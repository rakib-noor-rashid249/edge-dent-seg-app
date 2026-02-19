import * as ort from "onnxruntime-web";

interface Config {
  input_shape: number[];
  iou_threshold: number;
  score_threshold: number;
}

/**
 * Loads the ONNX model and performs a warm-up inference.
 * @param {string} device - Execution backend (e.g., "webgpu" or "wasm").
 * @param {string} model_path - URL or path to the model.
 * @param {Config} config - Configuration including input shape.
 * @returns {Promise<ort.InferenceSession | null>} The loaded session or null on failure.
 */
export async function model_loader(
  device: string,
  model_path: string,
  config: Config
): Promise<ort.InferenceSession | null> {
  // Set the WASM path (if needed)
  // ort.env.wasm.wasmPaths = `./`;

  try {
    // Load the model
    const yolo_model = await ort.InferenceSession.create(model_path, {
      executionProviders: [device],
      graphOptimizationLevel: 'all',
    });

    // Warm up the model
    const dummyInputShape = config.input_shape.reduce((a, b) => a * b, 1);
    const dummy_input_tensor = new ort.Tensor("float32", new Float32Array(dummyInputShape), config.input_shape);
    const { output0, output1 } = await yolo_model.run({ images: dummy_input_tensor });
    output0.dispose();
    output1.dispose();
    dummy_input_tensor.dispose();

    return yolo_model;
  } catch (error) {
    console.error("Error loading model:", error);
    return null;
  }
}