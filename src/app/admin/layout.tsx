// src/app/admin/layout.tsx
"use client";

import React from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import OrientationOverlay from "@/components/OrientationOverlay";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  const avatarUrl = user?.imageUrl || "/default-profile.png";
  const navItems = [
    { label: "Home", href: "/admin/dashboard", icon: HomeIcon },
    { label: "User Management", href: "/admin/users", icon: UsersIcon },
    { label: "Admin Management", href: "/admin/admins", icon: ShieldCheckIcon },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <Image
            src={avatarUrl}
            alt="Admin Avatar"
            width={64}
            height={64}
            className="rounded-full border-2 border-gray-300"
            priority
          />
          <span className="mt-2 text-lg font-semibold">{user?.firstName}</span>
          <span className="text-sm text-gray-500 text-center break-words">
            {user?.primaryEmailAddress?.emailAddress ||
              user?.emailAddresses[0]?.emailAddress}
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label={label}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Link>
            );
          })}

          <SignOutButton>
            <button
              className="flex w-full items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </SignOutButton>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-auto">
        <div className="max-w-7xl mx-auto p-4">{children}</div>
      </main>

      {/* Orientation Overlay */}
      <OrientationOverlay />
    </div>
  );
}
