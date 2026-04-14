"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { CreateStudentSchema, UpdateStudentSchema, CreateDocumentSchema } from "@/lib/validations";
import { revalidateTag, revalidatePath } from "next/cache";
import { TaysirError, ErrorCodes } from "@/lib/errors";

export const addDocumentToStudentAction = createSafeAction(CreateDocumentSchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const document = await tenantPrisma.document.create({
    data: {
      ...data,
      etablissementId: tenantId,
      status: 'APPROVED',
    }
  });
  revalidatePath('/[locale]/dashboard/students/[id]', 'page');
  return document;
});

export const createStudentAction = createSafeAction(CreateStudentSchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const { groupIds, ...studentData } = data;
  
  if (groupIds && groupIds.length > 0) {
    const validGroups = await tenantPrisma.groupe.findMany({
      where: { id: { in: groupIds } }
    });
    if (validGroups.length !== groupIds.length) {
      throw new TaysirError("Certains groupes spécifiés n'existent pas.", ErrorCodes.ERR_NOT_FOUND);
    }
  }

  const cleanedData = {
    ...studentData,
    email: studentData.email || null,
    phone: studentData.phone || null,
    parentName: studentData.parentName || null,
    parentPhone: studentData.parentPhone || null,
    parentEmail: studentData.parentEmail || null,
    address: studentData.address || null,
    photoUrl: studentData.photoUrl || null,
  };
  
  const student = await tenantPrisma.student.create({ 
    data: {
      ...cleanedData,
      groups: groupIds && groupIds.length > 0 ? { connect: groupIds.map(id => ({ id })) } : undefined
    } 
  });
  
  revalidateTag(`students-${tenantId}`, "max");
  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/dashboard/students', 'page');
  return student;
});

export const updateStudentAction = createSafeAction(UpdateStudentSchema, async ({ id, groupIds, ...data }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  
  if (groupIds && groupIds.length > 0) {
    const validGroups = await tenantPrisma.groupe.findMany({
      where: { id: { in: groupIds } }
    });
    if (validGroups.length !== groupIds.length) {
      throw new TaysirError("Certains groupes spécifiés n'existent pas.", ErrorCodes.ERR_NOT_FOUND);
    }
  }

  const cleanedData = {
    ...data,
    email: data.email || null,
    phone: data.phone || null,
    parentName: data.parentName || null,
    parentPhone: data.parentPhone || null,
    parentEmail: data.parentEmail || null,
    address: data.address || null,
    photoUrl: data.photoUrl || null,
  };
  
  const result = await tenantPrisma.student.update({ 
    where: { id }, 
    data: {
      ...cleanedData,
      groups: {
        set: groupIds?.map(id => ({ id })) || []
      }
    } 
  });

  revalidateTag(`students-${tenantId}`, "max");
  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/dashboard/students', 'page');
  return result;
});

export const deleteStudentAction = createSafeAction(z.object({ id: z.string().uuid() }), async ({ id }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  
  const result = await tenantPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const paymentPlans = await tx.paymentPlan.findMany({
      where: { studentId: id, etablissementId: tenantId },
      select: { id: true }
    });
    const paymentPlanIds = paymentPlans.map(p => p.id);

    if (paymentPlanIds.length > 0) {
      const tranches = await tx.tranche.findMany({
        where: { paymentPlanId: { in: paymentPlanIds } },
        select: { id: true }
      });
      const trancheIds = tranches.map(t => t.id);

      if (trancheIds.length > 0) {
        await tx.paiement.deleteMany({
          where: { trancheId: { in: trancheIds } }
        });
      }

      await tx.tranche.deleteMany({
        where: { paymentPlanId: { in: paymentPlanIds } }
      });

      await tx.paymentPlan.deleteMany({
        where: { studentId: id, etablissementId: tenantId }
      });
    }

    await tx.document.deleteMany({
      where: { studentId: id, etablissementId: tenantId }
    });

    await tx.attendanceRecord.deleteMany({
      where: { studentId: id, etablissementId: tenantId }
    });

    return await tx.student.delete({
      where: { id, etablissementId: tenantId }
    });
  });
  
  revalidateTag(`students-${tenantId}`, "max");
  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/dashboard/students', 'page');
  return result;
});

export const addStudentToGroupAction = createSafeAction(
  z.object({ studentId: z.string().uuid(), groupId: z.string().uuid() }),
  async ({ studentId, groupId }, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    const result = await tenantPrisma.groupe.update({
      where: { id: groupId, etablissementId: tenantId },
      data: { students: { connect: { id: studentId } } }
    });
    revalidatePath('/[locale]/dashboard/groups', 'page');
    return result;
  }
);

export const removeStudentFromGroupAction = createSafeAction(
  z.object({ studentId: z.string().uuid(), groupId: z.string().uuid() }),
  async ({ studentId, groupId }, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    const result = await tenantPrisma.groupe.update({
      where: { id: groupId, etablissementId: tenantId },
      data: { students: { disconnect: { id: studentId } } }
    });
    revalidatePath('/[locale]/dashboard/groups', 'page');
    return result;
  }
);

export const getStudentFullProfileAction = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { tenantId }) => {
    const client = getTenantPrisma(tenantId);
    
    return await client.student.findUnique({
      where: { id, etablissementId: tenantId },
      include: {
        groups: true,
        documents: true,
        attendance: {
          include: { session: { include: { activity: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        paymentPlans: {
          include: { 
            activity: true,
            tranches: { include: { paiements: true }, orderBy: { dueDate: 'asc' } } 
          }
        }
      }
    });
  }
);
