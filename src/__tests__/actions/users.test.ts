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
	default: { 
        hash: vi.fn().mockResolvedValue("hashed-password-123"),
        compare: vi.fn().mockResolvedValue(true)
    },
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
		etablissementId: "etab-1",
		...override,
	},
	expires: "2099-01-01",
});

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440001";
const OTHER_UUID = "550e8400-e29b-41d4-a716-446655440002";

describe("Users Actions Audit", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("createUserAction", () => {
		const validUser = {
			email: "new@school.dz",
			firstName: "John",
			lastName: "Doe",
			role: "ADMIN" as const,
			password: process.env.TEST_PASSWORD || "password123",
		};

		it("Happy Path: crée un utilisateur avec succès", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.user.findUnique as any).mockResolvedValue(null);
			const mockCreate = vi.fn().mockResolvedValue({ id: "u-1", ...validUser });
			vi.mocked(getTenantPrisma).mockReturnValue({ user: { create: mockCreate } } as never);

			const result = await createUserAction(validUser);
			expect(result.success).toBe(true);
			expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({
					email: validUser.email,
					etablissementId: "etab-1"
				})
			}));
		});

		it("Business: rejette si l'email est déjà pris", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.user.findUnique as any).mockResolvedValue({ id: "exists" });

			const result = await createUserAction(validUser);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_DATA_FORMAT");
				expect(result.error.message).toBe("Email déjà utilisé.");
			}
		});

		it("Système: gère une erreur Prisma", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			vi.mocked(prisma.user.findUnique as any).mockRejectedValue(new Error("DB_DOWN"));
			
			const result = await createUserAction(validUser);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
		});
	});

	describe("getUsersListAction", () => {
		it("Filtres et Privilèges: gère les rôles et le salaire", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession({ role: "ADMIN" }) as never);
			const mockFindMany = vi.fn().mockResolvedValue([]);
			vi.mocked(getTenantPrisma).mockReturnValue({ user: { findMany: mockFindMany } } as never);

			// Branche avec filtre rôle
			await getUsersListAction({ role: "ADMIN" });
			expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
				where: { role: "ADMIN" },
				select: expect.not.objectContaining({ salary: true })
			}));

            // Branche sans filtre rôle
            await getUsersListAction({});
            expect(mockFindMany).toHaveBeenLastCalledWith(expect.objectContaining({
                where: {}
            }));

            // Branche privilège GERANT (salaire inclus)
			vi.mocked(getServerSession).mockResolvedValue(makeSession({ role: "GERANT" }) as never);
			await getUsersListAction({});
			expect(mockFindMany).toHaveBeenLastCalledWith(expect.objectContaining({
				select: expect.objectContaining({ salary: true })
			}));
		});
	});

	describe("updateUserAction", () => {
		it("Escalade de privilèges: restrictions pour les non-gérants", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession({ role: "ADMIN" }) as never);
			
			// Rejet rôle
			const res1 = await updateUserAction({ id: VALID_UUID, role: "GERANT" as any });
			expect(res1.success).toBe(false);
            
            // Rejet salaire
            const res2 = await updateUserAction({ id: VALID_UUID, salary: 1000 });
            expect(res2.success).toBe(false);

            // Rejet statut
            const res3 = await updateUserAction({ id: VALID_UUID, status: "INACTIVE" as any });
            expect(res3.success).toBe(false);

            // Succès modification autorisée (prénom)
            const mockFindUnique = vi.fn().mockResolvedValue({ id: VALID_UUID });
            const mockUpdate = vi.fn().mockResolvedValue({ id: VALID_UUID });
            vi.mocked(getTenantPrisma).mockReturnValue({ user: { findUnique: mockFindUnique, update: mockUpdate } } as never);
            
            const res4 = await updateUserAction({ id: VALID_UUID, firstName: "Nouveau" });
            expect(res4.success).toBe(true);
		});

		it("Isolation et Erreur: gère le tenant spoofing et ressource absente", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession({ etablissementId: "etab-1", role: "GERANT" }) as never);
			const mockFindUnique = vi.fn().mockResolvedValue(null); 
			vi.mocked(getTenantPrisma).mockReturnValue({ user: { findUnique: mockFindUnique } } as never);

			const result = await updateUserAction({ id: OTHER_UUID, firstName: "Hacker" });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
			
			expect(mockFindUnique).toHaveBeenCalledWith(expect.objectContaining({
				where: { id_etablissementId: { id: OTHER_UUID, etablissementId: "etab-1" } }
			}));
		});

		it("Happy Path: mise à jour complète par gérant", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession({ role: "GERANT" }) as never);
			const mockFindUnique = vi.fn().mockResolvedValue({ id: VALID_UUID });
			const mockUpdate = vi.fn().mockResolvedValue({ id: VALID_UUID });
			vi.mocked(getTenantPrisma).mockReturnValue({ user: { findUnique: mockFindUnique, update: mockUpdate } } as never);

			const result = await updateUserAction({ id: VALID_UUID, salary: 50000, role: "ADMIN" });
			expect(result.success).toBe(true);
			expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ salary: 50000, role: "ADMIN" }),
                select: expect.objectContaining({ salary: true })
			}));
		});
	});

	describe("resetUserPasswordAction", () => {
		it("Happy Path: réinitialise le mot de passe avec succès", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const mockUpdate = vi.fn().mockResolvedValue({ id: VALID_UUID, email: "test@test.com" });
			vi.mocked(getTenantPrisma).mockReturnValue({ user: { update: mockUpdate } } as never);

			const result = await resetUserPasswordAction({ id: VALID_UUID, newPassword: "newpassword123" });
			expect(result.success).toBe(true);
			expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
				where: { id_etablissementId: { id: VALID_UUID, etablissementId: "etab-1" } },
				data: { password: "hashed-password-123" }
			}));
		});

		it("Zod: rejette un mot de passe trop court pour le reset", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const resZod = await resetUserPasswordAction({ id: VALID_UUID, newPassword: "123" });
			expect(resZod.success).toBe(false);
		});

        it("Isolation: utilise la clé composite id_etablissementId pour le reset", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession({ etablissementId: "target-etab" }) as never);
            const mockUpdate = vi.fn().mockResolvedValue({ id: VALID_UUID });
            vi.mocked(getTenantPrisma).mockReturnValue({ user: { update: mockUpdate } } as never);

            await resetUserPasswordAction({ id: VALID_UUID, newPassword: "newpassword123" });
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                where: { id_etablissementId: { id: VALID_UUID, etablissementId: "target-etab" } }
            }));
        });
	});

	describe("deleteUserAction", () => {
		it("Isolation et Résilience: suppression sécurisée", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession({ etablissementId: "my-etab" }) as never);
			const mockDelete = vi.fn().mockResolvedValue({ id: VALID_UUID });
			vi.mocked(getTenantPrisma).mockReturnValue({ user: { delete: mockDelete } } as never);

			await deleteUserAction({ id: VALID_UUID });
			expect(mockDelete).toHaveBeenCalledWith({
				where: { id_etablissementId: { id: VALID_UUID, etablissementId: "my-etab" } }
			});

			// Echec système (ex: déjà supprimé)
			vi.mocked(getTenantPrisma).mockReturnValue({ 
				user: { delete: vi.fn().mockRejectedValue(new Error("P2025")) } 
			} as never);
			const result = await deleteUserAction({ id: VALID_UUID });
			expect(result.success).toBe(false);
		});
	});
});
