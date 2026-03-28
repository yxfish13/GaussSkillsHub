import { PrismaClient } from "@prisma/client";
import { hashAdminPassword } from "../src/lib/auth";
import { getEnv } from "../src/lib/env";

const prisma = new PrismaClient();

async function main() {
  const env = getEnv();

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    console.warn("Skipping admin seed because ADMIN_USERNAME or ADMIN_PASSWORD is missing.");
    return;
  }

  const passwordHash = await hashAdminPassword(env.ADMIN_PASSWORD);

  await prisma.adminUser.upsert({
    where: {
      username: env.ADMIN_USERNAME
    },
    update: {
      passwordHash
    },
    create: {
      username: env.ADMIN_USERNAME,
      passwordHash
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
