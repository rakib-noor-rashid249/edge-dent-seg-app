"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ModelSettings from "./ModelSettings";
import { CustomModel } from "../utils/types";

interface SettingsModalProps {
    device: string;
    setDevice: (val: string) => void;
    modelName: string;
    setModelName: (val: string) => void;
    cameraSelectorRef: React.RefObject<HTMLSelectElement | null>;
    customModels: CustomModel[];
    cameras: MediaDeviceInfo[];
    onAddModel: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SettingsModal({
    device,
    setDevice,
    modelName,
    setModelName,
    cameraSelectorRef,
    customModels,
    cameras,
    onAddModel,
}: SettingsModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                    <Settings className="h-5 w-5 text-slate-600" />
                    <span className="sr-only">Open Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Application Settings</DialogTitle>
                    <DialogDescription>
                        Configure processing unit, model, and camera source.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <ModelSettings
                        device={device}
                        setDevice={setDevice}
                        modelName={modelName}
                        setModelName={setModelName}
                        cameraSelectorRef={cameraSelectorRef}
                        customModels={customModels}
                        cameras={cameras}
                    />

                    <div className="flex items-center justify-center pt-4 border-t border-slate-100">
                        <label className="cursor-pointer">
                            <Button variant="secondary" asChild className="w-full pointer-events-none">
                                <span>Add Custom Model (.onnx)</span>
                            </Button>
                            <input type="file" accept=".onnx" onChange={onAddModel} hidden />
                        </label>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
