import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	getTenantPrisma: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("@/lib/queries/attendance", () => ({
	computeWeeklyAttendanceRatios: vi
		.fn()
		.mockResolvedValue([80, 90, 70, 85, 60, 0, 0]),
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

const makeSession = (override = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-abc",
		...override,
	},
	expires: "2099-01-01",
});

describe("getDashboardStatsAction — isolation tenant MT-01", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les stats pour le bon tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCount = vi
			.fn()
			.mockResolvedValueOnce(42)
			.mockResolvedValueOnce(38);
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { count: mockCount },
		} as never);

		const result = await getDashboardStatsAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.total).toBe(42);
			expect(result.data.active).toBe(38);
		}

		// Vérifie que getTenantPrisma a été appelé avec le bon tenantId
		expect(getTenantPrisma).toHaveBeenCalledWith("etab-abc");
	});

	it("retourne erreur si pas de session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await getDashboardStatsAction({});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});

	it("passe etablissementId dans le where du count total", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCount = vi
			.fn()
			.mockResolvedValueOnce(10)
			.mockResolvedValueOnce(8);
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { count: mockCount },
		} as never);

		await getDashboardStatsAction({});

		// Premier appel : count total — doit inclure etablissementId
		expect(mockCount).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
		// Deuxième appel : count actifs — doit inclure etablissementId + isActive
		expect(mockCount).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				where: expect.objectContaining({
					etablissementId: "etab-abc",
					isActive: true,
				}),
			}),
		);
	});
});

describe("getPendingPaymentsAction — isolation tenant MT-01", () => {
	beforeEach(() => vi.clearAllMocks());

	it("appelle findMany avec le bon tenantId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([]);
		vi.mocked(getTenantPrisma).mockReturnValue({
			paymentPlan: { findMany: mockFindMany },
		} as never);

		await getPendingPaymentsAction({});
		expect(getTenantPrisma).toHaveBeenCalledWith("etab-abc");
		// Vérifie que etablissementId est dans le where
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});

	it("calcule le montant total en attente correctement", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockPlans = [
			{ totalAmount: 10000, paidAmount: 3000 },
			{ totalAmount: 5000, paidAmount: 5000 },
			{ totalAmount: 8000, paidAmount: 2000 },
		];
		const mockFindMany = vi.fn().mockResolvedValue(mockPlans);
		vi.mocked(getTenantPrisma).mockReturnValue({
			paymentPlan: { findMany: mockFindMany },
		} as never);

		const result = await getPendingPaymentsAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.count).toBe(3);
			// (10000-3000) + (5000-5000) + (8000-2000) = 7000 + 0 + 6000 = 13000
			expect(result.data.totalAmount).toBe(13000);
		}
	});
});

describe("getTodaySessionsAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les sessions du jour avec filtre etablissementId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const sessions = [{ id: "s1", startTime: new Date() }];
		const mockFindMany = vi.fn().mockResolvedValue(sessions);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findMany: mockFindMany },
		} as never);

		const result = await getTodaySessionsAction({});
		expect(result.success).toBe(true);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});

	it("retourne erreur sans session auth", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await getTodaySessionsAction({});
		expect(result.success).toBe(false);
	});
});

describe("getAttendanceStatsAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("délègue à computeWeeklyAttendanceRatios", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await getAttendanceStatsAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(Array.isArray(result.data)).toBe(true);
			expect(result.data).toHaveLength(7);
		}
	});
});

describe("getRoomOccupancyAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("calcule le taux d'occupation des salles", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCount = vi
			.fn()
			.mockResolvedValueOnce(10)
			.mockResolvedValueOnce(3);
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { count: mockCount },
			session: { count: mockCount },
		} as never);

		const result = await getRoomOccupancyAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.totalRooms).toBe(10);
			expect(result.data.occupiedRooms).toBe(3);
			expect(result.data.rate).toBe(30);
		}
	});

	it("retourne rate=0 si aucune salle", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCount = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(0);
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { count: mockCount },
			session: { count: mockCount },
		} as never);

		const result = await getRoomOccupancyAction({});
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.rate).toBe(0);
	});
});

describe("getDailyAttendanceRatioAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("calcule le ratio présence journalière", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const sessions = [
			{
				id: "s1",
				attendance: [
					{ status: "PRESENT" },
					{ status: "RETARD" },
					{ status: "ABSENT" },
				],
			},
		];
		const mockFindMany = vi.fn().mockResolvedValue(sessions);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findMany: mockFindMany },
		} as never);

		const result = await getDailyAttendanceRatioAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.totalExpected).toBe(3);
			expect(result.data.totalPresent).toBe(2);
			expect(result.data.ratio).toBe(67);
		}
	});

	it("retourne ratio=0 si aucune session aujourd'hui", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findMany: vi.fn().mockResolvedValue([]) },
		} as never);

		const result = await getDailyAttendanceRatioAction({});
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.ratio).toBe(0);
	});
});

describe("getUpcomingStaffAlertsAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les sessions imminentes du tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([{ id: "s1" }]);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findMany: mockFindMany },
		} as never);

		const result = await getUpcomingStaffAlertsAction({});
		expect(result.success).toBe(true);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});
});

describe("getFinancialKPIsAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("calcule le revenu mensuel total", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const payments = [{ amount: 5000 }, { amount: 3000 }];
		vi.mocked(getTenantPrisma).mockReturnValue({
			paiement: { findMany: vi.fn().mockResolvedValue(payments) },
		} as never);

		const result = await getFinancialKPIsAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.monthlyRevenue).toBe(8000);
			expect(result.data.currency).toBe("DZD");
		}
	});

	it("retourne 0 si aucun paiement ce mois", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			paiement: { findMany: vi.fn().mockResolvedValue([]) },
		} as never);

		const result = await getFinancialKPIsAction({});
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.monthlyRevenue).toBe(0);
	});
});

describe("getDashboardFormDataAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne toutes les données de formulaire du tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([]);
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { findMany: mockFindMany },
			activity: { findMany: mockFindMany },
			user: { findMany: mockFindMany },
			groupe: { findMany: mockFindMany },
			student: { findMany: mockFindMany },
			session: { findMany: mockFindMany },
			paymentPlan: { findMany: mockFindMany },
		} as never);

		const result = await getDashboardFormDataAction({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect("rooms" in result.data).toBe(true);
			expect("activities" in result.data).toBe(true);
			expect("students" in result.data).toBe(true);
			expect("totalPendingAmount" in result.data).toBe(true);
		}
	});
});
