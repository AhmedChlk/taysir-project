"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Utilitaire pour récupérer l'établissement localement
async function getEtablissementId() {
  const etablissement = await prisma.etablissement.findFirst();
  if (!etablissement) throw new Error("Établissement introuvable");
  return etablissement.id;
}

// Purificateur de données pour éviter les crashs Server Components
function purify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// --- ÉLÈVES (STUDENTS) ---
// ==========================================

export async function createStudentAction(data: any) {
  try {
    const tid = await getEtablissementId();

    // On isole groupId s'il est présent pour le gérer dans la relation "connect"
    const { groupId, ...studentData } = data;

    const result = await prisma.student.create({
      data: {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email || null,
        phone: studentData.phone || null,
        isMinor: studentData.isMinor || false,
        parentName: studentData.parentName || null,
        parentPhone: studentData.parentPhone || null,
        parentEmail: studentData.parentEmail || null,
        // CORRECTION DU BUG ICI : On lie l'élève à l'établissement
        etablissementId: tid,
        
        // Si un groupe est sélectionné à la création, on le connecte
        ...(groupId && {
          groups: {
            connect: { id: groupId }
          }
        })
      },
    });

    revalidatePath("/dashboard/students");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    console.error("Erreur createStudent:", error);
    return { success: false, error: { message: error.message } };
  }
}

export async function updateStudentAction(data: any) {
  try {
    const { id, groupId, ...updateData } = data;
    
    const result = await prisma.student.update({
      where: { id },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email || null,
        phone: updateData.phone || null,
        isMinor: updateData.isMinor || false,
        parentName: updateData.parentName || null,
        parentPhone: updateData.parentPhone || null,
        parentEmail: updateData.parentEmail || null,
        
        // Connexion à un nouveau groupe si on le modifie
        ...(groupId && {
          groups: {
            connect: { id: groupId }
          }
        })
      },
    });

    revalidatePath("/dashboard/students");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function deleteStudentAction({ id }: { id: string }) {
  try {
    await prisma.student.delete({ where: { id } });
    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

// Action pour retirer un élève d'un groupe spécifique
export async function removeStudentFromGroupAction({ studentId, groupId }: { studentId: string, groupId: string }) {
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        groups: {
          disconnect: { id: groupId }
        }
      }
    });
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}