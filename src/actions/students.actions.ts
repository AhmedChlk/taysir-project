// Actions pour gérer les étudiants
"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { CreateStudentSchema, UpdateStudentSchema } from "@/lib/validations";
import { revalidateTag } from "next/cache";

// Ajouter un étudiant
export const createStudentAction = createSafeAction(CreateStudentSchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const { groupId, ...studentData } = data;
  
  // Nettoyage des données
  const cleanedData = {
    ...studentData,
    email: studentData.email || null,
    phone: studentData.phone || null,
    parentName: studentData.parentName || null,
    parentPhone: studentData.parentPhone || null,
    parentEmail: studentData.parentEmail || null,
  };
  
  const student = await tenantPrisma.student.create({ 
    data: {
      ...cleanedData,
      groups: groupId ? { connect: { id: groupId } } : undefined
    } 
  });
  
  revalidateTag(`students-${tenantId}`);
  return student;
});

// Modifier un étudiant
export const updateStudentAction = createSafeAction(UpdateStudentSchema, async ({ id, groupId, ...data }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  
  const cleanedData = {
    ...data,
    email: data.email || null,
    phone: data.phone || null,
    parentName: data.parentName || null,
    parentPhone: data.parentPhone || null,
    parentEmail: data.parentEmail || null,
  };
  
  const result = await tenantPrisma.student.update({ 
    where: { id }, 
    data: {
      ...cleanedData,
      // Si un groupe est fourni, on connecte, sinon on ne touche pas aux groupes existants
      // Pour une gestion plus fine (enlever/ajouter), il faudrait une action dédiée
      groups: groupId ? { connect: { id: groupId } } : undefined
    } 
  });

  revalidateTag(`students-${tenantId}`);
  return result;
});

// Supprimer un étudiant
export const deleteStudentAction = createSafeAction(z.object({ id: z.string().uuid() }), async ({ id }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  
  // On supprime d'abord les relations ou on laisse Prisma gérer selon le schema
  const result = await tenantPrisma.student.delete({ where: { id } });
  
  revalidateTag(`students-${tenantId}`);
  return result;
});

// Ajouter un étudiant à un groupe
export const addStudentToGroupAction = createSafeAction(
  z.object({ studentId: z.string().uuid(), groupId: z.string().uuid() }),
  async ({ studentId, groupId }, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    return await tenantPrisma.groupe.update({
      where: { id: groupId },
      data: { students: { connect: { id: studentId } } }
    });
  }
);

// Enlever un étudiant d'un groupe
export const removeStudentFromGroupAction = createSafeAction(
  z.object({ studentId: z.string().uuid(), groupId: z.string().uuid() }),
  async ({ studentId, groupId }, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    return await tenantPrisma.groupe.update({
      where: { id: groupId },
      data: { students: { disconnect: { id: studentId } } }
    });
  }
);
