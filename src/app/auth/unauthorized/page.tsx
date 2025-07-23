// app/unauthorized/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">403 – Unauthorized</h1>
      <p className="text-lg mb-6">
        You don’t have permission to view this page.
      </p>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => router.push("/")}
      >
        Go Home
      </button>
    </div>
  );
}
