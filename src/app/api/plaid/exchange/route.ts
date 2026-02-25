import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlaidClient } from "@/lib/plaid";
import { syncPlaidForUser } from "@/lib/plaid-sync";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const publicToken = body.public_token;
  if (!publicToken || typeof publicToken !== "string") {
    return NextResponse.json({ error: "public_token required" }, { status: 400 });
  }

  try {
    const client = getPlaidClient();
    const exchangeRes = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    const accountsRes = await client.accountsGet({ access_token: accessToken });
    const institutionName = accountsRes.data.item?.institution_name ?? "Unknown";

    for (const acct of accountsRes.data.accounts) {
      const existing = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          plaidItemId: itemId,
          plaidAccountId: acct.account_id,
        },
      });
      const mask = acct.mask != null ? String(acct.mask) : null;
      if (existing) {
        await prisma.account.update({
          where: { id: existing.id },
          data: {
            plaidAccessToken: accessToken,
            name: acct.name || acct.official_name || existing.name,
            mask,
          },
        });
      } else {
        await prisma.account.create({
          data: {
            userId: session.user.id,
            name: acct.name || acct.official_name || acct.account_id,
            mask,
            source: "plaid",
            institutionName,
            plaidItemId: itemId,
            plaidAccountId: acct.account_id,
            plaidAccessToken: accessToken,
          },
        });
      }
    }

    let totalAdded = 0;
    try {
      totalAdded = await syncPlaidForUser(session.user.id, itemId);
    } catch (e) {
      console.error("Initial sync after exchange:", e);
    }

    return NextResponse.json({
      ok: true,
      accounts: accountsRes.data.accounts.length,
      totalAdded,
    });
  } catch (err: unknown) {
    console.error("Plaid exchange error:", err);
    return NextResponse.json(
      { error: "Failed to link account" },
      { status: 500 }
    );
  }
}
