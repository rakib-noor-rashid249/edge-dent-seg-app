import classes from "./yolo_classes.json";
import { Colors } from "./img_preprocess";

/**
 * Draw bounding boxes on the overlay canvas.
 * @param {Array<{bbox: number[], class_idx: number, score: number}>} predictions - Detected objects.
 * @param {HTMLCanvasElement} overlay_el - Canvas element to draw on.
 */
export async function draw_bounding_boxes(
  predictions: Array<{ bbox: number[]; class_idx: number; score: number }>,
  overlay_el: HTMLCanvasElement
): Promise<void> {
  const ctx = overlay_el.getContext("2d");
  if (!ctx) return;

  // Calculate diagonal length of the canvas for dynamic line width
  const diagonalLength = Math.sqrt(Math.pow(overlay_el.width, 2) + Math.pow(overlay_el.height, 2));
  const lineWidth = diagonalLength / 250;

  predictions.forEach((predict) => {
    // Get color for the class
    const borderColor = Colors.getColor(predict.class_idx, 0.8);
    const rgbaBorderColor = `rgba(${borderColor[0]}, ${borderColor[1]}, ${borderColor[2]}, ${borderColor[3]})`;

    const [x1, y1, width, height] = predict.bbox;

    // Draw border rectangle
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = rgbaBorderColor;
    ctx.strokeRect(x1, y1, width, height);

    // Draw label background and text
    ctx.fillStyle = rgbaBorderColor;
    ctx.font = "16px Arial";
    const text = `${classes[predict.class_idx]} ${predict.score.toFixed(2)}`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = parseInt(ctx.font, 10);

    // Position text above the box; adjust if near the top
    let textY = y1 - 5;
    let rectY = y1 - textHeight - 4;
    if (rectY < 0) {
      textY = y1 + textHeight + 5;
      rectY = y1 + 1;
    }

    ctx.fillRect(x1 - 1, rectY, textWidth + 4, textHeight + 4);
    ctx.fillStyle = "white";
    ctx.fillText(text, x1, textY);
  });
}
