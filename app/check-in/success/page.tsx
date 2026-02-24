import { Suspense } from "react";
import CheckInSuccess from "@/components/CheckInSuccess";

export const metadata = {
  title: "Check In Success",
};

export default function CheckInSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f0f2f2]" />}>
      <CheckInSuccess />
    </Suspense>
  );
}
