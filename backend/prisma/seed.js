require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const loginId = process.env.CENTRAL_LOGIN_ID || "central";
  const password = process.env.CENTRAL_SEED_PASSWORD;

  if (!password) {
    throw new Error("Set CENTRAL_SEED_PASSWORD in your .env before seeding.");
  }

  const existing = await prisma.centralAdmin.findUnique({ where: { loginId } });
  if (existing) {
    console.log(`Central admin "${loginId}" already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.centralAdmin.create({ data: { loginId, passwordHash } });
  console.log(`Central admin created. Login ID: "${loginId}" — use the password from your .env to log in.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
