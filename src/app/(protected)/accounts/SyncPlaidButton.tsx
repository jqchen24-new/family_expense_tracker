"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncPlaidButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const count = data.totalAdded ?? 0;
        setMessage({
          type: "ok",
          text: count > 0 ? `Synced ${count} transaction${count !== 1 ? "s" : ""}.` : "Sync complete. No new transactions.",
        });
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error ?? "Sync failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Sync failed." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        title="Pull latest transactions from your linked banks. If you just connected, wait a minute and try again."
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 hover:border-zinc-300 dark:hover:bg-zinc-700 dark:hover:border-zinc-500 disabled:opacity-50 transition-colors"
      >
        {syncing && (
          <span
            className="inline-block h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        )}
        {syncing ? "Syncing…" : "Sync transactions"}
      </button>
      {message && (
        <span
          className={`text-sm ${message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
