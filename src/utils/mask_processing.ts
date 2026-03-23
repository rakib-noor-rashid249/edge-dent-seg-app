/**
 * Shared mask post-processing logic.
 *
 * Used by both the main-thread `inference_pipeline.ts` and
 * the worker-thread `workerPipeline.ts` — avoids duplicating
 * the heavy OpenCV mask generation code.
 *
 * This module has NO DOM dependencies (no canvas, no document).
 * It works with raw pixel data via cv.Mat operations.
 */
import cv from "@techstark/opencv-js";
import { Colors } from "./img_preprocess";

interface MaskableBox {
  bbox: number[];
  class_idx: number;
  mask_weights: Float32Array;
}

interface MaskResult {
  /** Raw RGBA pixels of the mask overlay (same size as overlay dimensions). */
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Generate segmentation mask overlay from filtered detection results.
 *
 * @param filtered - Filtered detection results with mask weights.
 * @param protoMask - Raw proto mask data from model output1.
 * @param maskChannels - Number of mask channels (typically 32).
 * @param maskHeight - Proto mask height (typically 160).
 * @param maskWidth - Proto mask width (typically 160).
 * @param modelW - Model input width (e.g., 640).
 * @param modelH - Model input height (e.g., 640).
 * @param overlayW - Overlay/display width.
 * @param overlayH - Overlay/display height.
 * @param xRatio - Scale factor from model space to overlay space (X).
 * @param yRatio - Scale factor from model space to overlay space (Y).
 * @returns MaskResult with raw RGBA pixel data, or null if no detections.
 */
export function generateMaskOverlay(
  filtered: MaskableBox[],
  protoMask: Float32Array,
  maskChannels: number,
  maskHeight: number,
  maskWidth: number,
  modelW: number,
  modelH: number,
  overlayW: number,
  overlayH: number,
  xRatio: number,
  yRatio: number
): MaskResult | null {
  if (filtered.length === 0) return null;

  const matsToDelete: cv.Mat[] = [];

  const proto_mask_mat = cv.matFromArray(
    maskChannels,
    maskHeight * maskWidth,
    cv.CV_32F,
    protoMask
  );
  matsToDelete.push(proto_mask_mat);

  try {
    const NUM_FILTERED = filtered.length;

    // Build weights matrix from filtered results
    const maskWeightsArr = new Float32Array(NUM_FILTERED * maskChannels);
    for (let i = 0; i < NUM_FILTERED; i++) {
      for (let c = 0; c < maskChannels; c++) {
        maskWeightsArr[i * maskChannels + c] = filtered[i].mask_weights[c];
      }
    }
    const mask_weights_mat = cv.matFromArray(
      NUM_FILTERED, maskChannels, cv.CV_32F, maskWeightsArr
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
    const neg = new cv.Mat(
      weights_mul_proto.rows, weights_mul_proto.cols, cv.CV_32F, new cv.Scalar(-1)
    );
    matsToDelete.push(mask_sigmoid, ones, neg);
    cv.multiply(weights_mul_proto, neg, mask_sigmoid);
    cv.exp(mask_sigmoid, mask_sigmoid);
    cv.add(mask_sigmoid, ones, mask_sigmoid);
    cv.divide(ones, mask_sigmoid, mask_sigmoid);

    // Create overlay mat (RGBA, transparent)
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
    const maskScaleX = maskWidth / modelW;
    const maskScaleY = maskHeight / modelH;

    for (let i = 0; i < NUM_FILTERED; i++) {
      const rowMat = mask_sigmoid.row(i);
      matsToDelete.push(rowMat);
      const maskMat = cv.matFromArray(maskHeight, maskWidth, cv.CV_32F, rowMat.data32F);
      matsToDelete.push(maskMat);

      const [bx, by, bw, bh] = filtered[i].bbox;

      // Map bbox from overlay space → model space → mask space
      const mX = Math.floor(Math.max(0, (bx / xRatio) * maskScaleX));
      const mY = Math.floor(Math.max(0, (by / yRatio) * maskScaleY));
      const mW = Math.ceil(Math.min(maskWidth - mX, (bw / xRatio) * maskScaleX));
      const mH = Math.ceil(Math.min(maskHeight - mY, (bh / yRatio) * maskScaleY));

      if (mW <= 0 || mH <= 0) continue;

      // Crop the small region from the mask
      const maskRoi = maskMat.roi(new cv.Rect(mX, mY, mW, mH));
      matsToDelete.push(maskRoi);

      // Compute target position on the overlay
      const targetX = Math.max(0, Math.floor(bx));
      const targetY = Math.max(0, Math.floor(by));
      const targetW = Math.min(overlayW - targetX, Math.ceil(bw));
      const targetH = Math.min(overlayH - targetY, Math.ceil(bh));

      if (targetW <= 0 || targetH <= 0) continue;

      // Resize the cropped mask to target bbox size
      cv.resize(maskRoi, maskResized, new cv.Size(targetW, targetH), 0, 0, cv.INTER_LINEAR);

      // Binarize
      cv.threshold(maskResized, maskBinary, 0.5, 255, cv.THRESH_BINARY);
      maskBinary.convertTo(maskBinaryU8, cv.CV_8U);

      // Colorize and copy to overlay
      const color = Colors.getColor(filtered[i].class_idx, 0.6);
      const colorScalar = new cv.Scalar(color[0], color[1], color[2], color[3] * 255);
      const maskColored = new cv.Mat(targetH, targetW, cv.CV_8UC4, colorScalar);
      matsToDelete.push(maskColored);

      const overlayRoi = overlay_mat.roi(new cv.Rect(targetX, targetY, targetW, targetH));
      matsToDelete.push(overlayRoi);
      maskColored.copyTo(overlayRoi, maskBinaryU8);
    }

    // Extract raw RGBA pixels — copy into a clean ArrayBuffer
    // so the Uint8ClampedArray is backed by ArrayBuffer (not ArrayBufferLike),
    // which is required by the ImageData constructor.
    const rawData = overlay_mat.data;
    const buffer = new ArrayBuffer(rawData.byteLength);
    const pixels = new Uint8ClampedArray(buffer);
    pixels.set(rawData);
    return { pixels, width: overlayW, height: overlayH };
  } catch (error) {
    console.error("Error processing masks:", error);
    return null;
  } finally {
    matsToDelete.forEach((mat) => {
      if (mat && !mat.isDeleted()) mat.delete();
    });
  }
}
