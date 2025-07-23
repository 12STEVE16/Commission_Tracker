// src/app/admin/admins/page.tsx

import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export const revalidate = 0; // always fetch fresh

export default async function AdminsPage() {
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });
  const admins = users.filter((u) => u.publicMetadata?.role === "admin");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mt-8 mb-16">
        <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
        <Link href="/admin/admins/invite">
          <Button size="lg">Invite Admin</Button>
        </Link>
      </div>

      {/* Table without Card wrapper */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="p-3">No</TableHead>
              <TableHead className="p-3">Name</TableHead>
              <TableHead className="p-3">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-gray-500"
                >
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((u, idx) => (
                <TableRow key={u.id} className="hover:bg-gray-50 transition">
                  <TableCell className="p-3">{idx + 1}</TableCell>
                  <TableCell className="p-3 font-medium">
                    {u.firstName ?? ""} {u.lastName ?? ""}
                  </TableCell>
                  <TableCell className="p-3">
                    {u.emailAddresses[0]?.emailAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
