"use client";

import { useEffect, useState, useCallback } from "react";

export function useCamera() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedDeviceId") || "";
    }
    return "";
  });

  useEffect(() => {
    if (selectedDeviceId) {
      localStorage.setItem("selectedDeviceId", selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const toggleCamera = async () => {
    if (cameraStream) {
      stopCamera();
    } else {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCameraStream(stream);
      } catch (error) {
        console.error("Error toggling camera:", error);
      }
    }
  };

  useEffect(() => {
    const getCameras = async () => {
      try {
        // Removed initial permission request to get labels on mount
        // This will be handled when the user clicks "Open Camera"

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);

        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
      }
    };
    getCameras();
  }, [selectedDeviceId]);

  return {
    cameras,
    cameraStream,
    selectedDeviceId,
    setSelectedDeviceId,
    toggleCamera,
    stopCamera,
  };
}