// src/app/dashboard/commissions/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function CommissionsPage() {
  // 1️⃣ Fetch authenticated Clerk user
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/auth/sign-in");
  }

  // 2️⃣ Look up this user’s Supabase row by clerk_id
  const supabase = getServerSupabase();
  const { data: meRow, error: meError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUser.id)
    .single();

  if (meError || !meRow) {
    redirect("/dashboard");
  }
  const partnerId = meRow.id;

  // 3️⃣ Compute first day of current month in ISO (UTC)
  const now = new Date();
  const firstOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  // 4️⃣ Fetch all direct-level commissions since first of month
  const { data: directRows, error: directError } = await supabase
    .from("commission_logs")
    .select("customer_id, commission_amt")
    .eq("recipient_id", partnerId)
    .eq("level", 1)
    .gte("created_at", firstOfMonth);

  if (directError) {
    console.error("Error fetching direct commissions:", directError);
  }

  // Build a map: customer_id → total commission (number)
  const directTotalsMap: Record<string, number> = {};
  if (directRows) {
    for (const row of directRows) {
      const custId = row.customer_id as string;
      const amt = Number(row.commission_amt);
      directTotalsMap[custId] = (directTotalsMap[custId] || 0) + amt;
    }
  }

  // Fetch emails for those customer_ids
  const customerIds = Object.keys(directTotalsMap);
  let directList: { email: string; total: number }[] = [];
  if (customerIds.length > 0) {
    const { data: userRows, error: userErr } = await supabase
      .from("users")
      .select("id, email")
      .in("id", customerIds);
    if (userErr) {
      console.error("Error fetching customer emails:", userErr);
    } else if (userRows) {
      directList = userRows.map((u) => ({
        email: u.email,
        total: parseFloat(directTotalsMap[u.id].toFixed(2)),
      }));
      // Sort descending by total
      directList.sort((a, b) => b.total - a.total);
    }
  }

  // 5️⃣ Fetch all indirect-level commissions (levels 2 & 3) since first of month
  const { data: indirectRows, error: indirectError } = await supabase
    .from("commission_logs")
    .select("commission_amt")
    .eq("recipient_id", partnerId)
    .in("level", [2, 3])
    .gte("created_at", firstOfMonth);

  if (indirectError) {
    console.error("Error fetching indirect commissions:", indirectError);
  }
  let indirectTotal = 0;
  if (indirectRows) {
    indirectTotal = indirectRows.reduce(
      (sum, r) => sum + Number(r.commission_amt),
      0
    );
    indirectTotal = parseFloat(indirectTotal.toFixed(2));
  }

  // 6️⃣ Format “first of month” for display
  const firstOfMonthDate = new Date(firstOfMonth);
  const formattedFirst = firstOfMonthDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-semibold mb-4">
        My Commissions (Since {formattedFirst})
      </h1>

      {/* Direct Referrals */}
      <section className="mb-8">
        <h2 className="text-2xl font-medium mb-2">Direct Referrals</h2>
        {directList.length > 0 ? (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Referral Email</th>
                <th className="border px-4 py-2 text-right">Earnings ($)</th>
              </tr>
            </thead>
            <tbody>
              {directList.map((row) => (
                <tr key={row.email} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{row.email}</td>
                  <td className="border px-4 py-2 text-right">
                    {row.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">
            No direct referral commissions this month.
          </p>
        )}
      </section>

      {/* Indirect Earnings */}
      <section>
        <h2 className="text-2xl font-medium mb-2">Indirect Earnings</h2>
        {indirectTotal > 0 ? (
          <div className="text-lg">
            <span>Total from indirect referrals: </span>
            <span className="font-semibold">${indirectTotal.toFixed(2)}</span>
          </div>
        ) : (
          <p className="text-gray-500">
            No indirect commission earnings this month.
          </p>
        )}
      </section>
    </div>
  );
}
