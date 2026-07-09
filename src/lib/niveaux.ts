import type { NiveauScolaire } from "@prisma/client";

/**
 * Niveaux scolaires algériens (primaire / moyen / secondaire).
 * Ordre pédagogique + libellés bilingues FR/AR + regroupement par cycle,
 * pour l'affichage (badges), les formulaires (select) et les filtres.
 */

export type Cycle = "PRIMAIRE" | "MOYEN" | "SECONDAIRE";

interface NiveauMeta {
	value: NiveauScolaire;
	cycle: Cycle;
	fr: string;
	ar: string;
	/** Code court affiché en badge (ex. « 3AM »). */
	short: string;
}

// Ordre pédagogique officiel du système algérien.
export const NIVEAUX: NiveauMeta[] = [
	{
		value: "AP1",
		cycle: "PRIMAIRE",
		fr: "1re année primaire",
		ar: "السنة الأولى ابتدائي",
		short: "1AP",
	},
	{
		value: "AP2",
		cycle: "PRIMAIRE",
		fr: "2e année primaire",
		ar: "السنة الثانية ابتدائي",
		short: "2AP",
	},
	{
		value: "AP3",
		cycle: "PRIMAIRE",
		fr: "3e année primaire",
		ar: "السنة الثالثة ابتدائي",
		short: "3AP",
	},
	{
		value: "AP4",
		cycle: "PRIMAIRE",
		fr: "4e année primaire",
		ar: "السنة الرابعة ابتدائي",
		short: "4AP",
	},
	{
		value: "AP5",
		cycle: "PRIMAIRE",
		fr: "5e année primaire",
		ar: "السنة الخامسة ابتدائي",
		short: "5AP",
	},
	{
		value: "AM1",
		cycle: "MOYEN",
		fr: "1re année moyenne",
		ar: "السنة الأولى متوسط",
		short: "1AM",
	},
	{
		value: "AM2",
		cycle: "MOYEN",
		fr: "2e année moyenne",
		ar: "السنة الثانية متوسط",
		short: "2AM",
	},
	{
		value: "AM3",
		cycle: "MOYEN",
		fr: "3e année moyenne",
		ar: "السنة الثالثة متوسط",
		short: "3AM",
	},
	{
		value: "AM4",
		cycle: "MOYEN",
		fr: "4e année moyenne (BEM)",
		ar: "السنة الرابعة متوسط (ش.ت.م)",
		short: "4AM",
	},
	{
		value: "AS1",
		cycle: "SECONDAIRE",
		fr: "1re année secondaire",
		ar: "السنة الأولى ثانوي",
		short: "1AS",
	},
	{
		value: "AS2",
		cycle: "SECONDAIRE",
		fr: "2e année secondaire",
		ar: "السنة الثانية ثانوي",
		short: "2AS",
	},
	{
		value: "AS3",
		cycle: "SECONDAIRE",
		fr: "3e année secondaire (BAC)",
		ar: "السنة الثالثة ثانوي (بكالوريا)",
		short: "3AS",
	},
];

const BY_VALUE = new Map(NIVEAUX.map((n) => [n.value, n]));

/** Libellé complet localisé d'un niveau (`fr` par défaut). */
export function niveauLabel(
	value: NiveauScolaire | null | undefined,
	locale = "fr",
): string {
	if (!value) return "";
	const meta = BY_VALUE.get(value);
	if (!meta) return String(value);
	return locale.startsWith("ar") ? meta.ar : meta.fr;
}

/** Code court d'un niveau (ex. « 3AM »), indépendant de la langue. */
export function niveauShort(value: NiveauScolaire | null | undefined): string {
	if (!value) return "";
	return BY_VALUE.get(value)?.short ?? String(value);
}

/** Cycle d'un niveau (PRIMAIRE / MOYEN / SECONDAIRE). */
export function niveauCycle(
	value: NiveauScolaire | null | undefined,
): Cycle | null {
	if (!value) return null;
	return BY_VALUE.get(value)?.cycle ?? null;
}

/** Options groupées par cycle, prêtes pour un `<select>` avec `<optgroup>`. */
export function niveauxByCycle(locale = "fr"): {
	cycle: Cycle;
	label: string;
	options: { value: NiveauScolaire; label: string }[];
}[] {
	const cycleLabels: Record<Cycle, { fr: string; ar: string }> = {
		PRIMAIRE: { fr: "Primaire", ar: "ابتدائي" },
		MOYEN: { fr: "Moyen", ar: "متوسط" },
		SECONDAIRE: { fr: "Secondaire", ar: "ثانوي" },
	};
	const ar = locale.startsWith("ar");
	const cycles: Cycle[] = ["PRIMAIRE", "MOYEN", "SECONDAIRE"];
	return cycles.map((cycle) => ({
		cycle,
		label: ar ? cycleLabels[cycle].ar : cycleLabels[cycle].fr,
		options: NIVEAUX.filter((n) => n.cycle === cycle).map((n) => ({
			value: n.value,
			label: ar ? n.ar : n.fr,
		})),
	}));
}
