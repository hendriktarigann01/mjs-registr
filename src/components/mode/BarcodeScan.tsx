"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Info, X, QrCode } from "lucide-react";

interface ScanResult {
  success: boolean;
  message: string;
  name?: string;
  company?: string;
  alreadyCheckedIn?: boolean;
}

const AUTO_DISMISS_MS = 5000;

export default function BarcodeScan() {
  const router = useRouter();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_DISMISS_MS / 1000);

  const processingRef = useRef(false);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
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

  const resetState = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    setResult(null);
    setIsProcessing(false);
    setCountdown(AUTO_DISMISS_MS / 1000);
    processingRef.current = false;
    barcodeBufferRef.current = "";
  }, []);

  const startAutoDismiss = useCallback(() => {
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
      resetState();
    }, AUTO_DISMISS_MS);
  }, [resetState]);

  const handleCheckIn = useCallback(
    async (scannedData: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);

      try {
        // Extract token from full URL or use as-is
        let token = scannedData.trim();
        if (token.includes("/qr/")) {
          const parts = token.split("/qr/");
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
          // processingRef stays true — redirect will unmount this component
          return;
        }

        // ⚠️ Already checked in or error → show modal
        setResult({
          success: isSuccess,
          message:
            data.message ||
            (isSuccess ? "Check-in berhasil!" : "Terjadi kesalahan"),
          name: data.data?.registration?.fullName,
          company: data.data?.registration?.companyName,
          alreadyCheckedIn,
        });

        setIsProcessing(false);
        startAutoDismiss();
      } catch (error) {
        console.error("Check-in error:", error);
        setResult({
          success: false,
          message: "Kode tidak terdeteksi atau tidak valid",
        });
        setIsProcessing(false);
        startAutoDismiss();
      }
    },
    [router, startAutoDismiss],
  );

  // Barcode scanner keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block new input while modal is open or processing
      if (result !== null || processingRef.current) return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scanned = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = "";
        if (scanned.length > 0) {
          handleCheckIn(scanned);
        }
        return;
      }

      // Reset buffer if gap too long (manual typing vs scanner burst)
      if (timeSinceLastKey > 500 && barcodeBufferRef.current.length > 0) {
        barcodeBufferRef.current = "";
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCheckIn, result]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const progressPercent = (countdown / (AUTO_DISMISS_MS / 1000)) * 100;

  return (
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.07),transparent)]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-lg w-full">
        <p className="text-zinc-400 text-base leading-relaxed text-center">
          Arahkan barcode scanner ke kode QR peserta untuk melakukan check-in
        </p>

        {/* Scanner Icon */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative">
            {!isProcessing && (
              <>
                <div
                  className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <div
                  className="absolute -inset-4 rounded-full bg-blue-500/5 animate-ping"
                  style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
                />
              </>
            )}

            <div
              className={`relative w-28 h-28 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isProcessing
                  ? "bg-blue-600/20 border border-blue-500/40"
                  : "bg-zinc-900 border border-zinc-700/60"
              }`}
            >
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <QrCode className="w-12 h-12 text-zinc-400" />
              )}
            </div>
          </div>

          <p
            className={`text-sm transition-colors ${
              isProcessing
                ? "text-blue-400 animate-pulse font-medium"
                : "text-zinc-500"
            }`}
          >
            {isProcessing
              ? "Memproses data..."
              : "Menunggu pemindaian barcode..."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
        <span className="text-zinc-600 text-sm">
          Powered by Karindo Mitra Internasional
        </span>
      </div>

      {/* Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
              <div
                className="h-full bg-zinc-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={resetState}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            {result.alreadyCheckedIn ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Info className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-zinc-400 text-sm">Informasi</p>
                  <p className="text-lg font-medium text-white">
                    {result.message}
                  </p>
                </div>
              </>
            ) : (
              /* Error */
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-zinc-400 text-sm">Gagal</p>
                  <p className="text-lg font-medium text-white">
                    {result.message || "Kode tidak terdeteksi"}
                  </p>
                </div>
              </>
            )}

            {/* Dismiss button + countdown */}
            <button
              onClick={resetState}
              className="mt-6 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              Scan Berikutnya ({countdown}s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
