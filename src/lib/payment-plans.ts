import { addMonths } from "date-fns";

/**
 * Génération d'un échéancier de type « mensualités » adapté au marché algérien :
 * des frais d'inscription réglés à l'entrée, puis N mensualités égales.
 *
 * Utilisé côté formulaire pour pré-remplir les tranches ; l'action serveur
 * `createPaymentPlanAction` les enregistre telles quelles (avec leur `label`).
 */

export interface GeneratedTranche {
	amount: number;
	dueDate: string; // ISO
	label: string;
}

const MONTHS_FR = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
];

/** Libellé « Septembre 2026 » pour une date donnée. */
function monthLabel(d: Date): string {
	return `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Construit les tranches d'un échéancier mensuel.
 * @param opts.registrationFee  Frais d'inscription (0 = aucun) dus à `startDate`.
 * @param opts.monthlyAmount    Montant d'une mensualité (> 0).
 * @param opts.months           Nombre de mensualités (1..24).
 * @param opts.startDate        Date de la 1re mensualité (ISO ou Date).
 */
export function generateMonthlyTranches(opts: {
	registrationFee: number;
	monthlyAmount: number;
	months: number;
	startDate: string | Date;
}): GeneratedTranche[] {
	const start =
		typeof opts.startDate === "string"
			? new Date(opts.startDate)
			: opts.startDate;
	const months = Math.max(1, Math.min(24, Math.floor(opts.months)));
	const tranches: GeneratedTranche[] = [];

	if (opts.registrationFee > 0) {
		tranches.push({
			amount: opts.registrationFee,
			dueDate: start.toISOString(),
			label: "Inscription",
		});
	}

	for (let i = 0; i < months; i++) {
		const due = addMonths(start, i);
		tranches.push({
			amount: opts.monthlyAmount,
			dueDate: due.toISOString(),
			label: monthLabel(due),
		});
	}

	return tranches;
}

/** Total d'un échéancier mensuel (inscription + mensualités). */
export function monthlyPlanTotal(opts: {
	registrationFee: number;
	monthlyAmount: number;
	months: number;
}): number {
	const months = Math.max(1, Math.min(24, Math.floor(opts.months)));
	return opts.registrationFee + opts.monthlyAmount * months;
}
