// src/app/dashboard/layout.tsx
"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UserPlusIcon,
  UsersIcon,
  CurrencyDollarIcon,
  // UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import OrientationOverlay from "@/components/OrientationOverlay"; // your overlay component

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const pathname = usePathname();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  // Replace these with whatever routes your partner dashboard uses
  const navItems = [
    { label: "Home", href: "/dashboard", icon: HomeIcon },
    {
      label: "Commissions",
      href: "/dashboard/commissions",
      icon: CurrencyDollarIcon,
    },
    { label: "Invite", href: "/dashboard/invite", icon: UserPlusIcon },
    { label: "Referrals", href: "/dashboard/referrals", icon: UsersIcon },

    // { label: "Profile", href: "/dashboard/profile", icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        {/* User Info */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src={user.imageUrl || "/default-profile.png"}
            alt="Your Avatar"
            width={64}
            height={64}
            className="rounded-full border-2 border-gray-300"
          />
          <span className="mt-2 text-lg font-semibold">{user.firstName}</span>
          <span className="text-sm text-gray-500 text-center break-words">
            {user.primaryEmailAddress?.emailAddress ||
              user.emailAddresses[0]?.emailAddress}
          </span>
        </div>

        {/* Navigation Links */}
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

          {/* Sign Out */}
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
