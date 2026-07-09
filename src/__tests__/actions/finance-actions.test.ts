import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ getTenantPrisma: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from "next/cache";
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

// Erreur simulée type Prisma
class PrismaKnownError extends Error {
	code: string;
	constructor(message: string, code: string) {
		super(message);
		this.code = code;
		this.name = "PrismaClientKnownRequestError";
	}
}

describe("Finance Actions Audit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("1. createPaymentPlanAction", () => {
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

		describe("🔴 A. Sécurité et Isolation", () => {
			it("Unauthenticated : bloque l'action si pas de session", async () => {
				vi.mocked(getServerSession).mockResolvedValue(null);
				const result = await createPaymentPlanAction(validPlanInput);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("AUTH_REQUIRED");
				}
			});

			it("Cross-Tenant Access : Injecte bien le tenantId de la session dans la création (y compris les tranches)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(
					makeSession({ etablissementId: "tenant-hack" }) as never,
				);
				const mockCreate = vi.fn().mockResolvedValue({ id: "plan-1" });
				vi.mocked(getTenantPrisma).mockReturnValue({
					paymentPlan: { create: mockCreate },
				} as never);

				const result = await createPaymentPlanAction(validPlanInput);
				expect(result.success).toBe(true);

				const callArgs = mockCreate.mock.calls[0]![0];
				expect(callArgs.data.etablissementId).toBe("tenant-hack");
				expect(callArgs.data.tranches.create[0].etablissementId).toBe(
					"tenant-hack",
				);
			});
		});

		describe("🟠 B. Résilience et Désastres", () => {
			it("Prisma Down : Capture une erreur DB générique sans crasher", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockCreate = vi
					.fn()
					.mockRejectedValue(new Error("DB CONNECTION LOST"));
				vi.mocked(getTenantPrisma).mockReturnValue({
					paymentPlan: { create: mockCreate },
				} as never);

				const result = await createPaymentPlanAction(validPlanInput);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
				}
			});

			it("Unique Constraint Violation : Gère une duplication P2002 via le wrapper (safe-action gère la capture globale)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockCreate = vi
					.fn()
					.mockRejectedValue(
						new PrismaKnownError("Unique constraint", "P2002"),
					);
				vi.mocked(getTenantPrisma).mockReturnValue({
					paymentPlan: { create: mockCreate },
				} as never);

				const result = await createPaymentPlanAction(validPlanInput);
				expect(result.success).toBe(false);
			});
		});

		describe("🟡 C. Validations et Limites (Zod / Logique)", () => {
			it("Incohérence des tranches : rejette si la somme ne vaut pas le totalAmount", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const result = await createPaymentPlanAction({
					...validPlanInput,
					totalAmount: 10000, // Total = 10000, mais tranches = 5000
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("INVALID_DATA_FORMAT");
					expect(result.error.message).toMatch(/exactement égal/);
				}
			});

			it("Zod Limites : Payload incomplet (studentId manquant)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const result = await createPaymentPlanAction({
					activityId: ACTIVITY_ID,
					totalAmount: 5000,
					currency: "DZD",
					tranches: [],
				} as any);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("INVALID_DATA_FORMAT");
				}
			});
		});

		describe("🟢 D. Le Happy Path Extrême", () => {
			it("Succès : Calcule automatiquement le totalAmount si omis ou null", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockCreate = vi.fn().mockResolvedValue({ id: "plan-auto" });
				vi.mocked(getTenantPrisma).mockReturnValue({
					paymentPlan: { create: mockCreate },
				} as never);

				const result = await createPaymentPlanAction({
					...validPlanInput,
					totalAmount: undefined as any,
				});

				expect(result.success).toBe(true);
				expect(mockCreate.mock.calls[0]?.[0]?.data.totalAmount).toBe(5000);
				expect(revalidateTag).toHaveBeenCalledWith("finance-etab-1", "max");
			});

			it("Succès : Sans tranches (totalAmount est conservé)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockCreate = vi.fn().mockResolvedValue({ id: "plan-notranches" });
				vi.mocked(getTenantPrisma).mockReturnValue({
					paymentPlan: { create: mockCreate },
				} as never);

				const result = await createPaymentPlanAction({
					studentId: STUDENT_ID,
					activityId: ACTIVITY_ID,
					totalAmount: 9000,
					currency: "DZD" as const,
					tranches: undefined as any,
				});

				expect(result.success).toBe(true);
				expect(mockCreate.mock.calls[0]?.[0]?.data.totalAmount).toBe(9000);
				expect(
					mockCreate.mock.calls[0]?.[0]?.data.tranches.create,
				).toHaveLength(0);
			});
		});
	});

	describe("2. registerPaymentAction", () => {
		const validPaymentInput = {
			trancheId: TRANCHE_ID,
			montant_paye: 1000,
			methode: "CASH" as const,
			reference: "REF-123",
			note: "<script>alert(1)</script>", // Test d'injection basique
		};

		const buildMockTranche = (overrides = {}) => ({
			id: TRANCHE_ID,
			amount: 5000,
			isPaid: false,
			paymentPlanId: "plan-1",
			paiements: [],
			paymentPlan: {
				totalAmount: 5000,
				paidAmount: 0,
				student: {
					firstName: "Test",
					lastName: "Élève",
					parentPhone: "0661000000",
					phone: null,
				},
				etablissement: { name: "École Test" },
			},
			...overrides,
		});

		describe("🔴 A. Sécurité et Isolation", () => {
			it("Bloque si la tranche est introuvable pour ce tenantId (Cross-Tenant spoof)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockTx = {
					$executeRaw: vi.fn().mockResolvedValue(undefined),
					tranche: { findUnique: vi.fn().mockResolvedValue(null) }, // Tranche introuvable = tentative d'accès frauduleux
				};
				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
				} as never);

				const result = await registerPaymentAction(validPaymentInput);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
				}
			});
		});

		describe("🟠 B. Résilience et Désastres", () => {
			it("Transaction Rollback : Si une erreur survient, la transaction est abandonnée", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi
						.fn()
						.mockRejectedValue(new Error("TRANSACTION_FAILED")),
				} as never);

				const result = await registerPaymentAction(validPaymentInput);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
				}
			});
		});

		describe("🟡 C. Validations et Limites", () => {
			it("Rejette si la tranche est déjà soldée (isPaid = true)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockTx = {
					$executeRaw: vi.fn().mockResolvedValue(undefined),
					tranche: {
						findUnique: vi
							.fn()
							.mockResolvedValue(buildMockTranche({ isPaid: true })),
					},
				};
				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
				} as never);

				const result = await registerPaymentAction(validPaymentInput);
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("INVALID_DATA_FORMAT");
					expect(result.error.message).toMatch(/soldée/);
				}
			});

			it("Rejette si le montant dépasse le solde restant + 0.01 de marge", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockTx = {
					$executeRaw: vi.fn().mockResolvedValue(undefined),
					tranche: {
						findUnique: vi.fn().mockResolvedValue(
							buildMockTranche({
								amount: 1000,
								paiements: [{ amount: 800 }], // Reste = 200
							}),
						),
					},
				};
				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
				} as never);

				const result = await registerPaymentAction({
					...validPaymentInput,
					montant_paye: 500,
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.message).toMatch(/dépasse le solde/);
				}
			});
		});

		describe("🟢 D. Le Happy Path Extrême", () => {
			it("Succès : Paiement partiel avec référence et note (Injection safe)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockPaiementCreate = vi
					.fn()
					.mockResolvedValue({ id: "p-1", amount: 1000 });
				const mockPlanUpdate = vi
					.fn()
					.mockResolvedValue({ paidAmount: 1000, totalAmount: 5000 });
				const mockTrancheUpdate = vi.fn();

				const mockTx = {
					$executeRaw: vi.fn().mockResolvedValue(undefined),
					tranche: {
						findUnique: vi.fn().mockResolvedValue(buildMockTranche()),
						update: mockTrancheUpdate,
					},
					paiement: {
					create: mockPaiementCreate,
					findFirst: vi.fn().mockResolvedValue({ receiptNumber: 0 }),
				},
					paymentPlan: { update: mockPlanUpdate },
				};

				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
				} as never);

				const result = await registerPaymentAction(validPaymentInput);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.trancheStatut).toBe("PARTIAL");
					expect(result.data.resteSurTranche).toBe(4000);
				}

				// Vérifie l'injection des datas et la création
				expect(mockPaiementCreate.mock.calls[0]?.[0]?.data.note).toBe(
					"<script>alert(1)</script>",
				);
				// La tranche n'est pas soldée
				expect(mockTrancheUpdate).not.toHaveBeenCalled();
				// Le plan n'est pas full paid
				expect(mockPlanUpdate).toHaveBeenLastCalledWith(
					expect.objectContaining({
						data: { status: "PARTIAL" },
					}),
				);
			});

			it("Succès : Paiement avec champs optionnels omis (couverture des fallbacks nuls)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockPaiementCreate = vi
					.fn()
					.mockResolvedValue({ id: "p-opt", amount: 1000 });
				const mockPlanUpdate = vi
					.fn()
					.mockResolvedValue({ paidAmount: 1000, totalAmount: 5000 });

				const mockTx = {
					$executeRaw: vi.fn().mockResolvedValue(undefined),
					tranche: {
						findUnique: vi.fn().mockResolvedValue(buildMockTranche()),
						update: vi.fn(),
					},
					paiement: {
					create: mockPaiementCreate,
					findFirst: vi.fn().mockResolvedValue({ receiptNumber: 0 }),
				},
					paymentPlan: { update: mockPlanUpdate },
				};

				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
				} as never);

				const minimalInput = {
					trancheId: TRANCHE_ID,
					montant_paye: 1000,
					methode: "CASH" as const,
				};

				const result = await registerPaymentAction(minimalInput);
				expect(result.success).toBe(true);

				const createArgs = mockPaiementCreate.mock.calls[0]![0];
				expect(createArgs.data.reference).toBeNull();
				expect(createArgs.data.note).toBeNull();
			});

			it("Succès : Paiement total qui ferme la tranche ET le payment plan", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockPaiementCreate = vi
					.fn()
					.mockResolvedValue({ id: "p-2", amount: 5000 });
				const mockPlanUpdate = vi
					.fn()
					.mockResolvedValue({ paidAmount: 5000, totalAmount: 5000 }); // Plan soldé
				const mockTrancheUpdate = vi.fn();

				const mockTx = {
					$executeRaw: vi.fn().mockResolvedValue(undefined),
					tranche: {
						findUnique: vi.fn().mockResolvedValue(buildMockTranche()),
						update: mockTrancheUpdate,
					},
					paiement: {
					create: mockPaiementCreate,
					findFirst: vi.fn().mockResolvedValue({ receiptNumber: 0 }),
				},
					paymentPlan: { update: mockPlanUpdate },
				};

				vi.mocked(getTenantPrisma).mockReturnValue({
					$transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
				} as never);

				const result = await registerPaymentAction({
					...validPaymentInput,
					montant_paye: 5000,
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.trancheStatut).toBe("PAID");
					expect(result.data.resteSurTranche).toBe(0);
				}

				// Tranche mise à jour à PAID
				expect(mockTrancheUpdate).toHaveBeenCalledWith(
					expect.objectContaining({ data: { isPaid: true } }),
				);
				// Plan mis à jour à PAID
				expect(mockPlanUpdate).toHaveBeenLastCalledWith(
					expect.objectContaining({ data: { status: "PAID" } }),
				);
			});
		});
	});

	describe("3. getPaymentReceiptDataAction", () => {
		describe("🔴 Sécurité et Isolation", () => {
			it("Retourne NOT_FOUND si le paiement n'appartient pas au tenant (IDOR)", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				vi.mocked(getTenantPrisma).mockReturnValue({
					paiement: { findUnique: vi.fn().mockResolvedValue(null) },
				} as never);

				const result = await getPaymentReceiptDataAction({
					paiementId: PAYMENT_ID,
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
				}
			});
		});

		describe("🟢 Happy Path", () => {
			it("Génère les données du reçu avec calcul correct du reste sur tranche", async () => {
				vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
				const mockPayment = {
					id: PAYMENT_ID,
					date: new Date("2026-04-01"),
					amount: 2000,
					method: "CREDIT_CARD",
					reference: "REF-CARD",
					tranche: {
						amount: 5000,
						paiements: [{ amount: 2000 }, { amount: 500 }], // Reste = 2500
						paymentPlan: {
							student: { firstName: "Test", lastName: "User" },
							etablissement: { name: "Test School" },
						},
					},
				};

				vi.mocked(getTenantPrisma).mockReturnValue({
					paiement: { findUnique: vi.fn().mockResolvedValue(mockPayment) },
				} as never);

				const result = await getPaymentReceiptDataAction({
					paiementId: PAYMENT_ID,
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.resteSurTranche).toBe(2500);
					expect(result.data.studentFirstName).toBe("Test");
					expect(result.data.schoolName).toBe("Test School");
				}
			});
		});
	});
});
