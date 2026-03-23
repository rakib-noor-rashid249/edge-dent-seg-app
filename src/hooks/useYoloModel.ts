"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CustomModel } from "../utils/types";
import { isWebGPUSupported } from "../utils/gpu_check";
import defaultClasses from "../utils/yolo_classes.json";

const input_shape = [1, 3, 640, 640];
const iou_threshold = 0.25;
const score_threshold = 0.55;

/**
 * Manages the YOLO model lifecycle via Web Worker.
 *
 * The model is loaded ONLY in the worker (not on main thread),
 * keeping GPU/WASM memory usage to a single copy.
 * Both image mode and camera mode route through the same worker.
 */
export function useYoloModel() {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [warmUpTime, setWarmUpTime] = useState<string>("0");
  const [device, setDevice] = useState<string>(isWebGPUSupported() ? "webgpu" : "wasm");
  const [modelName, setModelName] = useState<string>("fft-11-n-best");
  const [modelStatus, setModelStatus] = useState<string>("Loading model...");

  // Web Worker — sole owner of the ONNX session
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef<boolean>(false);

  // Active classes for the currently selected model
  const activeClasses = (() => {
    const customModel = customModels.find((m) => m.url === modelName);
    return customModel ? customModel.classes : defaultClasses;
  })();

  const config = { input_shape, iou_threshold, score_threshold, classes: activeClasses };

  // Track whether a load is already in-flight
  const loadingRef = useRef<boolean>(false);

  /** Initialize the inference worker (call once on mount) */
  const initWorker = useCallback(() => {
    if (workerRef.current) return;

    const worker = new Worker(
      new URL("../workers/inferenceWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "model-status") {
        if (msg.status === "Model loaded") {
          workerReadyRef.current = true;
          setWarmUpTime(msg.warmUpTime);
          setModelStatus("Model loaded");
          setIsModelLoaded(true);
          loadingRef.current = false;
        } else if (msg.status === "webgpu-failed") {
          console.warn("[useYoloModel] WebGPU failed in worker, falling back to WASM...");
          loadingRef.current = false;
          setDevice("wasm"); // triggers re-load via effect
        } else if (msg.status === "Model loading failed") {
          console.error("[useYoloModel] Worker model loading failed:", msg.error);
          setModelStatus("Model loading failed");
          loadingRef.current = false;
        } else {
          setModelStatus(msg.status);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("[useYoloModel] Worker error:", error);
      loadingRef.current = false;
    };

    workerRef.current = worker;
  }, []);

  /** Load model in worker only */
  const loadModel = useCallback(async () => {
    if (loadingRef.current) {
      console.log("[useYoloModel] Load already in progress, skipping.");
      return;
    }
    loadingRef.current = true;

    setModelStatus("Loading model...");
    setIsModelLoaded(false);
    workerReadyRef.current = false;

    const customModel = customModels.find((model) => model.url === modelName);
    const model_path = customModel
      ? customModel.url
      : `/models/${modelName}.onnx`;

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "load-model",
        device,
        modelPath: model_path,
        config,
      });
    } else {
      console.error("[useYoloModel] Worker not initialized");
      loadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, modelName, customModels]);

  /** Add a custom model with its classes. Called from AddModelDialog. */
  const addCustomModel = useCallback((model: CustomModel) => {
    setCustomModels((prev) => [...prev, model]);
    setModelName(model.url);
  }, []);

  // Initialize worker on mount
  useEffect(() => {
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "release" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initWorker]);

  // Load model when device/modelName/customModels change
  useEffect(() => {
    loadModel();
  }, [loadModel]);

  return {
    customModels,
    isModelLoaded,
    warmUpTime,
    workerRef,
    workerReadyRef,
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
