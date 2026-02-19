"use client";

import { useState, useRef } from "react";
import { InferenceSession, Config } from "onnxruntime-web";
import { inference_pipeline } from "../utils/inference_pipeline";
import { draw_bounding_boxes } from "../utils/draw_bounding_boxes";
import { Box } from "../utils/types";

export function useImageProcessing() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [inferenceTime, setInferenceTime] = useState<string>("0");
  const [details, setDetails] = useState<Box[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const openImageRef = useRef<HTMLInputElement>(null);

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
        setDetails(results);
        setInferenceTime(resultsInferenceTime);
        await draw_bounding_boxes(results, overlayRef.current);
      }
      
      requestAnimationFrame(processFrame);
    };
    
    processFrame();
  };

  const toggleImage = () => {
    if (!imgSrc) {
      openImageRef.current?.click();
    } else {
      setImgSrc(null);
      if (openImageRef.current) openImageRef.current.disabled = false;
      if (overlayRef.current) {
        overlayRef.current.width = 0;
        overlayRef.current.height = 0;
      }
    }
  };

  const clearOverlay = () => {
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
    toggleImage,
    clearOverlay,
  };
}
