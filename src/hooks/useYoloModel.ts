"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { InferenceSession } from "onnxruntime-web";
import { model_loader } from "../utils/model_loader";
import { CustomModel } from "../utils/types";

const input_shape = [1, 3, 640, 640];
const iou_threshold = 0.35;
const score_threshold = 0.45;
const config = { input_shape, iou_threshold, score_threshold };

export function useYoloModel() {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [warmUpTime, setWarmUpTime] = useState<string>("0");
  const [device, setDevice] = useState<string>("webgpu");
  const [modelName, setModelName] = useState<string>("fft-11-n-best");

  const sessionRef = useRef<InferenceSession>(null);
  const [modelStatus, setModelStatus] = useState<string>("Loading model...");



  const loadModel = useCallback(async () => {
    setModelStatus("Loading model...");
    setIsModelLoaded(false);

    const customModel = customModels.find((model) => model.url === modelName);
    const model_path = customModel
      ? customModel.url
      : `/models/${modelName}.onnx`;

    try {
      const start = performance.now();
      const yolo_model = await model_loader(device, model_path, config);
      const end = performance.now();
      sessionRef.current = yolo_model;

      setModelStatus("Model loaded");
      setWarmUpTime((end - start).toFixed(2));
      setIsModelLoaded(true);
    } catch (error) {
      setModelStatus("Model loading failed");
      console.error(error);
    }
  }, [device, modelName, customModels]); // Added dependencies

  const addModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.replace(".onnx", "");
      setCustomModels((prevModels) => [
        ...prevModels,
        { name: fileName, url: URL.createObjectURL(file) },
      ]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadModel();
  }, [loadModel]); // Reload when loadModel changes (which depends on device/modelName)

  return {
    customModels,
    isModelLoaded,
    warmUpTime,
    sessionRef,
    modelStatus,
    device,
    setDevice,
    modelName,
    setModelName,
    config,
    loadModel,
    addModel,
  };
}
