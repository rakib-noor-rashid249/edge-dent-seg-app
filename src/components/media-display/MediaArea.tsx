"use client";

import { X } from "lucide-react";
import { useMediaDisplay } from "./MediaDisplayContext";
import Placeholder from "./Placeholder";

export default function MediaArea() {
  const {
    state: { cameraStream, imgSrc, isModelLoaded, modelStatus },
    actions: { onCameraLoad, onImageLoad, onCameraToggle, onImageToggle },
    meta: { inputCanvasRef, cameraRef, imgRef, overlayRef },
  } = useMediaDisplay();

  const showPlaceholder = !imgSrc && !cameraStream;
  const hasMedia = !!(cameraStream || imgSrc);

  return (
    <div
      className={`relative flex-1 min-h-[540px] bg-slate-100 flex items-center justify-center border-t-0 transition-opacity duration-300 ${!isModelLoaded ? "pointer-events-none opacity-60" : "opacity-100"
        }`}
    >
      {/* Hidden canvas used for inference */}
      <canvas ref={inputCanvasRef} className="hidden" />

      {/* Loading overlay when model not ready */}
      {!isModelLoaded ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-600">{modelStatus}</span>
        </div>
      ) : null}

      {/* Placeholder / Example Grid */}
      {showPlaceholder ? <Placeholder /> : null}

      {/* Media Wrapper for correct overlay alignment */}
      <div className="relative flex justify-center items-center max-w-full max-h-full">
        {/* Video for camera feed */}
        <video
          ref={cameraRef}
          className={`max-w-full max-h-full w-auto h-auto ${!cameraStream ? 'hidden' : 'block'}`}
          onLoadedData={onCameraLoad}
          autoPlay
          playsInline
          muted
        />

        {/* Image for static input */}
        {imgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            id="img"
            ref={imgRef}
            src={imgSrc}
            onLoad={onImageLoad}
            className="max-w-full max-h-full w-auto h-auto shadow-sm"
            alt="Input"
          />
        ) : null}

        {/* Overlay canvas + Close button */}
        {hasMedia ? (
          <>
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            <button
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-600 transition-all"
              onClick={() => {
                if (cameraStream) onCameraToggle();
                if (imgSrc) onImageToggle();
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
