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
  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await prisma.account.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json({ ok: true });
}
