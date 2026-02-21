"use client";

import { useState, useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Camera, X, Cpu, Package, Video, ChevronDown, ChevronUp, Sliders } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomModel } from "../utils/types";

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
  setModelName: (val: string) => void;
  device: string;
  setDevice: (val: string) => void;
  isModelLoaded: boolean;
  modelStatus: string;
  warmUpTime: string;
  inferenceTime: string;
  cameras: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (val: string) => void;
  customModels: CustomModel[];
  onAddModel: (event: React.ChangeEvent<HTMLInputElement>) => void;
  modelUploadRef: React.RefObject<HTMLInputElement | null>;
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
  setModelName,
  device,
  setDevice,
  isModelLoaded,
  modelStatus,
  warmUpTime,
  inferenceTime,
  cameras,
  selectedDeviceId,
  setSelectedDeviceId,
  customModels,
  onAddModel,
  modelUploadRef,
}: MediaDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showPlaceholder = !imgSrc && !cameraStream;
  const hasMedia = !!(cameraStream || imgSrc);

  return (
    <Card className="w-full flex flex-col overflow-hidden border border-slate-200 shadow-sm bg-white rounded-xl">

      {/* SYSTEM STATUS BAR — Responsive and Interactive */}
      <div className="flex-none bg-white border-b border-slate-100 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-h-[64px]">
        {mounted ? (
          <>
            <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 transition-all duration-300 ${!showSettings ? 'hidden md:flex' : 'flex'}`}>

              {/* Device Selection */}
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <Select value={device} onValueChange={setDevice} defaultValue="webgpu">
                  <SelectTrigger className="h-8 w-full md:w-[120px] text-[11px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200 rounded-full">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${isModelLoaded
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]"
                          : "bg-amber-400 animate-pulse"
                          }`}
                      />
                      <SelectValue placeholder="Select Device" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webgpu" className="text-xs uppercase">WebGPU</SelectItem>
                    <SelectItem value="wasm" className="text-xs uppercase">WASM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Selection */}
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <Select value={modelName} onValueChange={setModelName} defaultValue="fft-11-n-best">
                  <SelectTrigger className="h-8 w-full md:min-w-[140px] text-[11px] font-bold text-slate-700 bg-slate-50 border-slate-200 font-mono rounded-full">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fft-11-n-best" className="text-xs font-mono">High Speed</SelectItem>
                    <SelectItem value="fft-11-s-best" className="text-xs font-mono">High Accuracy</SelectItem>
                    {customModels.filter(model => model.url).map((model) => (
                      <SelectItem key={model.url} value={model.url} className="text-xs font-mono">
                        {model.name}
                      </SelectItem>
                    ))}
                    <div className="p-2 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => modelUploadRef.current?.click()}
                        className="w-full text-[10px] font-bold uppercase tracking-wider py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                      >
                        + Add Custom Model
                      </button>
                      <input
                        type="file"
                        accept=".onnx"
                        ref={modelUploadRef}
                        onChange={onAddModel}
                        className="hidden"
                      />
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* Camera Selection (Only visible if camera stream is active or we want to pre-select) */}
              <div className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger className="h-8 w-full md:w-[160px] text-[11px] font-medium text-slate-700 bg-slate-50 border-slate-200 rounded-full">
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.filter(cam => cam.deviceId).map((cam) => (
                      <SelectItem key={cam.deviceId} value={cam.deviceId} className="text-xs">
                        {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                      </SelectItem>
                    ))}
                    {cameras.filter(cam => cam.deviceId).length === 0 && (
                      <SelectItem value="no-camera" disabled className="text-xs">No cameras found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile Settings Toggle */}
            <div className="md:hidden flex items-center justify-between gap-4 mt-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 font-medium text-[10px] uppercase tracking-wider transition-colors hover:bg-slate-100"
              >
                <Sliders className="w-3 h-3 text-slate-400" />
                {showSettings ? "Hide Options" : "Show Options"}
                {showSettings ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
              </button>
            </div>

            {/* Right side: performance metrics */}
            <div className="flex items-center justify-between sm:justify-end gap-3 px-1 sm:px-0">
              {!isModelLoaded ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-medium">{modelStatus}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="font-medium text-slate-400">Inf.</span>
                    <span className="font-bold text-teal-600">{inferenceTime}ms</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200 hidden xs:block" />
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="font-medium text-slate-400">Warmup</span>
                    <span className="font-bold text-teal-600">{warmUpTime}ms</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200" />
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Ready
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between animate-pulse">
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-slate-100 rounded-full" />
              <div className="h-8 w-32 bg-slate-100 rounded-md hidden md:block" />
              <div className="h-8 w-40 bg-slate-100 rounded-md hidden md:block" />
            </div>
            <div className="h-8 w-32 bg-slate-100 rounded-md" />
          </div>
        )}
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