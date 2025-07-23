// app/dashboard/invite/page.tsx
"use client";
import React from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InviteSchema, InviteFormData } from "@/lib/validators/invite";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function InvitePage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { fullName: "", email: "", phone: "" },
  });

  if (!isLoaded) return <p>Loading…</p>;
  if (!user) {
    router.push("/auth/sign-in");
    return null;
  }

  async function onSubmit(data: InviteFormData) {
    try {
      const res = await fetch("/api/dashboard/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error);
      } else {
        router.push("/dashboard/referrals");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Invite failed: " + err.message);
      } else {
        alert("Invite failed: Unknown error");
      }
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Invite a Friend</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Full Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            {...register("fullName")}
            className="w-full border rounded p-2"
            placeholder="Jane Doe"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            className="w-full border rounded p-2"
            placeholder="jane@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register("phone")}
            type="tel"
            className="w-full border rounded p-2"
            placeholder="+61 412 345 678"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
