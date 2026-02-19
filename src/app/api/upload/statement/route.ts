import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsvRows, type ParserFormat } from "@/lib/csv-parser";
import crypto from "crypto";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const accountName = (formData.get("accountName") as string) || "Uploaded statement";
  const format = (formData.get("format") as ParserFormat) || "generic";

  if (!file || !file.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const contentType = file.type;
  const isCsv = contentType === "text/csv" || file.name.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === "," || c === "\t") && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  });

  const parsed = parseCsvRows(rows, format);
  if (parsed.length === 0) {
    return NextResponse.json({ error: "No valid transactions found in CSV" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: accountName,
      source: "upload",
    },
  });

  const existingRawIds = new Set<string>();
  const toCreate: {
    accountId: string;
    date: Date;
    amount: number;
    currency: string;
    merchantName: string;
    category: string | null;
    source: string;
    rawId: string;
  }[] = [];

  for (const t of parsed) {
    const rawId = crypto
      .createHash("sha256")
      .update(`${account.id}-${t.date.toISOString()}-${t.amount}-${t.merchantName}`)
      .digest("hex");
    if (existingRawIds.has(rawId)) continue;
    existingRawIds.add(rawId);
    toCreate.push({
      accountId: account.id,
      date: t.date,
      amount: t.amount,
      currency: t.currency,
      merchantName: t.merchantName,
      category: t.category ?? null,
      source: "upload",
      rawId,
    });
  }

  await prisma.transaction.createMany({
    data: toCreate,
  });

  return NextResponse.json({
    ok: true,
    accountId: account.id,
    imported: toCreate.length,
    skipped: parsed.length - toCreate.length,
  });
}
