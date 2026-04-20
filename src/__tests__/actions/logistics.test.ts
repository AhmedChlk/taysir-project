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
	createActivityAction,
	createGroupAction,
	createRoomAction,
	deleteActivityAction,
	deleteGroupAction,
	deleteRoomAction,
	markPresenceAction,
	updateActivityAction,
	updateGroupAction,
	updateRoomAction,
} from "@/actions/logistics.actions";
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

describe("createGroupAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un groupe avec etablissementId tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi
			.fn()
			.mockResolvedValue({ id: "g1", name: "Groupe A" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { create: mockCreate },
		} as never);

		const result = await createGroupAction({ name: "Groupe A" });
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});
});

describe("updateGroupAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("met à jour un groupe avec contrainte tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi
			.fn()
			.mockResolvedValue({ id: "g1", name: "Groupe B" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { update: mockUpdate },
		} as never);

		const result = await updateGroupAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
			name: "Groupe B",
		});
		expect(result.success).toBe(true);
	});
});

describe("deleteGroupAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime un groupe existant sans séances", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "g1" });
		const mockFindFirst = vi.fn().mockResolvedValue(null);
		const mockDelete = vi.fn().mockResolvedValue({ id: "g1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findUnique: mockFindUnique, delete: mockDelete },
			session: { findFirst: mockFindFirst },
		} as never);

		const result = await deleteGroupAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});

	it("bloque la suppression si séances liées", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "g1" });
		const mockFindFirst = vi.fn().mockResolvedValue({ id: "s1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findUnique: mockFindUnique, delete: vi.fn() },
			session: { findFirst: mockFindFirst },
		} as never);

		const result = await deleteGroupAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});
});

describe("deleteActivityAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime une activité sans liens", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "a1" });
		const mockFindFirst = vi.fn().mockResolvedValue(null);
		const mockDelete = vi.fn().mockResolvedValue({ id: "a1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			activity: { findUnique: mockFindUnique, delete: mockDelete },
			session: { findFirst: mockFindFirst },
			paymentPlan: { findFirst: mockFindFirst },
		} as never);

		const result = await deleteActivityAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});
});

describe("deleteRoomAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime une salle sans séances", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "r1" });
		const mockFindFirst = vi.fn().mockResolvedValue(null);
		const mockDelete = vi.fn().mockResolvedValue({ id: "r1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { findUnique: mockFindUnique, delete: mockDelete },
			session: { findFirst: mockFindFirst },
		} as never);

		const result = await deleteRoomAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});
});

describe("markPresenceAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un enregistrement de présence", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "s1" });
		const mockUpsert = vi.fn().mockResolvedValue({ id: "att-1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findUnique: mockFindUnique },
			attendanceRecord: { upsert: mockUpsert },
		} as never);

		const result = await markPresenceAction({
			seanceId: "550e8400-e29b-41d4-a716-446655440001",
			participantId: "550e8400-e29b-41d4-a716-446655440002",
			statut: "PRESENT" as never,
		});
		expect(result.success).toBe(true);
	});
});
