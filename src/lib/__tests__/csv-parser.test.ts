import { describe, it, expect } from "vitest";
import { parseCsvRows } from "../csv-parser";

describe("parseCsvRows", () => {
  it("parses generic format with date, description, amount", () => {
    const rows = [
      ["Date", "Description", "Amount"],
      ["2024-01-15", "Coffee Shop", "12.50"],
      ["2024-01-16", "Grocery Store", "85.00"],
    ];
    const result = parseCsvRows(rows, "generic");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      merchantName: "Coffee Shop",
      amount: -12.5,
      currency: "USD",
    });
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date.getFullYear()).toBe(2024);
    expect(result[1].amount).toBe(-85);
  });

  it("returns empty array for empty or single header row", () => {
    expect(parseCsvRows([], "generic")).toEqual([]);
    expect(parseCsvRows([["Date", "Amount"]], "generic")).toEqual([]);
  });

  it("parses Chase-style columns", () => {
    const rows = [
      ["Posting Date", "Description", "Amount", "Type"],
      ["1/15/2024", "AMZN Mktp", "42.99", "Debit"],
    ];
    const result = parseCsvRows(rows, "chase");
    expect(result).toHaveLength(1);
    expect(result[0].merchantName).toBe("AMZN Mktp");
    expect(result[0].amount).toBe(-42.99);
  });
});
