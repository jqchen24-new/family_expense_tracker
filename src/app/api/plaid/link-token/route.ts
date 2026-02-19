import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { auth } from "@/lib/auth";
import { getPlaidClient } from "@/lib/plaid";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return NextResponse.json(
      { error: "Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env." },
      { status: 503 }
    );
  }

  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: session.user.id },
      client_name: "Family Expense Tracker",
      products: [Products.Transactions],
      language: "en",
      country_codes: [CountryCode.Us],
    });
    return NextResponse.json({ linkToken: response.data.link_token });
  } catch (err: unknown) {
    const message = err && typeof err === "object" && "response" in err
      ? (err as { response?: { data?: { error_message?: string } } }).response?.data?.error_message
      : "Failed to create link token";
    console.error("Plaid linkTokenCreate error:", err);
    return NextResponse.json(
      { error: typeof message === "string" ? message : "Plaid configuration error" },
      { status: 500 }
    );
  }
}
