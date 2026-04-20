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
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_etablissementId: {
						id: "550e8400-e29b-41d4-a716-446655440001",
						etablissementId: "etab-abc",
					},
				},
			}),
		);
	});
});

describe("createRoomAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée une salle avec etablissementId tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi.fn().mockResolvedValue({ id: "r1", name: "Salle 1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { create: mockCreate },
		} as never);

		const result = await createRoomAction({ name: "Salle 1", capacity: 30 });
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});
});

describe("updateRoomAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("met à jour une salle", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({ id: "r1", name: "Salle 2" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { update: mockUpdate },
		} as never);

		const result = await updateRoomAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
			name: "Salle 2",
			capacity: 30,
		});
		expect(result.success).toBe(true);
	});
});

describe("createActivityAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée une activité", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi.fn().mockResolvedValue({ id: "a1", name: "Math" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			activity: { create: mockCreate },
		} as never);

		const result = await createActivityAction({ name: "Math", color: "#FF0000" });
		expect(result.success).toBe(true);
	});
});

describe("updateActivityAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("met à jour une activité", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({ id: "a1", name: "Phys" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			activity: { update: mockUpdate },
		} as never);

		const result = await updateActivityAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
			name: "Phys",
			color: "#00FF00",
		});
		expect(result.success).toBe(true);
	});
});

describe("deleteGroupAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime un groupe existant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "g1" });
		const mockDelete = vi.fn().mockResolvedValue({ id: "g1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findUnique: mockFindUnique, delete: mockDelete },
		} as never);

		const result = await deleteGroupAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockFindUnique).toHaveBeenCalled();
		expect(mockDelete).toHaveBeenCalled();
	});

	it("retourne RESOURCE_NOT_FOUND si groupe absent", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await deleteGroupAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});
});

describe("deleteActivityAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime une activité avec filtre tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "a1" });
		const mockDelete = vi.fn().mockResolvedValue({ id: "a1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			activity: { findUnique: mockFindUnique, delete: mockDelete },
		} as never);

		const result = await deleteActivityAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockDelete).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_etablissementId: {
						id: "550e8400-e29b-41d4-a716-446655440001",
						etablissementId: "etab-abc",
					},
				},
			}),
		);
	});
	it("retourne RESOURCE_NOT_FOUND si activité absente", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			activity: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await deleteActivityAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});
});

describe("deleteRoomAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime une salle avec filtre tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "r1" });
		const mockDelete = vi.fn().mockResolvedValue({ id: "r1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { findUnique: mockFindUnique, delete: mockDelete },
		} as never);

		const result = await deleteRoomAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockDelete).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_etablissementId: {
						id: "550e8400-e29b-41d4-a716-446655440001",
						etablissementId: "etab-abc",
					},
				},
			}),
		);
	});
	it("retourne RESOURCE_NOT_FOUND si salle absente", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			room: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await deleteRoomAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});
});

describe("markPresenceAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un enregistrement de présence avec upsert", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: "s1" });
		const mockUpsert = vi
			.fn()
			.mockResolvedValue({ id: "att-1", status: "PRESENT" });
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

	it("retourne RESOURCE_NOT_FOUND si séance absente", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			session: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await markPresenceAction({
			seanceId: "550e8400-e29b-41d4-a716-446655440001",
			participantId: "550e8400-e29b-41d4-a716-446655440002",
			statut: "PRESENT" as never,
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});
});
