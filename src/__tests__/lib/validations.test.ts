import { describe, expect, it } from "vitest";
import {
	ActivitySchema,
	CreateDocumentSchema,
	CreatePaymentPlanSchema,
	CreateSessionSchema,
	CreateUserSchema,
	MarkPresenceSchema,
	RoomSchema,
} from "@/lib/validations";

describe("Validations Stress Test", () => {
	describe("CreateUserSchema", () => {
		it("Fail: email invalide et mot de passe trop court", () => {
			const result = CreateUserSchema.safeParse({
				email: "pas-un-email",
				firstName: "A",
				lastName: "B",
				role: "ADMIN",
				password: "123",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const issues = result.error.issues;
				expect(issues.some((i) => i.path.includes("email"))).toBe(true);
				expect(issues.some((i) => i.path.includes("password"))).toBe(true);
			}
		});

		it("Success: avec avatarUrl optionnel", () => {
			const valid = {
				email: "test@test.com",
				firstName: "Ahmed",
				lastName: "Ben",
				role: "ADMIN",
				password: process.env.TEST_PASSWORD || "password123",
				avatarUrl: "https://photo.com/me.jpg",
			};
			expect(CreateUserSchema.safeParse(valid).success).toBe(true);
		});
	});

	describe("CreatePaymentPlanSchema", () => {
		const base = {
			studentId: "550e8400-e29b-41d4-a716-446655440001",
			activityId: "550e8400-e29b-41d4-a716-446655440002",
		};

		it("Success: Minimal (totalAmount et tranches optionnels)", () => {
			expect(CreatePaymentPlanSchema.safeParse(base).success).toBe(true);
		});

		it("Fail: montant négatif", () => {
			expect(
				CreatePaymentPlanSchema.safeParse({ ...base, totalAmount: -100 })
					.success,
			).toBe(false);
		});

		it("Success: Complet avec tranches", () => {
			const full = {
				...base,
				totalAmount: 5000,
				currency: "EUR",
				tranches: [{ amount: 5000, dueDate: "2026-01-01" }],
			};
			expect(CreatePaymentPlanSchema.safeParse(full).success).toBe(true);
		});
	});

	describe("MarkPresenceSchema", () => {
		const base = {
			seanceId: "550e8400-e29b-41d4-a716-446655440001",
			participantId: "550e8400-e29b-41d4-a716-446655440002",
			statut: "PRESENT",
		};

		it("Fail: retard négatif", () => {
			expect(
				MarkPresenceSchema.safeParse({ ...base, retard: -5 }).success,
			).toBe(false);
		});

		it("Success: avec note et retard valide", () => {
			expect(
				MarkPresenceSchema.safeParse({
					...base,
					retard: 15,
					note: "En retard de 15m",
				}).success,
			).toBe(true);
		});
	});

	describe("ActivitySchema", () => {
		it("Fail: Regex couleur invalide", () => {
			const base = { name: "Math" };
			expect(ActivitySchema.safeParse({ ...base, color: "red" }).success).toBe(
				false,
			);
			expect(ActivitySchema.safeParse({ ...base, color: "#ABC" }).success).toBe(
				false,
			); // Doit être 6 chars
			expect(
				ActivitySchema.safeParse({ ...base, color: "#GHIJKL" }).success,
			).toBe(false);
		});

		it("Success: Regex couleur valide", () => {
			expect(
				ActivitySchema.safeParse({ name: "Math", color: "#FF0000" }).success,
			).toBe(true);
		});

		it("Fail: Durée trop courte", () => {
			expect(
				ActivitySchema.safeParse({ name: "Math", duration: 10 }).success,
			).toBe(false);
		});
	});

	describe("CreateSessionSchema (Refinements)", () => {
		const base = {
			activityId: "550e8400-e29b-41d4-a716-446655440001",
			roomId: "550e8400-e29b-41d4-a716-446655440002",
			instructorId: "550e8400-e29b-41d4-a716-446655440003",
			groupId: "550e8400-e29b-41d4-a716-446655440004",
		};

		it("Fail: Date de fin avant début", () => {
			const result = CreateSessionSchema.safeParse({
				...base,
				startTime: new Date("2026-01-01T10:00:00Z"),
				endTime: new Date("2026-01-01T09:00:00Z"),
			});
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error?.issues[0]?.message).toMatch(
					/après l'heure de début/,
				);
		});

		it("Fail: Date de fin égale au début", () => {
			const date = new Date();
			expect(
				CreateSessionSchema.safeParse({
					...base,
					startTime: date,
					endTime: date,
				}).success,
			).toBe(false);
		});
	});

	describe("CreateDocumentSchema (Refinements)", () => {
		const base = {
			studentId: "550e8400-e29b-41d4-a716-446655440001",
			name: "Doc",
		};

		it("Fail: protocole non sécurisé (javascript, data, ftp)", () => {
			expect(
				CreateDocumentSchema.safeParse({ ...base, url: "javascript:alert(1)" })
					.success,
			).toBe(false);
			expect(
				CreateDocumentSchema.safeParse({
					...base,
					url: "ftp://files.com/doc.pdf",
				}).success,
			).toBe(false);
		});

		it("Success: http ou https", () => {
			expect(
				CreateDocumentSchema.safeParse({
					...base,
					url: "https://cdn.dz/doc.pdf",
				}).success,
			).toBe(true);
			expect(
				CreateDocumentSchema.safeParse({
					...base,
					url: "http://localhost:3000/test.pdf",
				}).success,
			).toBe(true);
		});
	});

	describe("Edge Cases Génériques", () => {
		it("Trim et chaines vides : CreateUserSchema rejette chaines vides avec espaces", () => {
			// Note: Si .trim() n'est pas utilisé, CreateUserSchema.min(2) devrait quand même rejeter " "
			expect(
				CreateUserSchema.safeParse({
					email: "a@b.com",
					firstName: " ",
					lastName: " ",
					role: "ADMIN",
					password: process.env.TEST_PASSWORD || "password123",
				}).success,
			).toBe(false);
		});

		it("Nettoyage des clés excessives : Zod ignore les champs inconnus", () => {
			const dataWithHacks = {
				id: "550e8400-e29b-41d4-a716-446655440001",
				name: "Salle A",
				capacity: 10,
				maliciousField: "DROP TABLE Users;",
			};
			const result = RoomSchema.safeParse(dataWithHacks);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).not.toHaveProperty("maliciousField");
			}
		});
	});
});
