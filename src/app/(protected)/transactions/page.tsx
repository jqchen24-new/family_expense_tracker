"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  merchantName: string;
  category: string | null;
  source: string;
  account: { id: string; name: string; source: string };
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function fetchAccounts() {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    }
    fetchAccounts();
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      if (accountId) params.set("accountId", accountId);
      if (category) params.set("category", category);
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions ?? []);
        setTotal(data.total ?? 0);
      }
      setLoading(false);
    }
    fetchTransactions();
  }, [start, end, accountId, category]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Transactions</h1>

      <div className="flex flex-wrap gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">From</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">To</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Category</label>
          <input
            type="text"
            placeholder="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1.5 text-sm w-40"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
          <p className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
            {total} transaction{total !== 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Merchant</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Account</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-700/50">
                    <td className="py-2 px-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">{t.merchantName}</td>
                    <td className="py-2 px-4 text-zinc-600 dark:text-zinc-400">{t.category ?? "—"}</td>
                    <td className="py-2 px-4 text-zinc-600 dark:text-zinc-400">{t.account.name}</td>
                    <td className={`py-2 px-4 text-right font-medium ${t.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                      {t.amount < 0 ? "-" : ""}${Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && (
            <p className="py-8 text-center text-zinc-500 dark:text-zinc-400">
              No transactions. <Link href="/upload" className="text-blue-600 hover:underline">Upload a statement</Link> or{" "}
              <Link href="/accounts" className="text-blue-600 hover:underline">connect an account</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
