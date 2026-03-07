"use client";

import { createContext, useContext } from "react";
import { CustomModel } from "../../utils/types";

interface MediaDisplayState {
  modelName: string;
  device: string;
  isModelLoaded: boolean;
  modelStatus: string;
  warmUpTime: string;
  inferenceTime: string;
  cameras: MediaDeviceInfo[];
  selectedDeviceId: string;
  customModels: CustomModel[];
  cameraStream: MediaStream | null;
  imgSrc: string | null;
}

interface MediaDisplayActions {
  setModelName: (val: string) => void;
  setDevice: (val: string) => void;
  setSelectedDeviceId: (val: string) => void;
  onCameraLoad: () => void;
  onImageLoad: () => void;
  onImageSelect: (src: string) => void;
  onCameraToggle: () => void;
  onImageToggle: () => void;
  onOpenImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addCustomModel: (model: CustomModel) => void;
}

interface MediaDisplayMeta {
  inputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraRef: React.RefObject<HTMLVideoElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  openImageRef: React.RefObject<HTMLInputElement | null>;
}

export interface MediaDisplayContextValue {
  state: MediaDisplayState;
  actions: MediaDisplayActions;
  meta: MediaDisplayMeta;
}

const MediaDisplayContext = createContext<MediaDisplayContextValue | null>(null);

export function useMediaDisplay(): MediaDisplayContextValue {
  const ctx = useContext(MediaDisplayContext);
  if (!ctx) {
    throw new Error("useMediaDisplay must be used within a MediaDisplay.Provider");
  }
  return ctx;
}

export function MediaDisplayProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MediaDisplayContextValue;
}) {
  return (
    <MediaDisplayContext value={value}>
      {children}
    </MediaDisplayContext>
  );
}
