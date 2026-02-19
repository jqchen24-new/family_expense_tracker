import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncPlaidForUser } from "@/lib/plaid-sync";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const itemId = body.itemId as string | undefined;

  try {
    const totalAdded = await syncPlaidForUser(session.user.id, itemId);
    return NextResponse.json({ ok: true, totalAdded });
  } catch (err) {
    console.error("Plaid sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
