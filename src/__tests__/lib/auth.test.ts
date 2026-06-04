import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
vi.mock("bcryptjs", () => ({
	default: {
		compare: vi.fn(),
	},
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

vi.spyOn(console, "error").mockImplementation(() => {});

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

describe("authOptions Audit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Providers -> authorize", () => {
		const authorize = (authOptions.providers[0] as any).options.authorize;

		it("échoue si les informations d'identification sont manquantes", async () => {
			const res1 = await authorize(null);
			const res2 = await authorize({ email: "test@test.com" });
			const res3 = await authorize({ password: "password" });

			expect(res1).toBeNull();
			expect(res2).toBeNull();
			expect(res3).toBeNull();
		});

		it("échoue si l'utilisateur n'existe pas", async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

			const result = await authorize({ email: "test@test.com", password: "password" });
			expect(result).toBeNull();
		});

		it("échoue si le statut de l'utilisateur n'est pas ACTIVE", async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: "u1",
				status: "INACTIVE",
			} as any);

			const result = await authorize({ email: "test@test.com", password: "password" });
			expect(result).toBeNull();
		});

		it("échoue si l'établissement est désactivé et l'utilisateur n'est pas SUPER_ADMIN", async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: "u1",
				status: "ACTIVE",
				role: "ADMIN",
				etablissement: { isActive: false },
			} as any);

			const result = await authorize({ email: "test@test.com", password: "password" });
			expect(result).toBeNull();
		});

		it("succès si l'établissement est désactivé mais l'utilisateur est SUPER_ADMIN", async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: "u1",
				status: "ACTIVE",
				role: "SUPER_ADMIN",
				firstName: "Super",
				lastName: "Admin",
				email: "super@admin.com",
				password: "hashedPassword",
				etablissementId: null,
				etablissement: { isActive: false },
			} as any);
			vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

			const result = await authorize({ email: "super@admin.com", password: "password" });
			expect(result).not.toBeNull();
			expect(result.id).toBe("u1");
			expect(result.etablissementId).toBe("");
		});

		it("échoue si le mot de passe est incorrect", async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: "u1",
				status: "ACTIVE",
				role: "ADMIN",
				password: "hashedPassword",
				etablissement: { isActive: true },
			} as any);
			vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

			const result = await authorize({ email: "test@test.com", password: "wrong" });
			expect(result).toBeNull();
		});

		it("succès si tout est correct (avec etablissementId)", async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue({
				id: "u1",
				email: "test@test.com",
				firstName: "John",
				lastName: "Doe",
				status: "ACTIVE",
				role: "ADMIN",
				password: "hashedPassword",
				etablissementId: "etab-1",
				etablissement: { isActive: true },
			} as any);
			vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

			const result = await authorize({ email: "test@test.com", password: "correct" });
			expect(result).toEqual({
				id: "u1",
				email: "test@test.com",
				name: "John Doe",
				role: "ADMIN",
				etablissementId: "etab-1",
			});
		});

		it("Pannes Critiques: capture une erreur Prisma et retourne null", async () => {
			vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB DOWN"));

			const result = await authorize({ email: "test@test.com", password: "password" });
			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe("Callbacks -> jwt", () => {
		const jwtCallback = authOptions.callbacks?.jwt as any;

		it("ajoute les informations de l'utilisateur au token lors de la connexion", async () => {
			const token = { name: "Test" };
			const user = { id: "u1", role: "ADMIN", etablissementId: "etab-1" };

			const result = await jwtCallback({ token, user });
			expect(result).toEqual({
				name: "Test",
				id: "u1",
				role: "ADMIN",
				etablissementId: "etab-1",
			});
		});

		it("gère etablissementId null", async () => {
			const token = {};
			const user = { id: "u1", role: "SUPER_ADMIN" }; // sans etablissementId ou null

			const result = await jwtCallback({ token, user: { ...user, etablissementId: null } });
			expect(result.etablissementId).toBe("");
		});

		it("retourne le token intact s'il n'y a pas de nouvel utilisateur", async () => {
			const token = { id: "u1", role: "ADMIN" };
			const result = await jwtCallback({ token });
			expect(result).toEqual(token);
		});
	});

	describe("Callbacks -> session", () => {
		const sessionCallback = authOptions.callbacks?.session as any;

		it("transmet les informations du token vers la session", async () => {
			const session = { user: { name: "Test" } };
			const token = { id: "u1", role: "ADMIN", etablissementId: "etab-1" };

			const result = await sessionCallback({ session, token });
			expect(result.user.id).toBe("u1");
			expect(result.user.role).toBe("ADMIN");
			expect(result.user.etablissementId).toBe("etab-1");
		});

		it("gère un token sans etablissementId défini (ne l'écrase pas)", async () => {
			const session = { user: { name: "Test", etablissementId: "exist" } };
			const token = { id: "u1", role: "ADMIN" }; // pas d'etablissementId

			const result = await sessionCallback({ session, token });
			expect(result.user.etablissementId).toBe("exist"); // Conservé
		});
        
        it("transmet les informations du token même si etablissementId est vide ('')", async () => {
			const session = { user: { name: "Test" } };
			const token = { id: "u1", role: "SUPER_ADMIN", etablissementId: "" };

			const result = await sessionCallback({ session, token });
			expect(result.user.etablissementId).toBe("");
		});

        it("ne fait rien si session.user est absent", async () => {
            const session = {};
            const token = { id: "u1", role: "ADMIN", etablissementId: "etab-1" };
            
            const result = await sessionCallback({ session, token });
            expect(result).toEqual({});
        });
	});

	describe("Callbacks -> redirect", () => {
		const redirectCallback = authOptions.callbacks?.redirect as any;

		it("accepte les URLs relatives", async () => {
			const result = await redirectCallback({ url: "/dashboard", baseUrl: "http://localhost:3000" });
			expect(result).toBe("http://localhost:3000/dashboard");
		});

		it("accepte les URLs de la même origine", async () => {
			const result = await redirectCallback({ url: "http://localhost:3000/settings", baseUrl: "http://localhost:3000" });
			expect(result).toBe("http://localhost:3000/settings");
		});

		it("rejette les URLs de domaines externes et retourne la baseUrl", async () => {
			const result = await redirectCallback({ url: "http://evil.com/phishing", baseUrl: "http://localhost:3000" });
			expect(result).toBe("http://localhost:3000");
		});
	});

	describe("Variables d'Environnement Fallbacks", () => {
		it("utilise une chaîne vide si NEXTAUTH_SECRET n'est pas défini", async () => {
			const originalSecret = process.env.NEXTAUTH_SECRET;
			delete process.env.NEXTAUTH_SECRET;
			
			vi.resetModules();
			const { authOptions: reloadedAuthOptions } = await import(`@/lib/auth?test=${Date.now()}`);
			
			expect(reloadedAuthOptions.secret).toBe("");
			
			if (originalSecret !== undefined) {
				process.env.NEXTAUTH_SECRET = originalSecret;
			}
		});
	});
});
