"use client";

import { useEffect } from "react";
import SettingsModal from "../components/SettingsModal";
import MediaDisplay from "../components/MediaDisplay";
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
    setImgSrc,
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
  }, [cameraStream, cameraRef]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Edge Dent Seg <span className="text-slate-400 font-normal text-sm ml-2">Clinical Suite</span></h1>
        </div>

        <SettingsModal
          device={device}
          setDevice={setDevice}
          modelName={modelName}
          setModelName={setModelName}
          cameraSelectorRef={cameraSelectorRef}
          customModels={customModels}
          cameras={cameras}
          onAddModel={addModel}
        />
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar Status (Detections) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col order-2 lg:order-1 h-[calc(100vh-120px)] sticky top-24">
          <ModelStatus
            modelStatus={modelStatus}
            isModelLoaded={isModelLoaded}
            warmUpTime={warmUpTime}
            inferenceTime={inferenceTime}
            details={details}
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
          />
        </section>

      </main>
    </div>
  );
}