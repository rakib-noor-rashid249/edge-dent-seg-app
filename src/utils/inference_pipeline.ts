import * as ort from 'onnxruntime-web';
import cv from '@techstark/opencv-js';
import { preProcess, applyNMS, Colors } from "./img_preprocess";
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
 * Approach (matching pranta-barua007/yolo11s-seg-web-onnx):
 * - cv.imread + direct resize to 640×640 (no divStride/padding)
 * - After post-processing, rescale bbox coords from model space → overlay space
 * - Mask: rescale bbox from model space → mask space (160×160), crop, resize to display bbox
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

  const input_tensor = new ort.Tensor("float32", blob.data32F, [
    1, 3, modelH, modelW,
  ]);
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
    return [[], "0"];
  }

  const NUM_PREDICTIONS = output0.dims[2];
  const NUM_BBOX_ATTRS = 4;
  const activeClasses = config.classes ?? defaultClasses;
  const NUM_SCORES = activeClasses.length;
  const NUM_MASK_WEIGHTS = 32;

  const predictionsData = output0.data as Float32Array;
  const bbox_data = predictionsData.subarray(0, NUM_PREDICTIONS * NUM_BBOX_ATTRS);
  const scores_data = predictionsData.subarray(
    NUM_PREDICTIONS * NUM_BBOX_ATTRS,
    NUM_PREDICTIONS * (NUM_BBOX_ATTRS + NUM_SCORES)
  );
  const mask_weights_data = predictionsData.subarray(
    NUM_PREDICTIONS * (NUM_BBOX_ATTRS + NUM_SCORES)
  );

  const proto_mask = output1.data as Float32Array;
  const MASK_CHANNELS = output1.dims[1];
  const MASK_HEIGHT = output1.dims[2];
  const MASK_WIDTH = output1.dims[3];
  output0.dispose();
  output1.dispose();

  // Overlay (display) dimensions
  const overlayW = overlay_el.width;
  const overlayH = overlay_el.height;

  // Simple scale factors: model space → overlay space
  const xRatio = overlayW / modelW;
  const yRatio = overlayH / modelH;

  // ── Post-process: extract bounding boxes ──
  const results: Box[] = [];
  for (let i = 0; i < NUM_PREDICTIONS; i++) {
    let maxScore = 0;
    let class_idx = -1;

    for (let c = 0; c < NUM_SCORES; c++) {
      const score = scores_data[i + c * NUM_PREDICTIONS];
      if (score > maxScore) {
        maxScore = score;
        class_idx = c;
      }
    }
    if (maxScore <= config.score_threshold) continue;

    // Model-space bbox (center x, center y, w, h)
    const cx = bbox_data[i];
    const cy = bbox_data[i + NUM_PREDICTIONS];
    const bw_model = bbox_data[i + NUM_PREDICTIONS * 2];
    const bh_model = bbox_data[i + NUM_PREDICTIONS * 3];

    // Rescale from model space → overlay display space
    const w = bw_model * xRatio;
    const h = bh_model * yRatio;
    const x = cx * xRatio - 0.5 * w;
    const y = cy * yRatio - 0.5 * h;

    const mask_weights = new Float32Array(NUM_MASK_WEIGHTS);
    for (let c = 0; c < NUM_MASK_WEIGHTS; c++) {
      mask_weights[c] = mask_weights_data[i + c * NUM_PREDICTIONS];
    }

    results.push({
      bbox: [x, y, w, h],
      class_idx,
      score: maxScore,
      mask_weights,
    });
  }

  // Apply NMS
  const scoresArray = results.map((r) => r.score);
  const selected_indices = applyNMS(results, scoresArray, config.iou_threshold);
  const filtered_results = selected_indices.map((i) => results[i]);

  // ── Mask post-processing ──
  if (filtered_results.length > 0) {
    const matsToDelete: cv.Mat[] = [];

    const proto_mask_mat = cv.matFromArray(
      MASK_CHANNELS,
      MASK_HEIGHT * MASK_WIDTH,
      cv.CV_32F,
      proto_mask
    );
    matsToDelete.push(proto_mask_mat);

    try {
      const NUM_FILTERED = filtered_results.length;

      // Build weights matrix from filtered results
      const maskWeights = new Float32Array(NUM_FILTERED * MASK_CHANNELS);
      for (let i = 0; i < NUM_FILTERED; i++) {
        for (let c = 0; c < MASK_CHANNELS; c++) {
          maskWeights[i * MASK_CHANNELS + c] = filtered_results[i].mask_weights[c];
        }
      }
      const mask_weights_mat = cv.matFromArray(
        NUM_FILTERED, MASK_CHANNELS, cv.CV_32F, maskWeights
      );
      matsToDelete.push(mask_weights_mat);

      // weights × proto_mask → [N, 160*160]
      const weights_mul_proto = new cv.Mat();
      const emptyMat = new cv.Mat();
      matsToDelete.push(weights_mul_proto, emptyMat);
      cv.gemm(mask_weights_mat, proto_mask_mat, 1.0, emptyMat, 0.0, weights_mul_proto);

      // Sigmoid activation
      const mask_sigmoid = new cv.Mat();
      const ones = cv.Mat.ones(weights_mul_proto.rows, weights_mul_proto.cols, cv.CV_32F);
      const neg = new cv.Mat(weights_mul_proto.rows, weights_mul_proto.cols, cv.CV_32F, new cv.Scalar(-1));
      matsToDelete.push(mask_sigmoid, ones, neg);
      cv.multiply(weights_mul_proto, neg, mask_sigmoid);
      cv.exp(mask_sigmoid, mask_sigmoid);
      cv.add(mask_sigmoid, ones, mask_sigmoid);
      cv.divide(ones, mask_sigmoid, mask_sigmoid);

      // Create overlay
      const overlay_mat = new cv.Mat(
        overlayH, overlayW, cv.CV_8UC4, new cv.Scalar(0, 0, 0, 0)
      );
      matsToDelete.push(overlay_mat);

      // Reusable mats for the loop
      const maskResized = new cv.Mat();
      const maskBinary = new cv.Mat();
      const maskBinaryU8 = new cv.Mat();
      matsToDelete.push(maskResized, maskBinary, maskBinaryU8);

      // Scale factors: model space → mask space (160×160)
      const maskScaleX = MASK_WIDTH / modelW;
      const maskScaleY = MASK_HEIGHT / modelH;

      for (let i = 0; i < NUM_FILTERED; i++) {
        const rowMat = mask_sigmoid.row(i);
        matsToDelete.push(rowMat);
        const maskMat = cv.matFromArray(MASK_HEIGHT, MASK_WIDTH, cv.CV_32F, rowMat.data32F);
        matsToDelete.push(maskMat);

        const [bx, by, bw, bh] = filtered_results[i].bbox;

        // Map bbox from overlay space → model space → mask space (160×160)
        // overlay_coord / xRatio → model coord, × maskScale → mask coord
        const maskX = Math.floor(Math.max(0, (bx / xRatio) * maskScaleX));
        const maskY = Math.floor(Math.max(0, (by / yRatio) * maskScaleY));
        const maskW = Math.ceil(Math.min(MASK_WIDTH - maskX, (bw / xRatio) * maskScaleX));
        const maskH = Math.ceil(Math.min(MASK_HEIGHT - maskY, (bh / yRatio) * maskScaleY));

        if (maskW <= 0 || maskH <= 0) continue;

        // Crop the small region from the 160×160 mask
        const maskRoi = maskMat.roi(new cv.Rect(maskX, maskY, maskW, maskH));
        matsToDelete.push(maskRoi);

        // Compute target position on the overlay
        const targetX = Math.max(0, Math.floor(bx));
        const targetY = Math.max(0, Math.floor(by));
        const targetW = Math.min(overlayW - targetX, Math.ceil(bw));
        const targetH = Math.min(overlayH - targetY, Math.ceil(bh));

        if (targetW <= 0 || targetH <= 0) continue;

        // Resize the cropped mask to the target bbox size
        cv.resize(maskRoi, maskResized, new cv.Size(targetW, targetH), 0, 0, cv.INTER_LINEAR);

        // Binarize
        cv.threshold(maskResized, maskBinary, 0.5, 255, cv.THRESH_BINARY);
        maskBinary.convertTo(maskBinaryU8, cv.CV_8U);

        // Colorize and copy to overlay
        const color = Colors.getColor(filtered_results[i].class_idx, 0.6);
        const colorScalar = new cv.Scalar(color[0], color[1], color[2], color[3] * 255);
        const maskColored = new cv.Mat(targetH, targetW, cv.CV_8UC4, colorScalar);
        matsToDelete.push(maskColored);

        const overlayRoi = overlay_mat.roi(new cv.Rect(targetX, targetY, targetW, targetH));
        matsToDelete.push(overlayRoi);
        maskColored.copyTo(overlayRoi, maskBinaryU8);
      }

      // Draw masks on overlay canvas
      const imgData = new ImageData(
        new Uint8ClampedArray(overlay_mat.data),
        overlayW,
        overlayH
      );
      const ctx = overlay_el.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, overlayW, overlayH);
        ctx.putImageData(imgData, 0, 0);
      }
    } catch (error) {
      console.error("Error processing masks:", error);
    } finally {
      matsToDelete.forEach((mat) => {
        if (mat && !mat.isDeleted()) mat.delete();
      });
    }
  }

  return [filtered_results, (end - start).toFixed(2)];
}
