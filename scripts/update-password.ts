import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "ahmed.choulak@taysir.dz";
  const password = "GerantPass789!";
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  console.log(`Password updated for ${email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
