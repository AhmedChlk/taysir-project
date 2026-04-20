import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("node:fs/promises", async () => {
	const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
	return {
		...actual,
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
	};
});

import { getServerSession } from "next-auth/next";
import { uploadFileAction } from "@/actions/upload.actions";

const makeSession = (override = {}) => ({
	user: { id: "u1", role: "ADMIN", etablissementId: "etab-1", ...override },
	expires: "2099-01-01",
});

const makeFormData = (fileOverride: Partial<{ name: string; size: number; type: string }> = {}) => {
	const file = {
		name: "test.jpg",
		size: 1024,
		type: "image/jpeg",
		arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
		...fileOverride,
	};
	return { get: vi.fn().mockReturnValue(file) } as unknown as FormData;
};

describe("uploadFileAction", () => {
	beforeEach(() => vi.clearAllMocks());

	it("upload un fichier JPEG valide", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const result = await uploadFileAction(makeFormData());
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data!.contentType).toBe("image/jpeg");
			expect(result.data!.pathname).toContain("uploads/etab-1/");
		}
	});

	it("upload un fichier PDF valide", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const result = await uploadFileAction(makeFormData({ name: "doc.pdf", type: "application/pdf" }));
		expect(result.success).toBe(true);
	});

	it("rejette sans session", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);

		const result = await uploadFileAction(makeFormData());
		expect(result.success).toBe(false);
		expect(result.error).toBe("Non autorisé");
	});

	it("rejette si etablissementId manquant", async () => {
		vi.mocked(getServerSession).mockResolvedValue(
			makeSession({ etablissementId: undefined }) as never,
		);

		const result = await uploadFileAction(makeFormData());
		expect(result.success).toBe(false);
		expect(result.error).toContain("établissement");
	});

	it("rejette si aucun fichier dans FormData", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
		const emptyFd = { get: vi.fn().mockReturnValue(null) } as unknown as FormData;

		const result = await uploadFileAction(emptyFd);
		expect(result.success).toBe(false);
		expect(result.error).toBe("Aucun fichier fourni");
	});

	it("rejette un fichier trop volumineux (>5Mo)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const result = await uploadFileAction(makeFormData({ size: 6 * 1024 * 1024 }));
		expect(result.success).toBe(false);
		expect(result.error).toContain("volumineux");
	});

	it("rejette un type non autorisé (text/html)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const result = await uploadFileAction(makeFormData({ type: "text/html" }));
		expect(result.success).toBe(false);
		expect(result.error).toContain("Type de fichier");
	});

	it("sanitise le nom de fichier (caractères spéciaux → _)", async () => {
		vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);

		const result = await uploadFileAction(makeFormData({ name: "mon fichier (1).jpg" }));
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data!.pathname).not.toContain(" ");
			expect(result.data!.pathname).not.toContain("(");
		}
	});
});
