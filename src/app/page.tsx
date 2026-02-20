"use client";

import { useState } from "react";
import SettingsModal from "../components/SettingsModal";
import MediaDisplay from "../components/MediaDisplay";
import ModelStatus from "../components/ModelStatus";
import Header from "../components/Header";
import { useYoloModel } from "../hooks/useYoloModel";
import { useCamera } from "../hooks/useCamera";
import { useImageProcessing } from "../hooks/useImageProcessing";
import "../styles/styles.css";
import { useEffect } from "react";

import { useRef } from "react";

export default function Home() {
  const modelUploadRef = useRef<HTMLInputElement>(null);
  const {
    customModels,
    isModelLoaded,
    warmUpTime,
    sessionRef,
    modelStatus,
    device,
    setDevice,
    modelName,
    setModelName,
    config,
    addModel,
  } = useYoloModel();

  const {
    cameras,
    cameraStream,
    selectedDeviceId,
    setSelectedDeviceId,
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
    redrawOverlay,
    saveResult,
    toggleImage,
    clearOverlay,
    setImgSrc,
  } = useImageProcessing();

  const [selectedDetectionIdx, setSelectedDetectionIdx] = useState<number | null>(null);

  const handleImageLoad = () => {
    setSelectedDetectionIdx(null);
    if (sessionRef.current) {
      processImage(sessionRef.current, config);
    }
  };

  const handleCameraLoad = () => {
    setSelectedDetectionIdx(null);
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

  const handleSelectDetection = (idx: number | null) => {
    setSelectedDetectionIdx(idx);
    redrawOverlay(details, idx);
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
  }, [cameraStream, cameraRef]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Header */}
      <Header />

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar Status (Detections) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col order-2 lg:order-1 h-[calc(100vh-120px)] sticky top-24">
          <ModelStatus
            details={details}
            selectedDetectionIdx={selectedDetectionIdx}
            onSelectDetection={handleSelectDetection}
            onSave={saveResult}
          />
        </aside>

        {/* Main Display Area */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 order-1 lg:order-2">
          <MediaDisplay
            inputCanvasRef={inputCanvasRef}
            cameraRef={cameraRef}
            imgRef={imgRef}
            overlayRef={overlayRef}
            cameraStream={cameraStream}
            imgSrc={imgSrc}
            onCameraLoad={handleCameraLoad}
            onImageLoad={handleImageLoad}
            onImageSelect={setImgSrc}
            onCameraToggle={handleCameraToggle}
            onImageToggle={toggleImage}
            openImageRef={openImageRef}
            onOpenImage={openImage}
            modelName={modelName}
            setModelName={setModelName}
            device={device}
            setDevice={setDevice}
            isModelLoaded={isModelLoaded}
            modelStatus={modelStatus}
            warmUpTime={warmUpTime}
            inferenceTime={inferenceTime}
            cameras={cameras}
            selectedDeviceId={selectedDeviceId}
            setSelectedDeviceId={setSelectedDeviceId}
            customModels={customModels}
            onAddModel={addModel}
            modelUploadRef={modelUploadRef}
          />
        </section>

      </main>
    </div>
  );
}