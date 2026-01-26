import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";
import {
  generateQRToken,
  apiResponse,
  apiError,
  sanitizeInput,
  getClientIp,
} from "@/lib/utils";
import { registrationRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Check rate limit (3 registrations per hour per IP)
    const { success: rateLimitOk } =
      await registrationRateLimit.limit(clientIp);

    if (!rateLimitOk) {
      return apiError("Terlalu banyak percobaan. Coba lagi nanti.", 429);
    }

    // Parse request body
    const body = await request.json();

    // Map frontend field names to backend schema
    const mappedData = {
      fullName: sanitizeInput(body.namaLengkap || ""),
      companyName: sanitizeInput(body.namaPerusahaan || ""),
      phoneNumber: body.nomorHp || "",
      note: body.konfirmasiKehadiran === "tidak" ? "Tidak hadir" : null,
    };

    // Validate with Zod
    const validatedData = registrationSchema.parse(mappedData);

    // Check if phone number already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: { phoneNumber: validatedData.phoneNumber },
    });

    if (existingRegistration) {
      return apiError("Nomor HP sudah terdaftar", 400);
    }

    // Generate unique QR token
    const qrToken = generateQRToken();

    // Get user agent for tracking
    const userAgent = request.headers.get("user-agent") || "Unknown";

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        fullName: validatedData.fullName,
        companyName: validatedData.companyName,
        phoneNumber: validatedData.phoneNumber,
        qrToken,
        note: validatedData.note,
        registrationIp: clientIp,
        userAgent,
      },
    });

    // Generate QR code URL (will be generated on-the-fly)
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qr/${qrToken}/image`;

    return apiResponse({
      id: registration.id,
      qrToken: registration.qrToken,
      qrCode: qrCodeUrl,
      message: "Registrasi berhasil",
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      const zodError = error as any;
      return apiError(
        "Data tidak valid",
        400,
        zodError.issues?.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      );
    }

    return apiError("Terjadi kesalahan server", 500);
  }
}
