import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const env = process.env.PLAID_ENV || "sandbox";
const basePath =
  env === "production"
    ? PlaidEnvironments.production
    : env === "development"
      ? "https://development.plaid.com"
      : PlaidEnvironments.sandbox;

export function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
  }
  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret },
    },
  });
  return new PlaidApi(configuration);
}
