// app/dashboard/referrals/page.tsx

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  // 1️⃣ Ensure the user is signed in
  const user = await currentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  // 2️⃣ Lookup Supabase UUID by Clerk ID
  const supabase = getServerSupabase();
  const { data: me, error: meErr } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", user.id)
    .single();
  if (meErr || !me) {
    throw new Error("Could not find your user record.");
  }
  const referrerId = me.id;

  // 3️⃣ Fetch all referrals for that referrer
  const { data: refs, error } = await supabase
    .from("referrals")
    .select("id, full_name, email, created_at")
    .eq("referrer_id", referrerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load your referrals: " + error.message);
  }

  // 4️⃣ Render
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Your Referrals</h1>
        <p className="text-gray-600">Total referred: {refs?.length ?? 0}</p>
      </header>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {refs && refs.length > 0 ? (
              refs.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{r.full_name || "—"}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">
                    {new Date(r.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  You haven’t referred anyone yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
