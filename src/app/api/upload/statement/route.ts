import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsvRows, type ParserFormat } from "@/lib/csv-parser";
import crypto from "crypto";

function parseCsvFile(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
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
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("file") as File[];
  const accountNameBase = (formData.get("accountName") as string) || "Uploaded statement";
  const format = (formData.get("format") as ParserFormat) || "generic";

  const toProcess = files.filter((f): f is File => f instanceof File && f.size > 0);
  if (toProcess.length === 0) {
    return NextResponse.json({ error: "No file(s) provided" }, { status: 400 });
  }

  for (const file of toProcess) {
    const isCsv = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      return NextResponse.json({ error: `Only CSV files are supported. "${file.name}" is not a CSV.` }, { status: 400 });
    }
  }

  const accountName = (accountNameBase || "Uploaded statement").trim();
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

  let totalSkipped = 0;

  for (const file of toProcess) {
    const text = await file.text();
    const rows = parseCsvFile(text);
    const parsed = parseCsvRows(rows, format);

    for (const t of parsed) {
      const rawId = crypto
        .createHash("sha256")
        .update(`${account.id}-${t.date.toISOString()}-${t.amount}-${t.merchantName}`)
        .digest("hex");
      if (existingRawIds.has(rawId)) {
        totalSkipped += 1;
        continue;
      }
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
  }

  if (toCreate.length > 0) {
    await prisma.transaction.createMany({ data: toCreate });
  }

  const totalImported = toCreate.length;
  if (totalImported === 0 && totalSkipped === 0) {
    await prisma.account.delete({ where: { id: account.id } });
    return NextResponse.json({ error: "No valid transactions found in any CSV" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    results: [{ accountId: account.id, name: account.name, imported: totalImported, skipped: totalSkipped }],
    accountId: account.id,
    imported: totalImported,
    skipped: totalSkipped,
  });
}
