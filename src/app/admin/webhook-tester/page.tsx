"use client";

import { useState, useMemo } from "react";

type NewPayload = {
  event: "user_signup";
  email: string;
  full_name: string;
  referrer_email?: string;
  setup_amount: number;
  monthly_amount: number;
};

type UpgradePayload = {
  event: "partner_signup";
  email: string;
};

type Payload = NewPayload | UpgradePayload;

export default function WebhookTester() {
  const [mode, setMode] = useState<"new" | "upgrade">("new");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [referrer, setReferrer] = useState("");
  const [setupAmount, setSetupAmount] = useState(""); // was number, now string
  const [monthlyAmount, setMonthlyAmount] = useState(""); // was number, now string
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Simple email regex
  const emailIsValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );

  // Only valid if email is good, and in “new” mode we also require fullName & amounts
  const formIsValid = useMemo(() => {
    if (!emailIsValid) return false;
    if (mode === "new") {
      if (!fullName.trim()) return false;
      const s = parseFloat(setupAmount);
      const m = parseFloat(monthlyAmount);
      if (isNaN(s) || s < 0) return false;
      if (isNaN(m) || m < 0) return false;
    }
    return true;
  }, [mode, emailIsValid, fullName, setupAmount, monthlyAmount]);

  async function sendWebhook() {
    setError("");
    if (!formIsValid) {
      setError("Please fix validation errors before sending.");
      return;
    }

    const payload: Payload =
      mode === "new"
        ? {
            event: "user_signup",
            email,
            full_name: fullName,
            setup_amount: parseFloat(setupAmount) || 0,
            monthly_amount: parseFloat(monthlyAmount) || 0,
            ...(referrer ? { referrer_email: referrer } : {}),
          }
        : {
            event: "partner_signup",
            email,
          };

    const raw = JSON.stringify(payload);

    try {
      const encoder = new TextEncoder();
      const secret = process.env.NEXT_PUBLIC_WEBHOOK_SECRET!;
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(raw));
      const signature = Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const url =
        mode === "new"
          ? "/api/webhook/user-signup"
          : "/api/webhook/partner-signup";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": signature,
        },
        body: raw,
      });

      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Webhook Tester</h1>

      <div className="flex space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "new"}
            onChange={() => setMode("new")}
          />
          <span>New Customer</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "upgrade"}
            onChange={() => setMode("upgrade")}
          />
          <span>Upgrade to Partner</span>
        </label>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="alice@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!emailIsValid && email && (
            <p className="text-red-500 text-sm">Invalid email address.</p>
          )}
        </div>

        {mode === "new" && (
          <>
            {/* Full Name */}
            <div>
              <label className="block mb-1 font-medium">Full Name</label>
              <input
                className="w-full border p-2 rounded"
                placeholder="Alice Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {!fullName.trim() && (
                <p className="text-red-500 text-sm">Name is required.</p>
              )}
            </div>

            {/* Referrer Email (optional) */}
            <div>
              <label className="block mb-1 font-medium">Referrer Email</label>
              <input
                className="w-full border p-2 rounded"
                placeholder="bob@example.com"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
              />
            </div>

            {/* Setup Amount */}
            <div>
              <label className="block mb-1 font-medium">Setup Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border p-2 rounded"
                placeholder="e.g. 1000.00"
                value={setupAmount}
                onChange={(e) => setSetupAmount(e.target.value)}
              />
              {setupAmount !== "" && isNaN(parseFloat(setupAmount)) && (
                <p className="text-red-500 text-sm">
                  Enter a valid number ≥ 0.
                </p>
              )}
            </div>

            {/* Monthly Amount */}
            <div>
              <label className="block mb-1 font-medium">
                Monthly Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border p-2 rounded"
                placeholder="e.g. 200.00"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
              />
              {monthlyAmount !== "" && isNaN(parseFloat(monthlyAmount)) && (
                <p className="text-red-500 text-sm">
                  Enter a valid number ≥ 0.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        onClick={sendWebhook}
        disabled={!formIsValid}
      >
        Send {mode === "new" ? "New Customer" : "Upgrade"} Webhook
      </button>

      {response && (
        <div>
          <h2 className="mt-4 font-medium">Response</h2>
          <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
