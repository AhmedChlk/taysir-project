import { describe, expect, it } from "vitest";
import { RegisterPaymentSchema } from "@/lib/validations";

describe("RegisterPaymentSchema — protection SQL injection", () => {
	const validBase = {
		trancheId: "550e8400-e29b-41d4-a716-446655440000",
		montant_paye: 5000,
		methode: "CASH" as const,
	};

	it("accepte un UUID valide", () => {
		const result = RegisterPaymentSchema.safeParse(validBase);
		expect(result.success).toBe(true);
	});

	it("rejette un trancheId avec payload SQL injection classique", () => {
		const result = RegisterPaymentSchema.safeParse({
			...validBase,
			trancheId: "' OR '1'='1",
		});
		expect(result.success).toBe(false);
	});

	it("rejette un trancheId avec commentaire SQL", () => {
		const result = RegisterPaymentSchema.safeParse({
			...validBase,
			trancheId: 'uuid-valid\'; DROP TABLE "Tranche"; --',
		});
		expect(result.success).toBe(false);
	});

	it("rejette un trancheId vide", () => {
		const result = RegisterPaymentSchema.safeParse({
			...validBase,
			trancheId: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejette un trancheId non-UUID (format invalide)", () => {
		const result = RegisterPaymentSchema.safeParse({
			...validBase,
			trancheId: "not-a-uuid-format",
		});
		expect(result.success).toBe(false);
	});

	it("rejette un montant négatif", () => {
		const result = RegisterPaymentSchema.safeParse({
			...validBase,
			montant_paye: -100,
		});
		expect(result.success).toBe(false);
	});

	it("rejette un montant nul", () => {
		const result = RegisterPaymentSchema.safeParse({
			...validBase,
			montant_paye: 0,
		});
		expect(result.success).toBe(false);
	});
});
