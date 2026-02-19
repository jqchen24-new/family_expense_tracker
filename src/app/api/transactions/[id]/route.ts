import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { category, notes } = body;

  const transaction = await prisma.transaction.findFirst({
    where: { id, account: { userId: session.user.id } },
  });
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const data: { category?: string; notes?: string } = {};
  if (typeof category === "string") data.category = category;
  if (typeof notes === "string") data.notes = notes;

  const updated = await prisma.transaction.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}
