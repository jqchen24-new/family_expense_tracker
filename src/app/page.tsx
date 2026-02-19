import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Family Expense Tracker</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Consolidate statements, connect accounts, and visualize your family spending.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-5 py-2.5 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
