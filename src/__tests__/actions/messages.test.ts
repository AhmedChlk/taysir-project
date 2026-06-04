import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
	const mock = {
		message: { create: vi.fn(), findMany: vi.fn() },
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
	getReceivedMessagesAction,
	getSentMessagesAction,
	sendMessageAction,
} from "@/actions/messages.actions";
import { getTenantPrisma } from "@/lib/prisma";

const TENANT_ID = "etab-abc";
const USER_ID = "user-123";
const RECIPIENT_ID = "550e8400-e29b-41d4-a716-446655440001";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: USER_ID,
		role: "ADMIN",
		etablissementId: TENANT_ID,
		...override,
	},
	expires: "2099-01-01",
});

describe("Messages Actions Audit", () => {
	let mockPrisma: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockPrisma = getTenantPrisma(TENANT_ID);
	});

	describe("🔴 A. Sécurité et Confidentialité (Privacy & Spoofing)", () => {
		it("Usurpation d'Expéditeur: Écrase le senderId avec celui de la session (pas d'usurpation)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockResolvedValue({ id: "msg-1" });

			const result = await sendMessageAction({
				content: "Bonjour",
				// Payload malveillant qui tenterait d'usurper l'identité
				senderId: "hacker-user-id",
			} as any);

			expect(result.success).toBe(true);

			// Le senderId est fermement lié à la session
			expect(mockPrisma.message.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ senderId: USER_ID }),
				}),
			);
		});

		it("Faille d'Isolation: Injecte rigoureusement le etablissementId de la session", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockResolvedValue({ id: "msg-1" });

			await sendMessageAction({ content: "Isolation" });

			expect(mockPrisma.message.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ etablissementId: TENANT_ID }),
				}),
			);
		});

		it("Lecture Non Autorisée: Bloque la lecture des messages d'un autre utilisateur", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.findMany.mockResolvedValue([]);

			// Même si on tente d'envoyer un recipientId différent, le userId de session est utilisé comme filtre unique
			await getReceivedMessagesAction({
				recipientId: "autre-utilisateur",
			} as any);
			expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { recipientId: USER_ID }, // strict sur USER_ID de la session
				}),
			);

			await getSentMessagesAction({ senderId: "autre-utilisateur" } as any);
			expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { senderId: USER_ID }, // strict sur USER_ID de la session
				}),
			);
		});
	});

	describe("🟠 B. Résilience et Désastres", () => {
		it("Crash Prisma: Gère un échec système (ex: destinataire n'existe pas -> Contrainte ForeignKey)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockRejectedValue(
				new Error("Foreign key constraint failed"),
			);

			const result = await sendMessageAction({
				content: "Test",
				recipientId: RECIPIENT_ID,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
			}
		});
	});

	describe("🟡 C. Validations et Cas Limites (Unhappy Paths)", () => {
		it("Contenu Vide ou Trop Court: Zod rejette", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockResolvedValue({ id: "msg-1" }); // Reset mock

			const result = await sendMessageAction({ content: "" }); // Envoi vide
			expect(result.success).toBe(false);
			if (!result.success)
				expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		});

		it("XSS / Injection: Le texte brut est passé à Prisma sans être interprété", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockResolvedValue({ id: "msg-xss" });

			const payload = "<script>alert('XSS')</script> DROP TABLE Users;";
			const result = await sendMessageAction({ content: payload });

			expect(result.success).toBe(true);
			// On vérifie que le contenu n'a pas déclenché d'erreur SQL et est bien passé à l'ORM
			expect(mockPrisma.message.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ content: payload }),
				}),
			);
		});
	});

	describe("🟢 D. Happy Path & Cache", () => {
		it("Envoi réussi avec destinataire + Invalidation de cache", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockResolvedValue({ id: "msg-2" });

			const result = await sendMessageAction({
				content: "Bonjour",
				recipientId: RECIPIENT_ID,
			});
			expect(result.success).toBe(true);
			expect(mockPrisma.message.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ recipientId: RECIPIENT_ID }),
				}),
			);

			const { revalidateTag } = await import("next/cache");
			expect(revalidateTag).toHaveBeenCalledWith(
				`etab_${TENANT_ID}_messages`,
				"max",
			);
		});

		it("Envoi réussi sans destinataire (Message Global / null fallback)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.message.create.mockResolvedValue({ id: "msg-global" });

			// Envoi sans recipientId
			const result = await sendMessageAction({ content: "Annonce Générale" });
			expect(result.success).toBe(true);
			expect(mockPrisma.message.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ recipientId: null }),
				}),
			);
		});
	});
});
