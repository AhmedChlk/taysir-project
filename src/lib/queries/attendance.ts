import "server-only";

import type { PrismaClient } from "@prisma/client";
import { eachDayOfInterval, endOfWeek, isSameDay, startOfWeek } from "date-fns";

/**
 * Calcule le taux de présence par jour sur la semaine courante.
 * Retourne un tableau de 7 valeurs (0-100%) — une par jour de Lundi à Dimanche.
 *
 * Ce helper est partagé entre `src/services/api.ts` et `src/actions/dashboard.actions.ts`
 * pour éviter la duplication de logique (DRY — ARCH-01).
 */
export async function computeWeeklyAttendanceRatios(
	client: PrismaClient,
	tenantId?: string,
): Promise<number[]> {
	const now = new Date();
	const start = startOfWeek(now, { weekStartsOn: 1 });
	const end = endOfWeek(now, { weekStartsOn: 1 });

	const records = await client.attendanceRecord.findMany({
		where: {
			...(tenantId ? { etablissementId: tenantId } : {}),
			session: {
				startTime: { gte: start, lte: end },
			},
		},
		select: {
			status: true,
			session: { select: { startTime: true } },
		},
	});

	const days = eachDayOfInterval({ start, end });

	return days.map((day) => {
		const dayRecords = records.filter(
			(record: { session: { startTime: Date } }) =>
				isSameDay(record.session.startTime, day),
		);

		if (dayRecords.length === 0) return 0;

		const presentCount = dayRecords.filter(
			(record: { status: string }) =>
				record.status === "PRESENT" || record.status === "RETARD",
		).length;

		return Math.round((presentCount / dayRecords.length) * 100);
	});
}
