// src/app/api/webhook/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const SHARED_SECRET = process.env.WEBHOOK_SECRET!;
if (!SHARED_SECRET) {
  throw new Error("WEBHOOK_SECRET is not defined in your environment");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // —1️⃣ Validate HMAC Signature—
  const rawBody = await req.text();
  const incomingSig = req.headers.get("x-webhook-signature") || "";
  const expectedSig = crypto
    .createHmac("sha256", SHARED_SECRET)
    .update(rawBody)
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSig, "hex"),
      Buffer.from(incomingSig, "hex")
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // —2️⃣ Parse Payload—
  const { email, full_name, event, referrer_email } = JSON.parse(rawBody) as {
    email: string;
    full_name?: string;
    event: "user_signup" | "partner_signup";
    referrer_email?: string;
  };

  // —3️⃣ Resolve referrer_id if first‐time signup—
  let referrerId: string | null = null;
  if (event === "user_signup" && referrer_email) {
    const { data: refRow } = await supabase
      .from("users")
      .select("id")
      .eq("email", referrer_email)
      .single();
    referrerId = refRow?.id ?? null;
  }

  // —4️⃣ Check if user exists in Supabase—
  const { data: existing } = await supabase
    .from("users")
    .select("id, is_partner")
    .eq("email", email)
    .maybeSingle();

  if (event === "user_signup") {
    // ─ New customer signup ─
    if (existing) {
      // idempotency: do nothing if they already exist
      return NextResponse.json({
        message: "Customer already exists",
        userId: existing.id,
      });
    }

    // Insert customer row only
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        full_name: full_name ?? null,
        role: "customer",
        referred_by: referrerId,
        referrer_email: referrer_email ?? null,
        is_partner: false,
        metadata: JSON.parse(rawBody),
      })
      .select("id")
      .single();

    if (error || !newUser) {
      return NextResponse.json(
        { error: "DB insert failed", details: error },
        { status: 500 }
      );
    }
    return NextResponse.json({
      message: "Customer created",
      userId: newUser.id,
    });
  }

  // event === "partner_signup"
  // ─ Existing customer becomes partner ─
  if (!existing) {
    // Unexpected: upgrade without prior signup
    return NextResponse.json(
      { error: "Customer not found to upgrade" },
      { status: 400 }
    );
  }

  // 1) Update Supabase flags
  await supabase
    .from("users")
    .update({ is_partner: true, role: "partner" })
    .eq("id", existing.id);

  // 2) Send Clerk invitation
  //    clerkClient() returns the real client instance
  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: "partner" },
    // You can customize email subject/body here if desired
  });

  return NextResponse.json({
    message: "Partner upgrade complete",
    userId: existing.id,
  });
}
