import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
	return new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});
};

const TENANT_CLIENT_TTL_MS = 5 * 60 * 1000; // 5 minutes

type TenantExtension = ReturnType<typeof buildTenantExtension>;

interface CachedTenantClient {
	client: TenantExtension;
	createdAt: number;
}

declare global {
	var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
	var tenantClients: Map<string, CachedTenantClient> | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

if (!globalThis.tenantClients) {
	globalThis.tenantClients = new Map();
}

function buildTenantExtension(etablissementId: string) {
	return prisma.$extends({
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					const globalModels = ["Etablissement"];
					if (globalModels.includes(model)) {
						return query(args);
					}

					const filterOps = [
						"findMany",
						"findFirst",
						"findFirstOrThrow",
						"findUnique",
						"findUniqueOrThrow",
						"update",
						"updateMany",
						"delete",
						"deleteMany",
						"count",
						"aggregate",
						"groupBy",
					];

					// biome-ignore lint/suspicious/noExplicitAny: Prisma extension args require dynamic casting for tenant injection middleware
					const mutableArgs = args as Record<string, any>;

					if (filterOps.includes(operation)) {
						mutableArgs.where = {
							...(mutableArgs.where ?? {}),
							etablissementId,
						};
						return query(args);
					}

					if (operation === "create") {
						mutableArgs.data = {
							...(mutableArgs.data ?? {}),
							etablissementId,
						};
						return query(args);
					}

					if (operation === "createMany") {
						if (Array.isArray(mutableArgs.data)) {
							mutableArgs.data = (
								mutableArgs.data as Record<string, unknown>[]
							).map((item) => ({
								...item,
								etablissementId,
							}));
							return query(args);
						}
					}

					if (operation === "upsert") {
						mutableArgs.create = {
							...(mutableArgs.create ?? {}),
							etablissementId,
						};
						mutableArgs.update = {
							...(mutableArgs.update ?? {}),
							etablissementId,
						};
						mutableArgs.where = {
							...(mutableArgs.where ?? {}),
							etablissementId,
						};
						return query(args);
					}

					return query(args);
				},
			},
		},
	});
}

function evictExpiredTenantClients(): void {
	const now = Date.now();
	for (const [key, cached] of globalThis.tenantClients!.entries()) {
		if (now - cached.createdAt > TENANT_CLIENT_TTL_MS) {
			globalThis.tenantClients!.delete(key);
		}
	}
}

/**
 * Returns a tenant-scoped Prisma client that automatically injects
 * `etablissementId` into all read/write operations for multi-tenant isolation.
 *
 * The returned type is `PrismaClient` to maintain call-site type safety.
 * The underlying client is a `$extends`-enhanced instance that enforces
 * tenant isolation at the query middleware level.
 *
 * Cached entries are evicted after TENANT_CLIENT_TTL_MS (5 minutes).
 * A probabilistic cleanup (1 in 10 calls) evicts all expired entries.
 */
export function getTenantPrisma(etablissementId: string): PrismaClient {
	if (!etablissementId) {
		throw new Error(
			"Tentative d accès aux données sans ID d établissement valide.",
		);
	}

	if (etablissementId === "GLOBAL_ACCESS") {
		// Client restreint au modèle global pour le SuperAdmin
		return prisma.$extends({
			query: {
				$allModels: {
					async $allOperations({ model, args, query }) {
						const globalModels = ["Etablissement"];
						if (!globalModels.includes(model)) {
							throw new Error(
								`Accès refusé : Le modèle ${model} est confidentiel et réservé au locataire.`,
							);
						}
						return query(args);
					},
				},
			},
		}) as unknown as PrismaClient;
	}

	// Probabilistic cleanup: 1 chance in 10 to evict expired entries
	if (Math.random() < 0.1) {
		evictExpiredTenantClients();
	}

	const now = Date.now();
	const cached = globalThis.tenantClients?.get(etablissementId);

	if (cached && now - cached.createdAt <= TENANT_CLIENT_TTL_MS) {
		return cached.client as unknown as PrismaClient;
	}

	const extendedClient = buildTenantExtension(etablissementId);

	globalThis.tenantClients?.set(etablissementId, {
		client: extendedClient,
		createdAt: now,
	});

	// Cast to PrismaClient for consistent call-site typing.
	// The runtime implementation is the extended client above which enforces tenancy.
	return extendedClient as unknown as PrismaClient;
}

export type TenantPrismaClient = PrismaClient;
