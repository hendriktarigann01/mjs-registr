"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function UnifiedRegistrationForm() {
  const router = useRouter();
  const pathname = usePathname();
  const isSuccessRoute = pathname === "/success";

  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("Peserta");

  const [formData, setFormData] = useState({
    namaLengkap: "",
    namaPerusahaan: "",
    nomorHp: "",
    konfirmasiKehadiran: "hadir",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");

  // Detect if we're on success page
  const isSuccessPage = isSuccessRoute && !!token;

  useEffect(() => {
    if (isSuccessRoute) {
      const storedToken = sessionStorage.getItem("qr_token");
      const storedName = sessionStorage.getItem("qr_name");

      if (storedToken) {
        setToken(storedToken);
        setName(storedName || "Peserta");
        // Hapus setelah dibaca — bersih
        sessionStorage.removeItem("qr_token");
        sessionStorage.removeItem("qr_name");
      }
    }
  }, [isSuccessRoute]);

  useEffect(() => {
    if (token) {
      setQrImageUrl(`/api/qr/${token}/image`);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log("API Response:", data);

      if (response.ok) {
        const token = data.data?.qrToken || data.qrToken;

        if (!token) {
          console.error("No token in response:", data);
          setError("Token tidak ditemukan dalam response");
          return;
        }

        sessionStorage.setItem("qr_token", token);
        sessionStorage.setItem("qr_name", formData.namaLengkap);
        router.push("/success");
      } else {
        setError(data.message || "Registrasi gagal");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `qr-code-${name.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isSuccessRoute && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full p-6 space-y-4">
          <div className="text-center">
            <p className="text-red-600 text-xs mb-3">
              Sesi telah berakhir atau halaman di-refresh.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-brand-primary text-white py-2 px-4 text-xs rounded-lg hover:bg-brand-primary-hover transition-colors"
            >
              Kembali ke Registrasi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full p-6 space-y-4">
        <Header />
        {/* Progress Bar */}
        <div className="flex items-center justify-between py-4 px-2">
          <div className="flex flex-col items-center gap-2 w-32">
            <div
              className={`w-10 h-10 rounded-full ${isSuccessPage ? "bg-brand-secondary text-brand-primary" : "bg-brand-secondary text-brand-primary"} flex items-center justify-center text-xs font-medium`}
            >
              1
            </div>
            <span className="text-xs text-font-secondary whitespace-nowrap">
              Isi Formulir
            </span>
          </div>
          <div
            className={`flex-1 h-0.5 ${isSuccessPage ? "bg-brand-primary" : "bg-gray-300"} mb-6`}
          />
          <div className="flex flex-col items-center gap-2 w-32">
            <div
              className={`w-10 h-10 rounded-full ${isSuccessPage ? "bg-brand-secondary text-brand-primary" : "bg-[#DFDFDF] text-font-secondary"} flex items-center justify-center text-xs ${isSuccessPage ? "font-medium" : ""}`}
            >
              2
            </div>
            <span
              className={`text-xs ${isSuccessPage ? "font-medium text-font-primary" : "text-font-secondary"} whitespace-nowrap`}
            >
              Download QR-Code
            </span>
          </div>
        </div>

        {isSuccessPage ? (
          // Success Page Content
          <>
            {/* Form Header */}
            <div className="flex mb-6 gap-5">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-pink-100 rounded-lg">
                <Image
                  src="/icons/qr_code.svg"
                  alt="ID Card Icon"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                  priority
                />
              </div>

              {/* Teks */}
              <div className="flex flex-col justify-center text-left text-xs">
                <h1 className="text-font-primary mb-3 font-semibold">
                  Download Barcode
                </h1>
                <p className="text-font-secondary">
                  Terima kasih! Registrasi Anda berhasil. Silakan simpan barcode
                  Anda.
                </p>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="p-8 rounded-lg mb-6 flex items-center justify-center">
              {qrImageUrl ? (
                <Image
                  src={qrImageUrl}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                  priority
                />
              ) : (
                <div className="w-64 h-64 animate-pulse rounded" />
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!qrImageUrl}
              className="w-full bg-brand-primary text-white mt-3 py-3 text-xs rounded-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Download QR Code
            </button>

            <p className="text-red-500 text-xs text-center">
              *Tunjukkan QR Code saat datang ke acara
            </p>
          </>
        ) : (
          // Registration Form Content
          <>
            {/* Form Header */}
            <div className="flex mb-6 gap-5">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-pink-100 rounded-lg">
                <Image
                  src="/icons/id_card.svg"
                  alt="ID Card Icon"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                  priority
                />
              </div>

              {/* Teks */}
              <div className="flex flex-col justify-center text-left text-xs">
                <h1 className="text-font-primary mb-3">Isi Formulir</h1>
                <p className="text-font-secondary">
                  Pastikan data yang dimasukkan benar untuk mendapatkan QR-Code
                  yang digunakan saat hadir
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                {error}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-3 text-font-primary"
            >
              <div>
                <label className="block text-xs font-medium mb-3">
                  Nama Lengkap<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={formData.namaLengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, namaLengkap: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-3">
                  Nama Perusahaan/EO<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama perusahaan/EO"
                  value={formData.namaPerusahaan}
                  onChange={(e) =>
                    setFormData({ ...formData, namaPerusahaan: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-3">
                  Nomor HP<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Masukan nomor hp anda"
                  value={formData.nomorHp}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorHp: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-[10px] text-font-secondary mt-1">
                  Format: 08xx (max 13 digit)
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium mb-3">
                  Konfirmasi Kehadiran<span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kehadiran"
                      value="hadir"
                      checked={formData.konfirmasiKehadiran === "hadir"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          konfirmasiKehadiran: e.target.value,
                        })
                      }
                      className="w-4 h-4 accent-black text-black focus:ring-black"
                    />
                    <span className="text-xs">Hadir</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kehadiran"
                      value="tidak"
                      checked={formData.konfirmasiKehadiran === "tidak"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          konfirmasiKehadiran: e.target.value,
                        })
                      }
                      className="w-4 h-4 accent-black text-black focus:ring-black"
                    />
                    <span className="text-xs">Tidak</span>
                  </label>
                </div>
              </div>

              <div className="h-0.5 border-t-2 border-dashed border-gray-300" />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-primary text-white mt-3 py-3 text-xs rounded-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : "Lanjutkan"}
              </button>
            </form>
          </>
        )}

        {/* Footer Logos */}
        <Footer />
      </div>
    </div>
  );
}
