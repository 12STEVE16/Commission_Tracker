import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Server action to handle invitation
async function inviteAdmin(formData: FormData) {
  "use server";
  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    throw new Error("Invalid email");
  }

  const res = await fetch("/api/admin/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || "Failed to send invite");
  }

  // On success, redirect to dashboard
  redirect("/admin/dashboard");
}

export default function InviteAdminPage() {
  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Invite User as Admin</h1>
      <Card>
        <CardContent className="p-4">
          <form action={inviteAdmin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email address
              </label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Send Invite</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
