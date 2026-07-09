"use server";

import crypto from "node:crypto";
import { type Prisma, StatusSession } from "@prisma/client";
import { addDays, addMonths, addWeeks } from "date-fns";
import { revalidateTag } from "next/cache";
import { z } from "zod";

// Plafond dur d'occurrences générées par une récurrence : évite qu'une
// `recurrenceEnd` très lointaine ne génère des milliers de séances (chaque
// itération exécute 3 requêtes de conflit → épuisement mémoire sur le VPS 1 Go).
const MAX_RECURRENCE_OCCURRENCES = 365;

// Détection de conflit de créneau réutilisable (création ET déplacement).
// `excludeId` exclut la séance en cours de modification pour qu'elle n'entre
// pas en conflit avec elle-même. Un chevauchement = start < finAutre ET
// end > débutAutre, uniquement parmi les séances SCHEDULED du tenant.
async function assertNoSlotConflict(
	client: ReturnType<typeof getTenantPrisma>,
	tenantId: string,
	params: {
		roomId: string;
		instructorId: string;
		groupId: string;
		start: Date;
		end: Date;
		excludeId?: string;
	},
) {
	const overlap = {
		startTime: { lt: params.end },
		endTime: { gt: params.start },
	};
	const notSelf = params.excludeId ? { id: { not: params.excludeId } } : {};
	const base = {
		etablissementId: tenantId,
		status: StatusSession.SCHEDULED,
		...notSelf,
		...overlap,
	};

	const roomConflict = await client.session.findFirst({
		where: { ...base, roomId: params.roomId },
		include: { room: true, group: true },
	});
	if (roomConflict) {
		throw new TaysirError(
			`Conflit Salle : La salle "${roomConflict.room.name}" est déjà occupée par le groupe "${roomConflict.group.name}" sur ce créneau (${params.start.toLocaleTimeString()} - ${params.end.toLocaleTimeString()}).`,
			ErrorCodes.ERR_INVALID_DATA,
			409,
		);
	}

	const instructorConflict = await client.session.findFirst({
		where: { ...base, instructorId: params.instructorId },
		include: { instructor: true },
	});
	if (instructorConflict) {
		throw new TaysirError(
			`Conflit Professeur : M. ${instructorConflict.instructor.lastName} a déjà un cours programmé sur ce créneau.`,
			ErrorCodes.ERR_INVALID_DATA,
			409,
		);
	}

	const groupConflict = await client.session.findFirst({
		where: { ...base, groupId: params.groupId },
		include: { group: true },
	});
	if (groupConflict) {
		throw new TaysirError(
			`Conflit Groupe : Le groupe "${groupConflict.group.name}" est déjà en séance sur ce créneau.`,
			ErrorCodes.ERR_INVALID_DATA,
			409,
		);
	}
}

import { createSafeAction, FRONTDESK_ROLES } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma } from "@/lib/prisma";
import { CreateSessionSchema } from "@/lib/validations";

export const getWeeklySessionsAction = createSafeAction(
	z.object({
		start: z.date(),
		end: z.date(),
		roomId: z.string().uuid().optional(),
		instructorId: z.string().uuid().optional(),
		groupId: z.string().uuid().optional(),
	}),
	async (filters, { tenantId, userId, role }) => {
		const client = getTenantPrisma(tenantId);

		// Un intervenant ne voit QUE ses propres séances : on force son id et on
		// ignore tout instructorId transmis (anti-usurpation).
		const scopedInstructorId =
			role === "INTERVENANT" ? userId : filters.instructorId;

		return await client.session.findMany({
			where: {
				etablissementId: tenantId,
				// Chevauchement (et non inclusion stricte) : une séance qui déborde
				// d'un bord de la fenêtre doit rester visible. overlap ⇔
				// startTime < fin ET endTime > début.
				startTime: { lt: filters.end },
				endTime: { gt: filters.start },
				...(filters.roomId ? { roomId: filters.roomId } : {}),
				...(scopedInstructorId ? { instructorId: scopedInstructorId } : {}),
				...(filters.groupId ? { groupId: filters.groupId } : {}),
			},
			include: {
				room: { select: { name: true, capacity: true } },
				activity: { select: { name: true, color: true } },
				group: { select: { name: true } },
				instructor: {
					select: { firstName: true, lastName: true, avatarUrl: true },
				},
			},
			orderBy: { startTime: "asc" },
		});
	},
);

export const getSessionAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		return await client.session.findUnique({
			where: { id, etablissementId: tenantId },
			include: {
				room: true,
				activity: true,
				group: true,
				instructor: {
					select: { firstName: true, lastName: true, avatarUrl: true },
				},
			},
		});
	},
);

export const createSessionAction = createSafeAction(
	CreateSessionSchema,
	async (data, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const checkConflict = (start: Date, end: Date) =>
			assertNoSlotConflict(client, tenantId, {
				roomId: data.roomId,
				instructorId: data.instructorId,
				groupId: data.groupId,
				start,
				end,
			});

		if (data.recurrenceType === "NONE" || !data.recurrenceEnd) {
			await checkConflict(data.startTime, data.endTime);
			const session = await client.session.create({
				data: {
					activityId: data.activityId,
					roomId: data.roomId,
					instructorId: data.instructorId,
					groupId: data.groupId,
					startTime: data.startTime,
					endTime: data.endTime,
					etablissementId: tenantId,
					status: StatusSession.SCHEDULED,
				},
				include: { room: true, activity: true, group: true, instructor: true },
			});

			revalidateTag(`etab_${tenantId}_schedule`, "max");
			revalidateTag(`etab_${tenantId}_dashboard`, "max");
			return session;
		}

		// Handle recurrence
		const sessionsToCreate = [];
		const recurrenceGroupId = crypto.randomUUID();
		const baseStart = new Date(data.startTime);
		const baseEnd = new Date(data.endTime);
		const recurrenceEnd = new Date(data.recurrenceEnd);
		// On dérive chaque occurrence depuis la date de BASE via addDays/Weeks/Months
		// (et non par mutation incrémentale) : addMonths clampe correctement les fins
		// de mois (31 janv. + 1 mois → 28/29 févr.) au lieu de déborder sur mars.
		const occurrenceAt = (index: number): { start: Date; end: Date } => {
			if (data.recurrenceType === "DAILY") {
				return {
					start: addDays(baseStart, index),
					end: addDays(baseEnd, index),
				};
			}
			if (data.recurrenceType === "WEEKLY") {
				return {
					start: addWeeks(baseStart, index),
					end: addWeeks(baseEnd, index),
				};
			}
			return {
				start: addMonths(baseStart, index),
				end: addMonths(baseEnd, index),
			};
		};

		for (let i = 0; i < MAX_RECURRENCE_OCCURRENCES; i++) {
			const { start, end } = occurrenceAt(i);
			if (start > recurrenceEnd) break;
			await checkConflict(start, end);
			sessionsToCreate.push({
				activityId: data.activityId,
				roomId: data.roomId,
				instructorId: data.instructorId,
				groupId: data.groupId,
				startTime: start,
				endTime: end,
				etablissementId: tenantId,
				status: StatusSession.SCHEDULED,
				recurrenceGroupId,
			});
		}

		const sessions = await client.session.createMany({
			data: sessionsToCreate,
		});

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		revalidateTag(`etab_${tenantId}_dashboard`, "max");

		return sessions;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const updateSessionAction = createSafeAction(
	z.object({
		id: z.string().uuid(),
		startTime: z.date().optional(),
		endTime: z.date().optional(),
		roomId: z.string().uuid().optional(),
		instructorId: z.string().uuid().optional(),
		groupId: z.string().uuid().optional(),
		activityId: z.string().uuid().optional(),
	}),
	async (data, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const { id, ...updateData } = data;

		// Déplacer une séance doit revalider les conflits (salle/prof/groupe) sur le
		// nouveau créneau, exactement comme la création. On charge l'état courant,
		// on fusionne les champs modifiés, puis on vérifie en s'excluant soi-même.
		const current = await client.session.findUnique({
			where: { id, etablissementId: tenantId },
			select: {
				startTime: true,
				endTime: true,
				roomId: true,
				instructorId: true,
				groupId: true,
			},
		});
		if (!current) {
			throw new TaysirError(
				"Séance introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		await assertNoSlotConflict(client, tenantId, {
			roomId: updateData.roomId ?? current.roomId,
			instructorId: updateData.instructorId ?? current.instructorId,
			groupId: updateData.groupId ?? current.groupId,
			start: updateData.startTime ?? current.startTime,
			end: updateData.endTime ?? current.endTime,
			excludeId: id,
		});

		const result = await client.session.update({
			where: { id, etablissementId: tenantId },
			// Zod `.optional()` yields `T | undefined`; under exactOptionalPropertyTypes
			// this is incompatible with Prisma's FK scalar input types even though
			// Prisma treats `undefined` as "skip field" at runtime.
			data: updateData as Prisma.SessionUncheckedUpdateInput,
		});

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const deleteSessionAction = createSafeAction(
	z.object({ id: z.string().uuid() }),
	async ({ id }, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const result = await client.session.delete({
			where: { id, etablissementId: tenantId },
		});

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const updateSeriesAction = createSafeAction(
	z.object({
		recurrenceGroupId: z.string(),
		startTime: z.date().optional(),
		endTime: z.date().optional(),
		roomId: z.string().uuid().optional(),
		instructorId: z.string().uuid().optional(),
		groupId: z.string().uuid().optional(),
		activityId: z.string().uuid().optional(),
		mode: z.enum(["FOLLOWING", "ALL"]),
		currentSessionId: z.string().uuid().optional(),
	}),
	async (data, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const currentSession = data.currentSessionId
			? await client.session.findUnique({
					where: { id: data.currentSessionId, etablissementId: tenantId },
				})
			: null;

		const whereClause: Prisma.SessionWhereInput = {
			recurrenceGroupId: data.recurrenceGroupId,
			etablissementId: tenantId,
		};

		if (data.mode === "FOLLOWING" && currentSession) {
			whereClause.startTime = { gte: currentSession.startTime };
		}

		// Si on change l'heure, on calcule le décalage (différence)
		let timeShift: { start: number; end: number } | null = null;
		if (data.startTime && data.endTime && currentSession) {
			timeShift = {
				start: data.startTime.getTime() - currentSession.startTime.getTime(),
				end: data.endTime.getTime() - currentSession.endTime.getTime(),
			};
		}

		const { mode, currentSessionId, startTime, endTime, ...baseUpdateData } =
			data;

		if (timeShift) {
			const shift = timeShift;
			// Update complexe : on doit boucler ou utiliser une raw query car Prisma ne supporte pas nativement l'addition de dates en updateMany
			const sessions = await client.session.findMany({ where: whereClause });
			const updates = sessions.map((s) =>
				client.session.update({
					where: { id: s.id },
					// `baseUpdateData` carries Zod-optional `T | undefined` FK fields which,
					// under exactOptionalPropertyTypes, are not assignable to Prisma's input
					// types despite `undefined` meaning "skip field" at runtime.
					data: {
						...baseUpdateData,
						startTime: new Date(s.startTime.getTime() + shift.start),
						endTime: new Date(s.endTime.getTime() + shift.end),
					} as Prisma.SessionUncheckedUpdateInput,
				}),
			);
			await Promise.all(updates);
		} else {
			await client.session.updateMany({
				where: whereClause,
				// See note above: Zod-optional `T | undefined` FK fields vs. Prisma input
				// types under exactOptionalPropertyTypes.
				data: baseUpdateData as Prisma.SessionUncheckedUpdateManyInput,
			});
		}

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		return { success: true };
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const deleteSeriesAction = createSafeAction(
	z.object({
		recurrenceGroupId: z.string(),
		mode: z.enum(["FOLLOWING", "ALL"]),
		currentSessionId: z.string().uuid().optional(),
	}),
	async (data, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const whereClause: Prisma.SessionWhereInput = {
			recurrenceGroupId: data.recurrenceGroupId,
			etablissementId: tenantId,
		};

		if (data.mode === "FOLLOWING" && data.currentSessionId) {
			const currentSession = await client.session.findUnique({
				where: { id: data.currentSessionId, etablissementId: tenantId },
			});
			if (currentSession) {
				whereClause.startTime = { gte: currentSession.startTime };
			}
		}

		const result = await client.session.deleteMany({
			where: whereClause,
		});

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);
