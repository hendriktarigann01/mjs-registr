"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Info } from "lucide-react";
import jsQR from "jsqr";

interface ScanResult {
  success: boolean;
  message: string;
  name?: string;
  company?: string;
  alreadyCheckedIn?: boolean;
  status?: "success" | "already_checked_in" | "error";
}

export default function QRScanner() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerFrameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

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

  const handleCheckIn = async (qrData: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      // Stop scanning
      stopScanning();

      // Extract token from QR data
      let token = qrData;
      if (qrData.includes("/qr/")) {
        const urlParts = qrData.split("/");
        token = urlParts[urlParts.length - 1];
      }

      console.log("Check-in token:", token);

      // Send check-in request
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": generateDeviceId(),
        },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await response.json();
      console.log("Check-in response:", data);
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log("Data success:", data.success);
      console.log("Already checked in:", data.data?.alreadyCheckedIn);

      setResult({
        success: data.success !== false, // Use API success flag, default to true if not false
        message: data.message || "Check-in berhasil!",
        name: data.data?.registration?.fullName,
        company: data.data?.registration?.companyName,
        alreadyCheckedIn: data.data?.alreadyCheckedIn || false,
      });

      // Auto-restart scanning after 3 seconds
      setTimeout(() => {
        setResult(null);
        processingRef.current = false;
        startScanning();
      }, 150000);
    } catch (error) {
      console.error("Check-in error:", error);
      setResult({
        success: false,
        message: "Kode qr tidak terdeteksi",
      });

      setTimeout(() => {
        setResult(null);
        processingRef.current = false;
        startScanning();
      }, 150000);
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

    // Set canvas size to match video
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get scanner frame position and size
      const scannerFrame = scannerFrameRef.current.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      // Calculate the portion of the video that corresponds to the scanner frame
      const scaleX = canvas.width / videoRect.width;
      const scaleY = canvas.height / videoRect.height;

      const scanX = (scannerFrame.left - videoRect.left) * scaleX;
      const scanY = (scannerFrame.top - videoRect.top) * scaleY;
      const scanWidth = scannerFrame.width * scaleX;
      const scanHeight = scannerFrame.height * scaleY;

      // Get image data only from scanner frame area
      const imageData = context.getImageData(
        Math.max(0, scanX),
        Math.max(0, scanY),
        Math.min(scanWidth, canvas.width - scanX),
        Math.min(scanHeight, canvas.height - scanY),
      );

      // Try to decode QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("QR Code detected:", code.data);
        handleCheckIn(code.data);
        return; // Stop scanning after successful decode
      }
    }

    // Continue scanning
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

      // Start QR scanning loop
      setTimeout(() => {
        scanQRCode();
      }, 500); // Small delay to ensure video is ready
    } catch (error) {
      console.error("Scanner error:", error);
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Video - Full Screen */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* Error Alert */}
        {error && (
          <div className="absolute top-6 left-6 right-6 p-4 bg-red-500/90 border border-red-600 rounded-lg text-white text-sm">
            {error}
          </div>
        )}

        {/* Main Content - Centered */}
        <div className="flex flex-col items-center justify-center px-6 gap-8 max-w-2xl">
          {/* Header */}
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
            {/* Corner borders */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white z-10" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white z-10" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white z-10" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white z-10" />

            {/* Scanning line animation */}
            {scanning && !result && (
              <div className="absolute inset-0 overflow-hidden z-10">
                <div className="absolute left-0 right-0 h-0.5 bg-white shadow-lg shadow-white/50 animate-scan" />
              </div>
            )}

            {/* Scanning status */}
            {scanning && !result && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-black/60 px-4 py-2 rounded-lg">
                  <p className="text-white text-sm font-medium">Scanning...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Absolute bottom */}
        <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-center gap-2">
          <span className="text-gray-300 text-sm">
            Powered by MJ Solution Indonesia
          </span>
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setResult(null);
                processingRef.current = false;
                startScanning();
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {result.success && !result.alreadyCheckedIn ? (
              // New Check-in Success State
              <>
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center">
                  {result.name && (
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Selamat datang Bapak/Ibu {result.name}
                    </h3>
                  )}
                </div>
              </>
            ) : result.success && result.alreadyCheckedIn ? (
              // Already Checked In State
              <>
                {/* Info Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Already Checked In Message */}
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {result.message}
                  </p>
                </div>
              </>
            ) : (
              // Error State
              <>
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                </div>

                {/* Error Message */}
                <div className="text-center">
                  <p className="text-gray-900 text-lg font-medium">
                    {result.message || "Kode qr tidak terdeteksi"}
                  </p>
                </div>
              </>
            )}
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
