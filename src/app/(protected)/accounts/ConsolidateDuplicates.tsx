"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function baseName(name: string): string {
  return name.replace(/\s*\(\d+\)\s*$/, "").trim();
}

type Account = { id: string; name: string; transactionCount: number };

export function ConsolidateDuplicates({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const byBase = new Map<string, Account[]>();
  for (const a of accounts) {
    const base = baseName(a.name);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push(a);
  }

  const duplicateGroups = Array.from(byBase.entries()).filter(([, list]) => list.length > 1);

  if (duplicateGroups.length === 0) return null;

  async function consolidate(base: string) {
    setLoading(base);
    try {
      const res = await fetch("/api/accounts/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseName: base }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Consolidate failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Duplicate account names in filter
      </p>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        The following names have multiple accounts (e.g. from earlier uploads). Consolidate each into one so the Transactions filter shows a single option.
      </p>
      <ul className="space-y-2">
        {duplicateGroups.map(([base, list]) => (
          <li key={base} className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              &quot;{base}&quot; — {list.length} account{list.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => consolidate(base)}
              disabled={loading !== null}
              className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50"
            >
              {loading === base ? "Merging…" : `Merge into one "${base}"`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
