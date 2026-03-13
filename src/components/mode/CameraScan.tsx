"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Info, X } from "lucide-react";

interface ScanResult {
  success: boolean;
  message: string;
  name?: string;
  company?: string;
  alreadyCheckedIn?: boolean;
}

const AUTO_DISMISS_MS = 5000;

export default function CameraScan() {
  const router = useRouter();

  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>("");
  const [countdown, setCountdown] = useState(AUTO_DISMISS_MS / 1000);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerFrameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const generateDeviceId = () => {
    if (typeof window !== "undefined") {
      let deviceId = sessionStorage.getItem("device_id");
      if (!deviceId) {
        deviceId = "device_" + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem("device_id", deviceId);
      }
      return deviceId;
    }
    return "unknown";
  };

  const startAutoDismiss = (onDone: () => void) => {
    setCountdown(AUTO_DISMISS_MS / 1000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current)
            clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    dismissTimerRef.current = setTimeout(() => {
      onDone();
    }, AUTO_DISMISS_MS);
  };

  const clearDismissTimers = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
  };

  const handleDismiss = () => {
    clearDismissTimers();
    setResult(null);
    setCountdown(AUTO_DISMISS_MS / 1000);
    processingRef.current = false;
    startScanning();
  };

  const handleCheckIn = async (qrData: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      stopScanning();

      let token = qrData;
      if (qrData.includes("/qr/")) {
        const parts = qrData.split("/qr/");
        token = parts[parts.length - 1];
      }

      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": generateDeviceId(),
        },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await response.json();
      const isSuccess = data.success !== false;
      const alreadyCheckedIn = data.data?.alreadyCheckedIn || false;

      if (isSuccess && !alreadyCheckedIn) {
        const name = encodeURIComponent(
          data.data?.registration?.fullName || "",
        );
        const gender = encodeURIComponent(
          data.data?.registration?.gender || "",
        );
        router.push(`/check-in/success?name=${name}&gender=${gender}`);
        return;
      }

      setResult({
        success: isSuccess,
        message:
          data.message ||
          (isSuccess ? "Check-in berhasil!" : "Terjadi kesalahan"),
        name: data.data?.registration?.fullName,
        company: data.data?.registration?.companyName,
        alreadyCheckedIn,
      });

      startAutoDismiss(() => {
        setResult(null);
        setCountdown(AUTO_DISMISS_MS / 1000);
        processingRef.current = false;
        startScanning();
      });
    } catch (error) {
      console.error("Check-in error:", error);
      setResult({
        success: false,
        message: "Kode qr tidak terdeteksi",
      });

      startAutoDismiss(() => {
        setResult(null);
        setCountdown(AUTO_DISMISS_MS / 1000);
        processingRef.current = false;
        startScanning();
      });
    }
  };

  const scanQRCode = () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !scanning ||
      !scannerFrameRef.current
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const scannerFrame = scannerFrameRef.current.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      const scaleX = canvas.width / videoRect.width;
      const scaleY = canvas.height / videoRect.height;

      const scanX = (scannerFrame.left - videoRect.left) * scaleX;
      const scanY = (scannerFrame.top - videoRect.top) * scaleY;
      const scanWidth = scannerFrame.width * scaleX;
      const scanHeight = scannerFrame.height * scaleY;

      const imageData = context.getImageData(
        Math.max(0, scanX),
        Math.max(0, scanY),
        Math.min(scanWidth, canvas.width - scanX),
        Math.min(scanHeight, canvas.height - scanY),
      );

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleCheckIn(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const startScanning = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);
      setTimeout(() => scanQRCode(), 500);
    } catch (error) {
      console.error("Scanner error:", error);
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
      clearDismissTimers();
    };
  }, []);

  const progressPercent = (countdown / (AUTO_DISMISS_MS / 1000)) * 100;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {error && (
          <div className="absolute top-6 left-6 right-6 p-4 bg-red-500/90 border border-red-600 rounded-lg text-white text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center px-6 gap-8 max-w-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-white text-2xl font-medium">
              Kode QR Kehadiran
            </h1>
            <p className="text-white max-w-md text-base">
              Letakkan QR-Code Anda di tempat yang tersedia dengan bagian depan
              menghadap kamera.
            </p>
          </div>

          {/* Scanner Box */}
          <div
            ref={scannerFrameRef}
            className="relative w-full max-w-sm aspect-square"
          >
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white z-10" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white z-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white z-10" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white z-10" />

            {scanning && !result && (
              <div className="absolute inset-0 overflow-hidden z-10">
                <div className="absolute left-0 right-0 h-0.5 bg-white shadow-lg shadow-white/50 animate-scan" />
              </div>
            )}

            {scanning && !result && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-black/60 px-4 py-2 rounded-lg">
                  <p className="text-white text-sm font-medium">Scanning...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-center gap-2">
          <span className="text-gray-300 text-sm">
            Powered by Karindo Mitra Internasional
          </span>
        </div>
      </div>

      {/* Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
              <div
                className="h-full bg-gray-400 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {result.alreadyCheckedIn ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {result.message}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-900 text-lg font-medium">
                    {result.message || "Kode qr tidak terdeteksi"}
                  </p>
                </div>
              </>
            )}

            <button
              onClick={handleDismiss}
              className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              Scan Berikutnya ({countdown}s)
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
