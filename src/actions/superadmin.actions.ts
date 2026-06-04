"use server";

import { RoleUser } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const CreateTenantSchema = z.object({
	name: z.string().min(2),
	slug: z
		.string()
		.min(2)
		.transform((val) => val.toLowerCase().trim().replace(/\s+/g, "-")),
	primaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	contractEndDate: z.string().optional(),
	manager: z.object({
		email: z.string().email(),
		firstName: z.string().min(2),
		lastName: z.string().min(2),
		password: z.string().min(8),
	}),
});

/**
 * Liste tous les établissements (Réservé SUPER_ADMIN)
 */
export const getAllTenantsAction = createSafeAction(
	z.object({}),
	async () => {
		return await prisma.etablissement.findMany({
			include: {
				_count: {
					select: { users: true, students: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	},
	{ requiredRole: RoleUser.SUPER_ADMIN },
);

/**
 * Création d'un nouvel établissement + Premier Gérant (Réservé SUPER_ADMIN)
 */
export const createTenantAction = createSafeAction(
	CreateTenantSchema,
	async (data) => {
		const existing = await prisma.etablissement.findUnique({
			where: { slug: data.slug },
		});

		if (existing) {
			throw new TaysirError(
				"Ce slug est déjà utilisé.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const existingUser = await prisma.user.findUnique({
			where: { email: data.manager.email },
		});

		if (existingUser) {
			throw new TaysirError(
				"Un utilisateur possède déjà cet email.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const hashedPassword = await bcrypt.hash(data.manager.password, 10);

		const result = await prisma.$transaction(async (tx) => {
			const tenant = await tx.etablissement.create({
				data: {
					name: data.name,
					slug: data.slug,
					primaryColor: data.primaryColor || "#0F515C",
					isActive: true,
					contractEndDate: data.contractEndDate
						? new Date(data.contractEndDate)
						: null,
				},
			});

			await tx.user.create({
				data: {
					email: data.manager.email,
					firstName: data.manager.firstName,
					lastName: data.manager.lastName,
					password: hashedPassword,
					role: RoleUser.GERANT,
					etablissementId: tenant.id,
				},
			});

			return { tenant };
		});

		revalidateTag("superadmin_tenants", "max");
		revalidateTag("superadmin_stats", "max");
		return result;
	},
	{ requiredRole: RoleUser.SUPER_ADMIN },
);

/**
 * Activer / Désactiver un établissement
 */
export const toggleTenantStatusAction = createSafeAction(
	z.object({ id: z.string().uuid(), isActive: z.boolean() }),
	async ({ id, isActive }) => {
		const result = await prisma.etablissement.update({
			where: { id },
			data: { isActive },
		});

		revalidateTag("superadmin_tenants", "max");
		revalidateTag("superadmin_stats", "max");
		return result;
	},
	{ requiredRole: RoleUser.SUPER_ADMIN },
);

/**
 * Mise à jour d'un établissement
 */
export const updateTenantAction = createSafeAction(
	z.object({
		id: z.string().uuid(),
		name: z.string().min(2).optional(),
		slug: z
			.string()
			.min(2)
			.regex(/^[a-z0-9-]+$/)
			.optional(),
		primaryColor: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.optional(),
		contractEndDate: z.string().optional(),
	}),
	async ({ id, ...data }) => {
		const updateData: any = { ...data };
		if (data.contractEndDate) {
			updateData.contractEndDate = new Date(data.contractEndDate);
		}

		const result = await prisma.etablissement.update({
			where: { id },
			data: updateData,
		});

		revalidateTag("superadmin_tenants", "max");
		return result;
	},
	{ requiredRole: RoleUser.SUPER_ADMIN },
);

/**
 * Suppression d'un établissement
 */
export const deleteTenantAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }) => {
		const result = await prisma.etablissement.delete({
			where: { id },
		});

		revalidateTag("superadmin_tenants", "max");
		revalidateTag("superadmin_stats", "max");
		return result;
	},
	{ requiredRole: RoleUser.SUPER_ADMIN },
);
