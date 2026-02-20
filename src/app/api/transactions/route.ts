import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const accountId = searchParams.get("accountId");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit")) || 500, 2000);
  const offset = Number(searchParams.get("offset")) || 0;

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  if (accountIds.length === 0) {
    const transactions: unknown[] = [];
    return NextResponse.json({ transactions, total: 0 });
  }

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (start) dateFilter.gte = new Date(start);
  if (end) dateFilter.lte = new Date(end);

  const where = {
    accountId: (accountId && accountIds.includes(accountId)) ? accountId : { in: accountIds },
    ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    ...(category && { category }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
      include: { account: { select: { id: true, name: true, source: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountIds = (
    await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })
  ).map((a) => a.id);

  if (accountIds.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.deleteAll) {
    const start = body.start as string | undefined;
    const end = body.end as string | undefined;
    const accountId = body.accountId as string | undefined;
    const category = body.category as string | undefined;

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (start) dateFilter.gte = new Date(start);
    if (end) dateFilter.lte = new Date(end);

    const where = {
      accountId: (accountId && accountIds.includes(accountId)) ? accountId : { in: accountIds },
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(category && { category }),
    };

    const { count } = await prisma.transaction.deleteMany({ where });
    return NextResponse.json({ ok: true, deleted: count });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array or deleteAll required" }, { status: 400 });
  }

  const { count } = await prisma.transaction.deleteMany({
    where: {
      id: { in: ids as string[] },
      accountId: { in: accountIds },
    },
  });

  return NextResponse.json({ ok: true, deleted: count });
}
