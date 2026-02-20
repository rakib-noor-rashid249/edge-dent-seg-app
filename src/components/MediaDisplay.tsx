"use client";

import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Camera, X } from "lucide-react";

interface MediaDisplayProps {
  inputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraRef: React.RefObject<HTMLVideoElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStream: MediaStream | null;
  imgSrc: string | null;
  onCameraLoad: () => void;
  onImageLoad: () => void;
  onImageSelect: (src: string) => void;
  onCameraToggle: () => void;
  onImageToggle: () => void;
  openImageRef: React.RefObject<HTMLInputElement | null>;
  onOpenImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  modelName: string;
  device: string;
  isModelLoaded: boolean;
  modelStatus: string;
  warmUpTime: string;
  inferenceTime: string;
}

const EXAMPLE_IMAGES = [
  '/ex1.jpg',
  '/ex2.jpg',
  '/ex3.jpg',
  '/ex4.jpg',
];

export default function MediaDisplay({
  inputCanvasRef,
  cameraRef,
  imgRef,
  overlayRef,
  cameraStream,
  imgSrc,
  onCameraLoad,
  onImageLoad,
  onImageSelect,
  onCameraToggle,
  onImageToggle,
  openImageRef,
  onOpenImage,
  modelName,
  device,
  isModelLoaded,
  modelStatus,
  warmUpTime,
  inferenceTime,
}: MediaDisplayProps) {

  const showPlaceholder = !imgSrc && !cameraStream;
  const hasMedia = !!(cameraStream || imgSrc);

  return (
    <Card className="w-full flex flex-col overflow-hidden border border-slate-200 shadow-sm bg-white rounded-xl">

      {/* SYSTEM STATUS BAR — part of normal flow, never overlaps */}
      <div className="flex-none bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Device Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200">
            <div
              className={`w-2 h-2 rounded-full transition-all duration-500 ${isModelLoaded
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]"
                : "bg-amber-400 animate-pulse"
                }`}
            />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{device}</span>
          </div>

          {/* Model Badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Model:</span>
            <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">{modelName}</span>
          </div>
        </div>

        {/* Right side: loading OR perf metrics + save */}
        <div className="flex items-center gap-3">
          {!isModelLoaded ? (
            <div className="flex items-center gap-2 text-amber-600">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-medium">{modelStatus}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">Warmup</span>
                <span className="font-bold text-teal-600">{warmUpTime}ms</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">Inference</span>
                <span className="font-bold text-teal-600">{inferenceTime}ms</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Ready
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MEDIA AREA */}
      <div
        className={`relative flex-1 min-h-[540px] bg-slate-100 flex items-center justify-center border-t-0 transition-opacity duration-300 ${!isModelLoaded ? "pointer-events-none opacity-60" : "opacity-100"
          }`}
      >
        {/* Hidden canvas used for inference */}
        <canvas ref={inputCanvasRef} className="hidden" />

        {/* Loading overlay when model not ready */}
        {!isModelLoaded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm gap-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-600">{modelStatus}</span>
          </div>
        )}

        {/* PLACEHOLDER / EXAMPLE GRID */}
        {showPlaceholder && (
          <div className="text-center p-8 max-w-2xl w-full flex flex-col items-center">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-8">
              <Card
                className="p-6 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all flex flex-col items-center gap-3 group border-slate-200"
                onClick={() => openImageRef.current?.click()}
              >
                <div className="p-4 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
                  <ImageIcon className="w-8 h-8 text-teal-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-slate-900">Upload Image</h3>
                  <p className="text-sm text-slate-500">Analyze a local file</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={openImageRef}
                  onChange={onOpenImage}
                />
              </Card>

              <Card
                className="p-6 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all flex flex-col items-center gap-3 group border-slate-200"
                onClick={onCameraToggle}
              >
                <div className="p-4 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
                  <Camera className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-slate-900">Open Camera</h3>
                  <p className="text-sm text-slate-500">Real-time detection</p>
                </div>
              </Card>
            </div>

            <div className="relative flex items-center w-full max-w-md mb-8">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or try an example</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {EXAMPLE_IMAGES.map((src, i) => (
                <button
                  key={i}
                  onClick={() => onImageSelect(src)}
                  className="relative group/img overflow-hidden rounded-lg aspect-square border border-slate-200 hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 transition-all shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Example ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

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
          {imgSrc && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              id="img"
              ref={imgRef}
              src={imgSrc}
              onLoad={onImageLoad}
              className="max-w-full max-h-full w-auto h-auto shadow-sm"
              alt="Input"
            />
          )}

          {/* Overlay canvas + Close button */}
          {hasMedia && (
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
          )}
        </div>
      </div>
    </Card>
  );
}