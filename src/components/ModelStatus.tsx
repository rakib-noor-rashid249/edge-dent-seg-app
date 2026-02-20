"use client";

import { Box } from "../utils/types";
import classes from "../utils/yolo_classes.json";
import { Colors } from "../utils/img_preprocess";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface ModelStatusProps {
  details: Box[];
  selectedDetectionIdx: number | null;
  onSelectDetection: (idx: number | null) => void;
  onSave: () => void;
}

export default function ModelStatus({
  details,
  selectedDetectionIdx,
  onSelectDetection,
  onSave,
}: ModelStatusProps) {
  const handleRowClick = (idx: number) => {
    onSelectDetection(selectedDetectionIdx === idx ? null : idx);
  };

  return (
    <Card className="w-full p-4 bg-white/80 backdrop-blur-sm shadow-md border-0 h-full flex flex-col">

      {/* Header row: label + count + save */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Detections{details.length > 0 && ` (${details.length})`}
        </h2>
        <button
          onClick={onSave}
          title="Save result as PNG"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={details.length === 0}
        >
          <Download className="w-3 h-3" />
          Save
        </button>
      </div>

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
            {details.map((item, index) => {
              const isSelected = selectedDetectionIdx === index;
              const isDimmed = selectedDetectionIdx !== null && !isSelected;
              const color = Colors.getColor(item.class_idx, 1.0);
              const dotColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

              return (
                <tr
                  key={index}
                  onClick={() => handleRowClick(index)}
                  className={`cursor-pointer transition-colors ${isSelected
                      ? "bg-teal-50 ring-1 ring-inset ring-teal-300"
                      : isDimmed
                        ? "opacity-40 hover:opacity-70"
                        : "hover:bg-slate-50"
                    }`}
                >
                  <td className="p-3 text-slate-500">{index + 1}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="font-medium text-slate-700">{classes[item.class_idx]}</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={item.score > 0.8 ? "default" : "secondary"}
                      className={item.score > 0.8 ? "bg-teal-500 hover:bg-teal-600" : ""}
                    >
                      {(item.score * 100).toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
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