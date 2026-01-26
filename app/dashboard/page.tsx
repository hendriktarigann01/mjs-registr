import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "next/link";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";

async function getDashboardStats() {
  const [
    totalRegistrations,
    totalCheckedIn,
    recentRegistrations,
    allRegistrations,
  ] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { attendance: true } }),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        attendance: true,
        createdAt: true,
        checkedInAt: true,
      },
    }),
    prisma.registration.findMany({
      select: {
        createdAt: true,
        checkedInAt: true,
        attendance: true,
      },
    }),
  ]);

  const totalPending = totalRegistrations - totalCheckedIn;
  const attendanceRate =
    totalRegistrations > 0
      ? ((totalCheckedIn / totalRegistrations) * 100).toFixed(1)
      : "0";

  // Registrations by hour
  const hourCounts = new Array(24).fill(0);
  allRegistrations.forEach((reg) => {
    const hour = new Date(reg.createdAt).getHours();
    hourCounts[hour]++;
  });

  // Check-ins by hour
  const checkInHourCounts = new Array(24).fill(0);
  allRegistrations.forEach((reg) => {
    if (reg.checkedInAt) {
      const hour = new Date(reg.checkedInAt).getHours();
      checkInHourCounts[hour]++;
    }
  });

  // Peak hours
  const peakRegistrationHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakCheckInHour = checkInHourCounts.indexOf(
    Math.max(...checkInHourCounts),
  );

  return {
    totalRegistrations,
    totalCheckedIn,
    totalPending,
    attendanceRate,
    recentRegistrations,
    analytics: {
      hourCounts,
      checkInHourCounts,
      peakRegistrationHour,
      peakCheckInHour,
    },
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Registrations",
      value: stats.totalRegistrations,
      icon: Users,
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Checked In",
      value: stats.totalCheckedIn,
      icon: UserCheck,
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending",
      value: stats.totalPending,
      icon: UserX,
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Stats and Quick Actions */}
      <div className="w-full rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <div className="h-full flex items-center gap-6 px-6 py-4">
          <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 transition-all duration-200 group flex-shrink-0 min-w-[140px]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`${stat.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className={`w-4 h-4 ${stat.textColor}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-font-secondary uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-xl font-medium text-font-primary">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vertical Divider */}
          <div className="h-16 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/dashboard/registrations"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="bg-blue-100 p-1.5 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-font-primary whitespace-nowrap">
                Registrations
              </span>
            </Link>

            {/* <Link
              href="/dashboard/logs"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="bg-gray-100 p-1.5 rounded-lg group-hover:bg-gray-200 transition-colors">
                <ChartNoAxesCombined className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-font-primary whitespace-nowrap">
                Logs
              </span>
            </Link> */}

            <Link
              href="/check-in"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-primary to-[#ec2053] hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                <UserCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-white whitespace-nowrap">
                Check-in
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-6 min-h-0">
        {/* Left: Analytics Charts (2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
          {/* Registrations by Hour */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
            <div className="mb-4">
              <h2 className="ttext-md font-medium text-font-primary">
                Registrations by Hour
              </h2>
              <p className="text-sm text-font-secondary mt-1">
                Peak:{" "}
                <span className="font-medium text-blue-600">
                  {stats.analytics.peakRegistrationHour
                    .toString()
                    .padStart(2, "0")}
                  :00
                </span>{" "}
                (
                {
                  stats.analytics.hourCounts[
                    stats.analytics.peakRegistrationHour
                  ]
                }{" "}
                registrations)
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <AnalyticsCharts
                data={stats.analytics.hourCounts}
                type="registrations"
              />
            </div>
          </div>
          {/* Check-ins by Hour */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
            <div className="mb-4">
              <h2 className="ttext-md font-medium text-font-primary">
                Check-ins by Hour
              </h2>
              <p className="text-sm text-font-secondary mt-1">
                Peak:{" "}
                <span className="font-medium text-green-600">
                  {stats.analytics.peakCheckInHour.toString().padStart(2, "0")}
                  :00
                </span>{" "}
                (
                {
                  stats.analytics.checkInHourCounts[
                    stats.analytics.peakCheckInHour
                  ]
                }{" "}
                check-ins)
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <AnalyticsCharts
                data={stats.analytics.checkInHourCounts}
                type="checkins"
              />
            </div>
          </div>
        </div>
        {/* Right: Recent Registrations (1/3) */}
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col min-h-0">
          <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h2 className="ttext-md font-medium text-font-primary">
              Recent Registrations
            </h2>
            <Link
              href="/dashboard/registrations"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
            {stats.recentRegistrations.length > 0 ? (
              stats.recentRegistrations.map((reg) => (
                <div key={reg.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-font-primary truncate">
                        {reg.fullName}
                      </h3>
                      <p className="text-xs text-font-secondary mt-1 truncate">
                        {reg.companyName}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
                          reg.attendance ? "bg-green-50" : "bg-orange-50"
                        }`}
                      >
                        {reg.attendance ? (
                          <UserCheck className="w-3 h-3 text-green-600" />
                        ) : (
                          <UserX className="w-3 h-3 text-orange-600" />
                        )}
                      </span>
                      <p className="text-[10px] text-font-secondary mt-1">
                        {new Date(reg.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-font-secondary">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No registrations yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
