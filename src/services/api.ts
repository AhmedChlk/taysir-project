// Fonctions pour récupérer les données (Server Side Only)

import "server-only";
import { prisma, getTenantPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cache } from "react";

/**
 * RÉCUPÉRATION DU PRISMA MÉMOÏSÉE (PERFORMANCE)
 * Utilise React Cache pour ne pas appeler getServerSession plusieurs fois par requête.
 */
const getPrisma = cache(async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  
  if (!session || !user) {
    throw new TaysirError("Accès refusé : Session non valide.", ErrorCodes.ERR_UNAUTHORIZED, 401);
  }

  if (user.role === "SUPER_ADMIN") {
    return prisma;
  }

  if (!user.etablissementId) {
    throw new TaysirError("Accès refusé : Aucun établissement rattaché.", ErrorCodes.ERR_UNAUTHORIZED, 401);
  }

  return getTenantPrisma(user.etablissementId);
});

// Récupérer les infos de l'école actuelle
export const getCurrentTenant = cache(async () => {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.etablissementId;
  
  if (!tenantId) return null;

  return await prisma.etablissement.findUnique({
    where: { id: tenantId }
  });
});

// Récupérer l'utilisateur connecté
export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) return null;

  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      etablissementId: true,
    }
  });
});

// Liste des écoles
export const getTenants = async () => {
  return await prisma.etablissement.findMany();
};

// Liste du staff
export const getStaff = async () => {
  const client = await getPrisma();
  return await client.user.findMany({
    orderBy: { createdAt: "desc" }
  });
};

// Liste des salles
export const getRooms = async () => {
  const client = await getPrisma();
  return await client.room.findMany();
};

// Liste des activités
export const getActivities = async () => {
  const client = await getPrisma();
  return await client.activity.findMany();
};

// Liste des groupes
export const getGroups = async () => {
  const client = await getPrisma();
  return await client.groupe.findMany({
    include: { students: true }
  });
};

// Liste des séances
export const getSessions = async () => {
  const client = await getPrisma();
  return await client.session.findMany({
    include: { room: true, activity: true, group: true }
  });
};

// Liste des élèves
export const getStudents = async () => {
  const client = await getPrisma();
  return await client.student.findMany({
    include: { groups: true }
  });
};

// Liste des paiements (PaymentPlans)
export const getPayments = async () => {
  const client = await getPrisma();
  return await client.paymentPlan.findMany({
    include: { 
      student: true,
      tranches: {
        include: { paiements: true },
        orderBy: { dueDate: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

// Liste des présences
export const getAttendance = async () => {
  const client = await getPrisma();
  return await client.attendanceRecord.findMany();
};

// Statistiques de présence pour le graphique
export const getAttendanceStats = async () => {
  const client = await getPrisma();
  const now = new Date();
  
  // On définit le début et la fin de la semaine actuelle (Lundi à Dimanche)
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  
  const records = await client.attendanceRecord.findMany({
    where: {
      session: {
        startTime: { gte: start, lte: end }
      }
    },
    select: {
      status: true,
      session: {
        select: {
          startTime: true
        }
      }
    }
  });

  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => {
    const dayRecords = records.filter((r: { session: { startTime: Date } }) => isSameDay(r.session.startTime, day));
    if (dayRecords.length === 0) return 0;
    
    const presentCount = dayRecords.filter((r: { status: string }) => r.status === "PRESENT" || r.status === "RETARD").length;
    return Math.round((presentCount / dayRecords.length) * 100);
  });
};
