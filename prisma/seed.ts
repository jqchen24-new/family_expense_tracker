import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists");
    return;
  }
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Demo Upload Account",
      source: "upload",
    },
  });
  const now = new Date();
  const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment"];
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), -i);
    const category = categories[i % categories.length];
    const amount = -(Math.random() * 80 + 5);
    await prisma.transaction.create({
      data: {
        accountId: account.id,
        date,
        amount,
        currency: "USD",
        merchantName: `Demo Merchant ${i + 1}`,
        category,
        source: "upload",
        rawId: `seed-${account.id}-${date.toISOString()}-${amount}-${i}`,
      },
    });
  }
  console.log("Seeded demo user:", email, "password: demo1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
