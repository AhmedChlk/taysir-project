"use server";

import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Fonction utilitaire de purification Prisma -> Client (anti-crash Turbopack)
function purify(data: any) {
  if (!data) return null;
  return JSON.parse(JSON.stringify(data));
}

// Récupération intelligente de l'Établissement (via Session ou Fallback local)
async function getTenantId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.etablissementId) {
    return session.user.etablissementId;
  }
  const etablissement = await prisma.etablissement.findFirst();
  return etablissement?.id;
}

// ==========================================
// --- PARAMÈTRES & UTILISATEUR CONNECTÉ ---
// ==========================================

export const getCurrentTenant = async () => {
  const tid = await getTenantId();
  if (!tid) return null;
  const tenant = await prisma.etablissement.findUnique({ where: { id: tid } });
  return purify(tenant);
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;

  // Fallback si la session expire en dev
  if (!userId) {
    const fallbackUser = await prisma.user.findFirst();
    userId = fallbackUser?.id;
  }
  
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true, 
      role: true, avatarUrl: true, isActive: true, etablissementId: true,
    }
  });
  return purify(user);
};

// ==========================================
// --- LISTES (LOGISTIQUE & UTILISATEURS) ---
// ==========================================

export const getStaff = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const staff = await prisma.user.findMany({ where: { etablissementId: tid } });
  return purify(staff);
};

export const getRooms = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const rooms = await prisma.room.findMany({ where: { etablissementId: tid } });
  return purify(rooms);
};

export const getActivities = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const activities = await prisma.activity.findMany({ where: { etablissementId: tid } });
  return purify(activities);
};

export const getGroups = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const groups = await prisma.groupe.findMany({ where: { etablissementId: tid } });
  return purify(groups);
};

export const getStudents = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const students = await prisma.student.findMany({ 
    where: { etablissementId: tid },
    include: { groups: true }
  });
  return purify(students);
};

// ==========================================
// --- TABLEAU DE BORD (DASHBOARD) ---
// ==========================================

export const getSessions = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const sessions = await prisma.session.findMany({
    include: { room: true, activity: true, group: true }
  });
  return purify(sessions);
};

export const getAttendance = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  const attendance = await prisma.attendanceRecord.findMany();
  return purify(attendance);
};

export const getPayments = async () => {
  const tid = await getTenantId();
  if (!tid) return [];
  
  const payments = await prisma.paymentPlan.findMany({
    where: { etablissementId: tid },
    include: { student: true },
    orderBy: { createdAt: 'desc' } // CORRECTION : createdAt au lieu de date
  });
  
  return purify(payments);
};

export const getAttendanceStats = async () => {
  const tid = await getTenantId();
  if (!tid) return [];

  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  
  const records = await prisma.attendanceRecord.findMany({
    where: {
      session: {
        startTime: { gte: start, lte: end }
      }
    },
    select: {
      status: true,
      session: {
        select: { startTime: true }
      }
    }
  });

  const days = eachDayOfInterval({ start, end });
  
  const stats = days.map(day => {
    const dayRecords = records.filter(r => isSameDay(new Date(r.session.startTime), day));
    if (dayRecords.length === 0) return 0;
    
    const presentCount = dayRecords.filter(r => r.status === "PRESENT" || r.status === "RETARD").length;
    return Math.round((presentCount / dayRecords.length) * 100);
  });

  return purify(stats);
};