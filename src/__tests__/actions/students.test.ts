import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	getTenantPrisma: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
	addStudentToGroupAction,
	createStudentAction,
	deleteStudentAction,
	getStudentFullProfileAction,
	removeStudentFromGroupAction,
	updateStudentAction,
} from "@/actions/students.actions";
import { getTenantPrisma } from "@/lib/prisma";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-abc",
		...override,
	},
	expires: "2099-01-01",
});

const validStudentInput = {
	firstName: "Youcef",
	lastName: "Brahim",
	email: "youcef@test.dz",
	phone: "0555000000",
	address: "1 Rue Didouche",
	photoUrl: "https://cdn.example.com/photo.jpg",
	isMinor: false,
	parentName: null,
	parentPhone: null,
	parentEmail: null,
	groupIds: [],
};

describe("createStudentAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un élève sans groupes", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi
			.fn()
			.mockResolvedValue({ id: "stu-1", ...validStudentInput });
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { create: mockCreate },
		} as never);

		const result = await createStudentAction(validStudentInput);
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.not.objectContaining({ groups: expect.anything() }),
			}),
		);
	});

	it("crée un élève avec groupes valides", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const groupId = "550e8400-e29b-41d4-a716-446655440002";
		const mockFindMany = vi.fn().mockResolvedValue([{ id: groupId }]);
		const mockCreate = vi.fn().mockResolvedValue({ id: "stu-2" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findMany: mockFindMany },
			student: { create: mockCreate },
		} as never);

		const result = await createStudentAction({
			...validStudentInput,
			groupIds: [groupId],
		});
		expect(result.success).toBe(true);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});

	it("rejette si un groupe n'appartient pas au tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([]); // 0 groupes valides (cross-tenant)
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findMany: mockFindMany },
		} as never);

		const result = await createStudentAction({
			...validStudentInput,
			groupIds: ["550e8400-e29b-41d4-a716-446655440099"],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
		}
	});

	it("retourne AUTH_REQUIRED sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await createStudentAction(validStudentInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});
});

describe("updateStudentAction", () => {
	beforeEach(() => vi.clearAllMocks());

	const updateInput = {
		id: "550e8400-e29b-41d4-a716-446655440001",
		...validStudentInput,
	};

	it("met à jour un élève avec contrainte id_etablissementId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({ id: updateInput.id });
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { update: mockUpdate },
		} as never);

		const result = await updateStudentAction(updateInput);
		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_etablissementId: {
						id: updateInput.id,
						etablissementId: "etab-abc",
					},
				},
			}),
		);
	});

	it("rejette les groupes invalides à l'update (cross-tenant)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findMany: vi.fn().mockResolvedValue([]) }, // 0 groups found
		} as never);

		const result = await updateStudentAction({
			...updateInput,
			groupIds: ["550e8400-e29b-41d4-a716-446655440099"],
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});
});

describe("deleteStudentAction", () => {
	beforeEach(() => vi.clearAllMocks());

	const deleteInput = { id: "550e8400-e29b-41d4-a716-446655440001" };

	it("supprime un élève sans plans de paiement", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: deleteInput.id });
		const mockTx = {
			paymentPlan: { findMany: vi.fn().mockResolvedValue([]) },
			document: { deleteMany: vi.fn().mockResolvedValue({}) },
			attendanceRecord: { deleteMany: vi.fn().mockResolvedValue({}) },
			student: { delete: vi.fn().mockResolvedValue({ id: deleteInput.id }) },
		};
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { findUnique: mockFindUnique },
			$transaction: vi
				.fn()
				.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) =>
					fn(mockTx),
				),
		} as never);

		const result = await deleteStudentAction(deleteInput);
		expect(result.success).toBe(true);
	});

	it("supprime un élève avec plans de paiement (cascade)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindUnique = vi.fn().mockResolvedValue({ id: deleteInput.id });
		const mockTx = {
			paymentPlan: {
				findMany: vi.fn().mockResolvedValue([{ id: "plan-1" }]),
				deleteMany: vi.fn().mockResolvedValue({}),
			},
			tranche: {
				findMany: vi.fn().mockResolvedValue([{ id: "tr-1" }]),
				deleteMany: vi.fn().mockResolvedValue({}),
			},
			paiement: { deleteMany: vi.fn().mockResolvedValue({}) },
			document: { deleteMany: vi.fn().mockResolvedValue({}) },
			attendanceRecord: { deleteMany: vi.fn().mockResolvedValue({}) },
			student: { delete: vi.fn().mockResolvedValue({ id: deleteInput.id }) },
		};
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { findUnique: mockFindUnique },
			$transaction: vi
				.fn()
				.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) =>
					fn(mockTx),
				),
		} as never);

		const result = await deleteStudentAction(deleteInput);
		expect(result.success).toBe(true);
		expect(mockTx.paiement.deleteMany).toHaveBeenCalled();
	});

	it("retourne RESOURCE_NOT_FOUND si élève inexistant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await deleteStudentAction(deleteInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});

	it("rejette un UUID invalide (Zod)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await deleteStudentAction({ id: "not-a-uuid" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});
});

describe("addStudentToGroupAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("connecte un élève à un groupe du tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({ id: "g1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { update: mockUpdate },
		} as never);

		const result = await addStudentToGroupAction({
			studentId: "550e8400-e29b-41d4-a716-446655440001",
			groupId: "550e8400-e29b-41d4-a716-446655440002",
		});
		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});
});

describe("removeStudentFromGroupAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("déconnecte un élève d'un groupe du tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockUpdate = vi.fn().mockResolvedValue({ id: "g1" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { update: mockUpdate },
		} as never);

		const result = await removeStudentFromGroupAction({
			studentId: "550e8400-e29b-41d4-a716-446655440001",
			groupId: "550e8400-e29b-41d4-a716-446655440002",
		});
		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					students: {
						disconnect: { id: "550e8400-e29b-41d4-a716-446655440001" },
					},
				},
			}),
		);
	});
});

describe("getStudentFullProfileAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne le profil complet avec tenant isolation", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockProfile = {
			id: "stu-1",
			firstName: "Youcef",
			groups: [],
			documents: [],
			attendance: [],
			paymentPlans: [],
		};
		const mockFindUnique = vi.fn().mockResolvedValue(mockProfile);
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { findUnique: mockFindUnique },
		} as never);

		const result = await getStudentFullProfileAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ etablissementId: "etab-abc" }),
			}),
		);
	});

	it("retourne null si élève non trouvé (sans erreur)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { findUnique: vi.fn().mockResolvedValue(null) },
		} as never);

		const result = await getStudentFullProfileAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		if (result.success) expect(result.data).toBeNull();
	});
});
