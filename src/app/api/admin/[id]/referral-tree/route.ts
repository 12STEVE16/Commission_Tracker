// app/api/admin/[id]/referral-tree/route.ts

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Unwrap the params promise to get the dynamic route id
  const { id } = await params;

  const supabase = getServerSupabase();

  const { data, error } = await supabase.rpc(
    "get_partner_referrals_tree_with_parent",
    { partner_id: id, max_level: 3 }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
