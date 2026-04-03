"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Utilitaire pour récupérer le Tenant (Établissement) localement
async function getEtablissementId() {
  const etablissement = await prisma.etablissement.findFirst();
  if (!etablissement) throw new Error("Établissement introuvable");
  return etablissement.id;
}

// Purificateur de données pour éviter les crashs Next.js 16 Server Components
function purify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// --- SALLES (ROOMS) ---
// ==========================================

export async function createRoomAction(data: any) {
  try {
    const tid = await getEtablissementId();
    const result = await prisma.room.create({
      data: {
        name: data.name,
        capacity: Number(data.capacity),
        description: data.description,
        etablissement: { connect: { id: tid } },
      },
    });
    revalidatePath("/dashboard/rooms");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function updateRoomAction(data: any) {
  try {
    const { id, ...updateData } = data;
    const result = await prisma.room.update({
      where: { id },
      data: {
        ...updateData,
        capacity: Number(updateData.capacity),
      },
    });
    revalidatePath("/dashboard/rooms");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function deleteRoomAction({ id }: { id: string }) {
  try {
    await prisma.room.delete({ where: { id } });
    revalidatePath("/dashboard/rooms");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

// ==========================================
// --- GROUPES (GROUPS) ---
// ==========================================

export async function createGroupAction(data: any) {
  try {
    const tid = await getEtablissementId();
    const result = await prisma.groupe.create({
      data: {
        name: data.name,
        level: data.level,
        schedule: data.schedule,
        capacity: data.capacity ? Number(data.capacity) : null,
        etablissement: { connect: { id: tid } },
      },
    });
    revalidatePath("/dashboard/groups");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function updateGroupAction(data: any) {
  try {
    const { id, ...updateData } = data;
    const result = await prisma.groupe.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.capacity && { capacity: Number(updateData.capacity) }),
      },
    });
    revalidatePath("/dashboard/groups");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function deleteGroupAction({ id }: { id: string }) {
  try {
    await prisma.groupe.delete({ where: { id } });
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

// ==========================================
// --- ACTIVITÉS (ACTIVITIES) ---
// ==========================================

export async function createActivityAction(data: any) {
  try {
    const tid = await getEtablissementId();
    const result = await prisma.activity.create({
      data: {
        name: data.name,
        description: data.description,
        // basePrice supprimé ici pour correspondre à ton schéma
        etablissement: { connect: { id: tid } },
      },
    });
    revalidatePath("/dashboard/activities");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function updateActivityAction(data: any) {
  try {
    const { id, ...updateData } = data;
    const result = await prisma.activity.update({
      where: { id },
      data: {
        name: updateData.name,
        description: updateData.description,
        // basePrice supprimé ici aussi
      },
    });
    revalidatePath("/dashboard/activities");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function deleteActivityAction({ id }: { id: string }) {
  try {
    await prisma.activity.delete({ where: { id } });
    revalidatePath("/dashboard/activities");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

// ==========================================
// --- PRÉSENCES (ATTENDANCE) ---
// ==========================================

export async function markPresenceAction(data: any) {
  try {
    const result = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId: data.seanceId,
          studentId: data.participantId,
        },
      },
      create: {
        status: data.statut,
        retardMinutes: data.retard ? Number(data.retard) : 0,
        note: data.note,
        sessionId: data.seanceId,
        studentId: data.participantId,
      },
      update: {
        status: data.statut,
        retardMinutes: data.retard ? Number(data.retard) : 0,
        note: data.note,
      },
    });
    revalidatePath("/dashboard/attendance");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}