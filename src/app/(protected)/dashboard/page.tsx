import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "./DashboardCharts";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  const thisMonthExpenses =
    accountIds.length === 0
      ? { _sum: { amount: 0 as number | null } }
      : await prisma.transaction.aggregate({
          where: {
            accountId: { in: accountIds },
            date: { gte: startOfMonth, lte: endOfMonth },
            amount: { lt: 0 },
          },
          _sum: { amount: true },
        });
  const lastMonthExpenses =
    accountIds.length === 0
      ? { _sum: { amount: 0 as number | null } }
      : await prisma.transaction.aggregate({
          where: {
            accountId: { in: accountIds },
            date: { gte: startOfLastMonth, lte: endOfLastMonth },
            amount: { lt: 0 },
          },
          _sum: { amount: true },
        });

  const thisMonthTotal = Math.abs(thisMonthExpenses._sum.amount ?? 0);
  const lastMonthTotal = Math.abs(lastMonthExpenses._sum.amount ?? 0);
  const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const byCategory =
    accountIds.length === 0
      ? []
      : await prisma.transaction.groupBy({
          by: ["category"],
          where: {
            accountId: { in: accountIds },
            date: { gte: startOfMonth, lte: endOfMonth },
            amount: { lt: 0 },
          },
          _sum: { amount: true },
        });

  const categoryData = byCategory
    .map((r) => ({
      name: r.category || "Uncategorized",
      value: Math.abs(r._sum.amount ?? 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Spending this month</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ${thisMonthTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`mt-1 text-sm ${change >= 0 ? "text-red-600" : "text-green-600"}`}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}% vs last month
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Last month</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ${lastMonthTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <DashboardCharts categoryData={categoryData} />
    </div>
  );
}
