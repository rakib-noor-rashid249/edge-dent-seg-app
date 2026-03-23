import cv from '@techstark/opencv-js';
import { Box } from './types';

/**
 * Pre-process input image for YOLO inference.
 *
 * Directly resizes to model input size (e.g. 640×640) and normalizes to [0, 1].
 * No stride-alignment or padding — keeps it simple and avoids creating
 * enormous intermediate matrices for large images.
 *
 * @param {cv.Mat} mat - Input image (RGBA from cv.imread).
 * @param {number} modelWidth - Model input width (e.g. 640).
 * @param {number} modelHeight - Model input height (e.g. 640).
 * @returns {cv.Mat} Normalized blob ready for inference.
 */
export function preProcess(
  mat: cv.Mat,
  modelWidth: number,
  modelHeight: number
): cv.Mat {
  // RGBA → RGB
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2RGB);

  // Direct resize to model input size
  cv.resize(mat, mat, new cv.Size(modelWidth, modelHeight));

  // Normalize to [0, 1] and create blob
  const blob = cv.blobFromImage(
    mat,
    1 / 255.0,
    new cv.Size(modelWidth, modelHeight),
    new cv.Scalar(0, 0, 0),
    false,
    false
  );

  return blob;
}

/**
 * Calculates Intersection Over Union (IOU) of two bounding boxes.
 * @param {number[]} box1 - Array of [x, y, width, height].
 * @param {number[]} box2 - Array of [x, y, width, height].
 * @returns {number} IOU value.
 */
export function calculateIOU(box1: number[], box2: number[]): number {
  const [x1, y1, w1, h1] = box1;
  const [x2, y2, w2, h2] = box2;

  const box1_x2 = x1 + w1;
  const box1_y2 = y1 + h1;
  const box2_x2 = x2 + w2;
  const box2_y2 = y2 + h2;

  const intersect_x1 = Math.max(x1, x2);
  const intersect_y1 = Math.max(y1, y2);
  const intersect_x2 = Math.min(box1_x2, box2_x2);
  const intersect_y2 = Math.min(box1_y2, box2_y2);

  if (intersect_x2 <= intersect_x1 || intersect_y2 <= intersect_y1) {
    return 0.0;
  }

  const intersection = (intersect_x2 - intersect_x1) * (intersect_y2 - intersect_y1);
  const box1_area = w1 * h1;
  const box2_area = w2 * h2;

  return intersection / (box1_area + box2_area - intersection);
}


/**
 * Applies Non-Maximum Suppression (NMS) to filter overlapping boxes.
 * @param {Box[]} boxes - Array of boxes with bounding box data.
 * @param {number[]} scores - Array of confidence scores.
 * @param {number} [iou_threshold=0.35] - IOU threshold.
 * @returns {number[]} Indices of boxes kept after NMS.
 */
export function applyNMS(boxes: Box[], scores: number[], iou_threshold: number = 0.35): number[] {
  const picked: number[] = [];
  const indexes: number[] = Array.from(Array(scores.length).keys());

  indexes.sort((a, b) => scores[b] - scores[a]);

  while (indexes.length > 0) {
    const current = indexes[0];
    picked.push(current);

    const rest = indexes.slice(1);
    indexes.length = 0;

    for (const idx of rest) {
      const iou = calculateIOU(boxes[current].bbox, boxes[idx].bbox);
      if (iou <= iou_threshold) {
        indexes.push(idx);
      }
    }
  }

  return picked;
}

/**
 * Extracts bounding box detections from raw YOLO output tensor data.
 * Shared between main-thread and worker inference pipelines.
 *
 * @param predictionsData - Raw output0 tensor data.
 * @param numPredictions - Number of predictions (output0.dims[2]).
 * @param numScores - Number of class scores.
 * @param numMaskWeights - Number of mask weight channels (typically 32).
 * @param scoreThreshold - Minimum confidence score.
 * @param xRatio - Scale factor: model space → overlay space (X).
 * @param yRatio - Scale factor: model space → overlay space (Y).
 * @returns Array of detection boxes with bbox, class_idx, score, and mask_weights.
 */
export function extractDetections(
  predictionsData: Float32Array,
  numPredictions: number,
  numScores: number,
  numMaskWeights: number,
  scoreThreshold: number,
  xRatio: number,
  yRatio: number
): Array<{ bbox: number[]; class_idx: number; score: number; mask_weights: Float32Array }> {
  const NUM_BBOX_ATTRS = 4;
  const bbox_data = predictionsData.subarray(0, numPredictions * NUM_BBOX_ATTRS);
  const scores_data = predictionsData.subarray(
    numPredictions * NUM_BBOX_ATTRS,
    numPredictions * (NUM_BBOX_ATTRS + numScores)
  );
  const mask_weights_data = predictionsData.subarray(
    numPredictions * (NUM_BBOX_ATTRS + numScores)
  );

  const results: Array<{ bbox: number[]; class_idx: number; score: number; mask_weights: Float32Array }> = [];

  for (let i = 0; i < numPredictions; i++) {
    let maxScore = 0;
    let class_idx = -1;

    for (let c = 0; c < numScores; c++) {
      const score = scores_data[i + c * numPredictions];
      if (score > maxScore) {
        maxScore = score;
        class_idx = c;
      }
    }
    if (maxScore <= scoreThreshold) continue;

    const cx = bbox_data[i];
    const cy = bbox_data[i + numPredictions];
    const bw_model = bbox_data[i + numPredictions * 2];
    const bh_model = bbox_data[i + numPredictions * 3];

    const w = bw_model * xRatio;
    const h = bh_model * yRatio;
    const x = cx * xRatio - 0.5 * w;
    const y = cy * yRatio - 0.5 * h;

    const mask_weights = new Float32Array(numMaskWeights);
    for (let c = 0; c < numMaskWeights; c++) {
      mask_weights[c] = mask_weights_data[i + c * numPredictions];
    }

    results.push({ bbox: [x, y, w, h], class_idx, score: maxScore, mask_weights });
  }

  return results;
}


/**
 * Ultralytics default color palette.
 *
 * Provides methods for converting hex color codes to RGBA and caching colors.
 */
export class Colors {
  static palette: number[][] = [
    "042AFF",
    "0BDBEB",
    "F3F3F3",
    "00DFB7",
    "111F68",
    "FF6FDD",
    "FF444F",
    "CCED00",
    "00F344",
    "BD00FF",
    "00B4FF",
    "DD00BA",
    "00FFFF",
    "26C000",
    "01FFB3",
    "7D24FF",
    "7B0068",
    "FF1B6C",
    "FC6D2F",
    "A2FF0B",
  ].map((c) => Colors.hex2rgba(`#${c}`));
  static n: number = Colors.palette.length;
  static cache: { [key: string]: number[] } = {};

  static hex2rgba(h: string, alpha: number = 1.0): number[] {
    return [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
      alpha,
    ];
  }

  static getColor(i: number, alpha: number = 1.0, bgr: boolean = false): number[] {
    const key = `${i}-${alpha}-${bgr}`;
    if (Colors.cache[key]) {
      return Colors.cache[key];
    }
    const c = Colors.palette[i % Colors.n];
    const rgba = [...c.slice(0, 3), alpha];
    const result = bgr ? [rgba[2], rgba[1], rgba[0], rgba[3]] : rgba;
    Colors.cache[key] = result;
    return result;
  }
}
