"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full p-6 space-y-4">
        <Header />

        {/* Form Header */}
        <div className="flex pt-4 mb-6 gap-5">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-pink-100 rounded-lg">
            <svg
              className="w-6 h-6 text-brand-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Teks */}
          <div className="flex flex-col justify-center text-left text-xs">
            <h1 className="text-font-primary mb-3 font-semibold">
              Admin Dashboard
            </h1>
            <p className="text-font-secondary">
              Login untuk mengakses dashboard admin
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-font-primary">
          <div>
            <label className="block text-xs font-medium mb-3">
              Username<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-3">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Demo Credentials */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-[10px] text-font-secondary font-medium mb-1">
              Demo Credentials:
            </p>
            <p className="text-[10px] text-font-secondary">
              Username: <span className="font-mono font-medium">admin</span>
              <br />
              Password: <span className="font-mono font-medium">admin123</span>
            </p>
          </div>

          <div className="h-0.5 border-t-2 border-dashed border-gray-300" />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary text-white mt-3 py-3 text-xs rounded-lg hover:bg-brand-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>

        {/* Footer Logos */}
        <Footer />
      </div>
    </div>
  );
}
