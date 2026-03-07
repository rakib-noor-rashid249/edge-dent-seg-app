"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { InferenceSession } from "onnxruntime-web";
import { model_loader } from "../utils/model_loader";
import { CustomModel } from "../utils/types";
import { isWebGPUSupported } from "../utils/gpu_check";
import defaultClasses from "../utils/yolo_classes.json";

const input_shape = [1, 3, 640, 640];
const iou_threshold = 0.25;
const score_threshold = 0.55;

export function useYoloModel() {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [warmUpTime, setWarmUpTime] = useState<string>("0");
  const [device, setDevice] = useState<string>(isWebGPUSupported() ? "webgpu" : "wasm");
  const [modelName, setModelName] = useState<string>("fft-11-n-best");

  const sessionRef = useRef<InferenceSession | null>(null);
  const [modelStatus, setModelStatus] = useState<string>("Loading model...");

  // Active classes for the currently selected model
  const activeClasses = (() => {
    const customModel = customModels.find((m) => m.url === modelName);
    return customModel ? customModel.classes : defaultClasses;
  })();

  // Config includes active classes so inference uses the right labels
  const config = { input_shape, iou_threshold, score_threshold, classes: activeClasses };

  // Track whether a load is already in-flight
  const loadingRef = useRef<boolean>(false);

  const loadModel = useCallback(async () => {
    if (loadingRef.current) {
      console.log("[useYoloModel] Load already in progress, skipping.");
      return;
    }
    loadingRef.current = true;

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

      if (!yolo_model) {
        setModelStatus("Model loading failed");
        loadingRef.current = false;
        return;
      }

      sessionRef.current = yolo_model;
      setModelStatus("Model loaded");
      setWarmUpTime((end - start).toFixed(2));
      setIsModelLoaded(true);
    } catch (error) {
      console.error("[useYoloModel] Error loading model:", error);

      if (device === "webgpu") {
        console.warn("[useYoloModel] WebGPU failed, falling back to WASM...");
        setModelStatus("Falling back to WASM...");
        setDevice("wasm");
      } else {
        setModelStatus("Model loading failed");
      }
    } finally {
      loadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, modelName, customModels]);

  /** Add a custom model with its classes. Called from AddModelDialog. */
  const addCustomModel = useCallback((model: CustomModel) => {
    setCustomModels((prev) => [...prev, model]);
    // Auto-select the newly added model
    setModelName(model.url);
  }, []);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

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
    addCustomModel,
    activeClasses,
  };
}
