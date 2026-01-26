import prisma from "@/lib/prisma";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

async function getAnalytics() {
  // Get all registrations with timestamps
  const registrations = await prisma.registration.findMany({
    select: {
      createdAt: true,
      checkedInAt: true,
      attendance: true,
    },
  });

  // Registrations by hour
  const hourCounts = new Array(24).fill(0);
  registrations.forEach(
    (reg: {
      createdAt: Date;
      checkedInAt: Date | null;
      attendance: boolean;
    }) => {
      const hour = new Date(reg.createdAt).getHours();
      hourCounts[hour]++;
    },
  );

  // Check-ins by hour
  const checkInHourCounts = new Array(24).fill(0);
  registrations.forEach(
    (reg: {
      createdAt: Date;
      checkedInAt: Date | null;
      attendance: boolean;
    }) => {
      if (reg.checkedInAt) {
        const hour = new Date(reg.checkedInAt).getHours();
        checkInHourCounts[hour]++;
      }
    },
  );

  // Peak hours
  const peakRegistrationHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakCheckInHour = checkInHourCounts.indexOf(
    Math.max(...checkInHourCounts),
  );

  return {
    hourCounts,
    checkInHourCounts,
    peakRegistrationHour,
    peakCheckInHour,
  };
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-stretch gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center
               px-4 bg-brand-primary text-white rounded-lg
               hover:bg-brand-primary-hover transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Event statistics and attendance insights
          </p>
        </div>
      </div>

      {/* Charts Grid - Full Height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Registrations by Hour Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Registrations by Hour
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Peak:{" "}
              <span className="font-medium text-blue-600">
                {analytics.peakRegistrationHour.toString().padStart(2, "0")}:00
              </span>{" "}
              ({analytics.hourCounts[analytics.peakRegistrationHour]}{" "}
              registrations)
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <AnalyticsCharts data={analytics.hourCounts} type="registrations" />
          </div>
        </div>

        {/* Check-ins by Hour Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Check-ins by Hour
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Peak:{" "}
              <span className="font-medium text-green-600">
                {analytics.peakCheckInHour.toString().padStart(2, "0")}:00
              </span>{" "}
              ({analytics.checkInHourCounts[analytics.peakCheckInHour]}{" "}
              check-ins)
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <AnalyticsCharts
              data={analytics.checkInHourCounts}
              type="checkins"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
