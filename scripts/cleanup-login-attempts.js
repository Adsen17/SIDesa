const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  console.log(`Login attempts lama terhapus: ${result.count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });