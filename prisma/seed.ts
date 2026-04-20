import { PrismaClient, RoleUser } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding propre...");

  // 0. Création du Super Admin
  const superAdminEmail = "ahmedchoulak80@superadmin.taysir.dz";
  const superPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!superPassword) {
    throw new Error("SEED_SUPER_ADMIN_PASSWORD is required for seeding");
  }
  const hashedSuperPassword = await bcrypt.hash(superPassword, 12);

  const superadmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { password: hashedSuperPassword },
    create: {
      email: superAdminEmail,
      password: hashedSuperPassword,
      firstName: "Ahmed",
      lastName: "Choulak",
      role: RoleUser.SUPER_ADMIN,
      status: "ACTIVE",
    },
  });
  console.log(`✅ Super Admin créé : ${superadmin.email}`);

  // 1. Création de l'établissement par défaut
  const etablissement = await prisma.etablissement.upsert({
    where: { slug: "taysir-academy" },
    update: {},
    create: {
      name: "Taysir Academy",
      slug: "taysir-academy",
      primaryColor: "#1A2F23", // Oasis Green
    },
  });

  console.log(`✅ Établissement créé : ${etablissement.name}`);

  // 2. Création de l'unique Gérant propre
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@taysir.dz";
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!initialAdminPassword) {
    throw new Error("INITIAL_ADMIN_PASSWORD is required for seeding");
  }
  const hashedPassword = await bcrypt.hash(initialAdminPassword, 12);

  const manager = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
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

  // 3. Création d'une activité par défaut
  const activity = await prisma.activity.create({
    data: {
      name: "Mathématiques",
      etablissementId: etablissement.id,
    }
  });
  console.log(`✅ Activité créée : ${activity.name}`);

  // 4. Création d'un groupe par défaut
  const group = await prisma.groupe.create({
    data: {
      name: "Groupe A1",
      etablissementId: etablissement.id,
    }
  });
  console.log(`✅ Groupe créé : ${group.name}`);

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
