import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma optimisé pour VPS (Long-running process)
 * Empêche la saturation du pool de connexions lors des rechargements (HMR).
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var tenantClients: Map<string, any> | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

// Cache global pour les clients étendus par tenant
if (!globalThis.tenantClients) {
  globalThis.tenantClients = new Map();
}

/**
 * Extension Multi-tenant de Haute Précision - MÉMOÏSÉE
 * Empêche la création répétée d'extensions qui dégradent les performances.
 */
export function getTenantPrisma(etablissementId: string) {
  if (!etablissementId) {
    throw new Error('Tentative d accès aux données sans ID d établissement valide.');
  }

  // Retourne le client du cache s'il existe
  if (globalThis.tenantClients?.has(etablissementId)) {
    return globalThis.tenantClients.get(etablissementId);
  }

  const extendedClient = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Modèles globaux exclus de l'isolation
          const globalModels = ['Etablissement'];
          if (globalModels.includes(model)) {
            return query(args);
          }

          // Sécurisation chirurgicale des filtres
          const filterOps = [
            'findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow',
            'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'
          ];

          if (filterOps.includes(operation)) {
            const finalArgs = {
              ...(args as any),
              where: {
                ...((args as any).where || {}),
                etablissementId,
              },
            };
            return query(finalArgs);
          }

          // Injection forcée lors des mutations (Create/Upsert)
          if (operation === 'create') {
            (args as any).data = { ...((args as any).data || {}), etablissementId };
          }

          if (operation === 'createMany') {
            if (Array.isArray((args as any).data)) {
              (args as any).data = (args as any).data.map((item: any) => ({ ...item, etablissementId }));
            }
          }

          if (operation === 'upsert') {
            (args as any).create = { ...((args as any).create || {}), etablissementId };
            (args as any).update = { ...((args as any).update || {}), etablissementId };
            (args as any).where = { ...((args as any).where || {}), etablissementId };
          }

          return query(args);
        },
      },
    },
  });

  // Mise en cache du client pour ce tenant
  globalThis.tenantClients?.set(etablissementId, extendedClient);
  
  return extendedClient;
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>;
