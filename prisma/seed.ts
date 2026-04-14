import { PrismaClient, RoleUser } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding propre...");

  // 1. Création de l'établissement par défaut
  // On utilise create ou upsert, mais après un reset, create suffit.
  const etablissement = await prisma.etablissement.create({
    data: {
      name: "Taysir Academy",
      slug: "taysir-academy",
      primaryColor: "#1A2F23", // Oasis Green
    },
  });

  console.log(`✅ Établissement créé : ${etablissement.name}`);

  // 2. Création de l'unique Gérant propre
  const adminEmail = "admin@taysir.dz";
  const hashedPassword = await bcrypt.hash("Taysir2026!", 12);

  const manager = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Taysir",
      role: RoleUser.GERANT,
      etablissementId: etablissement.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Gérant unique créé : ${manager.email}`);
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
