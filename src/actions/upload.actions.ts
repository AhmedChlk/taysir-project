"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function uploadFileAction(formData: FormData) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return { success: false, error: "Non autorisé" };
		}

		const file = formData.get("file") as File;
		if (!file) {
			return { success: false, error: "Aucun fichier fourni" };
		}

		if (file.size > 5 * 1024 * 1024) {
			return { success: false, error: "Fichier trop volumineux (max 5Mo)" };
		}

		const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
		if (!allowedTypes.includes(file.type)) {
			return {
				success: false,
				error: "Type de fichier non supporté (JPG, PNG, PDF uniquement)",
			};
		}

		const tenantId = session.user.etablissementId;
		if (!tenantId) {
			return { success: false, error: "Aucun établissement associé à ce compte" };
		}
		// Sécurisation du nom de fichier : on ne garde que le nom de base pour éviter le path traversal
		const safeFileName = path
			.basename(file.name)
			.replace(/[^a-zA-Z0-9.\-_]/g, "_");
		const relativePath = `uploads/${tenantId}/${Date.now()}-${safeFileName}`;
		const absolutePath = path.join(process.cwd(), "public", relativePath);

		// Création récursive du dossier
		await mkdir(path.dirname(absolutePath), { recursive: true });

		// Conversion en Buffer et écriture
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(absolutePath, buffer);

		// Retourner l'URL relative commençant par / pour que le navigateur la résolve sur le host actuel
		const url = `/${relativePath}`;

		return {
			success: true,
			data: {
				url: url,
				pathname: relativePath,
				contentType: file.type,
			},
		};
	} catch (error) {
		console.error("[UPLOAD_ERROR]", error);
		return { success: false, error: "Erreur lors de l'upload local" };
	}
}
