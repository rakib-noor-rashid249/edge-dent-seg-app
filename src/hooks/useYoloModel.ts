"use client";

import { useEffect, useRef, useState } from "react";
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
  const sessionRef = useRef<InferenceSession>(null);
  const modelStatusRef = useRef<HTMLParagraphElement>(null);
  const deviceRef = useRef<HTMLSelectElement>(null);
  const modelRef = useRef<HTMLSelectElement>(null);

  const loadModel = async () => {
    if (!modelStatusRef.current || !deviceRef.current || !modelRef.current) return;
    
    const modelStatusEl = modelStatusRef.current;
    modelStatusEl.textContent = "Loading model...";
    modelStatusEl.style.color = "red";
    setIsModelLoaded(false);

    const device = deviceRef.current.value;
    const selectedModel = modelRef.current.value;
    const customModel = customModels.find((model) => model.url === selectedModel);
    const model_path = customModel
      ? customModel.url
      : `/models/${selectedModel}.onnx`;

    try {
      const start = performance.now();
      const yolo_model = await model_loader(device, model_path, config);
      const end = performance.now();
      sessionRef.current = yolo_model;

      modelStatusEl.textContent = "Model loaded";
      modelStatusEl.style.color = "green";
      setWarmUpTime((end - start).toFixed(2));
      setIsModelLoaded(true);
    } catch (error) {
      if (modelStatusEl) {
        modelStatusEl.textContent = "Model loading failed";
        modelStatusEl.style.color = "red";
      }
      console.error(error);
    }
  };

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
    loadModel();
  }, []);

  return {
    customModels,
    isModelLoaded,
    warmUpTime,
    sessionRef,
    modelStatusRef,
    deviceRef,
    modelRef,
    config,
    loadModel,
    addModel,
  };
}
