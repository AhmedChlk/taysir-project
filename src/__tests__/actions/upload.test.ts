import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => {
    const mock = {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
    };
    return {
        ...mock,
        default: mock
    };
});

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.spyOn(console, "error").mockImplementation(() => {});

import { getServerSession } from "next-auth/next";
import { mkdir, writeFile } from "node:fs/promises";
import { uploadFileAction } from "@/actions/upload.actions";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: "etab-123",
		...override,
	},
	expires: "2099-01-01",
});

describe("Upload Actions Audit (Security & Resilience)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("🔴 A. Sécurité des Accès (Data Leakage & Auth)", () => {
		it("Accès Non Authentifié: Bloque l'upload si pas de session", async () => {
			vi.mocked(getServerSession).mockResolvedValue(null);
			const formData = new FormData();
			const result = await uploadFileAction(formData);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error).toMatch(/Non autorisé/);
		});

		it("Tenant Isolation: Bloque l'upload si l'utilisateur n'a pas d'etablissementId", async () => {
			vi.mocked(getServerSession).mockResolvedValue(
				makeSession({ etablissementId: null }) as never,
			);
			const formData = new FormData();
            const blob = new Blob(["dummy"], { type: "image/png" });
			formData.append("file", new File([blob], "test.png", { type: "image/png" }));
			
			const result = await uploadFileAction(formData);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error).toMatch(/Aucun établissement/);
		});
	});

	describe("🟠 B. Sécurité des Fichiers (Malicious Uploads & Path Traversal)", () => {
        it("Payload invalide: Aucun fichier fourni", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const formData = new FormData();
			const result = await uploadFileAction(formData);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error).toMatch(/Aucun fichier/);
		});

		it("Validation du Type: Rejette les fichiers exécutables (MIME falsifié ou non autorisé)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const formData = new FormData();
			// Falsification MIME ou type interdit
			const blob = new Blob(["bad script"], { type: "application/x-sh" });
			formData.append("file", new File([blob], "script.sh", { type: "application/x-sh" }));

			const result = await uploadFileAction(formData);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error).toMatch(/Type de fichier non supporté/);
		});

		it("Limite de Taille: Rejette un fichier > 5MB", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const formData = new FormData();
            
            // Simule un vrai gros fichier en mémoire (6MB)
            const bigArray = new Uint8Array(6 * 1024 * 1024);
            const blob = new Blob([bigArray], { type: "image/png" });
			formData.append("file", new File([blob], "big.png", { type: "image/png" }));

			const result = await uploadFileAction(formData);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error).toMatch(/trop volumineux/);
		});

		it("Path Traversal (Sanitisation): Nettoie le nom de fichier des caractères ../", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const formData = new FormData();
			const blob = new Blob(["test"], { type: "application/pdf" });
            // Nom de fichier malveillant
			formData.append("file", new File([blob], "../../../etc/passwd.pdf", { type: "application/pdf" }));

			const result = await uploadFileAction(formData);
			expect(result.success).toBe(true);

            // Vérifie que le writeFile a été appelé avec un nom "sain" (basename retire les dossiers)
			if (result.success) {
				const callPath = vi.mocked(writeFile).mock.calls[0]![0]! as string;
				expect(callPath).not.toMatch(/\.\.\//);
                expect(callPath).toMatch(/uploads\/etab-123\/\d+-passwd\.pdf/);
			}
		});
	});

	describe("🟡 C. Résilience et Désastres", () => {
		it("Échec du FileSystem: Capture l'erreur et retourne un fallback", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const formData = new FormData();
			const blob = new Blob(["dummy"], { type: "image/png" });
			formData.append("file", new File([blob], "test.png", { type: "image/png" }));

			// Simule un crash disque (ex: disque plein, droits manquants)
			vi.mocked(mkdir).mockRejectedValue(new Error("ENOSPC: no space left on device"));

			const result = await uploadFileAction(formData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toMatch(/Erreur lors de l'upload local/);
                expect(console.error).toHaveBeenCalled();
			}
		});
	});

	describe("🟢 D. Happy Path & Structure", () => {
		it("Upload réussi avec le bon etablissementId injecté dans le dossier", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            vi.mocked(mkdir).mockResolvedValue(undefined);
            vi.mocked(writeFile).mockResolvedValue(undefined);

			const formData = new FormData();
			const blob = new Blob(["dummy content"], { type: "image/jpeg" });
			const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
            
            // Forcer l'implémentation de arrayBuffer pour Vitest jsdom/node
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(10));
			formData.append("file", file);

			const result = await uploadFileAction(formData);
            if (!result.success) console.log("UPLOAD ERROR:", result.error);
			expect(result.success).toBe(true);

			if (result.success) {
				expect(result.data!.url).toMatch(/^\/uploads\/etab-123\/\d+-profile\.jpg$/);
				expect(result.data!.contentType).toBe("image/jpeg");

				// Le FS a bien été appelé
				expect(mkdir).toHaveBeenCalled();
				expect(writeFile).toHaveBeenCalled();
			}
		});
	});
});
