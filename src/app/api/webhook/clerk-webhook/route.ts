// src/app/api/webhook/clerk-webhook/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.json();
  const { type, data } = payload;

  if (type !== "user.created") {
    return NextResponse.json({ received: type });
  }

  const clerkId = data.id as string;
  const email = data.email_addresses?.[0]?.email_address as string;
  const fullName =
    data.first_name && data.last_name
      ? `${data.first_name} ${data.last_name}`
      : data.first_name || data.last_name || null;

  // Upsert using your actual columns (full_name, clerk_id)
  const { error } = await supabase.from("users").upsert(
    {
      email,
      full_name: fullName,
      clerk_id: clerkId,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "user.created handled" });
}
