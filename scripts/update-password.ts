import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Usage: ts-node scripts/update-password.ts <email> <password>
// Or via env: TARGET_EMAIL / TARGET_PASSWORD
async function main() {
  const email = process.argv[2] ?? process.env.TARGET_EMAIL;
  const password = process.argv[3] ?? process.env.TARGET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing args. Usage: update-password <email> <password> (or TARGET_EMAIL / TARGET_PASSWORD env).",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  console.log(`Password updated for ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
