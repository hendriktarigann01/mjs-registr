import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;

    console.log("QR Image Request - Token:", token);

    if (!token) {
      return new Response("Token tidak ditemukan", { status: 400 });
    }

    // Query dengan raw SQL untuk handle snake_case
    const registration = await prisma.$queryRaw<
      Array<{ id: string; full_name: string }>
    >`
      SELECT id, full_name FROM registrations WHERE qr_token = ${token} LIMIT 1
    `;

    console.log("Registration found:", registration);

    if (!registration || registration.length === 0) {
      console.error("Token not found in database:", token);
      return new Response("QR Code tidak ditemukan", { status: 404 });
    }

    // Generate QR code URL (the actual data to scan)
    const qrData = `${process.env.NEXT_PUBLIC_APP_URL}/qr/${token}`;
    console.log("QR Data:", qrData);

    // Generate QR code image as PNG buffer
    const qrImageBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: "M",
      type: "png",
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    console.log("QR Image generated, size:", qrImageBuffer.length);

    // Return image
    return new Response(qrImageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("QR generation error:", error);
    return new Response("Gagal generate QR code: " + error.message, {
      status: 500,
    });
  }
}
