"use client";

import { useEffect } from "react";
import ModelSettings  from "../components/ModelSettings";
import MediaDisplay from "../components/MediaDisplay";
import Controls from "../components/Controls";
import ModelStatus from "../components/ModelStatus";
import { useYoloModel } from "../hooks/useYoloModel";
import { useCamera } from "../hooks/useCamera";
import { useImageProcessing } from "../hooks/useImageProcessing";
import "../styles/styles.css";

export default function Home() {
  const {
    customModels,
    isModelLoaded,
    warmUpTime,
    sessionRef,
    modelStatusRef,
    deviceRef,
    modelRef,
    config,
    loadModel,
    addModel,
  } = useYoloModel();

  const {
    cameras,
    cameraStream,
    cameraSelectorRef,
    toggleCamera,
  } = useCamera();

  const {
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
  } = useImageProcessing();

  const handleImageLoad = () => {
    if (sessionRef.current) {
      processImage(sessionRef.current, config);
    }
  };

  const handleCameraLoad = () => {
    if (sessionRef.current) {
      processCamera(sessionRef.current, config);
    }
  };

  const handleCameraToggle = () => {
    if (cameraStream) {
      clearOverlay();
    }
    toggleCamera();
  };

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Set camera stream to video element
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-4xl font-bold">Yolo Segmentation</h1>

      <ModelSettings
        deviceRef={deviceRef}
        modelRef={modelRef}
        cameraSelectorRef={cameraSelectorRef}
        customModels={customModels}
        cameras={cameras}
        onLoadModel={loadModel}
      />

      <MediaDisplay
        inputCanvasRef={inputCanvasRef}
        cameraRef={cameraRef}
        imgRef={imgRef}
        overlayRef={overlayRef}
        cameraStream={cameraStream}
        imgSrc={imgSrc}
        onCameraLoad={handleCameraLoad}
        onImageLoad={handleImageLoad}
      />

      <Controls
        cameraStream={cameraStream}
        isModelLoaded={isModelLoaded}
        imgSrc={imgSrc}
        cameras={cameras}
        openImageRef={openImageRef}
        onImageToggle={toggleImage}
        onCameraToggle={handleCameraToggle}
        onOpenImage={openImage}
        onAddModel={addModel}
      />

      <ModelStatus
        modelStatusRef={modelStatusRef}
        isModelLoaded={isModelLoaded}
        warmUpTime={warmUpTime}
        inferenceTime={inferenceTime}
        details={details}
      />
    </div>
  );
}