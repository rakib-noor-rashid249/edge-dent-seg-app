"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";

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
}: MediaDisplayProps) {

  const showPlaceholder = !imgSrc && !cameraStream;

  return (
    <Card className="relative w-full h-[600px] bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 shadow-inner group">

      {/* Hidden canvas used for inference */}
      <canvas ref={inputCanvasRef} className="hidden" />

      {/* PLACEHOLDER / EXAMPLE GRID */}
      {showPlaceholder && (
        <div className="text-center p-8 max-w-2xl w-full">
          <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
            <ImageIcon className="text-slate-400 w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Image or Camera Detected</h3>
          <p className="text-slate-500 mb-8">Select a source from the sidebar or choose an example below.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXAMPLE_IMAGES.map((src, i) => (
              <button
                key={i}
                onClick={() => onImageSelect(src)}
                className="relative group/img overflow-hidden rounded-lg aspect-square border border-slate-200 hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 transition-all"
              >
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
          <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        )}
      </div>


    </Card>
  );
}