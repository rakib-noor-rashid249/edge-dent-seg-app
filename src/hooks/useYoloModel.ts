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

  // Main-thread session (used for single image processing)
  const sessionRef = useRef<InferenceSession | null>(null);
  const [modelStatus, setModelStatus] = useState<string>("Loading model...");

  // Web Worker (used for real-time camera processing)
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef<boolean>(false);

  // Active classes for the currently selected model
  const activeClasses = (() => {
    const customModel = customModels.find((m) => m.url === modelName);
    return customModel ? customModel.classes : defaultClasses;
  })();

  // Config includes active classes so inference uses the right labels
  const config = { input_shape, iou_threshold, score_threshold, classes: activeClasses };

  // Track whether a load is already in-flight
  const loadingRef = useRef<boolean>(false);

  /** Initialize the inference worker (call once on mount) */
  const initWorker = useCallback(() => {
    if (workerRef.current) return; // Already initialized

    const worker = new Worker(
      new URL("../workers/inferenceWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "model-status") {
        if (msg.status === "Model loaded") {
          workerReadyRef.current = true;
          // If main-thread model already loaded, keep its warmup time
          // Otherwise use worker's warmup time
          if (!isModelLoaded) {
            setWarmUpTime(msg.warmUpTime);
          }
        } else if (msg.status === "webgpu-failed") {
          console.warn("[useYoloModel] WebGPU failed in worker, falling back to WASM...");
          setDevice("wasm");
        } else if (msg.status === "Model loading failed") {
          console.error("[useYoloModel] Worker model loading failed:", msg.error);
        }
        // Update model status for UI display
        if (msg.status !== "webgpu-failed") {
          setModelStatus(msg.status);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("[useYoloModel] Worker error:", error);
    };

    workerRef.current = worker;
  }, [isModelLoaded]);

  /** Load model on both main thread (for image mode) and worker (for camera) */
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

    // Load in worker (for camera mode)
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "load-model",
        device,
        modelPath: model_path,
        config,
      });
    }

    // Load on main thread (for image mode)
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

  // Initialize worker on mount
  useEffect(() => {
    initWorker();
    return () => {
      // Terminate worker on unmount
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
    sessionRef,
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
