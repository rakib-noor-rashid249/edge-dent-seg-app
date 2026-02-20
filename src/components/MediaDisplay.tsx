"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
}: MediaDisplayProps) {

  const showPlaceholder = !imgSrc && !cameraStream;

  return (
    <Card className="relative w-full h-[600px] bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 shadow-inner group">

      {/* Hidden canvas used for inference */}
      <canvas ref={inputCanvasRef} className="hidden" />

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

        {/* Overlay canvas */}
        {/* We only show canvas if there is media content */}
        {(cameraStream || imgSrc) && (
          <>
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 z-10 shadow-md rounded-full w-8 h-8"
              onClick={() => {
                if (cameraStream) onCameraToggle();
                if (imgSrc) onImageToggle();
              }}
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </>
        )}
      </div>


    </Card>
  );
}