// Configuration de Prisma et gestion du multi-tenant

import { PrismaClient } from "@prisma/client";

// On crée une seule instance de Prisma
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

// Fonction pour filtrer les données par école automatiquement
export function getTenantPrisma(etablissementId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Modèles globaux sans isolation par établissement
          const skipModels = ["Etablissement"];
          if (skipModels.includes(model)) {
            return query(args);
          }

          // Gestion des findUnique qui deviennent des findFirst avec le tenantId
          if (operation === "findUnique" || operation === "findUniqueOrThrow") {
            const newOp = operation === "findUnique" ? "findFirst" : "findFirstOrThrow";
            return (prisma as any)[model][newOp]({
              ...args,
              where: {
                ...args.where,
                etablissementId,
              },
            });
          }

          // On ajoute le etablissementId partout pour la sécurité
          const filterOperations = [
            "findMany", "findFirst", "findFirstOrThrow",
            "update", "updateMany", "delete", "deleteMany", 
            "count", "aggregate", "groupBy",
          ];

          if (filterOperations.includes(operation)) {
            (args as any).where = {
              ...((args as any).where || {}),
              etablissementId,
            };
          }

          // Injection pour les créations
          if (operation === "create") {
            (args as any).data = { ...(args as any).data, etablissementId };
          }

          if (operation === "createMany") {
            if (Array.isArray((args as any).data)) {
              (args as any).data = (args as any).data.map((item: any) => ({ ...item, etablissementId }));
            } else if ((args as any).data) {
              (args as any).data = { ...(args as any).data, etablissementId };
            }
          }
          
          if (operation === "upsert") {
            (args as any).where = { ...(args as any).where, etablissementId };
            (args as any).create = { ...(args as any).create, etablissementId };
            (args as any).update = { ...(args as any).update, etablissementId };
          }

          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>;
