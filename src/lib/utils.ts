import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate unique QR token
export function generateQRToken(): string {
  return randomUUID();
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Convert +6281234567890 to 0812-3456-7890
  if (phone.startsWith("+62")) {
    const number = "0" + phone.slice(3);
    return number.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  return phone;
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

// Get user agent info
export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "Unknown";
}

// Get client IP from request
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

// Generate device ID from user agent
export function generateDeviceId(userAgent: string, ip: string): string {
  const crypto = import("crypto");
  const hash = crypto
    .createHash("sha256")
    .update(userAgent + ip)
    .digest("hex");
  return hash.slice(0, 16);
}

// Format date to Indonesian locale
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const datePart = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("id-ID", {
    timeStyle: "short",
  }).format(d);

  return `${datePart} (${timePart})`;
}

// Check if phone number has sequential digits (anti-bot)
export function isSequentialPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  let sequential = 0;

  for (let i = 0; i < digits.length - 1; i++) {
    if (parseInt(digits[i]) + 1 === parseInt(digits[i + 1])) {
      sequential++;
    }
  }

  // If more than 6 sequential digits, likely fake
  return sequential > 6;
}

// Generate random alphanumeric string
export function randomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create API response helper
export function apiResponse<T>(
  data: T,
  status: number = 200,
  message?: string,
) {
  return Response.json(
    {
      success: status >= 200 && status < 300,
      message,
      data,
    },
    { status },
  );
}

// Create error response helper
export function apiError(message: string, status: number = 400, errors?: any) {
  return Response.json(
    {
      success: false,
      message,
      errors,
    },
    { status },
  );
}
