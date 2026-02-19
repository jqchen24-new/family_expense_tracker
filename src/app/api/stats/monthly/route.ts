import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const months = Math.min(Number(searchParams.get("months")) || 12, 24);

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  if (accountIds.length === 0) {
    return NextResponse.json({ byMonth: [], byCategory: [] });
  }

  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      date: { gte: start, lte: end },
      amount: { lt: 0 },
    },
    select: { date: true, amount: true, category: true },
  });

  const byMonthMap = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(end.getFullYear(), end.getMonth() - months + 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonthMap.set(key, 0);
  }
  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (byMonthMap.has(key)) byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + Math.abs(t.amount));
  }
  const byMonth = Array.from(byMonthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));

  const byCategoryMap = new Map<string, number>();
  for (const t of transactions) {
    const cat = t.category || "Uncategorized";
    byCategoryMap.set(cat, (byCategoryMap.get(cat) ?? 0) + Math.abs(t.amount));
  }
  const byCategory = Array.from(byCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({ byMonth, byCategory });
}
