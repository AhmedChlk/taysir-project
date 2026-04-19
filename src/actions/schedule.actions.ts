"use server";

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

export const createSessionAction = createSafeAction(
	CreateSessionSchema,
	async (data, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const roomConflict = await client.session.findFirst({
			where: {
				etablissementId: tenantId,
				roomId: data.roomId,
				status: "SCHEDULED",
				OR: [
					{ startTime: { lt: data.endTime }, endTime: { gt: data.startTime } },
				],
			},
			include: { room: true, group: true },
		});

		if (roomConflict) {
			throw new TaysirError(
				`Conflit Salle : La salle "${roomConflict.room.name}" est déjà occupée par le groupe "${roomConflict.group.name}" sur ce créneau.`,
				ErrorCodes.ERR_INVALID_DATA,
				409,
			);
		}

		const instructorConflict = await client.session.findFirst({
			where: {
				etablissementId: tenantId,
				instructorId: data.instructorId,
				status: "SCHEDULED",
				OR: [
					{ startTime: { lt: data.endTime }, endTime: { gt: data.startTime } },
				],
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
				status: "SCHEDULED",
				OR: [
					{ startTime: { lt: data.endTime }, endTime: { gt: data.startTime } },
				],
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

		const session = await client.session.create({
			data: {
				...data,
				etablissementId: tenantId,
				status: "SCHEDULED",
			},
			include: {
				room: true,
				activity: true,
				group: true,
				instructor: true,
			},
		});

		revalidateTag(`etab_${tenantId}_schedule`, "max");
		revalidateTag(`etab_${tenantId}_dashboard`, "max");

		return session;
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
