/**
 * Parse CSV statement rows into normalized transactions.
 * Supports a generic format and Chase-style columns.
 */

export type ParsedTransaction = {
  date: Date;
  amount: number;
  currency: string;
  merchantName: string;
  category?: string;
};

export type ParserFormat = "generic" | "chase";

const DATE_REG = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

function parseDate(val: string): Date | null {
  const s = val.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const y = Number(m[3]);
    const year = y < 100 ? 2000 + y : y;
    return new Date(year, Number(m[1]) - 1, Number(m[2]));
  }
  return null;
}

function parseAmount(val: string): number | null {
  const s = val.trim().replace(/[$,\s]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return n;
}

/**
 * Chase credit card CSV: Details, Posting Date, Description, Amount, Type, ...
 * Or: Transaction Date, Post Date, Description, Category, Type, Amount, ...
 */
export function parseChaseRow(row: string[], headers: string[]): ParsedTransaction | null {
  const get = (names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.toLowerCase().includes(n.toLowerCase()));
      if (i >= 0 && row[i] !== undefined) return row[i].trim();
    }
    return "";
  };
  const dateStr = get(["posting date", "post date", "transaction date", "date"]);
  const desc = get(["description", "memo"]);
  const amountStr = get(["amount"]);
  const typeStr = get(["type", "debit/credit"]);
  const category = get(["category"]);

  const date = parseDate(dateStr);
  if (!date) return null;
  let amount = parseAmount(amountStr);
  if (amount === null) return null;
  if (typeStr.toLowerCase().includes("credit") || typeStr === "Credit") amount = -amount;
  else if (amount > 0) amount = -amount;
  return {
    date,
    amount,
    currency: "USD",
    merchantName: desc || "Unknown",
    category: category || undefined,
  };
}

/**
 * Generic: expect columns Date, Description, Amount (or similar).
 */
export function parseGenericRow(row: string[], headers: string[]): ParsedTransaction | null {
  const get = (names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.toLowerCase().includes(n.toLowerCase()));
      if (i >= 0 && row[i] !== undefined) return row[i].trim();
    }
    return "";
  };
  const dateStr = get(["date", "transaction date"]);
  const desc = get(["description", "memo", "merchant", "name"]);
  const amountStr = get(["amount", "debit", "credit"]);

  const date = parseDate(dateStr);
  if (!date) return null;
  let amount = parseAmount(amountStr);
  if (amount === null) return null;
  const debitStr = get(["debit"]);
  const creditStr = get(["credit"]);
  if (debitStr && parseAmount(debitStr) !== null) amount = -Math.abs(parseAmount(debitStr)!);
  else if (creditStr && parseAmount(creditStr) !== null) amount = Math.abs(parseAmount(creditStr)!);
  else if (amount > 0) amount = -amount;
  return {
    date,
    amount,
    currency: "USD",
    merchantName: desc || "Unknown",
    category: get(["category"]) || undefined,
  };
}

export function parseCsvRows(
  rows: string[][],
  format: ParserFormat
): ParsedTransaction[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  const out: ParsedTransaction[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c.trim())) continue;
    const parsed = format === "chase" ? parseChaseRow(row, headers) : parseGenericRow(row, headers);
    if (parsed) out.push(parsed);
  }
  return out;
}
