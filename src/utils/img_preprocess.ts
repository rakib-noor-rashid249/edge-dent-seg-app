import cv from '@techstark/opencv-js';
import { Box } from './types';

/**
 * Pre process input image.
 *
 * Resize and normalize image.
 *
 * @param {cv.Mat} mat - Pre process yolo model input image.
 * @param {number} input_width - Yolo model input width.
 * @param {number} input_height - Yolo model input height.
 * @returns {[cv.Mat, number, number]} Processed input mat and the x/y ratios.
 */
export function preProcess(mat: cv.Mat, input_width: number, input_height: number): [cv.Mat, number, number] {
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2RGB);

  // Resize to dimensions divisible by 32
  const [div_width, div_height] = divStride(32, mat.cols, mat.rows);
  cv.resize(mat, mat, new cv.Size(div_width, div_height));

  // Padding to square
  const max_dim = Math.max(div_width, div_height);
  const right_pad = max_dim - div_width;
  const bottom_pad = max_dim - div_height;
  cv.copyMakeBorder(
    mat,
    mat,
    0,
    bottom_pad,
    0,
    right_pad,
    cv.BORDER_CONSTANT,
    new cv.Scalar(0, 0, 0)
  );

  // Calculate ratios
  const xRatio = mat.cols / input_width;
  const yRatio = mat.rows / input_height;

  // Resize to input dimensions and normalize to [0, 1]
  const preProcessed = cv.blobFromImage(
    mat,
    1 / 255.0,
    new cv.Size(input_width, input_height),
    new cv.Scalar(0, 0, 0),
    false,
    false
  );

  return [preProcessed, xRatio, yRatio];
}

/**
 * Pre process input image dynamically.
 *
 * Normalize image.
 *
 * @param {cv.Mat} mat - Pre process yolo model input image.
 * @returns {[cv.Mat, number, number]} Processed input mat and its dimensions.
 */
export function preProcess_dynamic(mat: cv.Mat): [cv.Mat, number, number] {
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2RGB);

  // Resize image to dimensions divisible by 32
  const [div_width, div_height] = divStride(32, mat.cols, mat.rows);
  // Resize and normalize to [0, 1]
  const preProcessed = cv.blobFromImage(
    mat,
    1 / 255.0,
    new cv.Size(div_width, div_height),
    new cv.Scalar(0, 0, 0),
    false,
    false
  );
  return [preProcessed, div_width, div_height];
}

/**
 * Return width and height modified to be divisible by stride.
 * @param {number} stride - Stride value.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @returns {[number, number]} [width, height] divisible by stride.
 */
export function divStride(stride: number, width: number, height: number): [number, number] {
  width =
    width % stride >= stride / 2
      ? (Math.floor(width / stride) + 1) * stride
      : Math.floor(width / stride) * stride;

  height =
    height % stride >= stride / 2
      ? (Math.floor(height / stride) + 1) * stride
      : Math.floor(height / stride) * stride;

  return [width, height];
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
