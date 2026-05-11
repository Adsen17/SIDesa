import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding user...");

  const defaultPassword = await bcrypt.hash("123", 10);

  await prisma.user.upsert({
    where: { username: "dev" },
    update: {},
    create: {
      username: "dev",
      password: defaultPassword,
      phone: "08123",
      role: "developer",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      username: "owner",
      password: defaultPassword,
      phone: "08222",
      role: "owner",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "staff" },
    update: {},
    create: {
      username: "staff",
      password: defaultPassword,
      phone: "08333",
      role: "staff",
      isActive: true,
    },
  });

  console.log("✅ SEED SELESAI!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });