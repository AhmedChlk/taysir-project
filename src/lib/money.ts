import { Prisma } from "@prisma/client";

/**
 * Conversion des montants monétaires à la frontière lecture DB → application.
 *
 * En base, l'argent est stocké en `Decimal(12, 2)` (type Postgres `numeric`)
 * pour un stockage et une agrégation SQL exacts, sans dérive binaire.
 * Prisma matérialise ces colonnes en objets `Prisma.Decimal` (Decimal.js) qui
 * ne sont ni sérialisables vers les Client Components RSC ni utilisables dans
 * l'arithmétique JS (`a + b` concaténerait). On les convertit donc en `number`
 * dès la sortie de Prisma : les montants DZD (2 décimales, < 10^10) tiennent
 * très largement dans la plage des entiers sûrs JS (2^53), la conversion est
 * exacte et les gardes de tolérance (0.01) absorbent le bruit arithmétique.
 */

type DecimalLike = Prisma.Decimal | number | null | undefined;

/** Convertit un montant Decimal (ou number) en `number`. `null`/`undefined` → 0. */
export function money(value: DecimalLike): number {
	if (value == null) return 0;
	if (typeof value === "number") return value;
	return value.toNumber();
}

/** Variante préservant l'absence de valeur : `null`/`undefined` restent `null`. */
export function moneyOrNull(value: DecimalLike): number | null {
	if (value == null) return null;
	return money(value);
}

/** Somme d'une liste d'objets sur un champ monétaire, en `number`. */
export function sumMoney<T>(
	items: T[],
	pick: (item: T) => DecimalLike,
): number {
	return items.reduce((acc, item) => acc + money(pick(item)), 0);
}

/** Ré-export pour construire des Decimal côté écriture si besoin d'exactitude. */
export const Decimal = Prisma.Decimal;
