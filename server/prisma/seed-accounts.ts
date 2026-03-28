import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create default account if none exist
  const count = await prisma.account.count();
  if (count > 0) {
    console.log(`${count} account(s) already exist, skipping seed.`);
    return;
  }

  const account = await prisma.account.create({
    data: { name: "Primary" },
  });
  console.log(`Created default account: "${account.name}" (${account.id})`);

  // Backfill existing records
  const [balCount, incCount, expCount] = await Promise.all([
    prisma.balanceSnapshot.updateMany({
      where: { accountId: "" },
      data: { accountId: account.id },
    }),
    prisma.incomeSource.updateMany({
      where: { accountId: "" },
      data: { accountId: account.id },
    }),
    prisma.plannedExpense.updateMany({
      where: { accountId: "" },
      data: { accountId: account.id },
    }),
  ]);

  console.log(`Backfilled: ${balCount.count} balances, ${incCount.count} income, ${expCount.count} expenses`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
