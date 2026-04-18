"use server";

import { revalidateTag } from "next/cache";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import {
	GetStudentDocumentsSchema,
	UpdateDocumentStatusSchema,
} from "@/lib/validations";

export const updateDocumentStatusAction = createSafeAction(
	UpdateDocumentStatusSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const document = await tenantPrisma.document.update({
			where: {
				id_etablissementId: {
					id: data.id,
					etablissementId: tenantId,
				},
			},
			data: {
				status: data.status,
			},
		});

		revalidateTag(`etab_${tenantId}_students`, "max");
		return document;
	},
);

export const getStudentDocumentsAction = createSafeAction(
	GetStudentDocumentsSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		return tenantPrisma.document.findMany({
			where: {
				studentId: data.studentId,
				etablissementId: tenantId,
			},
			orderBy: { createdAt: "desc" },
		});
	},
);
