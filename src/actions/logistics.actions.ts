"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getEtablissementId() {
  const etablissement = await prisma.etablissement.findFirst();
  if (!etablissement) throw new Error("Établissement introuvable");
  return etablissement.id;
}

function purify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// --- GROUPES (CORRECTION DÉFINITIVE) ---
// ==========================================

export async function createGroupAction(data: any) {
  try {
    const tid = await getEtablissementId();

    // On prépare l'objet de base sans les relations pour l'instant
    const prismaData: any = {
      name: String(data.name),
      level: data.level ? String(data.level) : null,
      schedule: data.schedule ? String(data.schedule) : null,
      capacity: data.capacity ? parseInt(data.capacity, 10) : null,
      etablissement: { connect: { id: tid } },
    };

    /**
     * LE BUG EST ICI : Vérifie ton fichier schema.prisma
     * Si le champ s'appelle "activite", change "activity" ci-dessous.
     */
    if (data.activityId && data.activityId.length > 5) {
      // On essaie le nom standard 'activity'
      prismaData.activity = { connect: { id: data.activityId } };
    }

    if (data.instructorId && data.instructorId.length > 5) {
      // On essaie le nom standard 'instructor'
      prismaData.instructor = { connect: { id: data.instructorId } };
    }

    console.log("Tentative de création avec :", JSON.stringify(prismaData, null, 2));

    const result = await prisma.groupe.create({
      data: prismaData,
    });

    revalidatePath("/dashboard/groups");
    return { success: true, data: purify(result) };

  } catch (error: any) {
    console.error("ERREUR CRITIQUE PRISMA :", error.message);
    
    // Si l'erreur dit que 'activity' n'existe pas, on tente 'activite'
    if (error.message.includes("Unknown argument 'activity'")) {
       return { success: false, error: { message: "ERREUR DE NOM : Change 'activity' par 'activite' dans le code." } };
    }

    return { success: false, error: { message: error.message } };
  }
}

export async function updateGroupAction(data: any) {
  try {
    const { id, ...updateData } = data;
    const result = await prisma.groupe.update({
      where: { id },
      data: {
        name: updateData.name,
        level: updateData.level || null,
        schedule: updateData.schedule || null,
        capacity: updateData.capacity ? parseInt(updateData.capacity, 10) : null,
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
// --- SALLES (ROOMS) ---
// ==========================================

export async function createRoomAction(data: any) {
  try {
    const tid = await getEtablissementId();
    const result = await prisma.room.create({
      data: {
        name: data.name,
        capacity: parseInt(data.capacity, 10) || 0,
        description: data.description || null,
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
        name: updateData.name,
        capacity: parseInt(updateData.capacity, 10) || 0,
        description: updateData.description || null,
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
// --- ACTIVITÉS (ACTIVITIES) ---
// ==========================================

export async function createActivityAction(data: any) {
  try {
    const tid = await getEtablissementId();
    const result = await prisma.activity.create({
      data: {
        name: data.name,
        description: data.description || null,
        duration: data.duration ? parseInt(data.duration, 10) : 0,
        color: data.color || "#0F515C",
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
        description: updateData.description || null,
        duration: updateData.duration ? parseInt(updateData.duration, 10) : 0,
        color: updateData.color,
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
// --- PRÉSENCES ---
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
        retardMinutes: parseInt(data.retard, 10) || 0,
        note: data.note || null,
        sessionId: data.seanceId,
        studentId: data.participantId,
      },
      update: {
        status: data.statut,
        retardMinutes: parseInt(data.retard, 10) || 0,
        note: data.note || null,
      },
    });
    revalidatePath("/dashboard/attendance");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}