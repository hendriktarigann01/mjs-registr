import { Registration, AdminUser, AuditLog } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    email: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

// Registration types
export interface RegistrationWithStats extends Registration {
  _count?: {
    auditLogs: number;
  };
}

// Dashboard stats
export interface DashboardStats {
  totalRegistrations: number;
  totalCheckedIn: number;
  totalPending: number;
  attendanceRate: number;
  recentRegistrations: Registration[];
  checkInsByHour: {
    hour: string;
    count: number;
  }[];
}

// Audit log with relations
export interface AuditLogWithRelations extends AuditLog {
  admin?: AdminUser | null;
  registration?: Registration | null;
}

// QR Code data
export interface QRCodeData {
  token: string;
  registrationId: string;
  fullName: string;
}

// Check-in result
export interface CheckInResult {
  success: boolean;
  message: string;
  registration?: {
    id: string;
    fullName: string;
    companyName: string;
    checkedInAt: Date;
  };
}

// Export filters
export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  attendance?: boolean;
  search?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
