import { getPlaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

export async function syncPlaidForUser(userId: string, itemId?: string): Promise<number> {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      source: "plaid",
      plaidAccessToken: { not: null },
      ...(itemId && { plaidItemId: itemId }),
    },
  });

  const byItem = new Map<string | null, typeof accounts>();
  for (const a of accounts) {
    const key = a.plaidItemId ?? null;
    if (!byItem.has(key)) byItem.set(key, []);
    byItem.get(key)!.push(a);
  }

  const client = getPlaidClient();
  let totalAdded = 0;

  for (const [, itemAccounts] of byItem) {
    const first = itemAccounts[0];
    if (!first?.plaidAccessToken) continue;

    const accountIdByPlaidId = new Map<string, string>();
    for (const a of itemAccounts) {
      if (a.plaidAccountId) accountIdByPlaidId.set(a.plaidAccountId, a.id);
    }

    let cursor = first.plaidCursor ?? undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await client.transactionsSync({
          access_token: first.plaidAccessToken,
          cursor,
        });
        const data = response.data;
        hasMore = data.has_more;
        cursor = data.next_cursor;

        for (const tx of data.added) {
          if (tx.pending) continue;
          const ourAccountId = accountIdByPlaidId.get(tx.account_id);
          if (!ourAccountId) continue;
          const plaidAmount = tx.amount ?? 0;
          const amount = -plaidAmount;
          await prisma.transaction.upsert({
            where: { plaidTransactionId: tx.transaction_id },
            create: {
              accountId: ourAccountId,
              date: new Date(tx.date),
              amount,
              currency: tx.iso_currency_code ?? "USD",
              merchantName: tx.merchant_name ?? tx.name ?? "Unknown",
              category: tx.personal_finance_category?.primary ?? tx.category?.[0] ?? null,
              source: "plaid",
              plaidTransactionId: tx.transaction_id,
            },
            update: {},
          });
          totalAdded += 1;
        }
      } catch (err) {
        console.error("Plaid sync error for item:", first.plaidItemId, err);
        break;
      }
    }

    if (cursor) {
      await prisma.account.updateMany({
        where: { plaidItemId: first.plaidItemId, userId },
        data: { plaidCursor: cursor },
      });
    }
  }

  return totalAdded;
}
