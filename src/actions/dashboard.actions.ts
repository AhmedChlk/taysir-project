'use server';

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

/**
 * RÉCUPÉRATION DES STATISTIQUES ÉLÈVES
 */
export const getDashboardStatsAction = createSafeAction(
  z.object({}),
  async (_, { tenantId }) => {
    const client = getTenantPrisma(tenantId);
    
    const [totalStudents, activeStudents] = await Promise.all([
      client.student.count(),
      client.student.count({ where: { isActive: true } })
    ]);

    return {
      total: totalStudents,
      active: activeStudents,
      inactive: totalStudents - activeStudents
    };
  }
);

/**
 * RÉCUPÉRATION DES SÉANCES DU JOUR
 */
export const getTodaySessionsAction = createSafeAction(
  z.object({}),
  async (_, { tenantId }) => {
    const client = getTenantPrisma(tenantId);
    const now = new Date();
    
    return await client.session.findMany({
      where: {
        startTime: {
          gte: startOfDay(now),
          lte: endOfDay(now)
        }
      },
      include: {
        room: true,
        activity: true,
        group: true,
        instructor: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }
);

/**
 * RÉCUPÉRATION DES PAIEMENTS EN ATTENTE (RECOUVREMENT)
 */
export const getPendingPaymentsAction = createSafeAction(
  z.object({}),
  async (_, { tenantId }) => {
    const client = getTenantPrisma(tenantId);
    
    const pendingPlans = await client.paymentPlan.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      include: {
        student: true,
        tranches: {
          where: { isPaid: false },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    const totalPendingAmount = pendingPlans.reduce((acc: number, plan: { totalAmount: number; paidAmount: number }) => 
      acc + (plan.totalAmount - plan.paidAmount), 0
    );

    return {
      count: pendingPlans.length,
      totalAmount: totalPendingAmount,
      plans: pendingPlans
    };
  }
);

/**
 * STATISTIQUES DE PRÉSENCE (GRAPH)
 */
export const getAttendanceStatsAction = createSafeAction(
  z.object({}),
  async (_, { tenantId }) => {
    const client = getTenantPrisma(tenantId);
    const now = new Date();
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
        session: { select: { startTime: true } }
      }
    });

    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayRecords = records.filter((r: { session: { startTime: Date } }) => isSameDay(r.session.startTime, day));
      if (dayRecords.length === 0) return 0;
      
      const presentCount = dayRecords.filter((r: { status: string }) => 
        r.status === "PRESENT" || r.status === "RETARD"
      ).length;
      
      return Math.round((presentCount / dayRecords.length) * 100);
    });
  }
);
