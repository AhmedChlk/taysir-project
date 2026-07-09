"use server";

import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction, MANAGEMENT_ROLES } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma, prisma } from "@/lib/prisma";
import { stripUndefined } from "@/lib/utils/prisma-helpers";
import {
	CreateUserSchema,
	ListUsersSchema,
	UpdateUserSchema,
} from "@/lib/validations";

export const createUserAction = createSafeAction(
	CreateUserSchema,
	async (data, { tenantId }) => {
		const emailTaken = await prisma.user.findUnique({
			where: { email: data.email },
		});
		if (emailTaken) {
			throw new TaysirError(
				"Email déjà utilisé.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const hashedPassword = await bcrypt.hash(data.password, 12);
		const tenantPrisma = getTenantPrisma(tenantId);

		const user = await tenantPrisma.user.create({
			data: {
				...stripUndefined(data),
				password: hashedPassword,
				etablissementId: tenantId,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
			},
		});

		revalidateTag(`etab_${tenantId}_staff`, "max");
		return user;
	},
	{ requiredRole: MANAGEMENT_ROLES },
);

export const getUsersListAction = createSafeAction(
	ListUsersSchema,
	async (filters, { tenantId, role }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		return await tenantPrisma.user.findMany({
			where: {
				...(filters.role ? { role: filters.role } : {}),
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				status: true,
				avatarUrl: true,
				...(role === "GERANT" ? { salary: true } : {}),
			},
		});
	},
);

export const updateUserAction = createSafeAction(
	UpdateUserSchema,
	async ({ id, ...updateData }, { tenantId, role }) => {
		if (role !== "GERANT") {
			if (
				updateData.role ||
				updateData.salary !== undefined ||
				updateData.status
			) {
				throw new TaysirError(
					"Accès refusé : Seul le Gérant peut modifier les rôles, statuts ou salaires.",
					ErrorCodes.ERR_UNAUTHORIZED,
					403,
				);
			}
		}

		const tenantPrisma = getTenantPrisma(tenantId);

		const user = await tenantPrisma.user.findUnique({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
		});
		if (!user) {
			throw new TaysirError(
				"Utilisateur introuvable ou accès refusé.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		const updatedUser = await tenantPrisma.user.update({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
			data: stripUndefined(updateData),
			select: {
				id: true,
				email: true,
				role: true,
				status: true,
				...(role === "GERANT" ? { salary: true } : {}),
			},
		});

		revalidateTag(`etab_${tenantId}_dashboard`, "max");
		revalidateTag(`etab_${tenantId}_staff`, "max");

		return updatedUser;
	},
	{ requiredRole: MANAGEMENT_ROLES },
);

export const resetUserPasswordAction = createSafeAction(
	z.object({ id: z.string().uuid(), newPassword: z.string().min(8) }),
	async ({ id, newPassword }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const hashedPassword = await bcrypt.hash(newPassword, 12);

		return await tenantPrisma.user.update({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
			data: { password: hashedPassword },
			select: { id: true, email: true },
		});
	},
	{ requiredRole: MANAGEMENT_ROLES },
);

export const deleteUserAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId, userId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		// Garde : on ne supprime pas la cible si c'est le dernier GERANT actif
		// (sinon l'établissement se retrouve orphelin, sans compte pilote).
		const target = await tenantPrisma.user.findUnique({
			where: { id_etablissementId: { id, etablissementId: tenantId } },
			select: { id: true, role: true },
		});
		if (!target) {
			throw new TaysirError(
				"Utilisateur introuvable ou accès refusé.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}
		if (target.id === userId) {
			throw new TaysirError(
				"Utilisez la suppression de compte pour supprimer votre propre compte.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}
		if (target.role === "GERANT") {
			const otherActiveGerant = await tenantPrisma.user.findFirst({
				where: {
					role: "GERANT",
					status: "ACTIVE",
					etablissementId: tenantId,
					NOT: { id },
				},
				select: { id: true },
			});
			if (!otherActiveGerant) {
				throw new TaysirError(
					"Impossible de supprimer le dernier gérant actif de l'établissement.",
					ErrorCodes.ERR_FORBIDDEN,
					403,
				);
			}
		}

		const user = await tenantPrisma.user.delete({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
		});

		revalidateTag(`etab_${tenantId}_staff`, "max");
		return user;
	},
	{ requiredRole: MANAGEMENT_ROLES },
);
