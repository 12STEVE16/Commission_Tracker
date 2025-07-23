// app/api/dashboard/invite/route.ts

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getServerSupabase } from "@/lib/supabaseServer";
import { InviteSchema } from "@/lib/validators/invite";

export async function POST(req: Request) {
  // 1️⃣ Parse + validate
  const json = await req.json();
  const parsed = InviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }
  const { fullName, email, phone } = parsed.data;

  // 2️⃣ Auth
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = getServerSupabase();
  // 3️⃣ Find Supabase UUID
  const { data: me, error: meErr } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", user.id)
    .single();
  if (meErr || !me) {
    return NextResponse.json(
      { error: "User record not found" },
      { status: 500 }
    );
  }

  // 4️⃣ Prevent existing customer
  const { data: existing, error: eErr } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  if (eErr && eErr.code !== "PGRST116") {
    return NextResponse.json({ error: eErr.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ error: "Already a customer" }, { status: 400 });
  }

  // 5️⃣ Insert referral
  const { error: insErr } = await supabase.from("referrals").insert({
    full_name: fullName || null,
    email,
    phone: phone || null,
    referrer_id: me.id,
    created_at: new Date().toISOString(),
  });
  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json({ error: "Already invited" }, { status: 400 });
    }
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
