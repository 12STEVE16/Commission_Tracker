// app/api/admin/invite/route.ts
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server"; // async factory in v6+

interface InviteRequest {
  email: string;
}

export async function POST(request: Request) {
  const { email } = (await request.json()) as InviteRequest;

  try {
    // 1. Await the factory to get the actual ClerkClient instance
    const client = await clerkClient();

    // 2. Now you can call .invitations.createInvitation()
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "admin" },
      notify: true,
      ignoreExisting: true,
    });

    console.log("Invitation sent:", invitation.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Invitation creation error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 422 }
    );
  }
}
