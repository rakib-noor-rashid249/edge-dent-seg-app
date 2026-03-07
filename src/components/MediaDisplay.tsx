"use client";

import { Card } from "@/components/ui/card";
import { MediaDisplayProvider, MediaDisplayContextValue } from "./media-display/MediaDisplayContext";
import StatusBar from "./media-display/StatusBar";
import MediaArea from "./media-display/MediaArea";
import { CustomModel } from "../utils/types";

/**
 * Props accepted by the top-level MediaDisplay component.
 * These are assembled into a context value and provided to all sub-components.
 */
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
  addCustomModel: (model: CustomModel) => void;
}

/**
 * MediaDisplay — Compound component for the main media viewer.
 */
export default function MediaDisplay(props: MediaDisplayProps) {
  const contextValue: MediaDisplayContextValue = {
    state: {
      modelName: props.modelName,
      device: props.device,
      isModelLoaded: props.isModelLoaded,
      modelStatus: props.modelStatus,
      warmUpTime: props.warmUpTime,
      inferenceTime: props.inferenceTime,
      cameras: props.cameras,
      selectedDeviceId: props.selectedDeviceId,
      customModels: props.customModels,
      cameraStream: props.cameraStream,
      imgSrc: props.imgSrc,
    },
    actions: {
      setModelName: props.setModelName,
      setDevice: props.setDevice,
      setSelectedDeviceId: props.setSelectedDeviceId,
      onCameraLoad: props.onCameraLoad,
      onImageLoad: props.onImageLoad,
      onImageSelect: props.onImageSelect,
      onCameraToggle: props.onCameraToggle,
      onImageToggle: props.onImageToggle,
      onOpenImage: props.onOpenImage,
      addCustomModel: props.addCustomModel,
    },
    meta: {
      inputCanvasRef: props.inputCanvasRef,
      cameraRef: props.cameraRef,
      imgRef: props.imgRef,
      overlayRef: props.overlayRef,
      openImageRef: props.openImageRef,
    },
  };

  return (
    <MediaDisplayProvider value={contextValue}>
      <Card className="w-full flex flex-col overflow-hidden border border-slate-200 shadow-sm bg-white rounded-xl">
        <StatusBar />
        <MediaArea />
      </Card>
    </MediaDisplayProvider>
  );
}