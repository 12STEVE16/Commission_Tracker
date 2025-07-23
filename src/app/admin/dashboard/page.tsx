// app/admin/dashboard/page.tsx

import { getServerSupabase } from "@/lib/supabaseServer";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = getServerSupabase();

  // 1️⃣ Total users
  const { count: totalUsersCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  // 2️⃣ Total partners
  const { count: totalPartnersCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "partner");

  // 3️⃣ Total subscriptions ever
  const { count: totalSubscriptionsCount } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true });

  // 4️⃣ Commission this month (sum of commission_amt for this month)
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data: commData } = await supabase
    .from("commission_logs")
    .select("sum(commission_amt) as monthly_total", { count: "none" })
    .gte("created_at", startOfMonth.toISOString());

  const monthlyCommission = parseFloat(
    (commData?.[0]?.monthly_total ?? 0).toString()
  );

  // 5️⃣ New signups this month
  const { count: newUsersThisMonth } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  // Format current month for display
  const displayMonth = format(startOfMonth, "MMMM yyyy");

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Metrics for {displayMonth}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-semibold">{totalUsersCount ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Partners</p>
          <p className="text-2xl font-semibold">{totalPartnersCount ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Subscriptions</p>
          <p className="text-2xl font-semibold">
            {totalSubscriptionsCount ?? 0}
          </p>
        </div>

        {/* <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Commission Earned</p>
          <p className="text-2xl font-semibold">
            ${monthlyCommission.toFixed(2)}
          </p>
        </div> */}

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 sm:col-span-2 lg:col-span-2">
          <p className="text-sm text-gray-500">New Signups This Month</p>
          <p className="text-2xl font-semibold">{newUsersThisMonth ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
