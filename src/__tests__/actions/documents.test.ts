import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
    const mock = {
        document: { findMany: vi.fn(), update: vi.fn() },
    };
    return {
	    getTenantPrisma: vi.fn(() => mock),
        prisma: mock,
    };
});

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
	getStudentDocumentsAction,
	updateDocumentStatusAction,
} from "@/actions/documents.actions";
import { getTenantPrisma } from "@/lib/prisma";

const TENANT_ID = "etab-123";
const DOC_ID = "550e8400-e29b-41d4-a716-446655440001";
const STUDENT_ID = "550e8400-e29b-41d4-a716-446655440002";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: TENANT_ID,
		...override,
	},
	expires: "2099-01-01",
});

describe("Documents Actions Audit", () => {
    let mockPrisma: any;

	beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma = getTenantPrisma(TENANT_ID);
    });

	describe("🔴 A. Sécurité des Accès (IDOR & Tenant Spoofing)", () => {
		it("updateDocumentStatusAction: Utilise la clé composite pour empêcher la mise à jour cross-tenant (IDOR)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.document.update.mockResolvedValue({ id: DOC_ID, status: "APPROVED" });

			const result = await updateDocumentStatusAction({ id: DOC_ID, status: "APPROVED" });
			expect(result.success).toBe(true);

            // Vérifie l'étanchéité stricte par tenant
			expect(mockPrisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
				where: { id_etablissementId: { id: DOC_ID, etablissementId: TENANT_ID } },
			}));
		});

		it("getStudentDocumentsAction: Filtre strictement les documents par tenant (Empêche la fuite de données)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.document.findMany.mockResolvedValue([]);

			const result = await getStudentDocumentsAction({ studentId: STUDENT_ID });
			expect(result.success).toBe(true);

            // Vérifie que les documents retournés appartiennent TOUS au tenant de la session
			expect(mockPrisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ etablissementId: TENANT_ID, studentId: STUDENT_ID }),
			}));
		});
	});

	describe("🟡 B. Résilience et Désastres", () => {
        it("updateDocumentStatusAction: Gère une erreur Prisma proprement", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.document.update.mockRejectedValue(new Error("Document Not Found"));

			const result = await updateDocumentStatusAction({ id: DOC_ID, status: "REJECTED" });
			expect(result.success).toBe(false);
            if (!result.success) expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
        });
	});

	describe("🟢 C. Happy Path & Cache", () => {
		it("updateDocumentStatusAction: Met à jour et invalide le cache", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.document.update.mockResolvedValue({ id: DOC_ID });

			const result = await updateDocumentStatusAction({ id: DOC_ID, status: "PENDING" });
			expect(result.success).toBe(true);

            const { revalidateTag } = await import("next/cache");
            expect(revalidateTag).toHaveBeenCalledWith(`etab_${TENANT_ID}_students`, "max");
		});
	});
});
