// Récupération des stats du tableau de bord

"use server";

import { unstable_cache } from "next/cache";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

// Fonction pour récupérer les stats dans la base
const fetchDashboardStats = async (tenantId: string) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const now = new Date();

  // On parallélise les requêtes pour optimiser le temps de réponse initial
  const [activeStudents, revenueAggregation, todaySessions] = await Promise.all([
    tenantPrisma.student.count({ where: { isActive: true } }),
    
    tenantPrisma.paiement.aggregate({
      where: { date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum: { amount: true },
    }),

    tenantPrisma.session.count({
      where: { startTime: { gte: startOfDay(now), lte: endOfDay(now) }, status: "SCHEDULED" },
    }),
  ]);

  return {
    activeStudents,
    monthlyRevenue: revenueAggregation._sum.amount || 0,
    todaySessions,
    lastUpdated: now.toISOString(),
  };
};

// Cache pour éviter de surcharger la BDD
const getCachedStats = (tenantId: string) => 
  unstable_cache(
    () => fetchDashboardStats(tenantId),
    ["dashboard-stats", tenantId],
    {
      revalidate: 3600,
      tags: [`dashboard-${tenantId}`],
    }
  );

// Action pour le frontend
export const getDashboardStatsAction = createSafeAction(
  z.object({}), 
  async (_, { tenantId }) => {
    try {
      return await getCachedStats(tenantId)();
    } catch (error) {
      console.error(`[DASHBOARD_STATS_ERROR][${tenantId}]:`, error);
      throw error; // Let safe-action handle the formatting but log locally
    }
  }
);
