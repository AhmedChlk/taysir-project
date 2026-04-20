import { describe, expect, it } from "vitest";
import {
	ActivitySchema,
	CreateGroupSchema,
	CreatePaymentPlanSchema,
	CreateStudentSchema,
	CreateUserSchema,
	PaymentSchema,
	RoomSchema,
	UpdateGroupSchema,
	UpdateStudentSchema,
} from "@/lib/validations";

const TEST_PASSWORD_VALID = process.env.TEST_PASSWORD as string;

describe("CreateUserSchema", () => {
	const valid = {
		email: "user@school.dz",
		firstName: "Ahmed",
		lastName: "Benali",
		role: "ADMIN" as never,
		password: TEST_PASSWORD_VALID,
	};

	it("valide un utilisateur correct", () => {
		expect(CreateUserSchema.safeParse(valid).success).toBe(true);
	});

	it("rejette un email invalide", () => {
		expect(
			CreateUserSchema.safeParse({ ...valid, email: "not-email" }).success,
		).toBe(false);
	});

	it("rejette un prénom trop court", () => {
		expect(
			CreateUserSchema.safeParse({ ...valid, firstName: "A" }).success,
		).toBe(false);
	});

	it("rejette un mot de passe < 8 caractères", () => {
		expect(
			CreateUserSchema.safeParse({ ...valid, password: "short" }).success,
		).toBe(false);
	});
});

describe("CreateStudentSchema", () => {
	const valid = {
		firstName: "Youcef",
		lastName: "Mansour",
		email: "y@y.dz",
		photoUrl: "https://cdn.example.com/img.jpg",
		isMinor: false,
	};

	it("valide un élève correct", () => {
		expect(CreateStudentSchema.safeParse(valid).success).toBe(true);
	});

	it("rejette un prénom trop court", () => {
		expect(
			CreateStudentSchema.safeParse({ ...valid, firstName: "Y" }).success,
		).toBe(false);
	});

	it("rejette un email invalide", () => {
		expect(
			CreateStudentSchema.safeParse({ ...valid, email: "bad" }).success,
		).toBe(false);
	});

	it("accepte un email vide (champ optionnel)", () => {
		expect(CreateStudentSchema.safeParse({ ...valid, email: "" }).success).toBe(
			true,
		);
	});

	it("rejette une photoUrl invalide", () => {
		expect(
			CreateStudentSchema.safeParse({ ...valid, photoUrl: "not-a-url" })
				.success,
		).toBe(false);
	});

	it("accepte groupIds vide par défaut", () => {
		const result = CreateStudentSchema.safeParse(valid);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.groupIds).toEqual([]);
	});
});

describe("UpdateStudentSchema", () => {
	it("requiert un UUID valide pour id", () => {
		expect(
			UpdateStudentSchema.safeParse({
				id: "bad-id",
				firstName: "X",
				lastName: "Y",
				photoUrl: "https://x.com/img.jpg",
				isMinor: false,
			}).success,
		).toBe(false);
	});

	it("valide un update correct", () => {
		expect(
			UpdateStudentSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440001",
				firstName: "Youcef",
				lastName: "Mansour",
				photoUrl: "https://cdn.example.com/img.jpg",
				isMinor: false,
			}).success,
		).toBe(true);
	});
});

describe("CreatePaymentPlanSchema", () => {
	const valid = {
		studentId: "550e8400-e29b-41d4-a716-446655440001",
		activityId: "550e8400-e29b-41d4-a716-446655440002",
		totalAmount: 50000,
		tranches: [
			{ amount: 25000, dueDate: "2024-09-01" },
			{ amount: 25000, dueDate: "2024-10-01" },
		],
	};

	it("valide un plan de paiement correct avec devise par défaut", () => {
		const result = CreatePaymentPlanSchema.safeParse(valid);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.currency).toBe("DZD");
	});

	it("accepte EUR comme devise", () => {
		expect(
			CreatePaymentPlanSchema.safeParse({ ...valid, currency: "EUR" }).success,
		).toBe(true);
	});

	it("rejette une devise inconnue", () => {
		expect(
			CreatePaymentPlanSchema.safeParse({ ...valid, currency: "GBP" }).success,
		).toBe(false);
	});

	it("rejette si tranches est vide", () => {
		expect(
			CreatePaymentPlanSchema.safeParse({ ...valid, tranches: [] }).success,
		).toBe(false);
	});

	it("rejette un totalAmount négatif", () => {
		expect(
			CreatePaymentPlanSchema.safeParse({ ...valid, totalAmount: -100 })
				.success,
		).toBe(false);
	});
});

describe("PaymentSchema", () => {
	const valid = {
		id: "id-1",
		etablissementId: "etab-1",
		studentId: "stu-1",
		totalAmount: 10000,
		paidAmount: 5000,
		currency: "DZD",
		status: "PARTIAL" as const,
	};

	it("valide un paiement correct", () => {
		expect(PaymentSchema.safeParse(valid).success).toBe(true);
	});

	it("accepte USD comme devise", () => {
		expect(PaymentSchema.safeParse({ ...valid, currency: "USD" }).success).toBe(
			true,
		);
	});

	it("rejette une devise inconnue", () => {
		expect(PaymentSchema.safeParse({ ...valid, currency: "XOF" }).success).toBe(
			false,
		);
	});
});

describe("RoomSchema", () => {
	it("valide une salle correcte", () => {
		expect(
			RoomSchema.safeParse({ name: "Salle A", capacity: 20 }).success,
		).toBe(true);
	});

	it("rejette un nom trop court", () => {
		expect(RoomSchema.safeParse({ name: "A", capacity: 10 }).success).toBe(
			false,
		);
	});

	it("rejette une capacité < 1", () => {
		expect(RoomSchema.safeParse({ name: "Salle B", capacity: 0 }).success).toBe(
			false,
		);
	});
});

describe("ActivitySchema", () => {
	it("valide une activité correcte", () => {
		expect(ActivitySchema.safeParse({ name: "Yoga" }).success).toBe(true);
	});

	it("valide une couleur hexadécimale valide", () => {
		expect(
			ActivitySchema.safeParse({ name: "Yoga", color: "#FF5733" }).success,
		).toBe(true);
	});

	it("rejette une couleur invalide", () => {
		expect(
			ActivitySchema.safeParse({ name: "Yoga", color: "red" }).success,
		).toBe(false);
	});
});

describe("CreateGroupSchema & UpdateGroupSchema", () => {
	it("valide un groupe correct", () => {
		expect(CreateGroupSchema.safeParse({ name: "Groupe A" }).success).toBe(
			true,
		);
	});

	it("rejette un nom trop court", () => {
		expect(CreateGroupSchema.safeParse({ name: "G" }).success).toBe(false);
	});

	it("UpdateGroupSchema requiert un UUID", () => {
		expect(
			UpdateGroupSchema.safeParse({ id: "bad", name: "Groupe A" }).success,
		).toBe(false);
	});

	it("UpdateGroupSchema valide avec UUID correct", () => {
		expect(
			UpdateGroupSchema.safeParse({
				id: "550e8400-e29b-41d4-a716-446655440001",
				name: "Groupe B",
			}).success,
		).toBe(true);
	});
});
