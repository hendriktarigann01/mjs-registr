import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { apiResponse, apiError, getClientIp } from "@/lib/utils";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await context.params;

    // Check if registration exists
    const registration = await prisma.registration.findUnique({
      where: { id },
      select: { id: true, fullName: true, companyName: true },
    });

    if (!registration) {
      return apiError("Registration not found", 404);
    }

    // Delete the registration (this will cascade delete audit logs due to onDelete: SetNull)
    await prisma.registration.delete({
      where: { id },
    });

    // Create audit log
    const clientIp = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        action: "delete",
        adminId: (session.user as any).id,
        ipAddress: clientIp,
        details: {
          deletedRegistration: {
            id: registration.id,
            fullName: registration.fullName,
            companyName: registration.companyName,
          },
        },
      },
    });

    return apiResponse({ id }, 200, "Registration deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
    return apiError("Failed to delete registration", 500);
  }
}
