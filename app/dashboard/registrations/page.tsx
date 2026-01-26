
import prisma from "@/lib/prisma";
import RegistrationsTable from "@/components/dashboard/RegistrationsTable";
import { ChevronLeft, Download } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function getRegistrations(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = searchParams.search || "";
  const status = searchParams.status;
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = (searchParams.sortOrder || "desc") as "asc" | "desc";

  // Build where clause
  const where: any = {};

  // Search filter
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search } },
    ];
  }

  // Status filter
  if (status === "checked-in") {
    where.attendance = true;
  } else if (status === "pending") {
    where.attendance = false;
  }

  // Build orderBy clause
  let orderBy: any;

  if (sortBy === "checkedInAt") {
    // Handle nullable checkedInAt field
    orderBy = {
      checkedInAt: {
        sort: sortOrder,
        nulls: "last",
      },
    };
  } else {
    orderBy = {
      [sortBy]: sortOrder,
    };
  }

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      take: limit,
      skip,
      orderBy,
      select: {
        id: true,
        fullName: true,
        companyName: true,
        phoneNumber: true,
        attendance: true,
        checkedInAt: true,
        createdAt: true,
        qrToken: true,
      },
    }),
    prisma.registration.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    registrations,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getRegistrations(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-stretch gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <div className="py-2">
            <p className="text-gray-600 text-md">
              Manage all event registrations ({data.pagination.total} total)
            </p>
          </div>
        </div>

        <Link
          href="/api/register/export?format=csv"
          className="inline-flex text-md items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <RegistrationsTable
          registrations={data.registrations}
          pagination={data.pagination}
          searchParams={params}
        />
      </div>
    </div>
  );
}
