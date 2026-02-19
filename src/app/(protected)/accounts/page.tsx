import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ConnectPlaidButton } from "./ConnectPlaidButton";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Accounts</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ConnectPlaidButton />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">or upload statements on the Upload page</span>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{account.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {account.source === "plaid" ? account.institutionName ?? "Plaid" : "Upload"}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {account._count.transactions} transaction{account._count.transactions !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {account.source}
            </span>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 text-center text-zinc-500 dark:text-zinc-400">
            No accounts yet. Connect a bank with Plaid or upload a CSV statement.
          </p>
        )}
      </div>
    </div>
  );
}
