"use client";

import { Box } from "../utils/types";
import classes from "../utils/yolo_classes.json";

interface ModelStatusProps {
  modelStatusRef: React.RefObject<HTMLParagraphElement | null>;
  isModelLoaded: boolean;
  warmUpTime: string;
  inferenceTime: string;
  details: Box[];
}

export default function ModelStatus({
  modelStatusRef,
  isModelLoaded,
  warmUpTime,
  inferenceTime,
  details,
}: ModelStatusProps) {
  return (
    <div id="model-status-container" className="container w-full max-w-3xl text-center">
      <div id="inference-time-container" className="flex flex-col sm:flex-row justify-evenly text-xl my-6">
        <p>
          Warm up time: <span className="text-lime-500">{warmUpTime}ms</span>
        </p>
        <p>
          Inference time: <span className="text-lime-500">{inferenceTime}ms</span>
        </p>
      </div>
      
      <p ref={modelStatusRef} className={isModelLoaded ? "" : "animate-text-loading"}>
        Model not loaded
      </p>
      
      <details className="text-gray-200 group mt-4" open>
        <summary className="my-5 hover:text-gray-400 cursor-pointer transition-colors duration-300">
          Detected objects
        </summary>
        <div className="transition-all duration-300 ease-in-out transform origin-top group-open:animate-details-show">
          <table className="w-full text-left border-collapse table-auto text-sm bg-gray-800 rounded-md overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="border-b border-gray-600 p-4 text-gray-100">#</th>
                <th className="border-b border-gray-600 p-4 text-gray-100">Class</th>
                <th className="border-b border-gray-600 p-4 text-gray-100">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item, index) => (
                <tr key={index} className="hover:bg-gray-700 transition-colors text-gray-300">
                  <td className="border-b border-gray-600 p-4">{index + 1}</td>
                  <td className="border-b border-gray-600 p-4">{classes[item.class_idx]}</td>
                  <td className="border-b border-gray-600 p-4">{(item.score * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}