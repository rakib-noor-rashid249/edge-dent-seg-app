import classes from "./yolo_classes.json";
import { Colors } from "./img_preprocess";

/**
 * Draw bounding boxes ON TOP of existing canvas content (e.g., segmentation masks).
 * Does NOT clear the canvas.
 * @param predictions - Detected objects.
 * @param overlay_el - Canvas element to draw on.
 * @param filterIndex - If set, only draw that box fully; dim others.
 */
export async function draw_bounding_boxes(
  predictions: Array<{ bbox: number[]; class_idx: number; score: number }>,
  overlay_el: HTMLCanvasElement,
  filterIndex: number | null = null
): Promise<void> {
  const ctx = overlay_el.getContext("2d");
  if (!ctx) return;

  // NOTE: We do NOT clearRect here — masks drawn by inference_pipeline must be preserved.

  const diagonalLength = Math.sqrt(Math.pow(overlay_el.width, 2) + Math.pow(overlay_el.height, 2));
  const lineWidth = diagonalLength / 250;

  predictions.forEach((predict, idx) => {
    const isFiltered = filterIndex !== null && idx !== filterIndex;
    const alpha = isFiltered ? 0.15 : 0.8;

    const borderColor = Colors.getColor(predict.class_idx, alpha);
    const rgbaBorderColor = `rgba(${borderColor[0]}, ${borderColor[1]}, ${borderColor[2]}, ${alpha})`;

    const [x1, y1, width, height] = predict.bbox;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = rgbaBorderColor;
    ctx.strokeRect(x1, y1, width, height);

    // Only draw label for non-dimmed boxes
    if (!isFiltered) {
      ctx.fillStyle = rgbaBorderColor;
      ctx.font = "16px Arial";
      const text = `${classes[predict.class_idx]} ${predict.score.toFixed(2)}`;
      const textWidth = ctx.measureText(text).width;
      const textHeight = parseInt(ctx.font, 10);

      let textY = y1 - 5;
      let rectY = y1 - textHeight - 4;
      if (rectY < 0) {
        textY = y1 + textHeight + 5;
        rectY = y1 + 1;
      }

      ctx.fillRect(x1 - 1, rectY, textWidth + 4, textHeight + 4);
      ctx.fillStyle = "white";
      ctx.fillText(text, x1, textY);
    }
  });
}
