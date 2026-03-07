"use client";

import { Image as ImageIcon, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMediaDisplay } from "./MediaDisplayContext";

const EXAMPLE_IMAGES = [
  '/ex1.jpg',
  '/ex2.jpg',
  '/ex3.jpg',
  '/ex4.jpg',
];

export default function Placeholder() {
  const {
    actions: { onImageSelect, onCameraToggle, onOpenImage },
    meta: { openImageRef },
  } = useMediaDisplay();

  return (
    <div className="text-center p-8 max-w-2xl w-full flex flex-col items-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-8">
        <Card
          className="p-6 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all flex flex-col items-center gap-3 group border-slate-200"
          onClick={() => openImageRef.current?.click()}
        >
          <div className="p-4 bg-teal-50 rounded-full group-hover:bg-teal-100 transition-colors">
            <ImageIcon className="w-8 h-8 text-teal-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-900">Upload Image</h3>
            <p className="text-sm text-slate-500">Analyze a local file</p>
          </div>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={openImageRef}
            onChange={onOpenImage}
          />
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all flex flex-col items-center gap-3 group border-slate-200"
          onClick={onCameraToggle}
        >
          <div className="p-4 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
            <Camera className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-900">Open Camera</h3>
            <p className="text-sm text-slate-500">Real-time detection</p>
          </div>
        </Card>
      </div>

      <div className="relative flex items-center w-full max-w-md mb-8">
        <div className="grow border-t border-slate-200"></div>
        <span className="shrink-0 mx-4 text-slate-400 text-sm">Or try an example</span>
        <div className="grow border-t border-slate-200"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {EXAMPLE_IMAGES.map((src, i) => (
          <button
            key={i}
            onClick={() => onImageSelect(src)}
            className="relative group/img overflow-hidden rounded-lg aspect-square border border-slate-200 hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 transition-all shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Example ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
