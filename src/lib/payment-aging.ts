/* ==========================================================================
   payment-aging — pure helpers to surface what a school director actually
   needs: how much is overdue and how old (ancienneté des impayés).
   A tranche is overdue when it is unpaid and its dueDate is in the past.
   ========================================================================== */

const DAY_MS = 86_400_000;

export interface AgingTranche {
	amount: number;
	dueDate: string | Date;
	isPaid: boolean;
}

export interface AgingPlan {
	totalAmount: number;
	paidAmount: number;
	tranches?: AgingTranche[] | null;
}

export type AgingBucket = "0-30" | "30-60" | "60+";

export function planRemaining(p: AgingPlan): number {
	return Math.max(0, p.totalAmount - p.paidAmount);
}

export interface OverdueInfo {
	overdueAmount: number;
	daysLate: number;
	oldestDueDate: Date | null;
}

export function overdueInfo(p: AgingPlan, now: Date = new Date()): OverdueInfo {
	const overdue = (p.tranches ?? []).filter(
		(tr) => !tr.isPaid && new Date(tr.dueDate).getTime() < now.getTime(),
	);
	if (overdue.length === 0) {
		return { overdueAmount: 0, daysLate: 0, oldestDueDate: null };
	}
	const times = overdue.map((tr) => new Date(tr.dueDate).getTime());
	const oldestTime = Math.min(...times);
	// On plafonne le montant en retard au reste réellement dû sur le plan.
	// Une tranche reste `isPaid=false` tant qu'elle n'est pas soldée, même si
	// des paiements partiels ont déjà été appliqués : sommer le montant plein
	// des tranches surestimerait l'impayé. `planRemaining` (total - payé) borne
	// correctement l'exposition réelle.
	const rawOverdue = overdue.reduce((a, tr) => a + tr.amount, 0);
	const overdueAmount = Math.min(rawOverdue, planRemaining(p));
	const daysLate = Math.floor((now.getTime() - oldestTime) / DAY_MS);
	return { overdueAmount, daysLate, oldestDueDate: new Date(oldestTime) };
}

export function agingBucket(daysLate: number): AgingBucket {
	if (daysLate >= 60) return "60+";
	if (daysLate >= 30) return "30-60";
	return "0-30";
}

export interface AgingSummary {
	overdueTotal: number;
	count: number;
	b0_30: number;
	b30_60: number;
	b60plus: number;
}

export function agingSummary(
	plans: AgingPlan[],
	now: Date = new Date(),
): AgingSummary {
	const s: AgingSummary = {
		overdueTotal: 0,
		count: 0,
		b0_30: 0,
		b30_60: 0,
		b60plus: 0,
	};
	for (const p of plans) {
		const o = overdueInfo(p, now);
		if (o.overdueAmount <= 0) continue;
		s.overdueTotal += o.overdueAmount;
		s.count += 1;
		const bucket = agingBucket(o.daysLate);
		if (bucket === "0-30") s.b0_30 += o.overdueAmount;
		else if (bucket === "30-60") s.b30_60 += o.overdueAmount;
		else s.b60plus += o.overdueAmount;
	}
	return s;
}
