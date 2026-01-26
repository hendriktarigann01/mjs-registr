import prisma from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { UserCheck, UserCog, Trash2, Download, Activity } from "lucide-react";

interface SearchParams {
  page?: string;
  action?: string;
}

async function getAuditLogs(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const limit = 50;
  const skip = (page - 1) * limit;
  const action = searchParams.action;

  const where: Record<string, unknown> = {};
  if (action && action !== "all") {
    where.action = action;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { timestamp: "desc" },
      include: {
        admin: {
          select: {
            username: true,
            role: true,
          },
        },
        registration: {
          select: {
            fullName: true,
            companyName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

function getActionIcon(action: string) {
  switch (action) {
    case "check_in":
      return UserCheck;
    case "manual_check_in":
      return UserCog;
    case "delete":
      return Trash2;
    case "export":
      return Download;
    default:
      return Activity;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "check_in":
    case "manual_check_in":
      return "text-green-600 bg-green-100";
    case "delete":
      return "text-red-600 bg-red-100";
    case "export":
      return "text-blue-600 bg-blue-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await getAuditLogs(searchParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          Track all admin activities and system events ({data.pagination.total}{" "}
          total)
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All Actions" },
              { value: "check_in", label: "Check-in" },
              { value: "manual_check_in", label: "Manual Check-in" },
              { value: "export", label: "Export" },
              { value: "delete", label: "Delete" },
            ].map((option) => (
              <a
                key={option.value}
                href={`/dashboard/logs?action=${option.value}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  (searchParams.action || "all") === option.value
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {data.logs.length > 0 ? (
            data.logs.map((log) => {
              const Icon = getActionIcon(log.action);
              const colorClass = getActionColor(log.action);

              return (
                <div key={log.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {log.action.replace(/_/g, " ").toUpperCase()}
                          </h3>
                          <div className="mt-1 space-y-1">
                            {log.admin && (
                              <p className="text-sm text-gray-600">
                                By:{" "}
                                <span className="font-medium">
                                  {log.admin.username}
                                </span>{" "}
                                <span className="text-gray-400">
                                  ({log.admin.role})
                                </span>
                              </p>
                            )}
                            {log.registration && (
                              <p className="text-sm text-gray-600">
                                Target:{" "}
                                <span className="font-medium">
                                  {log.registration.fullName}
                                </span>{" "}
                                <span className="text-gray-400">
                                  - {log.registration.companyName}
                                </span>
                              </p>
                            )}
                            {log.ipAddress && (
                              <p className="text-xs text-gray-500">
                                IP: {log.ipAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="text-right">
                          <p className="text-sm text-gray-900 font-medium">
                            {formatDateTime(log.timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* Additional Details */}
                      {log.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-500">
              No audit logs found
            </div>
          )}
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </div>
            <div className="flex gap-2">
              {data.pagination.page > 1 && (
                <a
                  href={`/dashboard/logs?page=${data.pagination.page - 1}${searchParams.action ? `&action=${searchParams.action}` : ""}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </a>
              )}
              {data.pagination.page < data.pagination.totalPages && (
                <a
                  href={`/dashboard/logs?page=${data.pagination.page + 1}${searchParams.action ? `&action=${searchParams.action}` : ""}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
