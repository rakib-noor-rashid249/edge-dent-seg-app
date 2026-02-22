/**
 * Checks if the current browser environment supports WebGPU.
 * @returns {boolean} True if WebGPU is supported, false otherwise.
 */
export function isWebGPUSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    return !!(navigator as any).gpu;
}
