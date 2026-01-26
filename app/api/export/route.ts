import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatPhoneNumber, formatDateTime, getClientIp } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get all registrations
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        phoneNumber: true,
        attendance: true,
        checkedInAt: true,
        createdAt: true,
        note: true,
      },
    });

    // Create CSV content
    const headers = [
      "ID",
      "Full Name",
      "Company",
      "Phone Number",
      "Status",
      "Registered At",
      "Checked In At",
      "Note",
    ];

    const rows = registrations.map((reg) => [
      reg.id,
      reg.fullName,
      reg.companyName,
      formatPhoneNumber(reg.phoneNumber),
      reg.attendance ? "Checked In" : "Pending",
      formatDateTime(reg.createdAt),
      reg.checkedInAt ? formatDateTime(reg.checkedInAt) : "-",
      reg.note || "-",
    ]);

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    // Create audit log
    const clientIp = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        action: "export",
        adminId: session.user.id,
        ipAddress: clientIp,
        details: {
          format: "csv",
          count: registrations.length,
        },
      },
    });

    // Return CSV file
    const timestamp = new Date().toISOString().split("T")[0];
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="registrations-${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response("Export failed", { status: 500 });
  }
}
