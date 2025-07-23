// src/app/api/webhook/partner-signup/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { getServerSupabase } from "@/lib/supabaseServer";
import { clerkClient } from "@clerk/nextjs/server"; // ← correct import

const SHARED_SECRET = process.env.WEBHOOK_SECRET!;
if (!SHARED_SECRET) {
  throw new Error("WEBHOOK_SECRET is not defined");
}

export async function POST(req: NextRequest) {
  //
  // 1️⃣ — Verify HMAC-SHA256 signature
  //
  const rawBody = await req.text();
  const incomingSig = req.headers.get("x-webhook-signature") || "";
  const expectedSig = crypto
    .createHmac("sha256", SHARED_SECRET)
    .update(rawBody)
    .digest("hex");

  if (
    incomingSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(
      Buffer.from(incomingSig, "hex"),
      Buffer.from(expectedSig, "hex")
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  //
  // 2️⃣ — Parse and validate JSON
  //
  type Incoming = {
    event: "partner_signup";
    email: string;
  };

  let body: Incoming;
  try {
    body = JSON.parse(rawBody) as Incoming;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event !== "partner_signup") {
    return NextResponse.json(
      { error: "Unexpected event type" },
      { status: 400 }
    );
  }

  const { email } = body;
  const supabase = getServerSupabase();

  //
  // 3️⃣ — Look up user in Supabase
  //
  const { data: existing, error: existErr } = await supabase
    .from("users")
    .select("id, is_partner, active")
    .eq("email", email)
    .single();

  if (existErr || !existing) {
    return NextResponse.json(
      { error: "Customer not found to upgrade", details: existErr },
      { status: 404 }
    );
  }

  //
  // 4️⃣ — Idempotency: if already partner, return immediately
  //
  if (existing.is_partner) {
    return NextResponse.json({
      message: "User is already a partner",
      userId: existing.id,
    });
  }

  //
  // 5️⃣ — Update Supabase user: is_partner = true, role = "partner"
  //
  const { error: updateErr } = await supabase
    .from("users")
    .update({ is_partner: true, role: "partner" })
    .eq("id", existing.id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to update user to partner", details: updateErr },
      { status: 500 }
    );
  }

  //
  // 6️⃣ — Send Clerk invitation
  //
  try {
    const clerk = await clerkClient();
    await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "partner" },
      // Optionally set redirectUrl or ignoreExisting here
    });
  } catch (err: unknown) {
    console.error("Clerk invitation error:", err);
    // continue even if invite fails
  }

  return NextResponse.json({
    message: "Partner upgrade complete; Clerk invite sent if needed.",
    userId: existing.id,
  });
}
