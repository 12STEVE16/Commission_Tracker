// File: app/admin/users/PartnerTable.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Partner {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  referred_by: string | null;
}

interface PartnerTableProps {
  partners: Partner[];
  currentPage: number;
  totalPages: number;
  initialSearch: string;
}

export default function PartnerTable({
  partners,
  currentPage,
  totalPages,
  initialSearch,
}: PartnerTableProps) {
  const router = useRouter();
  const params = useSearchParams();

  // Local state so user can type freely
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const submitSearch = () => {
    const qp = new URLSearchParams(params.toString());
    qp.set("search", searchTerm);
    qp.set("page", "1"); // reset to first page on new search
    router.push(`?${qp.toString()}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitSearch();
  };

  return (
    <div className="space-y-4">
      {/* Search & Invite */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Input
          placeholder="Search by name or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          className="max-w-sm"
        />
        <Button onClick={submitSearch} className="w-full sm:w-auto">
          Search
        </Button>
        {/* <Link href="/admin/invite">
          <Button variant="secondary" className="w-full sm:w-auto">
            Invite New Partner
          </Button>
        </Link> */}
      </div>

      {/* Partners Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Name</TableHead>
              <TableHead className="w-1/4">Email</TableHead>
              <TableHead className="w-1/6">Joined</TableHead>
              <TableHead className="w-1/6">Referred By</TableHead>
              <TableHead className="w-1/6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {partners.length > 0 ? (
              partners.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell>
                    {p.full_name ?? (
                      <span className="text-gray-400">No name</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="break-words">{p.email}</span>
                  </TableCell>
                  <TableCell>
                    {new Date(p.created_at).toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {p.referred_by ? (
                      <Link
                        href={`/admin/users/${p.referred_by}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Referrer
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${p.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Profile
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-gray-500"
                >
                  No partners found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <nav className="flex justify-center items-center space-x-2 mt-4">
        <Link
          href={`?page=${currentPage - 1}&search=${encodeURIComponent(
            searchTerm
          )}`}
          className={`px-3 py-1 rounded ${
            currentPage === 1
              ? "text-gray-400 pointer-events-none"
              : "text-blue-600 hover:bg-gray-100"
          }`}
        >
          Previous
        </Link>

        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1;
          return (
            <Link
              key={pageNum}
              href={`?page=${pageNum}&search=${encodeURIComponent(searchTerm)}`}
              className={`px-3 py-1 rounded ${
                currentPage === pageNum
                  ? "bg-blue-600 text-white"
                  : "text-blue-600 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </Link>
          );
        })}

        <Link
          href={`?page=${currentPage + 1}&search=${encodeURIComponent(
            searchTerm
          )}`}
          className={`px-3 py-1 rounded ${
            currentPage === totalPages
              ? "text-gray-400 pointer-events-none"
              : "text-blue-600 hover:bg-gray-100"
          }`}
        >
          Next
        </Link>
      </nav>
    </div>
  );
}
