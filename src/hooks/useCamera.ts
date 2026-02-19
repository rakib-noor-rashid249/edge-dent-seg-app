"use client";

import { useEffect, useState, useRef } from "react";

export function useCamera() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraSelectorRef = useRef<HTMLSelectElement>(null);

  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setCameras(videoDevices);
    } catch (error) {
      console.error("Error getting cameras:", error);
    }
  };

  const toggleCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: cameraSelectorRef.current?.value },
          audio: false,
        });
        setCameraStream(stream);
      } catch (error) {
        console.error("Error toggling camera:", error);
      }
    }
  };

  useEffect(() => {
    getCameras();
  }, []);

  return {
    cameras,
    cameraStream,
    cameraSelectorRef,
    toggleCamera,
  };
}