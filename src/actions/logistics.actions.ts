"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
	ATTENDANCE_ROLES,
	createSafeAction,
	FRONTDESK_ROLES,
	MANAGEMENT_ROLES,
} from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma } from "@/lib/prisma";
import { stripUndefined } from "@/lib/utils/prisma-helpers";
import {
	ActivitySchema,
	BulkMarkPresenceSchema,
	CreateGroupSchema,
	MarkPresenceSchema,
	RoomSchema,
	UpdateGroupSchema,
} from "@/lib/validations";

export const createGroupAction = createSafeAction(
	CreateGroupSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.groupe.create({
			data: { ...data, etablissementId: tenantId },
		});
		revalidateTag(`groups-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const updateGroupAction = createSafeAction(
	UpdateGroupSchema,
	async ({ id, ...data }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.groupe.update({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
			data: { ...stripUndefined(data), etablissementId: tenantId },
		});
		revalidateTag(`groups-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const deleteGroupAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const exists = await tenantPrisma.groupe.findUnique({
			where: { id_etablissementId: { id, etablissementId: tenantId } },
		});
		if (!exists) {
			throw new TaysirError(
				"Groupe introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		// Vérifier si le groupe est utilisé dans des séances
		const hasSessions = await tenantPrisma.session.findFirst({
			where: { groupId: id, etablissementId: tenantId },
		});
		if (hasSessions) {
			throw new TaysirError(
				"Impossible de supprimer ce groupe car il est lié à des séances de cours existantes.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const result = await tenantPrisma.groupe.delete({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
		});
		revalidateTag(`groups-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const createRoomAction = createSafeAction(
	RoomSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.room.create({
			data: { ...stripUndefined(data), etablissementId: tenantId },
		});
		revalidateTag(`rooms-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const updateRoomAction = createSafeAction(
	RoomSchema.extend({ id: z.string().uuid() }),
	async ({ id, ...data }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.room.update({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
			data: { ...stripUndefined(data), etablissementId: tenantId },
		});
		revalidateTag(`rooms-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const deleteRoomAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const exists = await tenantPrisma.room.findUnique({
			where: { id_etablissementId: { id, etablissementId: tenantId } },
		});
		if (!exists) {
			throw new TaysirError(
				"Salle introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		// Vérifier si la salle est utilisée dans des séances
		const hasSessions = await tenantPrisma.session.findFirst({
			where: { roomId: id, etablissementId: tenantId },
		});
		if (hasSessions) {
			throw new TaysirError(
				"Impossible de supprimer cette salle car elle est utilisée dans des séances de cours planifiées.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const result = await tenantPrisma.room.delete({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
		});
		revalidateTag(`rooms-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const createActivityAction = createSafeAction(
	ActivitySchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.activity.create({
			data: { ...stripUndefined(data), etablissementId: tenantId },
		});
		revalidateTag(`activities-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: MANAGEMENT_ROLES },
);

export const updateActivityAction = createSafeAction(
	ActivitySchema.extend({ id: z.string().uuid() }),
	async ({ id, ...data }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const result = await tenantPrisma.activity.update({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
			data: { ...stripUndefined(data), etablissementId: tenantId },
		});
		revalidateTag(`activities-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: MANAGEMENT_ROLES },
);

export const deleteActivityAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const exists = await tenantPrisma.activity.findUnique({
			where: { id_etablissementId: { id, etablissementId: tenantId } },
		});
		if (!exists) {
			throw new TaysirError(
				"Activité introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		// Vérifier si l'activité est utilisée
		const hasSessions = await tenantPrisma.session.findFirst({
			where: { activityId: id, etablissementId: tenantId },
		});
		const hasPaymentPlans = await tenantPrisma.paymentPlan.findFirst({
			where: { activityId: id, etablissementId: tenantId },
		});

		if (hasSessions || hasPaymentPlans) {
			throw new TaysirError(
				"Impossible de supprimer cette activité car elle est liée à des séances ou des plans de paiement.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const result = await tenantPrisma.activity.delete({
			where: {
				id_etablissementId: {
					id,
					etablissementId: tenantId,
				},
			},
		});
		revalidateTag(`activities-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: MANAGEMENT_ROLES },
);

export const markPresenceAction = createSafeAction(
	MarkPresenceSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const seance = await tenantPrisma.session.findUnique({
			where: {
				id_etablissementId: {
					id: data.seanceId,
					etablissementId: tenantId,
				},
			},
			select: { groupId: true },
		});
		if (!seance) {
			throw new TaysirError(
				"Séance introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		// Intégrité : l'élève doit exister DANS ce tenant ET être inscrit au groupe
		// de la séance. `Student.id` est une PK globale ; sans ce contrôle on pourrait
		// écrire une présence pour l'élève d'un autre établissement ou hors-groupe.
		const enrolled = await tenantPrisma.student.findFirst({
			where: {
				id: data.participantId,
				etablissementId: tenantId,
				groups: { some: { id: seance.groupId } },
			},
			select: { id: true },
		});
		if (!enrolled) {
			throw new TaysirError(
				"Élève introuvable ou non inscrit au groupe de cette séance.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const result = await tenantPrisma.attendanceRecord.upsert({
			where: {
				sessionId_studentId_etablissementId: {
					sessionId: data.seanceId,
					studentId: data.participantId,
					etablissementId: tenantId,
				},
			},
			create: {
				status: data.statut,
				retardMinutes: data.retard ?? 0,
				...(data.note !== undefined ? { note: data.note } : {}),
				sessionId: data.seanceId,
				studentId: data.participantId,
				etablissementId: tenantId,
			},
			update: {
				status: data.statut,
				retardMinutes: data.retard ?? 0,
				...(data.note !== undefined ? { note: data.note } : {}),
				etablissementId: tenantId,
			},
		});

		revalidateTag(`attendance-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: ATTENDANCE_ROLES },
);

export const bulkMarkPresenceAction = createSafeAction(
	BulkMarkPresenceSchema,
	async ({ sessionId, records }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		// La séance doit appartenir au tenant (non vérifié auparavant).
		const seance = await tenantPrisma.session.findUnique({
			where: {
				id_etablissementId: { id: sessionId, etablissementId: tenantId },
			},
			select: { groupId: true },
		});
		if (!seance) {
			throw new TaysirError(
				"Séance introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		// Tous les élèves pointés doivent être inscrits au groupe de la séance
		// (empêche l'écriture de présences cross-tenant ou hors-groupe).
		const enrolled = await tenantPrisma.student.findMany({
			where: {
				etablissementId: tenantId,
				groups: { some: { id: seance.groupId } },
			},
			select: { id: true },
		});
		const enrolledIds = new Set(enrolled.map((s) => s.id));
		const intrus = records.find((r) => !enrolledIds.has(r.studentId));
		if (intrus) {
			throw new TaysirError(
				"Un ou plusieurs élèves ne sont pas inscrits au groupe de cette séance.",
				ErrorCodes.ERR_INVALID_DATA,
				400,
			);
		}

		const result = await tenantPrisma.$transaction(
			records.map((record) =>
				tenantPrisma.attendanceRecord.upsert({
					where: {
						sessionId_studentId_etablissementId: {
							sessionId,
							studentId: record.studentId,
							etablissementId: tenantId,
						},
					},
					create: {
						sessionId,
						etablissementId: tenantId,
						studentId: record.studentId,
						status: record.status,
						note: record.note ?? null,
					},
					update: {
						status: record.status,
						note: record.note ?? null,
						etablissementId: tenantId,
					},
				}),
			),
		);

		revalidateTag(`attendance-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: ATTENDANCE_ROLES },
);
