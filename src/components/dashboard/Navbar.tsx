"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavbarProps {
  user: {
    name: string;
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="w-full mx-auto justify-center items-center px-4 sm:px-6 lg:px-10 z-50 pt-4">
      <div className="flex justify-between items-center h-16">
        {/* Welcome Message */}
        <div>
          {pathname === "/dashboard" ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back, {user.name}!
              </h1>
              <p className="text-sm text-gray-600">
                Here&apos;s what&apos;s happening with your event today.
              </p>
            </>
          ) : pathname === "/dashboard/registrations" ? (
            <h1 className="text-xl font-semibold text-gray-900">
              Registrations
            </h1>
          ) : null}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </nav>
  );
}
