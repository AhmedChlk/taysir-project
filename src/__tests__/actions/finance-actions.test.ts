import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getTenantPrisma: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { getServerSession } from "next-auth/next";
import {
	createPaymentPlanAction,
	getPaymentReceiptDataAction,
	registerPaymentAction,
} from "@/actions/finance.actions";
import { getTenantPrisma } from "@/lib/prisma";

const makeSession = (override = {}) => ({
	user: { id: "u1", role: "ADMIN", etablissementId: "etab-1", ...override },
	expires: "2099-01-01",
});

const TRANCHE_ID = "550e8400-e29b-41d4-a716-446655440001";
const STUDENT_ID = "550e8400-e29b-41d4-a716-446655440002";
const ACTIVITY_ID = "550e8400-e29b-41d4-a716-446655440003";
const PAYMENT_ID = "550e8400-e29b-41d4-a716-446655440004";

const validPlanInput = {
	studentId: STUDENT_ID,
	activityId: ACTIVITY_ID,
	totalAmount: 5000,
	currency: "DZD" as const,
	tranches: [
		{ amount: 3000, dueDate: "2026-09-01" },
		{ amount: 2000, dueDate: "2026-10-01" },
	],
};

describe("createPaymentPlanAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un plan avec tranches dont la somme est cohérente", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi.fn().mockResolvedValue({ id: "plan-1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			paymentPlan: { create: mockCreate },
		} as never);

		const result = await createPaymentPlanAction(validPlanInput);
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledOnce();
	});

	it("rejette si la somme des tranches ne correspond pas au total", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await createPaymentPlanAction({
			...validPlanInput,
			totalAmount: 5000,
			tranches: [
				{ amount: 3000, dueDate: "2026-09-01" },
				{ amount: 1500, dueDate: "2026-10-01" },
			],
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		}
	});

	it("passe l'etablissementId sur chaque tranche créée", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi.fn().mockResolvedValue({ id: "plan-2" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			paymentPlan: { create: mockCreate },
		} as never);

		await createPaymentPlanAction(validPlanInput);

		const call = mockCreate.mock.calls[0]![0];
		const tranche = call.data.tranches.create[0];
		expect(tranche.etablissementId).toBe("etab-1");
	});

	it("retourne AUTH_REQUIRED sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await createPaymentPlanAction(validPlanInput);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("AUTH_REQUIRED");
		}
	});
});

describe("registerPaymentAction", () => {
	beforeEach(() => vi.clearAllMocks());

	const validInput = {
		trancheId: TRANCHE_ID,
		montant_paye: 1000,
		methode: "CASH" as const,
	};

	it("enregistre un paiement partiel", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const mockTranche = {
			id: TRANCHE_ID,
			amount: 5000,
			isPaid: false,
			paymentPlanId: "plan-1",
			paiements: [{ amount: 1000 }],
			paymentPlan: null,
		};

		const mockTx = {
			$executeRaw: vi.fn().mockResolvedValue(undefined),
			tranche: {
				findUnique: vi.fn().mockResolvedValue(mockTranche),
				update: vi.fn().mockResolvedValue({ ...mockTranche, isPaid: false }),
			},
			paiement: {
				create: vi.fn().mockResolvedValue({ id: "paiement-1", amount: 1000 }),
			},
			paymentPlan: {
				update: vi.fn().mockResolvedValue({ paidAmount: 2000, totalAmount: 5000 }),
			},
		};

		vi.mocked(getTenantPrisma).mockReturnValue({
			$transaction: vi.fn().mockImplementation(async (fn) => fn(mockTx)),
		} as never);

		const result = await registerPaymentAction(validInput);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.trancheStatut).toBe("PARTIAL");
		}
	});

	it("marque la tranche comme PAID si montant complet", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const mockTranche = {
			id: TRANCHE_ID,
			amount: 5000,
			isPaid: false,
			paymentPlanId: "plan-1",
			paiements: [],
			paymentPlan: null,
		};

		const mockTx = {
			$executeRaw: vi.fn().mockResolvedValue(undefined),
			tranche: {
				findUnique: vi.fn().mockResolvedValue(mockTranche),
				update: vi.fn().mockResolvedValue({ ...mockTranche, isPaid: true }),
			},
			paiement: {
				create: vi.fn().mockResolvedValue({ id: "paiement-2", amount: 5000 }),
			},
			paymentPlan: {
				update: vi.fn().mockResolvedValue({ paidAmount: 5000, totalAmount: 5000 }),
			},
		};

		vi.mocked(getTenantPrisma).mockReturnValue({
			$transaction: vi.fn().mockImplementation(async (fn) => fn(mockTx)),
		} as never);

		const result = await registerPaymentAction({ ...validInput, montant_paye: 5000 });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.trancheStatut).toBe("PAID");
		}
	});

	it("rejette si tranche introuvable", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const mockTx = {
			$executeRaw: vi.fn().mockResolvedValue(undefined),
			tranche: { findUnique: vi.fn().mockResolvedValue(null) },
			paiement: { create: vi.fn() },
			paymentPlan: { update: vi.fn() },
		};

		vi.mocked(getTenantPrisma).mockReturnValue({
			$transaction: vi.fn().mockImplementation(async (fn) => fn(mockTx)),
		} as never);

		const result = await registerPaymentAction(validInput);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
		}
	});

	it("rejette si tranche déjà soldée", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const mockTx = {
			$executeRaw: vi.fn().mockResolvedValue(undefined),
			tranche: {
				findUnique: vi.fn().mockResolvedValue({
					id: TRANCHE_ID,
					amount: 5000,
					isPaid: true,
					paymentPlanId: "plan-1",
					paiements: [],
				}),
			},
			paiement: { create: vi.fn() },
			paymentPlan: { update: vi.fn() },
		};

		vi.mocked(getTenantPrisma).mockReturnValue({
			$transaction: vi.fn().mockImplementation(async (fn) => fn(mockTx)),
		} as never);

		const result = await registerPaymentAction(validInput);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		}
	});

	it("rejette si montant dépasse le solde restant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const mockTx = {
			$executeRaw: vi.fn().mockResolvedValue(undefined),
			tranche: {
				findUnique: vi.fn().mockResolvedValue({
					id: TRANCHE_ID,
					amount: 1000,
					isPaid: false,
					paymentPlanId: "plan-1",
					paiements: [{ amount: 800 }],
				}),
			},
			paiement: { create: vi.fn() },
			paymentPlan: { update: vi.fn() },
		};

		vi.mocked(getTenantPrisma).mockReturnValue({
			$transaction: vi.fn().mockImplementation(async (fn) => fn(mockTx)),
		} as never);

		// 500 > (1000 - 800) + 0.01 = 200.01 → rejet
		const result = await registerPaymentAction({ ...validInput, montant_paye: 500 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		}
	});
});

describe("getPaymentReceiptDataAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les données de reçu pour un paiement valide", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const mockPayment = {
			id: PAYMENT_ID,
			date: new Date("2026-04-01"),
			amount: 3000,
			method: "CASH",
			reference: null,
			tranche: {
				amount: 5000,
				paiements: [{ amount: 3000 }],
				paymentPlan: {
					student: { firstName: "Ali", lastName: "Ben" },
					etablissement: { name: "École Test" },
				},
			},
		};

		vi.mocked(getTenantPrisma).mockReturnValue({
			paiement: { findUnique: vi.fn().mockResolvedValue(mockPayment) },
		} as never);

		const result = await getPaymentReceiptDataAction({ paiementId: PAYMENT_ID });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.studentFirstName).toBe("Ali");
			expect(result.data.resteSurTranche).toBe(2000);
		}
	});

	it("retourne NOT_FOUND si paiement introuvable", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		vi.mocked(getTenantPrisma).mockReturnValue({
			paiement: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await getPaymentReceiptDataAction({ paiementId: PAYMENT_ID });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
		}
	});
});
