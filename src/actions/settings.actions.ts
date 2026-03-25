// Gestion du profil et des paramètres

"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma, prisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

// Validation pour la mise à jour du profil
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères."),
  email: z.string().email("Format d'email invalide."),
  phone: z.string().optional().nullable(),
});

// Mise à jour des infos de l'utilisateur
export const updateProfileAction = createSafeAction(
  UpdateProfileSchema,
  async (data, { userId, tenantId }) => {
    // On ne permet pas de changer d'email s'il est déjà pris par un autre utilisateur
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new TaysirError("Cet email est déjà utilisé par un autre compte.", ErrorCodes.ERR_INVALID_DATA, 400);
    }

    const tenantPrisma = getTenantPrisma(tenantId);

    const updatedUser = await tenantPrisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        // phone: data.phone, // Décommenter si le champ existe dans le schéma Prisma
      },
    });

    revalidatePath("/dashboard/settings");
    return updatedUser;
  }
);

// Validation pour l'école
export const UpdateSchoolSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  // primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Mise à jour des infos de l'école
export const updateSchoolAction = createSafeAction(
  UpdateSchoolSchema,
  async (data, { tenantId, role }) => {
    // Seul un Gérant ou ADMIN peut modifier les infos de l'école
    if (role !== "GERANT" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new TaysirError("Accès refusé : Permissions insuffisantes.", ErrorCodes.ERR_UNAUTHORIZED, 403);
    }

    const updatedSchool = await prisma.etablissement.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        // address: data.address, // Décommenter si le champ existe dans le schéma Prisma
      },
    });

    revalidatePath("/dashboard/settings");
    return updatedSchool;
  }
);

// Suppression du compte
export const deleteAccountAction = createSafeAction(
  z.object({}),
  async (_, { userId, tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    
    // On pourrait ajouter des restrictions supplémentaires ici
    // Par exemple: ne pas permettre au dernier Gérant de supprimer son compte
    
    return await tenantPrisma.user.delete({
      where: { id: userId },
    });
  }
);
