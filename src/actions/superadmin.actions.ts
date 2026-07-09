"use server";

import { type Prisma, RoleUser } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { money } from "@/lib/money";
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
 * KPIs globaux de la plateforme, agrégés sur TOUS les établissements
 * (Réservé SUPER_ADMIN). C'est le seul périmètre où l'accès `prisma` brut
 * cross-tenant est légitime : le SUPER_ADMIN opère au niveau plateforme.
 */
export const getPlatformStatsAction = createSafeAction(
	z.object({}),
	async () => {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

		const [
			totalSchools,
			activeSchools,
			expiringSoon,
			newSchoolsThisMonth,
			totalStudents,
			activeStudents,
			totalStaff,
			revenueAgg,
			plansAgg,
		] = await Promise.all([
			prisma.etablissement.count(),
			prisma.etablissement.count({ where: { isActive: true } }),
			// Contrats arrivant à échéance dans les 30 jours (et pas déjà expirés).
			prisma.etablissement.count({
				where: { contractEndDate: { gte: now, lte: in30Days } },
			}),
			prisma.etablissement.count({ where: { createdAt: { gte: monthStart } } }),
			prisma.student.count(),
			prisma.student.count({ where: { isActive: true } }),
			prisma.user.count({ where: { role: { not: RoleUser.SUPER_ADMIN } } }),
			// Chiffre d'affaires encaissé (tous établissements confondus).
			prisma.paiement.aggregate({ _sum: { amount: true } }),
			// Facturé vs encaissé → reste à recouvrer sur la plateforme.
			prisma.paymentPlan.aggregate({
				_sum: { totalAmount: true, paidAmount: true },
			}),
		]);

		const totalBilled = money(plansAgg._sum.totalAmount);
		const totalCollected = money(plansAgg._sum.paidAmount);

		return {
			schools: {
				total: totalSchools,
				active: activeSchools,
				inactive: totalSchools - activeSchools,
				expiringSoon,
				newThisMonth: newSchoolsThisMonth,
			},
			people: {
				students: totalStudents,
				activeStudents,
				staff: totalStaff,
			},
			finance: {
				revenueCollected: money(revenueAgg._sum.amount),
				totalBilled,
				outstanding: Math.max(0, totalBilled - totalCollected),
				currency: "DZD",
			},
		};
	},
	{ requiredRole: RoleUser.SUPER_ADMIN },
);

/**
 * Réinitialise le mot de passe du gérant d'un établissement (Réservé SUPER_ADMIN).
 * Comble le cas « gérant verrouillé » sans devoir recréer l'établissement.
 */
export const resetGerantPasswordAction = createSafeAction(
	z.object({ tenantId: z.string().uuid(), newPassword: z.string().min(8) }),
	async ({ tenantId, newPassword }) => {
		const gerant = await prisma.user.findFirst({
			where: { etablissementId: tenantId, role: RoleUser.GERANT },
			orderBy: { createdAt: "asc" },
		});

		if (!gerant) {
			throw new TaysirError(
				"Aucun gérant trouvé pour cet établissement.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		const hashedPassword = await bcrypt.hash(newPassword, 12);
		await prisma.user.update({
			where: { id: gerant.id },
			data: { password: hashedPassword },
		});

		return { email: gerant.email };
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
		// Cast to the exact Prisma input type (not `any`): Zod `.optional()` yields
		// `T | undefined`, which exactOptionalPropertyTypes rejects against Prisma's
		// non-undefined field types even though Prisma skips `undefined` at runtime.
		const updateData = { ...data } as Prisma.EtablissementUpdateInput;
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
