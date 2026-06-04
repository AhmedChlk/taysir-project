import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

// Mock console.error to avoid noise in tests
vi.spyOn(console, "error").mockImplementation(() => {});

import { RoleUser } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-abc",
		...override,
	},
	expires: "2099-01-01",
});

const testSchema = z.object({ name: z.string().min(1) });

describe("createSafeAction - Security & Robustness Audit", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("🔴 Authentification & Autorisation", () => {
		it("Échec d'Authentification : rejette si pas de session", async () => {
			vi.mocked(getServerSession).mockResolvedValue(null);
			const action = createSafeAction(testSchema, async () => "ok");

			const result = await action({ name: "test" });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
		});

		it("Contrôle de Rôle : rejette si le rôle requis n'est pas possédé", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: RoleUser.PARTICIPANT }) as never,
			);
			const action = createSafeAction(testSchema, async () => "ok", {
				requiredRole: RoleUser.ADMIN,
			});

			const result = await action({ name: "test" });
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.code).toBe("FORBIDDEN_ACCESS");
		});

		it("Contrôle de Rôle : autorise si le rôle requis est possédé", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ role: RoleUser.ADMIN }) as never,
			);
			const action = createSafeAction(testSchema, async () => "ok", {
				requiredRole: RoleUser.ADMIN,
			});

			const result = await action({ name: "test" });
			expect(result.success).toBe(true);
		});
	});

	describe("🟠 Intégrité du Tenant (Multi-SaaS Isolation)", () => {
		it("Tenant Isolation : rejette si pas d'etablissementId (et non SUPER_ADMIN)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ etablissementId: null, role: RoleUser.ADMIN }) as never,
			);
			const action = createSafeAction(testSchema, async () => "ok");

			const result = await action({ name: "test" });
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.code).toBe("TENANT_DATA_ISOLATION_VIOLATION");
		});

		it("SUPER_ADMIN Bypass : autorise sans etablissementId avec accès global", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({
					etablissementId: null,
					role: RoleUser.SUPER_ADMIN,
				}) as never,
			);
			const action = createSafeAction(
				testSchema,
				async (_data, ctx) => ctx.tenantId,
			);

			const result = await action({ name: "test" });
			expect(result.success).toBe(true);
			if (result.success) expect(result.data).toBe("GLOBAL_ACCESS");
		});

		it("Immuabilité du Contexte : injecte les bonnes métadonnées au handler", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({
					id: "real-user",
					etablissementId: "real-etab",
					role: "GERANT",
				}) as never,
			);
			let capturedCtx: any = null;

			const action = createSafeAction(testSchema, async (_data, ctx) => {
				capturedCtx = ctx;
				return "ok";
			});

			await action({ name: "test" });
			expect(capturedCtx).toEqual({
				tenantId: "real-etab",
				userId: "real-user",
				role: "GERANT",
			});
		});
	});

	describe("🟡 Validation & Erreurs", () => {
		it("Zod Validation : rejette les données malformées", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const action = createSafeAction(testSchema, async () => "ok");

			const result = await action({ name: "" }); // Violates min(1)
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_DATA_FORMAT");
				expect(result.error.details).toBeDefined();
			}
		});

		it("Capture TaysirError : renvoie l'erreur métier proprement", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const action = createSafeAction(testSchema, async () => {
				throw new TaysirError(
					"Business Error",
					ErrorCodes.ERR_INVALID_DATA,
					400,
				);
			});

			const result = await action({ name: "x" });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe(ErrorCodes.ERR_INVALID_DATA);
				expect(result.error.message).toBe("Business Error");
			}
		});
	});

	describe("🟢 Résilience & Happy Path", () => {
		it("Gestion des Crashs : capture les erreurs imprévues (Robustesse)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const action = createSafeAction(testSchema, async () => {
				throw new Error("Unexpected database crash");
			});

			const result = await action({ name: "x" });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
				expect(console.error).toHaveBeenCalled();
			}
		});

		it("Exception non-objet Error : robuste si le throw n'est pas une Error (ligne 98 branch coverage)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const action = createSafeAction(testSchema, async () => {
				throw "String Error"; // Not an Error object
			});

			const result = await action({ name: "x" });
			expect(result.success).toBe(false);
			expect(console.error).toHaveBeenCalledWith(
				expect.stringContaining("Unknown error"),
			);
		});

		it("Exception dans le middleware : robuste si getAuthSession throw", async () => {
			// Simulation d'un crash grave dans le wrapper lui-même (ex: service auth en panne totale)
			vi.mocked(getServerSession).mockRejectedValue(
				new Error("AUTH_SERVICE_CRASH"),
			);
			const action = createSafeAction(testSchema, async () => "ok");

			const result = await action({ name: "test" });
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
		});

		it("Happy Path Extrême : succès avec toutes les données injectées", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const action = createSafeAction(testSchema, async (data, ctx) => ({
				data,
				ctx,
			}));

			const result = await action({ name: "FullTest" });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.data.name).toBe("FullTest");
				expect(result.data.ctx.tenantId).toBe("etab-abc");
			}
		});
	});
});
