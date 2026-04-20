import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { computeWeeklyAttendanceRatios } from "@/lib/queries/attendance";

const makePrismaClient = (
	records: { status: string; session: { startTime: Date } }[],
) =>
	({
		attendanceRecord: {
			findMany: vi.fn().mockResolvedValue(records),
		},
	}) as never;

describe("computeWeeklyAttendanceRatios", () => {
	it("retourne 7 zéros si aucune présence cette semaine", async () => {
		const client = makePrismaClient([]);
		const result = await computeWeeklyAttendanceRatios(client);
		expect(result).toHaveLength(7);
		expect(result.every((v) => v === 0)).toBe(true);
	});

	it("calcule 100% pour un jour où tous les élèves sont PRESENT", async () => {
		const monday = getThisWeekMonday();
		const records = [
			{ status: "PRESENT", session: { startTime: monday } },
			{ status: "PRESENT", session: { startTime: monday } },
		];
		const client = makePrismaClient(records);
		const result = await computeWeeklyAttendanceRatios(client);
		expect(result[0]).toBe(100);
	});

	it("inclut RETARD dans les présents", async () => {
		const monday = getThisWeekMonday();
		const records = [
			{ status: "PRESENT", session: { startTime: monday } },
			{ status: "RETARD", session: { startTime: monday } },
			{ status: "ABSENT", session: { startTime: monday } },
		];
		const client = makePrismaClient(records);
		const result = await computeWeeklyAttendanceRatios(client);
		// 2 présents (PRESENT + RETARD) sur 3 = 67%
		expect(result[0]).toBe(67);
	});

	it("retourne 0 pour un jour avec seulement des ABSENT", async () => {
		const tuesday = addDays(getThisWeekMonday(), 1);
		const records = [{ status: "ABSENT", session: { startTime: tuesday } }];
		const client = makePrismaClient(records);
		const result = await computeWeeklyAttendanceRatios(client);
		expect(result[1]).toBe(0);
	});

	it("passe le tenantId dans le where", async () => {
		const mockFindMany = vi.fn().mockResolvedValue([]);
		const client = {
			attendanceRecord: { findMany: mockFindMany },
		} as never;

		await computeWeeklyAttendanceRatios(client, "etab-test");
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-test" }),
			}),
		);
	});

	it("n'inclut pas etablissementId si tenantId absent", async () => {
		const mockFindMany = vi.fn().mockResolvedValue([]);
		const client = {
			attendanceRecord: { findMany: mockFindMany },
		} as never;

		await computeWeeklyAttendanceRatios(client);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.not.objectContaining({
					etablissementId: expect.anything(),
				}),
			}),
		);
	});

	it("retourne des pourcentages entiers (Math.round)", async () => {
		const monday = getThisWeekMonday();
		// 2 sur 3 = 66.66% → arrondi à 67%
		const records = [
			{ status: "PRESENT", session: { startTime: monday } },
			{ status: "PRESENT", session: { startTime: monday } },
			{ status: "ABSENT", session: { startTime: monday } },
		];
		const client = makePrismaClient(records);
		const result = await computeWeeklyAttendanceRatios(client);
		expect(Number.isInteger(result[0])).toBe(true);
		expect(result[0]).toBe(67);
	});
});

// Helpers
function getThisWeekMonday(): Date {
	const now = new Date();
	const day = now.getDay(); // 0=Sun, 1=Mon...
	const diff = day === 0 ? -6 : 1 - day;
	const monday = new Date(now);
	monday.setDate(now.getDate() + diff);
	monday.setHours(10, 0, 0, 0);
	return monday;
}

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}
