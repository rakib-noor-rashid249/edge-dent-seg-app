"use client";

import { CustomModel } from "../utils/types";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ModelSettingsProps {
    deviceRef: React.RefObject<HTMLSelectElement | null>;
    modelRef: React.RefObject<HTMLSelectElement | null>;
    cameraSelectorRef: React.RefObject<HTMLSelectElement | null>;
    customModels: CustomModel[];
    cameras: MediaDeviceInfo[];
    onLoadModel: () => void;
}

export default function ModelSettings({
    deviceRef,
    modelRef,
    cameraSelectorRef,
    customModels,
    cameras,
    onLoadModel,
}: ModelSettingsProps) {
    return (
        <Card className="w-full max-w-3xl p-6 bg-white/50 backdrop-blur-sm border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-6 justify-center items-end">
                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label htmlFor="device-selector" className="text-slate-600 font-medium">Processing Unit</Label>
                    <Select onValueChange={(val) => {
                        if (deviceRef.current) {
                            deviceRef.current.value = val;
                            onLoadModel();
                        }
                    }} defaultValue="webgpu">
                        <SelectTrigger className="w-full bg-white border-slate-200">
                            <SelectValue placeholder="Select Backend" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="webgpu">WebGPU (Recommended)</SelectItem>
                            <SelectItem value="wasm">Wasm (CPU)</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Hidden select for compatibility if refs are strictly needed, otherwise we should update hook to use state. 
                        For now, linking Select to Ref via onValueChange manual update or keeping hidden select.
                        Actually, refs are used in hook. let's keep native selects hidden or update refs manually.
                        The hook reads .value from ref. We can use a hidden native select sync strategy or just update the ref's current value if it's a mutable object, 
                        BUT refs usually point to DOM elements. 
                        
                        Strategy: Keep the original selects HIDDEN and control them via Shadcn Select onValueChange.
                    */}
                    <select
                        name="device-selector"
                        ref={deviceRef}
                        className="hidden"
                        defaultValue="webgpu"
                    >
                        <option value="webgpu">webGPU</option>
                        <option value="wasm">Wasm(cpu)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label htmlFor="model-selector" className="text-slate-600 font-medium">AI Model</Label>
                    <Select onValueChange={(val) => {
                        if (modelRef.current) {
                            modelRef.current.value = val;
                            onLoadModel();
                        }
                    }} defaultValue="fft-11-n-best">
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
                    <select
                        name="model-selector"
                        ref={modelRef}
                        className="hidden"
                        defaultValue="fft-11-n-best"
                    >
                        <option value="fft-11-n-best">ESN-11n-2.6M</option>
                        <option value="fft-11-s-best">ESN-11s-9.4M</option>
                        {customModels.map((model, index) => (
                            <option key={index} value={model.url}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label htmlFor="camera-selector" className="text-slate-600 font-medium">Camera Source</Label>
                    <Select onValueChange={(val) => {
                        if (cameraSelectorRef.current) {
                            cameraSelectorRef.current.value = val;
                        }
                    }}>
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
                    <select ref={cameraSelectorRef} className="hidden">
                        {cameras.map((camera, index) => (
                            <option key={index} value={camera.deviceId}>
                                {camera.label || `Camera ${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </Card>
    );
}
