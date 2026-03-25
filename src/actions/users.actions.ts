// Gestion des utilisateurs

"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma, prisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { 
  CreateUserSchema, 
  UpdateUserSchema, 
  ListUsersSchema 
} from "@/lib/validations";

// Créer un nouvel utilisateur
export const createUserAction = createSafeAction(
  CreateUserSchema,
  async (data, { tenantId }) => {
    // L'unicité de l'email est globale au système
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      throw new TaysirError("Email déjà utilisé.", ErrorCodes.ERR_INVALID_DATA, 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const tenantPrisma = getTenantPrisma(tenantId);

    return await tenantPrisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      } as any,
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
      },
    });
  }
);

// Récupérer la liste des utilisateurs de l'école
export const getUsersListAction = createSafeAction(
  ListUsersSchema,
  async (filters, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);

    return await tenantPrisma.user.findMany({
      where: {
        ...(filters.role ? { role: filters.role } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, avatarUrl: true,
      },
    });
  }
);

// Modifier un utilisateur
export const updateUserAction = createSafeAction(
  UpdateUserSchema,
  async ({ id, ...updateData }, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);

    const user = await tenantPrisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new TaysirError("Utilisateur introuvable ou accès refusé.", ErrorCodes.ERR_NOT_FOUND, 404);
    }

    return await tenantPrisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, role: true, isActive: true },
    });
  }
);

// Supprimer un utilisateur
export const deleteUserAction = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { tenantId, role }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    
    return await tenantPrisma.user.delete({
      where: { id },
    });
  }
);
