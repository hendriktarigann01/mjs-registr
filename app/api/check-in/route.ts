import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkInSchema } from "@/lib/validation";
import { apiResponse, apiError, getClientIp, getUserAgent } from "@/lib/utils";
import { checkInRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Get client info
    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Rate limit check (100 per minute per device)
    const deviceId = request.headers.get("x-device-id") || clientIp;
    const { success: rateLimitOk } = await checkInRateLimit.limit(deviceId);

    if (!rateLimitOk) {
      return apiError("Terlalu banyak scan. Tunggu sebentar.", 429);
    }

    // Parse and validate request
    const body = await request.json();
    const { qrToken } = checkInSchema.parse(body);

    // Find registration by QR token
    const registration = await prisma.registration.findUnique({
      where: { qrToken },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        phoneNumber: true,
        attendance: true,
        checkedInAt: true,
      },
    });

    if (!registration) {
      return apiError("QR Code tidak valid", 404);
    }

    // Check if already checked in
    if (registration.attendance) {
      return apiResponse(
        {
          alreadyCheckedIn: true,
          registration: {
            fullName: registration.fullName,
            companyName: registration.companyName,
            checkedInAt: registration.checkedInAt,
          },
        },
        200,
        `${registration.fullName} sudah check-in sebelumnya`,
      );
    }

    // Update to checked in
    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        attendance: true,
        checkedInAt: new Date(),
        checkInDeviceId: deviceId,
      },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        checkedInAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "check_in",
        targetRegistrationId: updated.id,
        deviceInfo: userAgent,
        ipAddress: clientIp,
        details: {
          method: "qr_scan",
          deviceId,
        },
      },
    });

    return apiResponse(
      {
        registration: updated,
      },
      200,
      `Selamat datang, ${updated.fullName}!`,
    );
  } catch (error: any) {
    console.error("Check-in error:", error);

    if (error.name === "ZodError") {
      return apiError("Data tidak valid", 400, error.errors);
    }

    return apiError("Terjadi kesalahan server", 500);
  }
}
