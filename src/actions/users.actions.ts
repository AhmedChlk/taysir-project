"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// Utilitaire pour récupérer l'établissement localement
async function getEtablissementId() {
  const etablissement = await prisma.etablissement.findFirst();
  if (!etablissement) throw new Error("Établissement introuvable");
  return etablissement.id;
}

// Purificateur pour éviter le crash des Server Components
function purify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// --- STAFF / UTILISATEURS (USERS) ---
// ==========================================

export async function createUserAction(data: any) {
  try {
    // 1. Vérification de l'email unique
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      return { success: false, error: { message: "Cet email est déjà utilisé." } };
    }

    // 2. Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const tid = await getEtablissementId();

    // 3. Création
    const result = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isActive: true, // Actif par défaut
        etablissementId: tid,
      },
    });

    // 4. Rafraîchissement forcé de la page Staff
    revalidatePath("/dashboard/staff");
    
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function updateUserAction(data: any) {
  try {
    const { id, password, ...updateData } = data;
    const updatePayload: any = { ...updateData };

    // Si on modifie le mot de passe, on le hash à nouveau
    if (password && password.trim() !== "") {
      updatePayload.password = await bcrypt.hash(password, 12);
    }

    const result = await prisma.user.update({
      where: { id },
      data: updatePayload,
    });

    // Rafraîchissement forcé
    revalidatePath("/dashboard/staff");
    
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function deleteUserAction({ id }: { id: string }) {
  try {
    await prisma.user.delete({ where: { id } });
    
    // Rafraîchissement forcé
    revalidatePath("/dashboard/staff");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}