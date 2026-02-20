"use client";

import { Box } from "../utils/types";
import classes from "../utils/yolo_classes.json";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModelStatusProps {
  modelStatus: string;
  isModelLoaded: boolean;
  warmUpTime: string;
  inferenceTime: string;
  details: Box[];
}

export default function ModelStatus({
  modelStatus,
  isModelLoaded,
  warmUpTime,
  inferenceTime,
  details,
}: ModelStatusProps) {
  return (
    <Card className="w-full max-w-3xl p-6 bg-white/80 backdrop-blur-sm shadow-md border-0 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Badge variant="outline" className="text-sm py-1 px-3 border-slate-300">
            Warmup: <span className="text-teal-600 font-semibold ml-1">{warmUpTime}ms</span>
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3 border-slate-300">
            Inference: <span className="text-teal-600 font-semibold ml-1">{inferenceTime}ms</span>
          </Badge>
        </div>
        <div className={`text-sm font-medium ${isModelLoaded ? 'text-teal-600' : 'text-amber-500 animate-pulse'}`}>
          {modelStatus}
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="p-3 font-semibold text-slate-600">#</th>
              <th className="p-3 font-semibold text-slate-600">Class</th>
              <th className="p-3 font-semibold text-slate-600">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-slate-500">{index + 1}</td>
                <td className="p-3 font-medium text-slate-700">{classes[item.class_idx]}</td>
                <td className="p-3">
                  <Badge variant={item.score > 0.8 ? "default" : "secondary"} className={item.score > 0.8 ? "bg-teal-500 hover:bg-teal-600" : ""}>
                    {(item.score * 100).toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            ))}
            {details.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  No detections yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}