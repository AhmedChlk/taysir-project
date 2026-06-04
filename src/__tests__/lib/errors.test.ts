import { describe, expect, it } from "vitest";
import { ErrorCodes, TaysirError } from "@/lib/errors";

describe("TaysirError Audit", () => {
	describe("🔴 A. Instanciation et Propriétés", () => {
		it("possède les propriétés de base par défaut", () => {
			const error = new TaysirError(
				"Message d'erreur",
				ErrorCodes.ERR_INVALID_DATA,
			);

			expect(error.message).toBe("Message d'erreur");
			expect(error.code).toBe("INVALID_DATA_FORMAT");
			expect(error.status).toBe(400);
			expect(error.name).toBe("TaysirError");
		});

		it("stocke correctement les détails personnalisés (ex: Zod issues)", () => {
			const details = { field: "email", error: "invalid" };
			const error = new TaysirError(
				"Validation failed",
				ErrorCodes.ERR_INVALID_DATA,
				422,
				details,
			);

			expect(error.status).toBe(422);
			expect(error.details).toEqual(details);
		});
	});

	describe("🟠 B. Sérialisation (toJSON)", () => {
		it("renvoie un objet propre sans stack trace", () => {
			const error = new TaysirError(
				"Auth failed",
				ErrorCodes.ERR_UNAUTHORIZED,
				401,
			);
			const json = error.toJSON();

			expect(json).toEqual({
				error: true,
				code: "AUTH_REQUIRED",
				message: "Auth failed",
				details: undefined,
			});

			// Preuve de non-fuite : le JSON ne doit pas contenir 'stack'
			expect(Object.keys(json)).not.toContain("stack");
		});

		it("inclut les détails dans la sérialisation si présents", () => {
			const error = new TaysirError(
				"Not Found",
				ErrorCodes.ERR_NOT_FOUND,
				404,
				{ id: "123" },
			);
			const json = error.toJSON();

			expect(json.details).toEqual({ id: "123" });
		});
	});

	describe("🟡 C. Hiérarchie et Prototypes", () => {
		it("est une instance de TaysirError et de Error", () => {
			const error = new TaysirError("Test", ErrorCodes.ERR_INTERNAL_SERVER);

			expect(error instanceof TaysirError).toBe(true);
			expect(error instanceof Error).toBe(true);
		});

		it("préserve le prototype après instanciation (Object.setPrototypeOf)", () => {
			const error = new TaysirError("Test", ErrorCodes.ERR_DATABASE_FAILURE);
			expect(Object.getPrototypeOf(error)).toBe(TaysirError.prototype);
		});
	});

	describe("🟢 D. Exhaustivité des Codes", () => {
		it("chaque code d'erreur est une chaîne non vide", () => {
			for (const key in ErrorCodes) {
				const value = ErrorCodes[key as keyof typeof ErrorCodes];
				expect(typeof value).toBe("string");
				expect(value.length).toBeGreaterThan(0);
			}
		});

		it("ERR_TENANT_MISMATCH correspond bien à l'isolation multi-tenant", () => {
			expect(ErrorCodes.ERR_TENANT_MISMATCH).toBe(
				"TENANT_DATA_ISOLATION_VIOLATION",
			);
		});
	});
});
