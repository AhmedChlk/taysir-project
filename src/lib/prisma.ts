import { PrismaClient } from "@prisma/client";

// Évite l'instanciation multiple de Prisma en mode développement (Hot Reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Fonction utilitaire pour simuler le Multi-Tenant en local
export const getTenantPrisma = (tenantId?: string) => {
  return prisma; // En production, on pourrait injecter des Prisma Extensions (RLS) ici
};