"use client";

import { useState, useRef, useCallback, MutableRefObject } from "react";
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

/**
 * Converts worker result boxes to main-thread Box type.
 * Adds empty mask_weights for type compatibility with draw functions.
 */
function toBoxes(workerBoxes: WorkerBox[]): Box[] {
  return workerBoxes.map((b) => ({
    ...b,
    mask_weights: new Float32Array(0),
  }));
}

/**
 * Draws worker inference results (masks + bounding boxes) onto the overlay canvas.
 */
function drawWorkerResults(
  msg: { maskPixels: Uint8ClampedArray | null; maskWidth: number; maskHeight: number; boxes: WorkerBox[]; inferenceTime: string },
  overlayRef: React.RefObject<HTMLCanvasElement | null>,
  maskSnapshotRef: React.MutableRefObject<ImageData | null>,
  setDetails: (boxes: Box[]) => void,
  setInferenceTime: (time: string) => void
) {
  // Draw masks on overlay canvas
  if (msg.maskPixels && overlayRef.current) {
    const ctx = overlayRef.current.getContext("2d");
    if (ctx) {
      const imgData = new ImageData(
        new Uint8ClampedArray(msg.maskPixels) as Uint8ClampedArray<ArrayBuffer>,
        msg.maskWidth,
        msg.maskHeight
      );
      ctx.clearRect(0, 0, msg.maskWidth, msg.maskHeight);
      ctx.putImageData(imgData, 0, 0);
      maskSnapshotRef.current = ctx.getImageData(0, 0, msg.maskWidth, msg.maskHeight);
    }
  } else if (overlayRef.current) {
    const ctx = overlayRef.current.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      maskSnapshotRef.current = null;
    }
  }

  const boxes = toBoxes(msg.boxes as WorkerBox[]);
  setDetails(boxes);
  setInferenceTime(msg.inferenceTime);

  if (overlayRef.current) {
    draw_bounding_boxes(boxes, overlayRef.current);
  }
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
  const maskSnapshotRef = useRef<ImageData | null>(null);

  // ── Worker back-pressure flag ──
  const workerBusyRef = useRef<boolean>(false);

  // ── Camera animation frame ID for cleanup ──
  const cameraRafRef = useRef<number | null>(null);

  // ── Reusable pixel buffer for GC reduction ──
  // Pre-allocated buffer dimensions — reset when canvas size changes.
  const pixelBufferRef = useRef<{ buffer: ArrayBuffer; width: number; height: number } | null>(null);

  /**
   * Get or create a reusable pixel buffer matching the given dimensions.
   * Avoids allocating a new ArrayBuffer every frame — only reallocates
   * when the canvas dimensions change.
   */
  const getPixelBuffer = (width: number, height: number): Uint8ClampedArray => {
    const byteLength = width * height * 4; // RGBA
    const cached = pixelBufferRef.current;
    if (cached && cached.width === width && cached.height === height && cached.buffer.byteLength === byteLength) {
      return new Uint8ClampedArray(cached.buffer);
    }
    // Allocate new buffer (only on first frame or dimension change)
    const buffer = new ArrayBuffer(byteLength);
    pixelBufferRef.current = { buffer, width, height };
    return new Uint8ClampedArray(buffer);
  };

  const openImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImgSrc(URL.createObjectURL(file));
      if (openImageRef.current) openImageRef.current.disabled = true;
      event.target.value = "";
    }
  };

  /**
   * Process a single uploaded image — routes through the WORKER.
   *
   * Same worker path as camera mode — model lives only in the worker,
   * so there's only one copy of the ONNX session in memory.
   */
  const processImage = (
    config: Config,
    workerRef: MutableRefObject<Worker | null>,
    workerReadyRef: MutableRefObject<boolean>
  ) => {
    if (!imgRef.current || !overlayRef.current || !inputCanvasRef.current) return;

    const worker = workerRef.current;
    if (!worker || !workerReadyRef.current) {
      console.error("[processImage] Worker not ready");
      return;
    }

    const naturalW = imgRef.current.naturalWidth;
    const naturalH = imgRef.current.naturalHeight;

    // Draw image at native resolution onto inputCanvas
    inputCanvasRef.current.width = naturalW;
    inputCanvasRef.current.height = naturalH;
    const inputCtx = inputCanvasRef.current.getContext("2d");
    if (!inputCtx) return;
    inputCtx.drawImage(imgRef.current, 0, 0, naturalW, naturalH);

    // Set overlay to native resolution
    overlayRef.current.width = naturalW;
    overlayRef.current.height = naturalH;

    // Get pixel data and send to worker
    const imageData = inputCtx.getImageData(0, 0, naturalW, naturalH);

    // One-shot listener for image result
    const handleResult = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type !== "inference-result") return;
      worker.removeEventListener("message", handleResult);

      if (msg.error) {
        console.error("[processImage] Worker error:", msg.error);
        return;
      }

      drawWorkerResults(msg, overlayRef, maskSnapshotRef, setDetails, setInferenceTime);
    };

    worker.addEventListener("message", handleResult);

    worker.postMessage(
      {
        type: "run-inference",
        pixels: imageData.data,
        srcWidth: naturalW,
        srcHeight: naturalH,
        overlayWidth: naturalW,
        overlayHeight: naturalH,
        config,
      },
      [imageData.data.buffer]
    );
  };

  /**
   * Process real-time camera feed — uses the WEB WORKER.
   *
   * Architecture:
   * - Main thread: requestAnimationFrame loop captures video → sends pixels to worker
   * - Worker: runs full inference pipeline (ONNX + OpenCV masks) off-thread
   * - Back to main thread: receives results → draws masks + bounding boxes
   *
   * GC optimization: pixel data is copied into a reusable buffer before
   * sending to the worker. The buffer is only reallocated on dimension change.
   */
  const processCamera = (
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
      console.error("[processCamera] No worker available");
      return;
    }

    // ── Worker message handler for inference results ──
    const handleWorkerMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type !== "inference-result") return;

      workerBusyRef.current = false;

      if (msg.error) {
        console.error("[processCamera] Worker inference error:", msg.error);
        return;
      }

      drawWorkerResults(msg, overlayRef, maskSnapshotRef, setDetails, setInferenceTime);
    };

    worker.addEventListener("message", handleWorkerMessage);

    // ── requestAnimationFrame loop ──
    const processFrame = () => {
      if (!cameraRef.current || !cameraRef.current.srcObject) {
        worker.removeEventListener("message", handleWorkerMessage);
        return;
      }

      // Draw video frame to input canvas (~0.5ms)
      inputCtx.drawImage(cameraRef.current, 0, 0, videoW, videoH);

      // Only send to worker if it's NOT busy (back-pressure)
      if (!workerBusyRef.current && workerReadyRef.current) {
        workerBusyRef.current = true;

        // Get pixel data from canvas
        const imageData = inputCtx.getImageData(0, 0, videoW, videoH);

        // Copy into reusable buffer to reduce GC pressure.
        // The original imageData.data gets GC'd but the heavy pixel
        // allocation is amortized via the reusable buffer.
        const reusablePixels = getPixelBuffer(videoW, videoH);
        reusablePixels.set(imageData.data);

        // Send copy to worker — transfer the reusable buffer
        worker.postMessage(
          {
            type: "run-inference",
            pixels: reusablePixels,
            srcWidth: videoW,
            srcHeight: videoH,
            overlayWidth: videoW,
            overlayHeight: videoH,
            config,
          },
          [reusablePixels.buffer]
        );

        // Reallocate the reusable buffer for the next frame
        // (the previous one was transferred to the worker)
        pixelBufferRef.current = null;
      }

      cameraRafRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  /**
   * Stop the camera processing loop.
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
   */
  const redrawOverlay = useCallback(async (boxes: Box[], filterIndex: number | null) => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext("2d");
    if (!ctx) return;

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
