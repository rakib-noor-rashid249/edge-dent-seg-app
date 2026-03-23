/**
 * Web Worker for YOLO11-Seg inference.
 *
 * Handles model loading and inference entirely off the main thread.
 * Communicates via structured messages:
 *   Main → Worker: "load-model" | "run-inference" | "release"
 *   Worker → Main: "model-status" | "inference-result"
 */
import * as ort from "onnxruntime-web";
import { workerInferencePipeline } from "./workerPipeline";

// ── Worker-global state ──
let session: ort.InferenceSession | null = null;
let sessionKey: string | null = null;

// ── Message types ──
export interface LoadModelMessage {
  type: "load-model";
  device: string;
  modelPath: string;
  config: {
    input_shape: number[];
    iou_threshold: number;
    score_threshold: number;
    classes?: string[];
  };
}

export interface RunInferenceMessage {
  type: "run-inference";
  pixels: Uint8ClampedArray;
  srcWidth: number;
  srcHeight: number;
  overlayWidth: number;
  overlayHeight: number;
  config: {
    input_shape: number[];
    iou_threshold: number;
    score_threshold: number;
    classes?: string[];
  };
}

export interface ReleaseMessage {
  type: "release";
}

export type WorkerInMessage = LoadModelMessage | RunInferenceMessage | ReleaseMessage;

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    // ── Load or switch model ──
    case "load-model": {
      const key = `${msg.device}|${msg.modelPath}`;

      // Reuse if same model
      if (session && sessionKey === key) {
        ctx.postMessage({
          type: "model-status",
          status: "Model loaded",
          warmUpTime: "0",
        });
        return;
      }

      // Release previous session
      if (session) {
        try { await session.release(); } catch { /* ignore */ }
        session = null;
        sessionKey = null;
      }

      ctx.postMessage({ type: "model-status", status: "Loading model..." });

      try {
        ort.env.logLevel = "error";

        const start = performance.now();
        session = await ort.InferenceSession.create(msg.modelPath, {
          executionProviders: [msg.device],
          graphOptimizationLevel: "all",
          logSeverityLevel: 3,
        });

        // Warm-up inference
        const shape = msg.config.input_shape;
        const dummySize = shape.reduce((a, b) => a * b, 1);
        const dummy = new ort.Tensor("float32", new Float32Array(dummySize), shape);
        const warmupOutput = await session.run({ images: dummy });
        warmupOutput.output0?.dispose();
        warmupOutput.output1?.dispose();
        dummy.dispose();

        const warmUpTime = (performance.now() - start).toFixed(2);
        sessionKey = key;

        ctx.postMessage({
          type: "model-status",
          status: "Model loaded",
          warmUpTime,
        });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("[Worker] Error loading model:", error);

        // If WebGPU failed, tell main thread to fallback
        if (msg.device === "webgpu") {
          ctx.postMessage({
            type: "model-status",
            status: "webgpu-failed",
            error: errMsg,
          });
        } else {
          ctx.postMessage({
            type: "model-status",
            status: "Model loading failed",
            error: errMsg,
          });
        }
      }
      break;
    }

    // ── Run inference on a frame ──
    case "run-inference": {
      if (!session) {
        ctx.postMessage({
          type: "inference-result",
          error: "No model loaded",
        });
        return;
      }

      try {
        const result = await workerInferencePipeline(
          msg.pixels,
          msg.srcWidth,
          msg.srcHeight,
          session,
          msg.config,
          msg.overlayWidth,
          msg.overlayHeight
        );

        // Transfer the mask pixel buffer for zero-copy (if it exists)
        const transfer: Transferable[] = [];
        if (result.maskPixels) {
          transfer.push(result.maskPixels.buffer);
        }

        ctx.postMessage(
          {
            type: "inference-result",
            boxes: result.boxes,
            inferenceTime: result.inferenceTime,
            maskPixels: result.maskPixels,
            maskWidth: result.maskWidth,
            maskHeight: result.maskHeight,
          },
          transfer
        );
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("[Worker] Inference error:", error);
        ctx.postMessage({ type: "inference-result", error: errMsg });
      }
      break;
    }

    // ── Release model ──
    case "release": {
      if (session) {
        try { await session.release(); } catch { /* ignore */ }
        session = null;
        sessionKey = null;
      }
      break;
    }
  }
};
