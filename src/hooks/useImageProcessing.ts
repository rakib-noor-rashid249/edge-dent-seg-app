"use client";

import { useState, useRef, useCallback } from "react";
import { InferenceSession } from "onnxruntime-web";
import { inference_pipeline } from "../utils/inference_pipeline";
import { draw_bounding_boxes } from "../utils/draw_bounding_boxes";
import { Box } from "../utils/types";

interface Config {
  input_shape: number[];
  iou_threshold: number;
  score_threshold: number;
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

  const openImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImgSrc(URL.createObjectURL(file));
      if (openImageRef.current) openImageRef.current.disabled = true;
      event.target.value = "";
    }
  };

  const processImage = async (session: InferenceSession, config: Config) => {
    if (!imgRef.current || !overlayRef.current || !session) return;

    overlayRef.current.width = imgRef.current.width;
    overlayRef.current.height = imgRef.current.height;

    const [results, resultsInferenceTime] = await inference_pipeline(
      imgRef.current,
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

  const processCamera = async (session: InferenceSession, config: Config) => {
    if (!cameraRef.current || !inputCanvasRef.current || !overlayRef.current) return;

    const inputCtx = inputCanvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!inputCtx) return;

    inputCtx.canvas.width = cameraRef.current.videoWidth;
    inputCtx.canvas.height = cameraRef.current.videoHeight;
    overlayRef.current.width = cameraRef.current.videoWidth;
    overlayRef.current.height = cameraRef.current.videoHeight;

    const processFrame = async () => {
      if (!cameraRef.current || !cameraRef.current.srcObject) return;

      inputCtx.drawImage(
        cameraRef.current,
        0,
        0,
        cameraRef.current.videoWidth,
        cameraRef.current.videoHeight
      );

      if (inputCanvasRef.current && overlayRef.current && session) {
        const [results, resultsInferenceTime] = await inference_pipeline(
          inputCanvasRef.current,
          session,
          config,
          overlayRef.current
        );

        // Snapshot mask state for each new camera frame
        const ctx = overlayRef.current.getContext("2d");
        if (ctx) {
          maskSnapshotRef.current = ctx.getImageData(0, 0, overlayRef.current.width, overlayRef.current.height);
        }

        setDetails(results);
        setInferenceTime(resultsInferenceTime);
        await draw_bounding_boxes(results, overlayRef.current);
      }

      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

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
    redrawOverlay,
    saveResult,
    toggleImage,
    clearOverlay,
    setImgSrc,
  };
}
