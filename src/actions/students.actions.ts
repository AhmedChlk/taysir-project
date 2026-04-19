"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma } from "@/lib/prisma";
import {
	CreateDocumentSchema,
	CreateStudentSchema,
	UpdateStudentSchema,
} from "@/lib/validations";

export const addDocumentToStudentAction = createSafeAction(
	CreateDocumentSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const document = await tenantPrisma.document.create({
			data: {
				...data,
				etablissementId: tenantId,
				status: "APPROVED",
			},
		});
		revalidatePath("/[locale]/dashboard/students/[id]", "page");
		return document;
	},
);

export const createStudentAction = createSafeAction(
	CreateStudentSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const { groupIds, ...studentData } = data;

		if (groupIds && groupIds.length > 0) {
			const validGroups = await tenantPrisma.groupe.findMany({
				where: { id: { in: groupIds } },
			});
			if (validGroups.length !== groupIds.length) {
				throw new TaysirError(
					"Certains groupes spécifiés n'existent pas.",
					ErrorCodes.ERR_NOT_FOUND,
				);
			}
		}

		const cleanedData = {
			...studentData,
			email: studentData.email || null,
			phone: studentData.phone || null,
			parentName: studentData.parentName || null,
			parentPhone: studentData.parentPhone || null,
			parentEmail: studentData.parentEmail || null,
			address: studentData.address || null,
			photoUrl: studentData.photoUrl || null,
		};

		const student = await tenantPrisma.student.create({
			data: {
				...cleanedData,
				groups:
					groupIds && groupIds.length > 0
						? { connect: groupIds.map((id) => ({ id })) }
						: undefined,
			},
		});

		revalidateTag(`students-${tenantId}`, "max");
		revalidatePath("/[locale]/dashboard", "page");
		revalidatePath("/[locale]/dashboard/students", "page");
		return student;
	},
);

export const updateStudentAction = createSafeAction(
	UpdateStudentSchema,
	async ({ id, groupIds, ...data }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		if (groupIds && groupIds.length > 0) {
			const validGroups = await tenantPrisma.groupe.findMany({
				where: { id: { in: groupIds } },
			});
			if (validGroups.length !== groupIds.length) {
				throw new TaysirError(
					"Certains groupes spécifiés n'existent pas.",
					ErrorCodes.ERR_NOT_FOUND,
				);
			}
		}

		const cleanedData = {
			...data,
			email: data.email || null,
			phone: data.phone || null,
			parentName: data.parentName || null,
			parentPhone: data.parentPhone || null,
			parentEmail: data.parentEmail || null,
			address: data.address || null,
			photoUrl: data.photoUrl || null,
		};

		const result = await tenantPrisma.student.update({
			where: { id },
			data: {
				...cleanedData,
				groups: {
					set: groupIds?.map((id) => ({ id })) || [],
				},
			},
		});

		revalidateTag(`students-${tenantId}`, "max");
		revalidatePath("/[locale]/dashboard", "page");
		revalidatePath("/[locale]/dashboard/students", "page");
		return result;
	},
);

export const deleteStudentAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const result = await tenantPrisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// 1. Vérifier si l'élève existe (sans filtre d'établissement pour trouver l'ID unique)
				const student = await tx.student.findUnique({
					where: { id },
				});

				if (!student) {
					throw new TaysirError(
						"Élève introuvable.",
						ErrorCodes.ERR_NOT_FOUND,
						404,
					);
				}

				// 2. Sécurité : vérifier que l'admin appartient au même établissement ou est superadmin
				if (
					tenantId !== "SUPERADMIN_ACCESS" &&
					student.etablissementId !== tenantId
				) {
					throw new TaysirError(
						"Accès refusé : Vous ne pouvez pas supprimer un élève d'un autre établissement.",
						ErrorCodes.ERR_UNAUTHORIZED,
						403,
					);
				}

				// 3. Nettoyage des relations (Bottom-up pour éviter les erreurs de clés étrangères)
				const paymentPlans = await tx.paymentPlan.findMany({
					where: { studentId: id },
					select: { id: true },
				});
				const paymentPlanIds = paymentPlans.map((p) => p.id);

				if (paymentPlanIds.length > 0) {
					const tranches = await tx.tranche.findMany({
						where: { paymentPlanId: { in: paymentPlanIds } },
						select: { id: true },
					});
					const trancheIds = tranches.map((t) => t.id);

					if (trancheIds.length > 0) {
						await tx.paiement.deleteMany({
							where: { trancheId: { in: trancheIds } },
						});
					}

					await tx.tranche.deleteMany({
						where: { paymentPlanId: { in: paymentPlanIds } },
					});

					await tx.paymentPlan.deleteMany({
						where: { studentId: id },
					});
				}

				await tx.document.deleteMany({
					where: { studentId: id },
				});

				await tx.attendanceRecord.deleteMany({
					where: { studentId: id },
				});

				// 4. Suppression finale de l'élève
				return await tx.student.delete({
					where: { id },
				});
			},
		);

		// 5. Revalidation forcée du cache
		const revalTenantId =
			tenantId === "SUPERADMIN_ACCESS" ? result.etablissementId : tenantId;
		revalidateTag(`students-${revalTenantId}`, "max");
		revalidatePath("/[locale]/dashboard", "page");
		revalidatePath("/[locale]/dashboard/students", "page");

		return result;
	},
);

export const addStudentToGroupAction = createSafeAction(
	z.object({ studentId: z.string().uuid(), groupId: z.string().uuid() }),
	async ({ studentId, groupId }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.groupe.update({
			where: { id: groupId, etablissementId: tenantId },
			data: { students: { connect: { id: studentId } } },
		});
		revalidatePath("/[locale]/dashboard/groups", "page");
		return result;
	},
);

export const removeStudentFromGroupAction = createSafeAction(
	z.object({ studentId: z.string().uuid(), groupId: z.string().uuid() }),
	async ({ studentId, groupId }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.groupe.update({
			where: { id: groupId, etablissementId: tenantId },
			data: { students: { disconnect: { id: studentId } } },
		});
		revalidatePath("/[locale]/dashboard/groups", "page");
		return result;
	},
);

export const getStudentFullProfileAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		return await client.student.findUnique({
			where: { id, etablissementId: tenantId },
			include: {
				groups: true,
				documents: true,
				attendance: {
					include: { session: { include: { activity: true } } },
					orderBy: { createdAt: "desc" },
					take: 20,
				},
				paymentPlans: {
					include: {
						activity: true,
						tranches: {
							include: { paiements: true },
							orderBy: { dueDate: "asc" },
						},
					},
				},
			},
		});
	},
);
