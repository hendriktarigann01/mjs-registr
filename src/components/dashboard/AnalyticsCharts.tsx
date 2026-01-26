"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AnalyticsChartsProps {
  data: number[];
  type: "registrations" | "checkins";
}

export default function AnalyticsCharts({ data, type }: AnalyticsChartsProps) {
  const categories = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  const color = type === "registrations" ? "#3b82f6" : "#10b981";

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "70%",
        distributed: false,
      },
    },
    colors: [color],
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 0.15, // Bar jadi 15% lebih gelap saat hover
        } as { type: string; value: number },
      },
      active: {
        filter: {
          type: "darken",
          value: 0.25, // Bar jadi 25% lebih gelap saat click
        } as { type: string; value: number },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
      labels: {
        rotate: -45,
        rotateAlways: true,
        style: {
          fontSize: "10px",
          colors: "#6b7280",
        },
      },
      tickPlacement: "on",
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
      title: {
        text: type === "registrations" ? "Registrations" : "Check-ins",
        style: {
          fontSize: "12px",
          fontWeight: 500,
          color: "#374151",
        },
      },
    },
    grid: {
      strokeDashArray: 3,
      borderColor: "#e5e7eb",
    },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex }) => {
        const val = series[seriesIndex][dataPointIndex];
        return `<div style="padding:6px 10px; font-size:12px; color: #2b2b2b">
                  ${val} ${type === "registrations" ? "registrations" : "check-ins"}
                </div>
              `;
      },
    },
  };

  const series = [
    {
      name: type === "registrations" ? "Registrations" : "Check-ins",
      data,
    },
  ];

  return (
    <div className="w-full h-full">
      <Chart
        options={options}
        series={series}
        type="bar"
        height="100%"
        width="100%"
      />
    </div>
  );
}
