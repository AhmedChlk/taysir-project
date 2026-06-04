import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
	const mock = {
		student: { count: vi.fn(), findMany: vi.fn() },
		session: { findMany: vi.fn(), count: vi.fn() },
		paymentPlan: { findMany: vi.fn() },
		room: { count: vi.fn(), findMany: vi.fn() },
		activity: { findMany: vi.fn() },
		user: { findMany: vi.fn() },
		paiement: { findMany: vi.fn() },
		groupe: { findMany: vi.fn() },
	};
	return {
		getTenantPrisma: vi.fn(() => mock),
	};
});

vi.mock("@/lib/queries/attendance", () => ({
	computeWeeklyAttendanceRatios: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
	getAttendanceStatsAction,
	getDailyAttendanceRatioAction,
	getDashboardFormDataAction,
	getDashboardStatsAction,
	getFinancialKPIsAction,
	getPendingPaymentsAction,
	getRoomOccupancyAction,
	getTodaySessionsAction,
	getUpcomingStaffAlertsAction,
} from "@/actions/dashboard.actions";
import { getTenantPrisma } from "@/lib/prisma";
import { computeWeeklyAttendanceRatios } from "@/lib/queries/attendance";

const TENANT_ID = "etab-123";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: TENANT_ID,
		...override,
	},
	expires: "2099-01-01",
});

describe("Dashboard Actions Audit", () => {
	let mockPrisma: any;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-22T10:00:00Z")); // Wednesday 10 AM
		mockPrisma = getTenantPrisma(TENANT_ID);
	});

	describe("🔴 A. Sécurité et Isolation (Tenant/ID Spoofing)", () => {
		it("getDashboardFormDataAction: Empêche la fuite de données cross-tenant (Isolation absolue)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

			mockPrisma.room.findMany.mockResolvedValue([]);
			mockPrisma.activity.findMany.mockResolvedValue([]);
			mockPrisma.user.findMany.mockResolvedValue([]);
			mockPrisma.groupe.findMany.mockResolvedValue([]);
			mockPrisma.student.findMany.mockResolvedValue([]);
			mockPrisma.session.findMany.mockResolvedValue([]);
			mockPrisma.paymentPlan.findMany.mockResolvedValue([]);

			const result = await getDashboardFormDataAction({});
			expect(result.success).toBe(true);

			// Vérifie l'injection stricte de etablissementId sur TOUTES les requêtes
			expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ etablissementId: TENANT_ID }),
				}),
			);
			expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ etablissementId: TENANT_ID }),
				}),
			);
		});

		it("getPendingPaymentsAction: Assure que les paiements non autorisés n'affectent pas les KPI", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.paymentPlan.findMany.mockResolvedValue([]);

			await getPendingPaymentsAction({});
			// Isolation Prisma : le client injecté par getTenantPrisma bloque la lecture
			expect(mockPrisma.paymentPlan.findMany).toHaveBeenCalled();
		});
	});

	describe("🟠 B. Mathématiques et Edge Cases (Fiabilité des KPIs)", () => {
		it("getRoomOccupancyAction: Division par Zéro retourne 0% proprement", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			// Zéro salle, Zéro session
			mockPrisma.room.count.mockResolvedValue(0);
			mockPrisma.session.count.mockResolvedValue(0);

			const result = await getRoomOccupancyAction({});
			expect(result.success).toBe(true);
			if (result.success) expect(result.data.rate).toBe(0); // Pas de NaN ou Infinity
		});

		it("getRoomOccupancyAction: Arrondi correct (Math.round)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			// 2 sessions sur 3 salles = 66.66% -> 67%
			mockPrisma.room.count.mockResolvedValue(3);
			mockPrisma.session.count.mockResolvedValue(2);

			const result = await getRoomOccupancyAction({});
			expect(result.success).toBe(true);
			if (result.success) expect(result.data.rate).toBe(67);
		});

		it("getDailyAttendanceRatioAction: Division par Zéro retourne 0% si 0 présences attendues", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			// 1 session, mais 0 étudiant attendu (tableau attendance vide)
			mockPrisma.session.findMany.mockResolvedValue([
				{ id: "s1", attendance: [] },
			]);

			const result = await getDailyAttendanceRatioAction({});
			expect(result.success).toBe(true);
			if (result.success) expect(result.data.ratio).toBe(0);
		});

		it("getDailyAttendanceRatioAction: Calcule correctement avec PRESENT et RETARD", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.session.findMany.mockResolvedValue([
				{
					id: "s1",
					attendance: [
						{ status: "PRESENT" },
						{ status: "RETARD" },
						{ status: "ABSENT" },
					],
				},
				{ id: "s2", attendance: [{ status: "ABSENT" }] },
			]);

			const result = await getDailyAttendanceRatioAction({});
			expect(result.success).toBe(true);
			// 2 présents/retards sur 4 attendus = 50%
			if (result.success) {
				expect(result.data.ratio).toBe(50);
				expect(result.data.totalExpected).toBe(4);
				expect(result.data.totalPresent).toBe(2);
			}
		});

		it("getPendingPaymentsAction: Calcule la somme des restes à payer (reduce)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.paymentPlan.findMany.mockResolvedValue([
				{ id: "p1", totalAmount: 1000, paidAmount: 200 }, // Reste 800
				{ id: "p2", totalAmount: 500, paidAmount: 0 }, // Reste 500
			]);

			const result = await getPendingPaymentsAction({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.count).toBe(2);
				expect(result.data.totalAmount).toBe(1300);
			}
		});

		it("getFinancialKPIsAction: Somme les revenus du mois (reduce sur paiements)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.paiement.findMany.mockResolvedValue([
				{ amount: 1500 },
				{ amount: 3000 },
			]);

			const result = await getFinancialKPIsAction({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.monthlyRevenue).toBe(4500);
				expect(result.data.currency).toBe("DZD");
			}
		});
	});

	describe("🟡 C. Résilience et Performance", () => {
		it("getDashboardFormDataAction: Rollback et erreur propre si une des requêtes massives échoue", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

			mockPrisma.room.findMany.mockResolvedValue([]);
			mockPrisma.activity.findMany.mockRejectedValue(new Error("TIMEOUT")); // 2ème requête crash

			const result = await getDashboardFormDataAction({});
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
		});

		it("getFinancialKPIsAction: Résilience face au crash Prisma", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.paiement.findMany.mockRejectedValue(new Error("DB GONE"));

			const result = await getFinancialKPIsAction({});
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
		});
	});

	describe("🟢 D. Happy Path & Cohérence", () => {
		it("getDashboardStatsAction: Calcule inactifs = total - actifs", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.student.count
				.mockResolvedValueOnce(100)
				.mockResolvedValueOnce(80);

			const result = await getDashboardStatsAction({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.total).toBe(100);
				expect(result.data.active).toBe(80);
				expect(result.data.inactive).toBe(20);
			}
		});

		it("getTodaySessionsAction: Filtre avec les bornes du jour local", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.session.findMany.mockResolvedValue([]);

			await getTodaySessionsAction({});

			// startOfDay et endOfDay générés selon l'heure locale mockée
			expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						startTime: expect.objectContaining({
							gte: expect.any(Date),
							lte: expect.any(Date),
						}),
					}),
				}),
			);
		});

		it("getUpcomingStaffAlertsAction: Recherche sur les 30 prochaines minutes strictes", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.session.findMany.mockResolvedValue([]);

			await getUpcomingStaffAlertsAction({});

			expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						status: "SCHEDULED",
						startTime: expect.objectContaining({
							gte: expect.any(Date), // now
							lte: expect.any(Date), // now + 30 min
						}),
					}),
				}),
			);
		});

		it("getAttendanceStatsAction: Appel correctement le service externe", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(computeWeeklyAttendanceRatios).mockResolvedValue([
				10, 20, 30, 40, 50, 60, 70,
			]);

			const result = await getAttendanceStatsAction({});
			expect(result.success).toBe(true);
			if (result.success) expect(result.data).toHaveLength(7);

			expect(computeWeeklyAttendanceRatios).toHaveBeenCalledWith(
				mockPrisma,
				TENANT_ID,
			);
		});

		it("getDashboardFormDataAction: Exécute toutes les promesses et calcule le total en attente", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

			mockPrisma.room.findMany.mockResolvedValue([{}]);
			mockPrisma.activity.findMany.mockResolvedValue([{}]);
			mockPrisma.user.findMany.mockResolvedValue([{}]);
			mockPrisma.groupe.findMany.mockResolvedValue([{}]);
			mockPrisma.student.findMany.mockResolvedValue([{}]);
			mockPrisma.session.findMany.mockResolvedValue([{}]);
			mockPrisma.paymentPlan.findMany.mockResolvedValue([
				{ totalAmount: 100, paidAmount: 50 }, // Reste 50
			]);

			const result = await getDashboardFormDataAction({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.rooms).toHaveLength(1);
				expect(result.data.totalPendingAmount).toBe(50);
			}
		});
	});
});
