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
	getReceivedMessagesAction,
	getSentMessagesAction,
	sendMessageAction,
} from "@/actions/messages.actions";
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

describe("sendMessageAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("crée un message avec senderId de la session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi
			.fn()
			.mockResolvedValue({ id: "msg-1", content: "Bonjour" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			message: { create: mockCreate },
		} as never);

		const result = await sendMessageAction({ content: "Bonjour" });
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					senderId: "user-1",
					etablissementId: "etab-abc",
				}),
			}),
		);
	});

	it("crée un message avec recipientId", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const mockCreate = vi.fn().mockResolvedValue({ id: "msg-2" });
		vi.mocked(getTenantPrisma).mockReturnValue({
			message: { create: mockCreate },
		} as never);

		const result = await sendMessageAction({
			content: "Bonjour",
			recipientId: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					recipientId: "550e8400-e29b-41d4-a716-446655440001",
				}),
			}),
		);
	});

	it("rejette un contenu vide", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		vi.mocked(getTenantPrisma).mockReturnValue({} as never);

		const result = await sendMessageAction({ content: "" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
	});

	it("retourne AUTH_REQUIRED sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		const result = await sendMessageAction({ content: "Test" });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
	});
});

describe("getReceivedMessagesAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les messages reçus par l'utilisateur courant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const messages = [{ id: "msg-1", content: "Salut" }];
		const mockFindMany = vi.fn().mockResolvedValue(messages);
		vi.mocked(getTenantPrisma).mockReturnValue({
			message: { findMany: mockFindMany },
		} as never);

		const result = await getReceivedMessagesAction({});
		expect(result.success).toBe(true);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ recipientId: "user-1" }),
			}),
		);
	});
});

describe("getSentMessagesAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("retourne les messages envoyés par l'utilisateur courant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const messages = [{ id: "msg-2", content: "Bonjour" }];
		const mockFindMany = vi.fn().mockResolvedValue(messages);
		vi.mocked(getTenantPrisma).mockReturnValue({
			message: { findMany: mockFindMany },
		} as never);

		const result = await getSentMessagesAction({});
		expect(result.success).toBe(true);
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ senderId: "user-1" }),
			}),
		);
	});
});
