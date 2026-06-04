import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { PrismaClient } from "@prisma/client";
import { addDays, startOfWeek } from "date-fns";
import { computeWeeklyAttendanceRatios } from "@/lib/queries/attendance";

const makePrismaClient = (records: any[], findManyMock?: any) =>
	({
		attendanceRecord: {
			findMany: findManyMock || vi.fn().mockResolvedValue(records),
		},
	}) as unknown as PrismaClient;

// Helpers pour générer des dates de la semaine en cours
const now = new Date();
const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
currentMonday.setHours(10, 0, 0, 0);

describe("computeWeeklyAttendanceRatios Audit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("🔴 A. Sécurité et Isolation (Tenant/ID Spoofing)", () => {
		it("passe le tenantId dans le where pour isoler les requêtes", async () => {
			const mockFindMany = vi.fn().mockResolvedValue([]);
			const client = makePrismaClient([], mockFindMany);

			await computeWeeklyAttendanceRatios(client, "etab-secure-123");

			expect(mockFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						etablissementId: "etab-secure-123",
					}),
				}),
			);
		});

		it("n'inclut pas etablissementId si tenantId est absent (comportement GLOBAL)", async () => {
			const mockFindMany = vi.fn().mockResolvedValue([]);
			const client = makePrismaClient([], mockFindMany);

			await computeWeeklyAttendanceRatios(client);

			const callArgs = mockFindMany.mock.calls[0]![0];
			expect(callArgs.where).not.toHaveProperty("etablissementId");
		});
	});

	describe("🟠 B. Mathématiques et Edge Cases", () => {
		it("Division par Zéro : retourne 0% si aucune présence n'est trouvée pour la semaine", async () => {
			const client = makePrismaClient([]);
			const result = await computeWeeklyAttendanceRatios(client);

			expect(result).toHaveLength(7);
			expect(result.every((v) => v === 0)).toBe(true);
		});

		it("Précision des Arrondis : arrondi mathématique standard (Math.round)", async () => {
			// 2 présents sur 3 = 66.666...% -> 67%
			const records = [
				{ status: "PRESENT", session: { startTime: currentMonday } },
				{ status: "PRESENT", session: { startTime: currentMonday } },
				{ status: "ABSENT", session: { startTime: currentMonday } },
			];
			const client = makePrismaClient(records);
			const result = await computeWeeklyAttendanceRatios(client);

			expect(Number.isInteger(result[0])).toBe(true);
			expect(result[0]).toBe(67);
		});

		it("Données Incomplètes : gère les statuts inattendus ou nuls comme des absences", async () => {
			const tuesday = addDays(currentMonday, 1);
			const records = [
				{ status: "PRESENT", session: { startTime: tuesday } },
				{ status: null, session: { startTime: tuesday } },
				{ status: "UNKNOWN_STATUS", session: { startTime: tuesday } },
				{ status: undefined, session: { startTime: tuesday } },
			];
			const client = makePrismaClient(records);
			const result = await computeWeeklyAttendanceRatios(client);

			// 1 présent sur 4 = 25%
			expect(result[1]).toBe(25);
		});

		it("Périodes Extrêmes : Gère correctement le passage d'une année à l'autre (Leap Year/NYE)", async () => {
			// On fixe la date au 31 Décembre 2024 (Mardi)
			const nye = new Date("2024-12-31T12:00:00Z");
			vi.setSystemTime(nye);

			const client = makePrismaClient([
				{
					status: "PRESENT",
					session: { startTime: new Date("2024-12-31T10:00:00Z") },
				}, // Mardi 31 Déc
				{
					status: "PRESENT",
					session: { startTime: new Date("2025-01-01T10:00:00Z") },
				}, // Mercredi 1 Jan
			]);

			const result = await computeWeeklyAttendanceRatios(client);
			expect(result).toHaveLength(7);
			expect(result[1]).toBe(100); // Mardi
			expect(result[2]).toBe(100); // Mercredi
		});
	});

	describe("🟡 C. Résilience et Performance", () => {
		it("Performance : calcule 10,000 enregistrements sans dépasser la pile", async () => {
			const massiveRecords = Array.from({ length: 10000 }).map((_, i) => ({
				status: i % 2 === 0 ? "PRESENT" : "ABSENT",
				session: { startTime: currentMonday },
			}));

			const client = makePrismaClient(massiveRecords);
			const start = performance.now();
			const result = await computeWeeklyAttendanceRatios(client);
			const duration = performance.now() - start;

			expect(result[0]).toBe(50); // 50% de présents
			expect(duration).toBeLessThan(1000); // Moins d'une seconde
		});

		it("Crash Prisma : remonte l'erreur proprement si la DB échoue", async () => {
			const mockFindMany = vi.fn().mockRejectedValue(new Error("DB CRASH"));
			const client = makePrismaClient([], mockFindMany);

			await expect(computeWeeklyAttendanceRatios(client)).rejects.toThrow(
				"DB CRASH",
			);
		});
	});

	describe("🟢 D. Happy Path & Inclusions", () => {
		it("inclut RETARD et PRESENT comme présences", async () => {
			const records = [
				{ status: "PRESENT", session: { startTime: currentMonday } },
				{ status: "RETARD", session: { startTime: currentMonday } },
				{ status: "ABSENT", session: { startTime: currentMonday } },
				{ status: "EXCUSED", session: { startTime: currentMonday } },
			];
			const client = makePrismaClient(records);
			const result = await computeWeeklyAttendanceRatios(client);

			// 2 présents (PRESENT + RETARD) sur 4 = 50%
			expect(result[0]).toBe(50);
		});
	});
});
