import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	getTenantPrisma: vi.fn(),
	prisma: {
		user: { findUnique: vi.fn() },
		etablissement: { update: vi.fn() },
	},
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
	deleteAccountAction,
	updateProfileAction,
} from "@/actions/settings.actions";
import { getTenantPrisma, prisma } from "@/lib/prisma";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-123",
		email: "admin@school.dz",
		name: "Admin Test",
		...override,
	},
	expires: "2099-01-01",
});

describe("updateProfileAction — SEC-03 ownership", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne une erreur si pas de session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await updateProfileAction({
			firstName: "Ahmed",
			lastName: "Benali",
			email: "a@b.com",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("AUTH_REQUIRED");
		}
	});

	it("met à jour le profil avec contrainte composite id_etablissementId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({
			id: "user-1",
			firstName: "Ahmed",
			lastName: "Benali",
			email: "a@b.com",
		});
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { update: mockUpdate },
		} as never);
		vi.mocked(
			prisma.user.findUnique as ReturnType<typeof vi.fn>,
		).mockResolvedValue(null);

		const result = await updateProfileAction({
			firstName: "Ahmed",
			lastName: "Benali",
			email: "a@b.com",
		});

		expect(result.success).toBe(true);
		// Vérifie que le where utilise la clé composite
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_etablissementId: { id: "user-1", etablissementId: "etab-123" },
				},
			}),
		);
	});
});

describe("deleteAccountAction — SEC-06 dernier gérant", () => {
	beforeEach(() => vi.clearAllMocks());

	it("bloque la suppression si GERANT est le dernier actif", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "GERANT" }) as never,
		);
		const mockFindFirst = vi.fn().mockResolvedValue(null); // aucun autre GERANT
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findFirst: mockFindFirst, delete: vi.fn() },
		} as never);

		const result = await deleteAccountAction({});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("FORBIDDEN_ACCESS");
		}
	});

	it("permet la suppression si un autre GERANT actif existe", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "GERANT" }) as never,
		);
		const mockFindFirst = vi.fn().mockResolvedValue({ id: "other-gerant" });
		const mockDelete = vi.fn().mockResolvedValue({ id: "user-1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findFirst: mockFindFirst, delete: mockDelete },
		} as never);

		const result = await deleteAccountAction({});
		expect(result.success).toBe(true);
	});

	it("permet la suppression d'un ADMIN sans vérification gérant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ role: "ADMIN" }) as never,
		);
		const mockDelete = vi.fn().mockResolvedValue({ id: "user-1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			user: { findFirst: vi.fn(), delete: mockDelete },
		} as never);

		const result = await deleteAccountAction({});
		expect(result.success).toBe(true);
	});

	it("retourne erreur si pas de session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await deleteAccountAction({});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("AUTH_REQUIRED");
		}
	});
});
