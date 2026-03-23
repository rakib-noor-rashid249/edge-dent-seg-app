"use client";

import { useState, useRef, useCallback, MutableRefObject } from "react";
import { InferenceSession } from "onnxruntime-web";
import { inference_pipeline } from "../utils/inference_pipeline";
import { draw_bounding_boxes } from "../utils/draw_bounding_boxes";
import { Box } from "../utils/types";

interface Config {
  input_shape: number[];
  iou_threshold: number;
  score_threshold: number;
  classes?: string[];
}

/** Minimal box type returned by the worker (no mask_weights needed on main thread) */
interface WorkerBox {
  bbox: number[];
  class_idx: number;
  score: number;
}

export function useImageProcessing() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [inferenceTime, setInferenceTime] = useState<string>("0");
  const [details, setDetails] = useState<Box[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const openImageRef = useRef<HTMLInputElement>(null);
  // Snapshot of the mask-only canvas state (after inference, before bounding boxes)
  const maskSnapshotRef = useRef<ImageData | null>(null);

  // ── Worker back-pressure flag ──
  // Prevents queuing frames when the worker is still processing the previous one.
  const workerBusyRef = useRef<boolean>(false);

  // ── Camera animation frame ID for cleanup ──
  const cameraRafRef = useRef<number | null>(null);

  const openImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImgSrc(URL.createObjectURL(file));
      if (openImageRef.current) openImageRef.current.disabled = true;
      event.target.value = "";
    }
  };

  /**
   * Process a single uploaded image — runs on the MAIN THREAD.
   * No freeze risk since it only runs once per image upload.
   */
  const processImage = async (session: InferenceSession, config: Config) => {
    if (!imgRef.current || !overlayRef.current || !inputCanvasRef.current || !session) return;

    const naturalW = imgRef.current.naturalWidth;
    const naturalH = imgRef.current.naturalHeight;

    // Draw image at native resolution onto inputCanvas so cv.imread
    // always reads full-resolution pixels, regardless of CSS display size.
    inputCanvasRef.current.width = naturalW;
    inputCanvasRef.current.height = naturalH;
    const inputCtx = inputCanvasRef.current.getContext("2d");
    if (!inputCtx) return;
    inputCtx.drawImage(imgRef.current, 0, 0, naturalW, naturalH);

    // Set overlay canvas to native resolution
    overlayRef.current.width = naturalW;
    overlayRef.current.height = naturalH;

    const [results, resultsInferenceTime] = await inference_pipeline(
      inputCanvasRef.current,
      session,
      config,
      overlayRef.current
    );

    // Snapshot the mask state so filter redraws can restore it
    const ctx = overlayRef.current.getContext("2d");
    if (ctx) {
      maskSnapshotRef.current = ctx.getImageData(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    setDetails(results);
    setInferenceTime(resultsInferenceTime);
    await draw_bounding_boxes(results, overlayRef.current);
  };

  /**
   * Process real-time camera feed — uses the WEB WORKER.
   *
   * Architecture:
   * - Main thread: requestAnimationFrame loop that captures video → sends pixels to worker
   * - Worker: runs full inference pipeline (ONNX + OpenCV masks) off-thread
   * - Back to main thread: receives results → draws masks + bounding boxes
   *
   * The requestAnimationFrame loop is now ~1ms (just drawImage + getImageData),
   * so the video feed stays smooth at 60fps. Detections update at whatever speed
   * the model runs (typically 10-30fps depending on hardware).
   */
  const processCamera = (
    _session: InferenceSession,
    config: Config,
    workerRef: MutableRefObject<Worker | null>,
    workerReadyRef: MutableRefObject<boolean>
  ) => {
    if (!cameraRef.current || !inputCanvasRef.current || !overlayRef.current) return;

    const inputCtx = inputCanvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!inputCtx) return;

    const videoW = cameraRef.current.videoWidth;
    const videoH = cameraRef.current.videoHeight;
    inputCtx.canvas.width = videoW;
    inputCtx.canvas.height = videoH;
    overlayRef.current.width = videoW;
    overlayRef.current.height = videoH;

    const worker = workerRef.current;
    if (!worker) {
      console.error("[processCamera] No worker available, cannot start camera processing.");
      return;
    }

    // ── Set up worker message handler for inference results ──
    const handleWorkerMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type !== "inference-result") return;

      workerBusyRef.current = false; // Release back-pressure

      if (msg.error) {
        console.error("[processCamera] Worker inference error:", msg.error);
        return;
      }

      // Draw masks on overlay canvas (main thread, fast putImageData)
      if (msg.maskPixels && overlayRef.current) {
        const ctx = overlayRef.current.getContext("2d");
        if (ctx) {
          const imgData = new ImageData(
            new Uint8ClampedArray(msg.maskPixels),
            msg.maskWidth,
            msg.maskHeight
          );
          ctx.clearRect(0, 0, msg.maskWidth, msg.maskHeight);
          ctx.putImageData(imgData, 0, 0);

          // Snapshot mask state for filter redraws
          maskSnapshotRef.current = ctx.getImageData(0, 0, msg.maskWidth, msg.maskHeight);
        }
      } else if (overlayRef.current) {
        // No masks (no detections) — clear overlay
        const ctx = overlayRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
          maskSnapshotRef.current = null;
        }
      }

      // Convert worker boxes to main-thread Box type (add dummy mask_weights for compatibility)
      const boxes: Box[] = (msg.boxes as WorkerBox[]).map((b) => ({
        ...b,
        mask_weights: new Float32Array(0), // Not needed on main thread
      }));

      setDetails(boxes);
      setInferenceTime(msg.inferenceTime);

      // Draw bounding boxes on top of masks (fast canvas ops)
      if (overlayRef.current) {
        draw_bounding_boxes(boxes, overlayRef.current);
      }
    };

    worker.addEventListener("message", handleWorkerMessage);

    // ── requestAnimationFrame loop (super cheap — ~1ms per frame) ──
    const processFrame = () => {
      if (!cameraRef.current || !cameraRef.current.srcObject) {
        // Camera stopped — clean up
        worker.removeEventListener("message", handleWorkerMessage);
        return;
      }

      // Draw video frame to input canvas (cheap, ~0.5ms)
      inputCtx.drawImage(cameraRef.current, 0, 0, videoW, videoH);

      // Only send to worker if it's NOT busy (back-pressure / frame skipping)
      if (!workerBusyRef.current && workerReadyRef.current) {
        workerBusyRef.current = true;

        // Get raw pixel data (~1ms for 640x480)
        const imageData = inputCtx.getImageData(0, 0, videoW, videoH);

        // Send to worker with transferable buffer (zero-copy)
        worker.postMessage(
          {
            type: "run-inference",
            pixels: imageData.data,
            srcWidth: videoW,
            srcHeight: videoH,
            overlayWidth: videoW,
            overlayHeight: videoH,
            config,
          },
          [imageData.data.buffer] // Transfer ownership — no copy!
        );
      }

      cameraRafRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  /**
   * Stop the camera processing loop.
   * Called when camera is toggled off or component unmounts.
   */
  const stopCameraProcessing = useCallback(() => {
    if (cameraRafRef.current !== null) {
      cancelAnimationFrame(cameraRafRef.current);
      cameraRafRef.current = null;
    }
    workerBusyRef.current = false;
  }, []);

  /**
   * Re-draw overlay: restore mask snapshot then draw filtered boxes.
   * Call this when user selects/deselects a detection filter.
   */
  const redrawOverlay = useCallback(async (boxes: Box[], filterIndex: number | null) => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext("2d");
    if (!ctx) return;

    // Restore the mask-only snapshot first
    if (maskSnapshotRef.current) {
      ctx.putImageData(maskSnapshotRef.current, 0, 0);
    } else {
      ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    await draw_bounding_boxes(boxes, overlayRef.current, filterIndex);
  }, []);

  /** Composite source image + overlay canvas and download as PNG. */
  const saveResult = useCallback(() => {
    const sourceEl: HTMLImageElement | HTMLVideoElement | null =
      imgRef.current ?? cameraRef.current;
    if (!sourceEl || !overlayRef.current) return;

    const w = overlayRef.current.width ||
      (sourceEl as HTMLImageElement).naturalWidth ||
      (sourceEl as HTMLVideoElement).videoWidth;
    const h = overlayRef.current.height ||
      (sourceEl as HTMLImageElement).naturalHeight ||
      (sourceEl as HTMLVideoElement).videoHeight;

    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(sourceEl, 0, 0, w, h);
    ctx.drawImage(overlayRef.current, 0, 0, w, h);

    const dataUrl = offscreen.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `inference-result-${Date.now()}.png`;
    a.click();
  }, []);

  const toggleImage = () => {
    if (!imgSrc) {
      openImageRef.current?.click();
    } else {
      maskSnapshotRef.current = null;
      setImgSrc(null);
      setDetails([]);
      if (openImageRef.current) openImageRef.current.disabled = false;
      if (overlayRef.current) {
        overlayRef.current.width = 0;
        overlayRef.current.height = 0;
      }
    }
  };

  const clearOverlay = () => {
    maskSnapshotRef.current = null;
    stopCameraProcessing();
    if (overlayRef.current) {
      overlayRef.current.width = 0;
      overlayRef.current.height = 0;
    }
  };

  return {
    imgSrc,
    inferenceTime,
    details,
    imgRef,
    overlayRef,
    cameraRef,
    inputCanvasRef,
    openImageRef,
    openImage,
    processImage,
    processCamera,
    stopCameraProcessing,
    redrawOverlay,
    saveResult,
    toggleImage,
    clearOverlay,
    setImgSrc,
  };
}
