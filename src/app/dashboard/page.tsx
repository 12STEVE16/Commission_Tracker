// app/dashboard/page.tsx

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabaseServer";
import Link from "next/link";

function getMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1️⃣ Auth check
  const user = await currentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  // 2️⃣ Find Supabase UUID
  const supabase = getServerSupabase();
  const { data: meRow } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", user.id)
    .single();
  const userId = meRow?.id;
  if (!userId) {
    throw new Error("Your user record could not be found.");
  }

  // 3️⃣ This month’s range
  const { start, end } = getMonthRange();

  // 4️⃣ Parallel queries
  const [
    // total referrals count
    totalRefsResult,
    // referrals this month count
    thisMonthRefsResult,
    // all commissions rows for lifetime
    lifetimeCommsResult,
    // commissions this month
    monthCommsResult,
  ] = await Promise.all([
    supabase
      .from("referrals")
      .select("id", { count: "exact" })
      .eq("referrer_id", userId),
    supabase
      .from("referrals")
      .select("id", { count: "exact" })
      .eq("referrer_id", userId)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("commission_logs")
      .select("commission_amt")
      .eq("recipient_id", userId),
    supabase
      .from("commission_logs")
      .select("commission_amt")
      .eq("recipient_id", userId)
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  if (totalRefsResult.error) {
    throw new Error(
      "Error loading total referrals: " + totalRefsResult.error.message
    );
  }
  if (thisMonthRefsResult.error) {
    throw new Error(
      "Error loading this month's referrals: " +
        thisMonthRefsResult.error.message
    );
  }
  if (lifetimeCommsResult.error) {
    throw new Error(
      "Error loading lifetime commissions: " + lifetimeCommsResult.error.message
    );
  }
  if (monthCommsResult.error) {
    throw new Error(
      "Error loading this month's commissions: " +
        monthCommsResult.error.message
    );
  }

  const totalReferrals = totalRefsResult.count ?? 0;
  const referralsThisMonth = thisMonthRefsResult.count ?? 0;

  // Sum commission_amt arrays
  const totalCommission = lifetimeCommsResult.data
    .map((r) => Number(r.commission_amt) || 0)
    .reduce((sum, x) => sum + x, 0);

  const monthCommission = monthCommsResult.data
    .map((r) => Number(r.commission_amt) || 0)
    .reduce((sum, x) => sum + x, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back,{" "}
            {user.firstName || user.primaryEmailAddress?.emailAddress}!
          </p>
        </div>
        <Link
          href="/dashboard/invite"
          className="mt-4 sm:mt-0 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Invite a Friend
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <p className="mt-2 text-2xl font-semibold">{totalReferrals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">This Month’s Referrals</p>
          <p className="mt-2 text-2xl font-semibold">{referralsThisMonth}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Lifetime Commission</p>
          <p className="mt-2 text-2xl font-semibold">
            ${totalCommission.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">This Month’s Commission</p>
          <p className="mt-2 text-2xl font-semibold">
            ${monthCommission.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white p-6 rounded-lg shadow flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard/referrals"
          className="flex-1 bg-blue-600 text-white py-3 rounded text-center hover:bg-blue-700"
        >
          View All Referrals
        </Link>
        <Link
          href="/dashboard/commissions"
          className="flex-1 bg-indigo-600 text-white py-3 rounded text-center hover:bg-indigo-700"
        >
          View Commissions
        </Link>
      </div>
    </div>
  );
}
