// File: app/admin/users/page.tsx

import { getServerSupabase } from "@/lib/supabaseServer";
import PartnerTable from "./PartnerTable";

interface UsersPageProps {
  // Next.js 15+: searchParams is passed in as a Promise
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  // 1. Await searchParams before using .page/.search
  const { page, search } = await searchParams;

  // 2. Compute pagination & search term
  const currentPage = parseInt(page || "1", 10);
  const pageSize = 7;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  const searchTerm = (search || "").trim();

  // 3. Build your Supabase query
  const supabase = getServerSupabase();
  let query = supabase
    .from("users")
    .select("id, full_name, email, created_at, referred_by", {
      count: "exact",
    })
    .eq("role", "partner")
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (searchTerm) {
    // case-insensitive match on name OR email
    query = query
      .ilike("full_name", `%${searchTerm}%`)
      .or(`email.ilike.%${searchTerm}%`);
  }

  // 4. Fetch the slice + total count
  const { data: partners, error, count } = await query.range(from, to);
  if (error) {
    throw new Error(`Failed to fetch partners: ${error.message}`);
  }
  const totalPages = Math.ceil((count || 0) / pageSize);

  // 5. Render
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">All Partners</h1>
      <PartnerTable
        partners={partners || []}
        currentPage={currentPage}
        totalPages={totalPages}
        initialSearch={searchTerm}
      />
    </div>
  );
}
