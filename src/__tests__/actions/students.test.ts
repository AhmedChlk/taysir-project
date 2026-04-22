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
    addDocumentToStudentAction,
	addStudentToGroupAction,
	createStudentAction,
	deleteStudentAction,
	getStudentFullProfileAction,
	removeStudentFromGroupAction,
	updateStudentAction,
} from "@/actions/students.actions";
import { getTenantPrisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

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
		expect(revalidateTag).toHaveBeenCalled();
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
	});

	it("rejette si un groupe n'appartient pas au tenant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockFindMany = vi.fn().mockResolvedValue([]); 
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findMany: mockFindMany },
		} as never);

		const result = await createStudentAction({
			...validStudentInput,
			groupIds: ["550e8400-e29b-41d4-a716-446655440099"],
		});
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
	});

	it("retourne AUTH_REQUIRED sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await createStudentAction(validStudentInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});

    it("rejette les données invalides (Zod)", async () => {
        vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
        const result = await createStudentAction({ ...validStudentInput, firstName: "" });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
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
		expect(mockUpdate).toHaveBeenCalled();
	});

    it("met à jour avec des groupes valides", async () => {
        vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const groupId = "550e8400-e29b-41d4-a716-446655440002";
		const mockFindMany = vi.fn().mockResolvedValue([{ id: groupId }]);
		const mockUpdate = vi.fn().mockResolvedValue({ id: updateInput.id });
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findMany: mockFindMany },
			student: { update: mockUpdate },
		} as never);

		const result = await updateStudentAction({
			...updateInput,
			groupIds: [groupId],
		});
		expect(result.success).toBe(true);
    });

	it("rejette les groupes invalides à l'update (cross-tenant)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({
			groupe: { findMany: vi.fn().mockResolvedValue([]) },
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

	it("supprime un élève avec plans de paiement et tranches", async () => {
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
});

describe("addDocumentToStudentAction", () => {
    beforeEach(() => vi.clearAllMocks());

    it("ajoute un document avec succès", async () => {
        vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
        const mockCreate = vi.fn().mockResolvedValue({ id: "doc-1" });
        vi.mocked(getTenantPrisma).mockReturnValue({
            document: { create: mockCreate },
        } as never);

        const result = await addDocumentToStudentAction({
            studentId: "550e8400-e29b-41d4-a716-446655440001",
            name: "ID Card",
            url: "https://example.com/id.pdf",
            type: "application/pdf"
        });

        expect(result.success).toBe(true);
        expect(mockCreate).toHaveBeenCalled();
        expect(revalidateTag).toHaveBeenCalled();
    });

    it("rejette si les données de document sont invalides", async () => {
        vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
        const result = await addDocumentToStudentAction({
            studentId: "not-a-uuid",
            name: "",
            url: "invalid-url"
        } as any);

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
	});
});

describe("getStudentFullProfileAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne le profil complet avec tenant isolation", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockProfile = { id: "stu-1" };
		const mockFindUnique = vi.fn().mockResolvedValue(mockProfile);
		vi.mocked(getTenantPrisma).mockReturnValue({
			student: { findUnique: mockFindUnique },
		} as never);

		const result = await getStudentFullProfileAction({
			id: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});
});
