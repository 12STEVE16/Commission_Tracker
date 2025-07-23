// app/dashboard/referrals/ReferralTable.tsx
"use client";

import React, { useState } from "react";
// import Link from "next/link";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface Referral {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface ReferralTableProps {
  referrals: Referral[];
}

export default function ReferralTable({ referrals }: ReferralTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter referrals by name or email
  const filtered = referrals.filter((r) => {
    const name = r.full_name?.toLowerCase() || "";
    const email = r.email?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* 1) Search box */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Input
          placeholder="Search by name or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          className="max-w-sm"
        />
      </div>

      {/* 2) Responsive table container */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Name</TableHead>
              <TableHead className="w-1/3">Email</TableHead>
              <TableHead className="w-1/3">Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-gray-50">
                  <TableCell>
                    {r.full_name ?? (
                      <span className="text-gray-400">No name</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="break-words">{r.email}</span>
                  </TableCell>
                  <TableCell>
                    {new Date(r.created_at).toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-gray-500"
                >
                  No direct referrals yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
