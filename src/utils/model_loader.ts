import * as ort from "onnxruntime-web";

interface Config {
  input_shape: number[];
  iou_threshold: number;
  score_threshold: number;
}

/**
 * Module-level singleton: persists across React component mount/unmount cycles
 * so that Next.js client-side navigation doesn't trigger a double-session error.
 */
let cachedSession: ort.InferenceSession | null = null;
let cachedKey: string | null = null; // "<device>|<model_path>"

/**
 * Returns the cached session if device + model_path are unchanged.
 * Otherwise releases the old session, creates a new one, runs warm-up, and caches it.
 */
export async function model_loader(
  device: string,
  model_path: string,
  config: Config
): Promise<ort.InferenceSession | null> {
  const key = `${device}|${model_path}`;

  // ── Reuse existing session if nothing changed ───────────────────────────
  if (cachedSession && cachedKey === key) {
    console.log("[model_loader] Reusing cached session:", key);
    return cachedSession;
  }

  // ── Release stale session before creating a new one ────────────────────
  if (cachedSession) {
    try {
      await cachedSession.release();
    } catch {
      // release may throw if the session was already invalidated — ignore.
    }
    cachedSession = null;
    cachedKey = null;
  }

  try {
    const yolo_model = await ort.InferenceSession.create(model_path, {
      executionProviders: [device],
      graphOptimizationLevel: "all",
    });

    // Warm-up inference
    const dummyInputShape = config.input_shape.reduce((a, b) => a * b, 1);
    const dummy_input_tensor = new ort.Tensor(
      "float32",
      new Float32Array(dummyInputShape),
      config.input_shape
    );
    const { output0, output1 } = await yolo_model.run({ images: dummy_input_tensor });
    output0.dispose();
    output1.dispose();
    dummy_input_tensor.dispose();

    // Cache for future remounts
    cachedSession = yolo_model;
    cachedKey = key;

    return yolo_model;
  } catch (error) {
    console.error("Error loading model:", error);
    throw error;
  }
}

/** Call this when the user explicitly selects a different model/device. */
export async function releaseSession(): Promise<void> {
  if (cachedSession) {
    try {
      await cachedSession.release();
    } catch {
      // ignore
    }
    cachedSession = null;
    cachedKey = null;
  }
}