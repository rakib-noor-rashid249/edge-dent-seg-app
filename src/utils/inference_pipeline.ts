import * as ort from 'onnxruntime-web';
import cv from '@techstark/opencv-js';
import { preProcess, applyNMS, extractDetections } from "./img_preprocess";
import { generateMaskOverlay } from "./mask_processing";
import { Box } from "./types";
import defaultClasses from "./yolo_classes.json";

interface Config {
  input_shape: number[];
  iou_threshold: number;
  score_threshold: number;
  classes?: string[];
}

/**
 * Performs inference using the ONNX model and post-processes the results.
 *
 * Main-thread pipeline: uses cv.imread for DOM elements.
 * For the worker equivalent (raw pixels), see workerPipeline.ts.
 *
 * Shared logic imported from:
 *   - img_preprocess.ts: preProcess, applyNMS, extractDetections
 *   - mask_processing.ts: generateMaskOverlay
 *
 * @param {HTMLImageElement | HTMLCanvasElement} input_el - Input element.
 * @param {ort.InferenceSession} session - ONNX model session.
 * @param {Config} config - Model configuration.
 * @param {HTMLCanvasElement} overlay_el - Canvas for overlay/masks.
 * @returns {Promise<[Box[], string]>} Detected objects and inference time.
 */
export async function inference_pipeline(
  input_el: HTMLImageElement | HTMLCanvasElement,
  session: ort.InferenceSession,
  config: Config,
  overlay_el: HTMLCanvasElement
): Promise<[Box[], string]> {
  const src_mat = cv.imread(input_el);

  const modelW = config.input_shape[3];
  const modelH = config.input_shape[2];

  // Pre-process: resize to 640×640 and normalize
  const blob = preProcess(src_mat, modelW, modelH);
  src_mat.delete();

  const input_tensor = new ort.Tensor("float32", blob.data32F, [1, 3, modelH, modelW]);
  blob.delete();

  // Run inference
  const start = performance.now();
  const output = await session.run({ images: input_tensor });
  const end = performance.now();
  input_tensor.dispose();

  const output0 = output.output0;
  const output1 = output.output1;
  if (!output0 || !output1) {
    console.error("Invalid model output");
    output0?.dispose();
    output1?.dispose();
    return [[], "0"];
  }

  const NUM_PREDICTIONS = output0.dims[2];
  const activeClasses = config.classes ?? defaultClasses;
  const NUM_SCORES = activeClasses.length;
  const NUM_MASK_WEIGHTS = 32;

  const predictionsData = output0.data as Float32Array;
  const proto_mask = output1.data as Float32Array;
  const MASK_CHANNELS = output1.dims[1];
  const MASK_HEIGHT = output1.dims[2];
  const MASK_WIDTH = output1.dims[3];
  output0.dispose();
  output1.dispose();

  const overlayW = overlay_el.width;
  const overlayH = overlay_el.height;
  const xRatio = overlayW / modelW;
  const yRatio = overlayH / modelH;

  // ── Post-process: extract bounding boxes (shared function) ──
  const results: Box[] = extractDetections(
    predictionsData, NUM_PREDICTIONS, NUM_SCORES,
    NUM_MASK_WEIGHTS, config.score_threshold, xRatio, yRatio
  );

  // Apply NMS
  const scoresArray = results.map((r) => r.score);
  const selected_indices = applyNMS(results, scoresArray, config.iou_threshold);
  const filtered_results = selected_indices.map((i) => results[i]);

  // ── Mask post-processing (shared with worker pipeline) ──
  const maskResult = generateMaskOverlay(
    filtered_results,
    proto_mask,
    MASK_CHANNELS,
    MASK_HEIGHT,
    MASK_WIDTH,
    modelW,
    modelH,
    overlayW,
    overlayH,
    xRatio,
    yRatio
  );

  if (maskResult) {
    const imgData = new ImageData(
      maskResult.pixels as Uint8ClampedArray<ArrayBuffer>,
      maskResult.width,
      maskResult.height
    );
    const ctx = overlay_el.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, overlayW, overlayH);
      ctx.putImageData(imgData, 0, 0);
    }
  }

  return [filtered_results, (end - start).toFixed(2)];
}
