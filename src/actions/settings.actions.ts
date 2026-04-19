"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma, prisma } from "@/lib/prisma";

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
			throw new TaysirError(
				"Cet email est déjà utilisé par un autre compte.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const tenantPrisma = getTenantPrisma(tenantId);

		const updatedUser = await tenantPrisma.user.update({
			where: { id_etablissementId: { id: userId, etablissementId: tenantId } },
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
			},
		});

		revalidateTag(`etab_${tenantId}_settings`);
		return updatedUser;
	},
);

export const UpdateSchoolSchema = z.object({
	name: z.string().min(2),
	address: z.string().optional().nullable(),
	primaryColor: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional()
		.nullable(),
});

export const updateSchoolAction = createSafeAction(
	UpdateSchoolSchema,
	async (data, { tenantId, role }) => {
		if (role !== "GERANT" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
			throw new TaysirError(
				"Accès refusé : Permissions insuffisantes.",
				ErrorCodes.ERR_UNAUTHORIZED,
				403,
			);
		}

		const updatedSchool = await prisma.etablissement.update({
			where: { id: tenantId },
			data: {
				name: data.name,
				address: data.address ?? null,
				primaryColor: data.primaryColor ?? null,
			},
		});

		revalidateTag(`etab_${tenantId}_settings`);
		return updatedSchool;
	},
);

export const deleteAccountAction = createSafeAction(
	z.object({}),
	async (_, { userId, tenantId, role }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		// Guard : le dernier GERANT actif ne peut pas se supprimer
		if (role === "GERANT") {
			const otherActiveGerant = await tenantPrisma.user.findFirst({
				where: {
					role: "GERANT",
					status: "ACTIVE",
					etablissementId: tenantId,
					NOT: { id: userId },
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

		return await tenantPrisma.user.delete({
			where: { id_etablissementId: { id: userId, etablissementId: tenantId } },
		});
	},
);
