import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
	const mock = {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
			findFirst: vi.fn(),
			delete: vi.fn(),
		},
		etablissement: { update: vi.fn() },
	};
	return {
		getTenantPrisma: vi.fn(() => mock),
		prisma: mock,
	};
});

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
	updateSchoolAction,
} from "@/actions/settings.actions";
import { getTenantPrisma, prisma } from "@/lib/prisma";

const TENANT_ID = "etab-abc";
const USER_ID = "user-123";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: USER_ID,
		role: "ADMIN",
		etablissementId: TENANT_ID,
		...override,
	},
	expires: "2099-01-01",
});

describe("Settings Actions Audit", () => {
	let mockPrisma: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockPrisma = getTenantPrisma(TENANT_ID);
	});

	describe("🔴 A. Sécurité et Permissions (Access Control)", () => {
		it("updateProfileAction: Bloque si l'email est déjà utilisé par un AUTRE compte (Email Conflict)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			// Simule un autre utilisateur possédant déjà cet email
			vi.mocked(prisma.user.findUnique as any).mockResolvedValue({
				id: "other-user",
				email: "taken@test.com",
			});

			const result = await updateProfileAction({
				firstName: "John",
				lastName: "Doe",
				email: "taken@test.com",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_DATA_FORMAT");
				expect(result.error.message).toMatch(/déjà utilisé/);
			}
		});

		it("updateProfileAction: Autorise la mise à jour si l'email appartient au compte courant", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.user.findUnique as any).mockResolvedValue({
				id: USER_ID,
				email: "my-email@test.com",
			});
			mockPrisma.user.update.mockResolvedValue({ id: USER_ID });

			const result = await updateProfileAction({
				firstName: "John",
				lastName: "Doe",
				email: "my-email@test.com",
			});

			expect(result.success).toBe(true);
		});

		it("updateSchoolAction: Bloque les utilisateurs sans privilèges (ex: STAFF ou STUDENT)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: "STAFF" }) as never,
			);
			const result = await updateSchoolAction({ name: "Hacker School" });

			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
		});

		it("updateSchoolAction: Autorise GERANT, ADMIN et SUPER_ADMIN", async () => {
			const roles = ["GERANT", "ADMIN", "SUPER_ADMIN"];
			for (const role of roles) {
				vi.mocked(getServerSession).mockResolvedValue(
					makeSession({ role }) as never,
				);
				vi.mocked(prisma.etablissement.update).mockResolvedValue({
					id: TENANT_ID,
				} as any);

				const result = await updateSchoolAction({ name: "School Name" });
				expect(result.success).toBe(true);
			}
		});

		it("updateSchoolAction: Gère les champs optionnels omis (Branches ?? null)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: "ADMIN" }) as never,
			);
			vi.mocked(prisma.etablissement.update).mockResolvedValue({
				id: TENANT_ID,
			} as any);

			// On n'envoie ni address ni primaryColor
			await updateSchoolAction({ name: "Minimal" });

			expect(prisma.etablissement.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: {
						name: "Minimal",
						address: null,
						primaryColor: null,
					},
				}),
			);
		});
	});

	describe("🟠 B. Logique Métier Critique (Account Deletion)", () => {
		it("Règle du Dernier Gérant: Bloque la suppression si l'utilisateur est le seul GERANT actif", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: "GERANT" }) as never,
			);
			mockPrisma.user.findFirst.mockResolvedValue(null); // Aucun autre gérant trouvé

			const result = await deleteAccountAction({});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("FORBIDDEN_ACCESS");
				expect(result.error.message).toMatch(/dernier gérant actif/);
			}
		});

		it("Règle du Dernier Gérant: Autorise si un autre gérant actif existe", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: "GERANT" }) as never,
			);
			mockPrisma.user.findFirst.mockResolvedValue({ id: "other-gerant" });
			mockPrisma.user.delete.mockResolvedValue({ id: USER_ID });

			const result = await deleteAccountAction({});
			expect(result.success).toBe(true);
			expect(mockPrisma.user.delete).toHaveBeenCalled();
		});

		it("Suppression Sans Contrainte: Autorise la suppression d'un ADMIN sans vérifier les gérants", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: "ADMIN" }) as never,
			);
			mockPrisma.user.delete.mockResolvedValue({ id: USER_ID });

			const result = await deleteAccountAction({});
			expect(result.success).toBe(true);

			// Vérifie qu'on n'a même pas cherché d'autres gérants
			expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
			expect(mockPrisma.user.delete).toHaveBeenCalled();
		});
	});

	describe("🟡 C. Résilience et Validation", () => {
		it("updateSchoolAction: Rejette les couleurs mal formatées via Zod", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

			const res1 = await updateSchoolAction({
				name: "School",
				primaryColor: "red",
			});
			expect(res1.success).toBe(false);

			const res2 = await updateSchoolAction({
				name: "School",
				primaryColor: "#1234567",
			}); // Trop long
			expect(res2.success).toBe(false);
		});

		it("Crash Prisma: Gère un échec système lors de l'update profil", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.user.findUnique as any).mockResolvedValue(null);
			mockPrisma.user.update.mockRejectedValue(new Error("NETWORK_FAILURE"));

			const result = await updateProfileAction({
				firstName: "John",
				lastName: "Doe",
				email: "john@doe.com",
			});
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
		});
	});

	describe("🟢 D. Cache et Invalidation", () => {
		it("updateSchoolAction: Déclenche revalidateTag après succès", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.etablissement.update).mockResolvedValue({
				id: TENANT_ID,
			} as any);

			await updateSchoolAction({ name: "Taysir Academy" });

			const { revalidateTag } = await import("next/cache");
			expect(revalidateTag).toHaveBeenCalledWith(
				`etab_${TENANT_ID}_settings`,
				"max",
			);
		});

		it("updateProfileAction: Déclenche revalidateTag après succès", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.user.findUnique as any).mockResolvedValue(null);
			mockPrisma.user.update.mockResolvedValue({ id: USER_ID });

			await updateProfileAction({
				firstName: "John",
				lastName: "Doe",
				email: "john@doe.com",
			});

			const { revalidateTag } = await import("next/cache");
			expect(revalidateTag).toHaveBeenCalledWith(
				`etab_${TENANT_ID}_settings`,
				"max",
			);
		});
	});
});
