"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma, prisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères."),
  email: z.string().email("Format d'email invalide."),
  phone: z.string().optional().nullable(),
});

export const updateProfileAction = createSafeAction(
  UpdateProfileSchema,
  async (data, { userId, tenantId }) => {
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
      },
    });

    revalidatePath("/dashboard/settings");
    return updatedUser;
  }
);

export const UpdateSchoolSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
});

export const updateSchoolAction = createSafeAction(
  UpdateSchoolSchema,
  async (data, { tenantId, role }) => {
    if (role !== "GERANT" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      throw new TaysirError("Accès refusé : Permissions insuffisantes.", ErrorCodes.ERR_UNAUTHORIZED, 403);
    }

    const updatedSchool = await prisma.etablissement.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        address: data.address,
        primaryColor: data.primaryColor,
      },
    });

    revalidatePath("/dashboard/settings");
    return updatedSchool;
  }
);

export const deleteAccountAction = createSafeAction(
  z.object({}),
  async (_, { userId, tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    
    return await tenantPrisma.user.delete({
      where: { id: userId },
    });
  }
);
