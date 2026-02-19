"use client";

interface MediaDisplayProps {
  inputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraRef: React.RefObject<HTMLVideoElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStream: MediaStream | null;
  imgSrc: string | null;
  onCameraLoad: () => void;
  onImageLoad: () => void;
}

export default function MediaDisplay({
  inputCanvasRef,
  cameraRef,
  imgRef,
  overlayRef,
  cameraStream,
  imgSrc,
  onCameraLoad,
  onImageLoad,
}: MediaDisplayProps) {
  return (
    <div className="relative w-full max-w-[720px] border border-slate-500 rounded-lg overflow-hidden">
      {/* Hidden canvas used for inference */}
      <canvas ref={inputCanvasRef} className="hidden" />
      
      {/* Video for camera feed */}
      <video
        ref={cameraRef}
        className="w-full rounded-lg"
        onLoadedData={onCameraLoad}
        autoPlay
        playsInline
        muted
        hidden={!cameraStream}
      />
      
      {/* Image for static input */}
      {imgSrc && (
        <img
          id="img"
          ref={imgRef}
          src={imgSrc}
          onLoad={onImageLoad}
          className="w-full rounded-lg"
          alt="Input"
        />
      )}
      
      {/* Overlay canvas */}
      <canvas ref={overlayRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
}