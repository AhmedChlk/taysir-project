import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	getTenantPrisma: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
	getDashboardStatsAction,
	getPendingPaymentsAction,
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
