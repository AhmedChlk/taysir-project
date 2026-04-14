"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { createSafeAction } from "@/lib/actions/safe-action";
import { UpdateDocumentStatusSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export const updateDocumentStatusAction = createSafeAction(
  UpdateDocumentStatusSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    const document = await tenantPrisma.document.update({
      where: {
        id: data.id,
      },
      data: {
        status: data.status,
      },
    });

    revalidatePath("/dashboard/students");
    return document;
  }
);

export async function getStudentDocuments(studentId: string, tenantId: string) {
  const tenantPrisma = getTenantPrisma(tenantId);
  return await tenantPrisma.document.findMany({
    where: {
      studentId: studentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
