import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	getTenantPrisma: vi.fn(),
	prisma: {
		user: { findUnique: vi.fn() },
	},
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
	default: { hash: vi.fn().mockResolvedValue("hashed-password-123") },
}));

import { getServerSession } from "next-auth/next";
import {
	createUserAction,
	deleteUserAction,
	getUsersListAction,
	resetUserPasswordAction,
	updateUserAction,
} from "@/actions/users.actions";
import { getTenantPrisma, prisma } from "@/lib/prisma";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "GERANT",
		etablissementId: "etab-xyz",
		...override,
	},
	expires: "2099-01-01",
});

const TEST_PASSWORD_VALID = process.env.TEST_PASSWORD as string;
const TEST_PASSWORD_NEW = process.env.TEST_PASSWORD_RESET as string;

describe("createUserAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un utilisateur avec mot de passe hashé", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(
			prisma.user.findUnique as ReturnType<typeof vi.fn>,
		).mockResolvedValue(null);
		const mockCreate = vi.fn().mockResolvedValue({
			id: "u-new",
			email: "staff@school.dz",
			firstName: "Fatima",
			lastName: "Mansouri",
			role: "SECRETAIRE",
		});
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { create: mockCreate },
		} as never);

		const result = await createUserAction({
			email: "staff@school.dz",
			firstName: "Fatima",
			lastName: "Mansouri",
			role: "SECRETAIRE" as never,
			password: TEST_PASSWORD_VALID,
		});
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					password: expect.any(String),
					etablissementId: "etab-xyz",
				}),
			}),
		);
	});

	it("rejette si l'email est déjà utilisé", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(
			prisma.user.findUnique as ReturnType<typeof vi.fn>,
		).mockResolvedValue({ id: "existing" });

		const result = await createUserAction({
			email: "taken@school.dz",
			firstName: "X",
			lastName: "Y",
			role: "ADMIN" as never,
			password: TEST_PASSWORD_VALID,
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});

	it("retourne AUTH_REQUIRED sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await createUserAction({
			email: "x@y.com",
			firstName: "X",
			lastName: "Y",
			role: "ADMIN" as never,
			password: TEST_PASSWORD_VALID,
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});
});

describe("getUsersListAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne tous les utilisateurs du tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const users = [{ id: "u1", email: "a@b.dz", role: "SECRETAIRE" }];
		const mockFindMany = vi.fn().mockResolvedValue(users);
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findMany: mockFindMany },
		} as never);

		const result = await getUsersListAction({});
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toHaveLength(1);
	});

	it("filtre par rôle si fourni", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([]);
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findMany: mockFindMany },
		} as never);

		await getUsersListAction({ role: "SECRETAIRE" as never });
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ role: "SECRETAIRE" }),
			}),
		);
	});

	it("inclut salary dans la select si rôle GERANT", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "GERANT" }) as never,
		);
		const mockFindMany = vi.fn().mockResolvedValue([]);
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findMany: mockFindMany },
		} as never);

		await getUsersListAction({});
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				select: expect.objectContaining({ salary: true }),
			}),
		);
	});
});

describe("updateUserAction", () => {
	beforeEach(() => vi.clearAllMocks());

	const userId = "550e8400-e29b-41d4-a716-446655440001";

	it("met à jour un utilisateur (GERANT peut changer le rôle)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "GERANT" }) as never,
		);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: userId });
		const mockUpdate = vi
			.fn()
			.mockResolvedValue({ id: userId, role: "INTERVENANT" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findUnique: mockFindUnique, update: mockUpdate },
		} as never);

		const result = await updateUserAction({
			id: userId,
			role: "INTERVENANT" as never,
		});
		expect(result.success).toBe(true);
	});

	it("bloque un non-GERANT qui tente de changer le rôle", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "ADMIN" }) as never,
		);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await updateUserAction({
			id: userId,
			role: "SECRETAIRE" as never,
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});

	it("retourne RESOURCE_NOT_FOUND si utilisateur absent", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "GERANT" }) as never,
		);
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
		} as never);

		const result = await updateUserAction({ id: userId });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});
});

describe("resetUserPasswordAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("hash le nouveau mot de passe et met à jour", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({ id: "u1", email: "a@b.dz" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { update: mockUpdate },
		} as never);

		const result = await resetUserPasswordAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
			newPassword: TEST_PASSWORD_NEW,
		});
		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { password: expect.any(String) },
			}),
		);
	});
});

describe("deleteUserAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("supprime l'utilisateur avec contrainte id_etablissementId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockDelete = vi.fn().mockResolvedValue({ id: "u1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { delete: mockDelete },
		} as never);

		const result = await deleteUserAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockDelete).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_etablissementId: {
						id: "550e8400-e29b-41d4-a716-446655440001",
						etablissementId: "etab-xyz",
					},
				},
			}),
		);
	});

	it("rejette un id non-UUID", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await deleteUserAction({ id: "bad-id" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});
});

