import React, { useRef, useEffect, useState } from 'react';

interface CameraFeedProps {
  onFrameCapture: (imageData: string) => void;
  captureIntervalMs: number;
  isActive: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onFrameCapture, captureIntervalMs, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStreamError("Could not access camera. Please allow permissions.");
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  useEffect(() => {
    let intervalId: number;

    if (isActive && !streamError) {
      intervalId = window.setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');

          if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            onFrameCapture(imageData);
          }
        }
      }, captureIntervalMs);
    }

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive, captureIntervalMs, onFrameCapture, streamError]);

  return (
    <div className="relative w-full max-w-lg aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {streamError ? (
        <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
          {streamError}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            LIVE
          </div>
        </>
      )}
    </div>
  );
};

export default CameraFeed;
