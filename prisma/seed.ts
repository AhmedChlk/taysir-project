import { PrismaClient, RoleUser } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // 1. Création de l'établissement par défaut
  const etablissement = await prisma.etablissement.upsert({
    where: { slug: "ecole-ruifed" },
    update: {},
    create: {
      name: "Ecole Ruifed",
      slug: "ecole-ruifed",
      primaryColor: "#0F515C",
    },
  });

  console.log(`✅ Établissement créé : ${etablissement.name}`);

  // 2. Création de l'administrateur par défaut (Directeur Noreddine Ruifed)
  const adminEmail = "noreddine@ruifed.dz";
  const hashedPassword = await bcrypt.hash("Taysir2024!", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: RoleUser.GERANT,
      etablissementId: etablissement.id,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "Noreddine",
      lastName: "Ruifed",
      role: RoleUser.GERANT,
      etablissementId: etablissement.id,
      isActive: true,
    },
  });

  console.log(`✅ Administrateur créé : ${admin.email}`);
  console.log("✨ Seeding terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
