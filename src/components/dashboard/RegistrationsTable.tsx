"use client";

import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import { formatPhoneNumber, formatDateTime } from "@/lib/utils";

interface Registration {
  id: string;
  fullName: string;
  companyName: string;
  phoneNumber: string;
  attendance: boolean;
  checkedInAt: Date | null;
  createdAt: Date;
  qrToken: string;
}

interface RegistrationsTableProps {
  registrations: Registration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

// Row Component - Memoized untuk mencegah re-render
const TableRow = ({
  reg,
  index,
  pageOffset,
  onDelete,
}: {
  reg: Registration;
  index: number;
  pageOffset: number;
  onDelete: (id: string) => void;
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {pageOffset + index + 1}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{reg.fullName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600">{reg.companyName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600">
          {formatPhoneNumber(reg.phoneNumber)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
            reg.attendance
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {reg.attendance ? "Checked In" : "Pending"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {formatDateTime(reg.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {reg.checkedInAt ? formatDateTime(reg.checkedInAt) : "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={() => onDelete(reg.id)}
          className="text-red-600 hover:text-red-800 transition-colors p-1"
          title="Delete registration"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// Memoize row component
const MemoizedTableRow = React.memo(TableRow);

export default function RegistrationsTable({
  registrations,
  pagination,
  searchParams,
}: RegistrationsTableProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.search || "");
  const [status, setStatus] = useState(searchParams.status || "all");
  const [sortBy, setSortBy] = useState(searchParams.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.sortOrder || "desc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParams.search) {
        updateParams({ search: search || undefined });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Memoize page offset calculation
  const pageOffset = useMemo(
    () => (pagination.page - 1) * pagination.limit,
    [pagination.page, pagination.limit],
  );

  // Optimize status change handler
  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    updateParams({
      status: newStatus === "all" ? undefined : newStatus,
    });
  }, []);

  // Optimize sort handler
  const handleSort = useCallback(
    (column: string) => {
      setSortBy((prevSortBy) => {
        const newOrder =
          prevSortBy === column && sortOrder === "asc" ? "desc" : "asc";
        setSortOrder(newOrder);
        updateParams({
          sortBy: column,
          sortOrder: newOrder,
        });
        return column;
      });
    },
    [sortOrder],
  );

  // Optimize delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (isDeleting) return;

      setIsDeleting(true);
      try {
        const response = await fetch(`/api/register/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          router.refresh();
          setDeleteConfirm(null);
        } else {
          const data = await response.json();
          alert(data.message || "Failed to delete registration");
        }
      } catch (error) {
        alert("An error occurred while deleting");
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, router],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(currentSearchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`/dashboard/registrations?${params.toString()}`);
    },
    [currentSearchParams, router],
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return (
      <ArrowUpDown
        className={`w-4 h-4 ${sortOrder === "asc" ? "rotate-180" : ""} text-brand-primary transition-transform`}
      />
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-transparent">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Live Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Live search by name, company, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Filter:
              </span>
            </div>
            <div className="flex gap-2">
              {[
                { value: "all", label: "All" },
                { value: "checked-in", label: "Checked In" },
                { value: "pending", label: "Pending" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    status === option.value
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table with optimized rendering */}
      <div className="h-full max-h-[60vh] overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-16">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("fullName")}
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                >
                  Name
                  <SortIcon column="fullName" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("companyName")}
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                >
                  Company
                  <SortIcon column="companyName" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("attendance")}
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                >
                  Status
                  <SortIcon column="attendance" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                >
                  Registered
                  <SortIcon column="createdAt" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("checkedInAt")}
                  className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                >
                  Checked In
                  <SortIcon column="checkedInAt" />
                </button>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-200">
            {registrations.length > 0 ? (
              registrations.map((reg, index) => (
                <MemoizedTableRow
                  key={reg.id}
                  reg={reg}
                  index={index}
                  pageOffset={pageOffset}
                  onDelete={setDeleteConfirm}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-12 h-12 text-gray-300" />
                    <p className="text-lg font-medium">
                      No registrations found
                    </p>
                    <p className="text-sm">
                      Try adjusting your search or filter
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {pageOffset + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                updateParams({ page: String(pagination.page - 1) })
              }
              disabled={pagination.page === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="inline-flex items-center px-4 py-2 text-sm text-gray-700 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                updateParams({ page: String(pagination.page + 1) })
              }
              disabled={pagination.page === pagination.totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Registration
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this registration? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
