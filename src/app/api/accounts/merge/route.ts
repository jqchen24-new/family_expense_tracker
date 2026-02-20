import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fromAccountId = body.fromAccountId as string | undefined;
  const toAccountId = body.toAccountId as string | undefined;

  if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
    return NextResponse.json(
      { error: "fromAccountId and toAccountId required and must be different" },
      { status: 400 }
    );
  }

  const accounts = await prisma.account.findMany({
    where: {
      id: { in: [fromAccountId, toAccountId] },
      userId: session.user.id,
    },
  });

  if (accounts.length !== 2) {
    return NextResponse.json({ error: "One or both accounts not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { accountId: fromAccountId },
      data: { accountId: toAccountId },
    }),
    prisma.account.delete({
      where: { id: fromAccountId },
    }),
  ]);

  return NextResponse.json({ ok: true, mergedInto: toAccountId });
}
