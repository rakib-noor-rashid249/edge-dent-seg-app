"use client";

interface ControlsProps {
  cameraStream: MediaStream | null;
  isModelLoaded: boolean;
  imgSrc: string | null;
  cameras: MediaDeviceInfo[];
  openImageRef: React.RefObject<HTMLInputElement | null>;
  onImageToggle: () => void;
  onCameraToggle: () => void;
  onOpenImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddModel: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Controls({
  cameraStream,
  isModelLoaded,
  imgSrc,
  cameras,
  openImageRef,
  onImageToggle,
  onCameraToggle,
  onOpenImage,
  onAddModel,
}: ControlsProps) {
  return (
    <div id="btn-container" className="container w-full max-w-3xl flex flex-wrap gap-4 justify-center">
      <button
        className="btn"
        disabled={!!cameraStream || !isModelLoaded}
        onClick={onImageToggle}
      >
        {imgSrc ? "Close Image" : "Open Image"}
        <input
          type="file"
          accept="image/*"
          hidden
          ref={openImageRef}
          onChange={onOpenImage}
        />
      </button>
      
      <button
        className="btn"
        onClick={onCameraToggle}
        disabled={cameras.length === 0 || !!imgSrc || !isModelLoaded}
      >
        {cameraStream ? "Close Camera" : "Open Camera"}
      </button>
      
      <label className="btn cursor-pointer">
        <input type="file" accept=".onnx" onChange={onAddModel} hidden />
        <span>Add model</span>
      </label>
    </div>
  );
}