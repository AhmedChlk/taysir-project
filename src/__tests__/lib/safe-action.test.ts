import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { TaysirError } from "@/lib/errors";

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

describe("createSafeAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne success:true quand tout est valide", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const action = createSafeAction(testSchema, async (data) => ({
			greeting: `Hello ${data.name}`,
		}));

		const result = await action({ name: "Taysir" });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.greeting).toBe("Hello Taysir");
	});

	it("retourne AUTH_REQUIRED si pas de session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const action = createSafeAction(testSchema, async () => "ok");

		const result = await action({ name: "test" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});

	it("retourne TENANT_DATA_ISOLATION_VIOLATION si pas d'etablissementId (non SUPER_ADMIN)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ etablissementId: null, role: "ADMIN" }) as never,
		);
		const action = createSafeAction(testSchema, async () => "ok");

		const result = await action({ name: "test" });
		expect(result.success).toBe(false);
		if (!result.success)
			expect(result.error.code).toBe("TENANT_DATA_ISOLATION_VIOLATION");
	});

	it("retourne INVALID_DATA_FORMAT si les données Zod sont invalides", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const action = createSafeAction(testSchema, async () => "ok");

		const result = await action({ name: "" }); // min(1) violated
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});

	it("capture une TaysirError et retourne son code", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const action = createSafeAction(testSchema, async () => {
			throw new TaysirError("Non trouvé", "RESOURCE_NOT_FOUND", 404);
		});

		const result = await action({ name: "x" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
			expect(result.error.message).toBe("Non trouvé");
		}
	});

	it("capture une erreur inconnue et retourne INTERNAL_SERVER_ERROR", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const action = createSafeAction(testSchema, async () => {
			throw new Error("Unexpected crash");
		});

		const result = await action({ name: "x" });
		expect(result.success).toBe(false);
		if (!result.success)
			expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
	});

	it("passe le bon contexte (tenantId, userId, role) au handler", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		let capturedCtx: { tenantId: string; userId: string; role: string } | null =
			null;

		const action = createSafeAction(testSchema, async (_data, ctx) => {
			capturedCtx = ctx;
			return "ok";
		});

		await action({ name: "x" });
		expect(capturedCtx).toEqual({
			tenantId: "etab-abc",
			userId: "user-1",
			role: "ADMIN",
		});
	});

	it("autorise SUPER_ADMIN sans etablissementId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ etablissementId: null, role: "SUPER_ADMIN" }) as never,
		);
		const action = createSafeAction(
			testSchema,
			async (_data, ctx) => ctx.tenantId,
		);

		const result = await action({ name: "x" });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBe("SUPERADMIN_ACCESS");
	});
});
