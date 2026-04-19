"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma, prisma } from "@/lib/prisma";
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
				...data,
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

		revalidatePath("/[locale]/dashboard/staff", "page");
		return user;
	},
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
			data: updateData,
			select: {
				id: true,
				email: true,
				role: true,
				status: true,
				...(role === "GERANT" ? { salary: true } : {}),
			},
		});

		revalidatePath("/[locale]/dashboard", "page");
		revalidatePath("/[locale]/dashboard/staff", "page");

		return updatedUser;
	},
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
);

export const deleteUserAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const user = await tenantPrisma.user.delete({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
		});

		revalidatePath("/[locale]/dashboard/staff", "page");
		return user;
	},
);
