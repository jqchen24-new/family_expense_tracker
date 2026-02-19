import { NextResponse } from "next/server";
import { syncPlaidForUser } from "@/lib/plaid-sync";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const webhookType = body.webhook_type as string;
  const webhookCode = body.webhook_code as string;
  const itemId = body.item_id as string | undefined;

  if (webhookType !== "TRANSACTIONS" || (webhookCode !== "DEFAULT_UPDATE" && webhookCode !== "INITIAL_UPDATE")) {
    return NextResponse.json({ received: true });
  }

  if (!itemId) return NextResponse.json({ received: true });

  const account = await prisma.account.findFirst({
    where: { plaidItemId: itemId, source: "plaid" },
    select: { userId: true },
  });
  if (!account) return NextResponse.json({ received: true });

  try {
    await syncPlaidForUser(account.userId, itemId);
  } catch (err) {
    console.error("Plaid webhook sync error:", err);
  }

  return NextResponse.json({ received: true });
}
