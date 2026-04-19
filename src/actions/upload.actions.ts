"use server";

import { put } from "@vercel/blob";
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

		const tenantId = session.user.etablissementId || "system";
		const filename = `${tenantId}/${Date.now()}-${file.name}`;

		if (!process.env.BLOB_READ_WRITE_TOKEN) {
			const arrayBuffer = await file.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString("base64");
			const dataUri = `data:${file.type};base64,${base64}`;

			return {
				success: true,
				data: {
					url: dataUri,
					pathname: filename,
					contentType: file.type,
				},
			};
		}

		const blob = await put(filename, file, {
			access: "public",
			addRandomSuffix: true,
		});

		return {
			success: true,
			data: {
				url: blob.url,
				pathname: blob.pathname,
				contentType: blob.contentType,
			},
		};
	} catch (error) {
		console.error("[UPLOAD_ERROR]", error);
		return { success: false, error: "Erreur lors de l'upload" };
	}
}
