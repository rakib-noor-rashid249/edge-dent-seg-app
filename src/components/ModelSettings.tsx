"use client";

import { CustomModel } from "../utils/types";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ModelSettingsProps {
    device: string;
    setDevice: (val: string) => void;
    modelName: string;
    setModelName: (val: string) => void;
    selectedDeviceId: string;
    setSelectedDeviceId: (val: string) => void;
    customModels: CustomModel[];
    cameras: MediaDeviceInfo[];
}

export default function ModelSettings({
    device,
    setDevice,
    modelName,
    setModelName,
    selectedDeviceId,
    setSelectedDeviceId,
    customModels,
    cameras,
}: ModelSettingsProps) {
    return (
        <Card className="w-full max-w-3xl p-6 bg-white/50 backdrop-blur-sm border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-6 justify-center items-end">
                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label htmlFor="device-selector" className="text-slate-600 font-medium">Processing Unit</Label>
                    <Select onValueChange={(val) => {
                        setDevice(val);
                    }} value={device}>
                        <SelectTrigger className="w-full bg-white border-slate-200">
                            <SelectValue placeholder="Select Backend" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="webgpu">WebGPU (Recommended)</SelectItem>
                            <SelectItem value="wasm">Wasm (CPU)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label htmlFor="model-selector" className="text-slate-600 font-medium">AI Model</Label>
                    <Select onValueChange={(val) => {
                        setModelName(val);
                    }} value={modelName}>
                        <SelectTrigger className="w-full bg-white border-slate-200">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fft-11-n-best">ESN-11n (High Speed)</SelectItem>
                            <SelectItem value="fft-11-s-best">ESN-11s (High Accuracy)</SelectItem>
                            {customModels.map((model, index) => (
                                <SelectItem key={index} value={model.url}>
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label htmlFor="camera-selector" className="text-slate-600 font-medium">Camera Source</Label>
                    <Select onValueChange={(val) => {
                        setSelectedDeviceId(val);
                    }} value={selectedDeviceId}>
                        <SelectTrigger className="w-full bg-white border-slate-200">
                            <SelectValue placeholder="Select Camera" />
                        </SelectTrigger>
                        <SelectContent>
                            {cameras.map((camera, index) => (
                                <SelectItem key={index} value={camera.deviceId}>
                                    {camera.label || `Camera ${index + 1}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
}
