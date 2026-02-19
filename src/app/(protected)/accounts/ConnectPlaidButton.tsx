"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";

export function ConnectPlaidButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch("/api/plaid/link-token", { method: "POST" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          if (res.ok && data.linkToken) {
            setLinkToken(data.linkToken);
            setError(null);
          } else {
            setError(data.error || `Request failed (${res.status})`);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load Plaid");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });
      router.refresh();
    },
    [router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => {},
  });

  if (loading && !linkToken && !error) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
      >
        Connect bank (loading…)
      </button>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-amber-600 dark:text-amber-400">
          Connect bank: {error}
        </span>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            setLinkToken(null);
            fetch("/api/plaid/link-token", { method: "POST" })
              .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.linkToken) {
                  setLinkToken(data.linkToken);
                  setError(null);
                } else {
                  setError(data.error || `Request failed (${res.status})`);
                }
              })
              .catch(() => setError("Failed to load Plaid"))
              .finally(() => setLoading(false));
          }}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-fit"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!linkToken) {
    return (
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Connect bank (unavailable)
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open()}
      disabled={!ready}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      Connect bank with Plaid
    </button>
  );
}
