"use server";

import crypto from "node:crypto";
import { Prisma, StatusSession } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
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
	async (filters, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		return await client.session.findMany({
			where: {
				etablissementId: tenantId,
				startTime: { gte: filters.start },
				endTime: { lte: filters.end },
				...(filters.roomId ? { roomId: filters.roomId } : {}),
				...(filters.instructorId ? { instructorId: filters.instructorId } : {}),
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

		const checkConflict = async (start: Date, end: Date) => {
			const roomConflict = await client.session.findFirst({
				where: {
					etablissementId: tenantId,
					roomId: data.roomId,
					status: StatusSession.SCHEDULED,
					OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
				},
				include: { room: true, group: true },
			});

			if (roomConflict) {
				throw new TaysirError(
					`Conflit Salle : La salle "${roomConflict.room.name}" est déjà occupée par le groupe "${roomConflict.group.name}" sur ce créneau (${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}).`,
					ErrorCodes.ERR_INVALID_DATA,
					409,
				);
			}

			const instructorConflict = await client.session.findFirst({
				where: {
					etablissementId: tenantId,
					instructorId: data.instructorId,
					status: StatusSession.SCHEDULED,
					OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
				},
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
				where: {
					etablissementId: tenantId,
					groupId: data.groupId,
					status: StatusSession.SCHEDULED,
					OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
				},
				include: { group: true },
			});

			if (groupConflict) {
				throw new TaysirError(
					`Conflit Groupe : Le groupe "${groupConflict.group.name}" est déjà en séance sur ce créneau.`,
					ErrorCodes.ERR_INVALID_DATA,
					409,
				);
			}
		};

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
		const currentStart = new Date(data.startTime);
		const currentEnd = new Date(data.endTime);
		const recurrenceEnd = new Date(data.recurrenceEnd);

		while (currentStart <= recurrenceEnd) {
			await checkConflict(currentStart, currentEnd);
			sessionsToCreate.push({
				activityId: data.activityId,
				roomId: data.roomId,
				instructorId: data.instructorId,
				groupId: data.groupId,
				startTime: new Date(currentStart),
				endTime: new Date(currentEnd),
				etablissementId: tenantId,
				status: StatusSession.SCHEDULED,
				recurrenceGroupId,
			});

			if (data.recurrenceType === "DAILY") {
				currentStart.setDate(currentStart.getDate() + 1);
				currentEnd.setDate(currentEnd.getDate() + 1);
			} else if (data.recurrenceType === "WEEKLY") {
				currentStart.setDate(currentStart.getDate() + 7);
				currentEnd.setDate(currentEnd.getDate() + 7);
			} else if (data.recurrenceType === "MONTHLY") {
				currentStart.setMonth(currentStart.getMonth() + 1);
				currentEnd.setMonth(currentEnd.getMonth() + 1);
			}
		}

		const sessions = await client.session.createMany({
			data: sessionsToCreate,
		});

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		revalidateTag(`etab_${tenantId}_dashboard`, "max");

		return sessions;
	},
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
);
