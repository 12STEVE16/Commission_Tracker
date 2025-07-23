// src/app/api/webhook/user-signup/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { getServerSupabase } from "@/lib/supabaseServer";

const SHARED_SECRET = process.env.WEBHOOK_SECRET!;
if (!SHARED_SECRET) {
  throw new Error("WEBHOOK_SECRET is not defined");
}

export async function POST(req: NextRequest) {
  // 1️⃣ Verify signature
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

  // 2️⃣ Parse and validate JSON
  type Incoming = {
    event: "user_signup";
    email: string;
    full_name: string;
    referrer_email?: string;
    setup_amount: number;
    monthly_amount: number;
  };

  let body: Incoming;
  try {
    body = JSON.parse(rawBody) as Incoming;
  } catch (err) {
    console.error("JSON parse error:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event !== "user_signup") {
    return NextResponse.json(
      { error: "Unexpected event type" },
      { status: 400 }
    );
  }

  // 3️⃣ Normalize emails to lowercase
  const email = body.email.toLowerCase();
  const full_name = body.full_name.trim();
  const referrer_email = body.referrer_email?.toLowerCase() ?? null;
  const setup_amount = body.setup_amount;
  const monthly_amount = body.monthly_amount;

  const supabase = getServerSupabase();

  // 4️⃣ — Resolve referrer_id (if any)
  let referrerId: string | null = null;
  let isValidPartner = false;

  if (referrer_email) {
    console.log("Looking up referrer by email:", referrer_email);

    const { data: refRow, error: refErr } = await supabase
      .from("users")
      .select("id, is_partner, active, referred_by")
      .eq("email", referrer_email)
      .single();

    if (refErr) {
      console.error("Error looking up referrer:", refErr);
    } else if (!refRow) {
      console.warn("No user found with email:", referrer_email);
    } else {
      referrerId = refRow.id;
      console.log("Referrer found:", refRow);

      if (refRow.is_partner && refRow.active) {
        isValidPartner = true;
      } else {
        console.warn(
          "Referrer is not an active partner; commissions will be skipped."
        );
      }
    }
  }

  // 5️⃣ — Idempotency: check if user already exists
  const { data: existing, error: existErr } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existErr) {
    console.error("Error checking existing user:", existErr);
    return NextResponse.json(
      { error: "Error querying users", details: existErr },
      { status: 500 }
    );
  }
  if (existing) {
    return NextResponse.json({
      message: "Customer already exists, skipping inserts.",
      userId: existing.id,
    });
  }

  // 6️⃣ — Insert new user, storing lowercase emails
  const { data: newUser, error: userErr } = await supabase
    .from("users")
    .insert({
      email, // already lowercased
      full_name,
      role: "customer",
      referred_by: referrerId,
      referrer_email, // lowercased or null
      is_partner: false,
      active: true,
      metadata: JSON.parse(rawBody),
    })
    .select("id")
    .single();

  if (userErr || !newUser) {
    console.error("Error inserting user:", userErr);
    return NextResponse.json(
      { error: "DB insert (users) failed", details: userErr },
      { status: 500 }
    );
  }
  const customerId = newUser.id;

  // 7️⃣ — Insert subscription record
  const { data: subRow, error: subErr } = await supabase
    .from("subscriptions")
    .insert({
      user_id: customerId,
      setup_amount,
      monthly_amount,
    })
    .select("id")
    .single();

  if (subErr || !subRow) {
    console.error("Error inserting subscription:", subErr);
    return NextResponse.json(
      { error: "DB insert (subscriptions) failed", details: subErr },
      { status: 500 }
    );
  }
  const subscriptionId = subRow.id;

  // 8️⃣ — Commission logs (levels 1–3) if referrer is a valid partner
  if (isValidPartner && referrerId) {
    let currentReferrer = referrerId;
    for (let level = 1; level <= 3 && currentReferrer; level++) {
      const { data: refUser, error: refUserErr } = await supabase
        .from("users")
        .select("id, referred_by, is_partner, active")
        .eq("id", currentReferrer)
        .single();

      if (refUserErr || !refUser || !refUser.is_partner || !refUser.active) {
        break;
      }

      const pctRate = level === 1 ? 0.1 : 0.05;

      // Setup fee commission
      if (setup_amount > 0) {
        const amt = parseFloat((setup_amount * pctRate).toFixed(2));
        const { error: commErr1 } = await supabase
          .from("commission_logs")
          .insert({
            recipient_id: refUser.id,
            customer_id: customerId,
            subscription_id: subscriptionId,
            level,
            pct_rate: pctRate,
            commission_amt: amt,
          });
        if (commErr1) console.error(`Commission insert error:`, commErr1);
      }

      // Monthly commission
      if (monthly_amount > 0) {
        const amt = parseFloat((monthly_amount * pctRate).toFixed(2));
        const { error: commErr2 } = await supabase
          .from("commission_logs")
          .insert({
            recipient_id: refUser.id,
            customer_id: customerId,
            subscription_id: subscriptionId,
            level,
            pct_rate: pctRate,
            commission_amt: amt,
          });
        if (commErr2) console.error(`Commission insert error:`, commErr2);
      }

      currentReferrer = refUser.referred_by;
    }
  }

  // 9️⃣ — Return success
  return NextResponse.json({
    message:
      "User, subscription, and (if valid) commissions inserted successfully.",
    userId: customerId,
    subscriptionId,
  });
}
