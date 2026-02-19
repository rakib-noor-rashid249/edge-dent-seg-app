"use client";

import { CustomModel } from "../utils/types";

interface ModelSettingsProps {
  deviceRef: React.RefObject<HTMLSelectElement | null>;
  modelRef: React.RefObject<HTMLSelectElement | null>;
  cameraSelectorRef: React.RefObject<HTMLSelectElement | null>;
  customModels: CustomModel[];
  cameras: MediaDeviceInfo[];
  onLoadModel: () => void;
}

export default function ModelSettings({
  deviceRef,
  modelRef,
  cameraSelectorRef,
  customModels,
  cameras,
  onLoadModel,
}: ModelSettingsProps) {
  return (
    <div id="setting-container" className="container w-full max-w-3xl flex flex-wrap gap-4 justify-center">
      <div className="flex flex-col">
        <label htmlFor="device-selector">Backend:</label>
        <select name="device-selector" ref={deviceRef} onChange={onLoadModel}>
          <option value="webgpu">webGPU</option>
          <option value="wasm">Wasm(cpu)</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="model-selector">Model:</label>
        <select name="model-selector" ref={modelRef} onChange={onLoadModel}>
          <option value="yolo11n-seg">yolo11n-2.6M</option>
          <option value="yolo11s-seg">yolo11s-9.4M</option>
          {customModels.map((model, index) => (
            <option key={index} value={model.url}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="camera-selector">Select Camera:</label>
        <select ref={cameraSelectorRef}>
          {cameras.map((camera, index) => (
            <option key={index} value={camera.deviceId}>
              {camera.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}