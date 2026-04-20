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

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
	createSessionAction,
	deleteSessionAction,
	getWeeklySessionsAction,
} from "@/actions/schedule.actions";
import { getTenantPrisma } from "@/lib/prisma";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-abc",
		...override,
	},
	expires: "2099-01-01",
});

const validSession = {
	activityId: "550e8400-e29b-41d4-a716-446655440004",
	roomId: "550e8400-e29b-41d4-a716-446655440001",
	instructorId: "550e8400-e29b-41d4-a716-446655440002",
	groupId: "550e8400-e29b-41d4-a716-446655440003",
	startTime: new Date("2026-09-01T09:00:00Z"),
	endTime: new Date("2026-09-01T11:00:00Z"),
};

describe("createSessionAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée une session sans conflit", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindFirst = vi.fn().mockResolvedValue(null); // no conflicts
		const mockCreate = vi
			.fn()
			.mockResolvedValue({ id: "sess-1", ...validSession });
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findFirst: mockFindFirst, create: mockCreate },
		} as never);

		const result = await createSessionAction(validSession);
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					etablissementId: "etab-abc",
					status: "SCHEDULED",
				}),
			}),
		);
	});

	it("rejette un conflit de salle", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindFirst = vi.fn().mockResolvedValueOnce({
			room: { name: "Salle A" },
			group: { name: "Groupe 1" },
		}); // room conflict
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findFirst: mockFindFirst },
		} as never);

		const result = await createSessionAction(validSession);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});

	it("rejette un conflit d'instructeur", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindFirst = vi
			.fn()
			.mockResolvedValueOnce(null) // no room conflict
			.mockResolvedValueOnce({
				instructor: { lastName: "Bensalem" },
			}); // instructor conflict
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findFirst: mockFindFirst },
		} as never);

		const result = await createSessionAction(validSession);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});

	it("rejette un conflit de groupe", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindFirst = vi
			.fn()
			.mockResolvedValueOnce(null) // no room conflict
			.mockResolvedValueOnce(null) // no instructor conflict
			.mockResolvedValueOnce({ group: { name: "Groupe A" } }); // group conflict
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findFirst: mockFindFirst },
		} as never);

		const result = await createSessionAction(validSession);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});

	it("retourne AUTH_REQUIRED sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await createSessionAction(validSession);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});
});

describe("deleteSessionAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime une session avec filtre tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockDelete = vi.fn().mockResolvedValue({ id: "sess-1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { delete: mockDelete },
		} as never);

		const result = await deleteSessionAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockDelete).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});

	it("rejette un id non-UUID", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await deleteSessionAction({ id: "not-a-uuid" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});
});

describe("getWeeklySessionsAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les sessions de la semaine avec filtre tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const sessions = [{ id: "s1", startTime: new Date() }];
		const mockFindMany = vi.fn().mockResolvedValue(sessions);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findMany: mockFindMany },
		} as never);

		const result = await getWeeklySessionsAction({
			start: new Date("2026-09-01"),
			end: new Date("2026-09-07"),
		});
		expect(result.success).toBe(true);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});

	it("filtre par roomId si fourni", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([]);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findMany: mockFindMany },
		} as never);

		await getWeeklySessionsAction({
			start: new Date("2026-09-01"),
			end: new Date("2026-09-07"),
			roomId: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					roomId: "550e8400-e29b-41d4-a716-446655440001",
				}),
			}),
		);
	});
});
