"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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

  const fetchTransactions = useCallback(async () => {
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
  }, [start, end, accountId, category]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      transactions.forEach((t) => next.delete(t.id));
      return next;
    });
  }, [transactions]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} transaction${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Delete failed");
        return;
      }
      setSelectedIds(new Set());
      await fetchTransactions();
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAll() {
    if (total === 0) return;
    if (!confirm(`Delete all ${total} transaction${total !== 1 ? "s" : ""} (matching your filters)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteAll: true,
          start: start || undefined,
          end: end || undefined,
          accountId: accountId || undefined,
          category: category || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Delete failed");
        return;
      }
      setSelectedIds(new Set());
      await fetchTransactions();
    } finally {
      setDeleting(false);
    }
  }

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
          <div className="px-4 py-2 flex items-center justify-between gap-4 flex-wrap border-b border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {total} transaction{total !== 1 ? "s" : ""}
              {selectedIds.size > 0 && (
                <span className="ml-2 text-zinc-700 dark:text-zinc-300">
                  ({selectedIds.size} selected)
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              {total > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : `Delete all ${total}`}
                </button>
              )}
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : `Delete ${selectedIds.size} selected`}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="w-10 py-3 px-2 text-left">
                    {transactions.length > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === transactions.length}
                          onChange={toggleSelectAll}
                          className="rounded border-zinc-300 dark:border-zinc-600"
                          aria-label="Select all on page"
                        />
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">Select page</span>
                      </label>
                    )}
                  </th>
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
                    <td className="w-10 py-2 px-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="rounded border-zinc-300 dark:border-zinc-600"
                        aria-label={`Select ${t.merchantName}`}
                      />
                    </td>
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
