"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [accountName, setAccountName] = useState("");
  const [format, setFormat] = useState<"generic" | "chase">("generic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; accountId: string } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("accountName", accountName || "Uploaded statement");
      formData.set("format", format);
      const res = await fetch("/api/upload/statement", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setLoading(false);
        return;
      }
      setResult({ imported: data.imported, skipped: data.skipped ?? 0, accountId: data.accountId });
      setFile(null);
      setAccountName("");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Upload statement</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Upload a CSV export from your bank or credit card. We support a generic format (Date, Description, Amount) and Chase-style columns.
      </p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4 max-w-lg">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
            {error}
          </p>
        )}
        {result && (
          <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
            Imported {result.imported} transaction{result.imported !== 1 ? "s" : ""}
            {result.skipped > 0 && `, ${result.skipped} duplicate(s) skipped`}.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Account name (optional)</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. Chase Sapphire"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">CSV format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "generic" | "chase")}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          >
            <option value="generic">Generic (Date, Description, Amount)</option>
            <option value="chase">Chase</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">CSV file</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 file:mr-2 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
