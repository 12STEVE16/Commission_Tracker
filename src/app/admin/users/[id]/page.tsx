// app/admin/users/[id]/page.tsx

import Link from "next/link";
import { getServerSupabase } from "@/lib/supabaseServer";
import ReferralTree from "./ReferralTree";

type ReferralRow = {
  id: string;
  name: string;
  email: string;
  setup_fee: number;
  monthly_fee: number;
  commission: number;
  referrerId?: string;
  referrerName?: string;
};

async function getLevelData(
  partnerId: string,
  level: number
): Promise<ReferralRow[]> {
  const supabase = getServerSupabase();
  const { data: logs } = await supabase
    .from("commission_logs")
    .select("customer_id, commission_amt")
    .eq("recipient_id", partnerId)
    .eq("level", level);

  const commissionMap: Record<string, number> = {};
  (logs || []).forEach((entry) => {
    const cid = entry.customer_id!;
    commissionMap[cid] =
      (commissionMap[cid] || 0) + Number(entry.commission_amt || 0);
  });

  const rows: ReferralRow[] = [];
  for (const customerId of Object.keys(commissionMap)) {
    const commission = commissionMap[customerId];
    const { data: userRow } = await supabase
      .from("users")
      .select("id, full_name, email, referred_by")
      .eq("id", customerId)
      .single();
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("setup_amount, monthly_amount")
      .eq("user_id", customerId)
      .order("paid_at", { ascending: false })
      .limit(1)
      .single();

    const setup_fee = subRow?.setup_amount || 0;
    const monthly_fee = subRow?.monthly_amount || 0;

    const row: ReferralRow = {
      id: userRow!.id,
      name: userRow!.full_name,
      email: userRow!.email,
      setup_fee,
      monthly_fee,
      commission,
    };

    if (level > 1 && userRow!.referred_by) {
      const { data: refRow } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("id", userRow!.referred_by)
        .single();
      if (refRow) {
        row.referrerId = refRow.id;
        row.referrerName = refRow.full_name;
      }
    }

    rows.push(row);
  }

  return rows;
}

export default async function UserDetailPage(_args: {
  params: Promise<{ id: string }>;
}) {
  // Await params to get the dynamic route id
  const { id: partnerId } = await _args.params;
  const supabase = getServerSupabase();

  // 1) Fetch partner info
  const { data: partner } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", partnerId)
    .single();

  // 2) Pre-fetch all three levels
  const [level1, level2, level3] = await Promise.all([
    getLevelData(partnerId, 1),
    getLevelData(partnerId, 2),
    getLevelData(partnerId, 3),
  ]);

  // 3) Table renderer
  const renderTable = (rows: ReferralRow[], lvl: number) => (
    <section key={lvl} className="space-y-2">
      <h2 className="text-xl font-semibold">Level {lvl} Referrals</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              {lvl > 1 && <th className="p-2 text-left">Referral Name</th>}
              <th className="p-2 text-right">Setup Fee</th>
              <th className="p-2 text-right">Monthly Fee</th>
              <th className="p-2 text-right">Commission Earned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.email}</td>
                {lvl > 1 && (
                  <td className="p-2">
                    {r.referrerId ? (
                      <Link
                        href={`/admin/users/${r.referrerId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {r.referrerName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="p-2 text-right">${r.setup_fee.toFixed(2)}</td>
                <td className="p-2 text-right">${r.monthly_fee.toFixed(2)}</td>
                <td className="p-2 text-right">${r.commission.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={lvl > 1 ? 6 : 5}
                  className="p-2 text-center text-gray-500"
                >
                  No level {lvl} referrals
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-8 p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">{partner?.full_name}</h1>
        <p className="text-gray-500">{partner?.email}</p>
      </header>

      {/* Referral Tree */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Referral Tree</h2>
        <ReferralTree partnerId={partnerId} />
      </section>

      {/* Level Tables */}
      {renderTable(level1, 1)}
      {renderTable(level2, 2)}
      {renderTable(level3, 3)}
    </div>
  );
}
