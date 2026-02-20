"use client";

import { Box } from "../utils/types";
import classes from "../utils/yolo_classes.json";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModelStatusProps {
  details: Box[];
}

export default function ModelStatus({ details }: ModelStatusProps) {
  return (
    <Card className="w-full p-4 bg-white/80 backdrop-blur-sm shadow-md border-0 h-full flex flex-col">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Detections</h2>

      <div className="flex-1 overflow-auto rounded-md border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="p-3 font-semibold text-slate-600">#</th>
              <th className="p-3 font-semibold text-slate-600">Class</th>
              <th className="p-3 font-semibold text-slate-600">Conf.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-slate-500">{index + 1}</td>
                <td className="p-3 font-medium text-slate-700">{classes[item.class_idx]}</td>
                <td className="p-3">
                  <Badge
                    variant={item.score > 0.8 ? "default" : "secondary"}
                    className={item.score > 0.8 ? "bg-teal-500 hover:bg-teal-600" : ""}
                  >
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