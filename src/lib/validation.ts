import { z } from "zod";

// Registration Form Validation
export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama harus minimal 2 karakter")
    .max(255, "Nama terlalu panjang")
    .regex(/^[a-zA-Z\s.]+$/, "Nama hanya boleh mengandung huruf dan spasi"),

  companyName: z
    .string()
    .min(2, "Nama perusahaan harus minimal 2 karakter")
    .max(255, "Nama perusahaan terlalu panjang"),

  phoneNumber: z
    .string()
    .regex(
      /^(\+62|62|0)[0-9]{9,12}$/,
      "Format nomor telepon tidak valid (contoh: 08123456789)",
    )
    .transform((val) => {
      // Normalize phone number to start with +62
      if (val.startsWith("0")) return "+62" + val.slice(1);
      if (val.startsWith("62")) return "+" + val;
      return val;
    }),

  note: z.string().max(500, "Catatan terlalu panjang").optional().nullable(),
});

// Check-in Validation
export const checkInSchema = z.object({
  qrToken: z.string().uuid("QR Token tidak valid"),
  deviceId: z.string().optional(),
});

// Admin Login Validation
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(100, "Username terlalu panjang"),

  password: z.string().min(6, "Password minimal 6 karakter"),
});

// Manual Check-in by Admin
export const manualCheckInSchema = z.object({
  registrationId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

// Update Registration (Admin)
export const updateRegistrationSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  companyName: z.string().min(2).max(255).optional(),
  phoneNumber: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/)
    .optional(),
  note: z.string().max(500).optional(),
});

// Export types
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ManualCheckInInput = z.infer<typeof manualCheckInSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
