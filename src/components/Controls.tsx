"use client";

import { Button } from "@/components/ui/button";

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
    <div id="btn-container" className="container w-full max-w-3xl flex flex-wrap gap-4 justify-center py-4">
      <Button
        variant={imgSrc ? "secondary" : "default"}
        disabled={!!cameraStream || !isModelLoaded}
        onClick={onImageToggle}
        className="w-32"
      >
        {imgSrc ? "Close Image" : "Open Image"}
        <input
          type="file"
          accept="image/*"
          hidden
          ref={openImageRef}
          onChange={onOpenImage}
        />
      </Button>

      <Button
        variant={cameraStream ? "destructive" : "default"}
        onClick={onCameraToggle}
        disabled={cameras.length === 0 || !!imgSrc || !isModelLoaded}
        className="w-32"
      >
        {cameraStream ? "Close Camera" : "Open Camera"}
      </Button>

      <label className="cursor-pointer">
        <Button variant="outline" asChild className="w-32 pointer-events-none">
          <span>Add Model</span>
        </Button>
        <input type="file" accept=".onnx" onChange={onAddModel} hidden />
      </label>
    </div>
  );
}