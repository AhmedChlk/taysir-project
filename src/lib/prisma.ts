import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
	return new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});
};

declare global {
	var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
	// biome-ignore lint/suspicious/noExplicitAny: PrismaClient extensions are not statically typeable without circular references
	var tenantClients: Map<string, any> | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

if (!globalThis.tenantClients) {
	globalThis.tenantClients = new Map();
}

/**
 * Returns a tenant-scoped Prisma client that automatically injects
 * `etablissementId` into all read/write operations for multi-tenant isolation.
 *
 * The returned type is `PrismaClient` to maintain call-site type safety.
 * The underlying client is a `$extends`-enhanced instance that enforces
 * tenant isolation at the query middleware level.
 */
export function getTenantPrisma(etablissementId: string): PrismaClient {
	if (!etablissementId) {
		throw new Error(
			"Tentative d accès aux données sans ID d établissement valide.",
		);
	}

	if (etablissementId === "SUPERADMIN_ACCESS") {
		return prisma;
	}

	const cached = globalThis.tenantClients?.get(etablissementId);
	if (cached) {
		return cached as PrismaClient;
	}

	const extendedClient = prisma.$extends({
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

	globalThis.tenantClients?.set(etablissementId, extendedClient);

	// Cast to PrismaClient for consistent call-site typing.
	// The runtime implementation is the extended client above which enforces tenancy.
	return extendedClient as unknown as PrismaClient;
}

export type TenantPrismaClient = PrismaClient;
