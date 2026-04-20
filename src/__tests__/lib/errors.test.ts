import { describe, expect, it } from "vitest";
import { ErrorCodes, TaysirError } from "@/lib/errors";

describe("ErrorCodes", () => {
	it("contient toutes les clés requises", () => {
		expect(ErrorCodes.ERR_UNAUTHORIZED).toBe("AUTH_REQUIRED");
		expect(ErrorCodes.ERR_FORBIDDEN).toBe("FORBIDDEN_ACCESS");
		expect(ErrorCodes.ERR_INVALID_DATA).toBe("INVALID_DATA_FORMAT");
		expect(ErrorCodes.ERR_TENANT_MISMATCH).toBe(
			"TENANT_DATA_ISOLATION_VIOLATION",
		);
		expect(ErrorCodes.ERR_NOT_FOUND).toBe("RESOURCE_NOT_FOUND");
		expect(ErrorCodes.ERR_INTERNAL_SERVER).toBe("INTERNAL_SERVER_ERROR");
		expect(ErrorCodes.ERR_DATABASE_FAILURE).toBe("DATABASE_OPERATION_FAILED");
	});
});

describe("TaysirError", () => {
	it("hérite de Error", () => {
		const err = new TaysirError("msg", ErrorCodes.ERR_UNAUTHORIZED);
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(TaysirError);
	});

	it("a le bon name", () => {
		const err = new TaysirError("msg", ErrorCodes.ERR_UNAUTHORIZED);
		expect(err.name).toBe("TaysirError");
	});

	it("stocke le message, code et status par défaut (400)", () => {
		const err = new TaysirError("erreur", ErrorCodes.ERR_INVALID_DATA);
		expect(err.message).toBe("erreur");
		expect(err.code).toBe("INVALID_DATA_FORMAT");
		expect(err.status).toBe(400);
	});

	it("accepte un status personnalisé", () => {
		const err = new TaysirError("non trouvé", ErrorCodes.ERR_NOT_FOUND, 404);
		expect(err.status).toBe(404);
	});

	it("stocke les details optionnels", () => {
		const details = { field: "email" };
		const err = new TaysirError(
			"invalid",
			ErrorCodes.ERR_INVALID_DATA,
			400,
			details,
		);
		expect(err.details).toEqual(details);
	});

	it("details est undefined par défaut", () => {
		const err = new TaysirError("msg", ErrorCodes.ERR_UNAUTHORIZED);
		expect(err.details).toBeUndefined();
	});

	it("toJSON retourne la structure attendue", () => {
		const err = new TaysirError("erreur", ErrorCodes.ERR_FORBIDDEN, 403, {
			x: 1,
		});
		expect(err.toJSON()).toEqual({
			error: true,
			code: "FORBIDDEN_ACCESS",
			message: "erreur",
			details: { x: 1 },
		});
	});

	it("instanceof fonctionne après setPrototypeOf", () => {
		const err = new TaysirError("msg", ErrorCodes.ERR_INTERNAL_SERVER);
		expect(err instanceof TaysirError).toBe(true);
	});

	it("peut être capturée comme TaysirError dans un try/catch", () => {
		let caught: TaysirError | null = null;
		try {
			throw new TaysirError("oops", ErrorCodes.ERR_DATABASE_FAILURE, 500);
		} catch (e) {
			if (e instanceof TaysirError) caught = e;
		}
		expect(caught).not.toBeNull();
		expect(caught?.code).toBe("DATABASE_OPERATION_FAILED");
	});
});
