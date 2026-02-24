"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const AUTO_REDIRECT_MS = 8000;

export default function CheckInSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "Peserta";
  const gender = searchParams.get("gender") || "";

  const [countdown, setCountdown] = useState(AUTO_REDIRECT_MS / 1000);

  const isFemale = gender.toLowerCase() === "perempuan";
  const animationSrc = isFemale
    ? "/animation/animation_female.mp4"
    : "/animation/animation_male.mp4";

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      router.push("/check-in");
    }, AUTO_REDIRECT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="relative bg-[#f0f2f2] w-full min-h-screen overflow-hidden flex flex-col">
      {/* Background pattern top-left */}
      <div className="absolute top-0 left-0 w-100 h-100 z-10 pointer-events-none">
        <Image
          src="/entry-top.webp"
          fill
          alt="pattern top"
          unoptimized
          className="object-contain object-top-left"
        />
      </div>

      {/* Background pattern bottom-right */}
      <div className="absolute bottom-0 right-0 w-100 h-100 z-10 pointer-events-none">
        <Image
          src="/entry-bottom.webp"
          fill
          alt="pattern bottom"
          unoptimized
          className="object-contain object-bottom-right"
        />
      </div>

      {/* Animation as background layer — gender based */}
      <div className="absolute inset-0 flex justify-center items-end pointer-events-none">
        <video
          key={animationSrc}
          src={animationSrc}
          autoPlay
          loop
          muted
          playsInline
          className="h-full object-contain"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center pt-16 px-8 flex-1">
        {/* Logo */}
        <div className="mb-10">
          <Image
            src="/mjs_logo_text.png"
            width={160}
            height={60}
            alt="Logo MJ Solution Indonesia"
            unoptimized
            className="object-contain"
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-lg font-light tracking-wide">
            Welcome
          </p>
          <h1 className="text-4xl font-semibold text-gray-700 tracking-tight">
            {name}
          </h1>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-6 px-8 flex items-center justify-between">
        <p className="text-gray-400 text-xs">
          Powered by MJ Solution Indonesia
        </p>
      </div>
    </div>
  );
}
