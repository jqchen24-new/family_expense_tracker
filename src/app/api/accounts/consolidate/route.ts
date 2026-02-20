import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function baseName(name: string): string {
  return name.replace(/\s*\(\d+\)\s*$/, "").trim();
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const base = typeof body.baseName === "string" ? body.baseName.trim() : "";
  if (!base) {
    return NextResponse.json({ error: "baseName is required" }, { status: 400 });
  }

  const all = await prisma.account.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { transactions: true } } },
  });

  const toMerge = all.filter((a) => baseName(a.name) === base);

  if (toMerge.length <= 1) {
    return NextResponse.json({ ok: true, merged: 0, message: "Nothing to consolidate" });
  }

  const target = toMerge.find((a) => a.name === base) ?? toMerge.sort((a, b) => b._count.transactions - a._count.transactions)[0];
  const others = toMerge.filter((a) => a.id !== target!.id);

  for (const acc of others) {
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { accountId: acc.id },
        data: { accountId: target!.id },
      }),
      prisma.account.delete({ where: { id: acc.id } }),
    ]);
  }

  if (target!.name !== base) {
    await prisma.account.update({
      where: { id: target!.id },
      data: { name: base },
    });
  }

  return NextResponse.json({
    ok: true,
    merged: others.length,
    into: target!.id,
    name: base,
  });
}
