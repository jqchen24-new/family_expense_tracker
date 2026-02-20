"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; name: string; source: string; transactionCount: number };

export function AccountActions({
  account,
  otherAccounts,
}: {
  account: Account;
  otherAccounts: Account[];
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(account.name);
  const [merging, setMerging] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim() === account.name || !newName.trim()) {
      setRenaming(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Rename failed");
        return;
      }
      setRenaming(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!mergeTargetId) return;
    if (
      !confirm(
        `Move all ${account.transactionCount} transaction(s) from "${account.name}" into "${otherAccounts.find((a) => a.id === mergeTargetId)?.name}"? The "${account.name}" account will be removed.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: account.id,
          toAccountId: mergeTargetId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Merge failed");
        return;
      }
      setMerging(false);
      setMergeTargetId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const message =
      account.transactionCount > 0
        ? `Delete "${account.name}" and its ${account.transactionCount} transaction(s)? This cannot be undone.`
        : `Delete "${account.name}"? This cannot be undone.`;
    if (!confirm(message)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const canMerge = otherAccounts.length > 0;

  return (
    <div className="flex flex-col gap-2 items-end">
      {!renaming ? (
        <button
          type="button"
          onClick={() => setRenaming(true)}
          disabled={loading}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          Rename
        </button>
      ) : (
        <form onSubmit={handleRename} className="flex gap-2 items-center">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-sm w-40"
            autoFocus
          />
          <button type="submit" disabled={loading} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Save
          </button>
          <button type="button" onClick={() => { setRenaming(false); setNewName(account.name); }} className="text-xs text-zinc-500 hover:underline">
            Cancel
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading || deleting}
        className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete account"}
      </button>

      {canMerge && (
        <>
          {!merging ? (
            <button
              type="button"
              onClick={() => setMerging(true)}
              disabled={loading}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
            >
              Merge into another account
            </button>
          ) : (
            <form onSubmit={handleMerge} className="flex flex-col gap-2 items-end">
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-sm"
              >
                <option value="">Select account to merge into…</option>
                {otherAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.transactionCount} txns)
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={loading || !mergeTargetId} className="text-xs text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50">
                  Merge
                </button>
                <button type="button" onClick={() => { setMerging(false); setMergeTargetId(""); }} className="text-xs text-zinc-500 hover:underline">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
