/**
 * Strips all `undefined` values from an object before passing it to Prisma.
 * Required because `exactOptionalPropertyTypes: true` in tsconfig causes
 * Zod-parsed optional fields (`field?: T | undefined`) to conflict with
 * Prisma's strict input types (`field?: T` without the `| undefined`).
 */
// biome-ignore lint/suspicious/noExplicitAny: The return type must be any to allow assignment to Prisma strict input types
export function stripUndefined<T extends object>(obj: T): any {
	return Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	);
}
