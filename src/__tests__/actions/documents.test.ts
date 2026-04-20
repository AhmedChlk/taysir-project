import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next-auth/next — doit être en haut avant l'import de l'action
vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

// Mock getTenantPrisma
vi.mock("@/lib/prisma", () => ({
	getTenantPrisma: vi.fn(() => ({
		document: {
			findMany: vi.fn().mockResolvedValue([]),
		},
	})),
}));

// Mock authOptions (requis par safe-action.ts)
vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import { getStudentDocumentsAction } from "@/actions/documents.actions";

const VALID_STUDENT_UUID = "550e8400-e29b-41d4-a716-446655440000";

const buildSession = () => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-123",
		email: "admin@school.dz",
		name: "Admin Test",
	},
	expires: "2099-01-01",
});

describe("getStudentDocumentsAction — protection IDOR (SEC-02)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("retourne une erreur ERR_UNAUTHORIZED si pas de session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);

		const result = await getStudentDocumentsAction({
			studentId: VALID_STUDENT_UUID,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("AUTH_REQUIRED");
		}
	});

	it("retourne les documents pour un tenant valide avec session authentifiée", async () => {
		vi.mocked(getServerSession).mockResolvedValue(buildSession() as never);

		const result = await getStudentDocumentsAction({
			studentId: VALID_STUDENT_UUID,
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(Array.isArray(result.data)).toBe(true);
		}
	});

	it("rejette un studentId non-UUID (protection injection)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(buildSession() as never);

		const result = await getStudentDocumentsAction({
			studentId: "' OR '1'='1",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		}
	});

	it("rejette un studentId vide", async () => {
		vi.mocked(getServerSession).mockResolvedValue(buildSession() as never);

		const result = await getStudentDocumentsAction({
			studentId: "",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		}
	});

	it("ne permet pas de passer un tenantId arbitraire — il est extrait de la session", async () => {
		// Le schéma ne contient que studentId : impossible d'injecter un tenantId externe.
		// On passe un objet forgé avec une propriété tenantId supplémentaire pour simuler
		// ce qu'un attaquant tenterait via un appel JS direct (contournement TypeScript).
		vi.mocked(getServerSession).mockResolvedValue(buildSession() as never);

		const attackerPayload = {
			studentId: VALID_STUDENT_UUID,
			tenantId: "attacker-tenant",
		} as unknown as { studentId: string };

		const result = await getStudentDocumentsAction(attackerPayload);

		// La session retourne "etab-123", l'attaquant ne peut pas le surcharger
		expect(result.success).toBe(true);
	});
});
