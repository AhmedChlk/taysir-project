/* ==========================================================================
   wa-relance — build a one-click WhatsApp reminder (relance) for unpaid
   tuition. Algerian market: phones normalised to international 213… form,
   message pre-filled in French. Opens wa.me (no API key needed).
   ========================================================================== */

/** Normalise an Algerian phone to wa.me digits (e.g. "0661…" → "213661…"). */
export function normalizeDzPhone(raw?: string | null): string | null {
	if (!raw) return null;
	let d = raw.replace(/\D/g, "");
	if (!d) return null;
	if (d.startsWith("00")) d = d.slice(2);
	if (d.startsWith("213")) return d;
	if (d.startsWith("0")) return `213${d.slice(1)}`;
	// bare local mobile (9 digits, e.g. 6XXXXXXXX / 5XXXXXXXX / 7XXXXXXXX)
	if (d.length === 9) return `213${d}`;
	return d;
}

export interface RelanceLine {
	/** Human label for the échéance, e.g. "15/06/2026". */
	dueLabel: string;
	amount: number;
	overdue?: boolean | undefined;
}

/** Detailed reminder: school name + the échéances to settle + total. */
export function buildRelanceMessage(opts: {
	firstName: string;
	remaining: number;
	school?: string | undefined;
	lines?: RelanceLine[] | undefined;
}): string {
	const da = (n: number) => `${n.toLocaleString("fr-FR")} DA`;
	const header = opts.school ? `Bonjour, ici ${opts.school}.` : "Bonjour,";
	const intro = `Rappel concernant la scolarité de ${opts.firstName}.`;

	let detail = "";
	if (opts.lines && opts.lines.length > 0) {
		const items = opts.lines
			.map(
				(l) =>
					`• Échéance du ${l.dueLabel} : ${da(l.amount)}${l.overdue ? " (en retard)" : ""}`,
			)
			.join("\n");
		detail = `\nÉchéances à régler :\n${items}`;
	}

	const total = `\nSolde total à régler : ${da(opts.remaining)}.`;
	const outro = "\nMerci de bien vouloir régulariser. Cordialement.";
	return `${header}\n${intro}${detail}${total}${outro}`;
}

export function buildWaUrl(phone: string, message: string): string {
	return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Lien SMS natif (schéma `sms:`) — pour les parents sans WhatsApp (fréquent en
 * Algérie). Ouvre l'app SMS du téléphone avec le message pré-rempli. `phone`
 * doit être au format international sans `+` (ex. « 213661… ») ; on préfixe `+`.
 */
export function buildSmsUrl(phone: string, message: string): string {
	return `sms:+${phone}?&body=${encodeURIComponent(message)}`;
}

/**
 * Reçu de paiement envoyé au parent via WhatsApp (bilingue FR/AR).
 * Le canal wa.me ne permet pas de pièce jointe : le message porte le détail du
 * reçu (numéro, montant réglé, solde restant). Le PDF reste téléchargeable.
 */
export function buildReceiptMessage(opts: {
	studentFirstName: string;
	amount: number;
	receiptNumber?: number | null;
	remaining: number;
	school?: string | undefined;
	locale?: string | undefined;
}): string {
	const da = (n: number) => `${n.toLocaleString("fr-FR")} DA`;
	const num =
		opts.receiptNumber != null
			? `N° ${String(opts.receiptNumber).padStart(4, "0")}`
			: "";
	if ((opts.locale ?? "fr").startsWith("ar")) {
		const header = opts.school ? `مرحبًا، من ${opts.school}.` : "مرحبًا،";
		return (
			`${header}\n` +
			`نؤكد استلام دفعة بمبلغ ${da(opts.amount)} بخصوص ${opts.studentFirstName}. وصل ${num}.\n` +
			(opts.remaining > 0
				? `المبلغ المتبقي: ${da(opts.remaining)}.`
				: `تمّت تسوية كامل المبلغ. شكرًا لكم.`)
		);
	}
	const header = opts.school ? `Bonjour, ici ${opts.school}.` : "Bonjour,";
	return (
		`${header}\n` +
		`Nous confirmons la réception d'un paiement de ${da(opts.amount)} pour ${opts.studentFirstName}. Reçu ${num}.\n` +
		(opts.remaining > 0
			? `Solde restant : ${da(opts.remaining)}.`
			: `Scolarité entièrement réglée. Merci.`)
	);
}

/**
 * Message d'alerte d'absence à destination du parent (bilingue FR/AR selon le
 * locale). Canal WhatsApp — n°1 de communication parents en Algérie.
 */
export function buildAbsenceMessage(opts: {
	studentFirstName: string;
	sessionLabel: string; // ex. "Mathématiques — mercredi 1 juillet à 09:00"
	school?: string | undefined;
	locale?: string | undefined;
}): string {
	if ((opts.locale ?? "fr").startsWith("ar")) {
		const header = opts.school ? `مرحبًا، من ${opts.school}.` : "مرحبًا،";
		return (
			`${header}\n` +
			`نودّ إعلامكم بغياب ${opts.studentFirstName} عن الحصة: ${opts.sessionLabel}.\n` +
			`يرجى التكرم بتبرير الغياب. مع خالص التقدير.`
		);
	}
	const header = opts.school ? `Bonjour, ici ${opts.school}.` : "Bonjour,";
	return (
		`${header}\n` +
		`Nous vous informons de l'absence de ${opts.studentFirstName} à la séance : ${opts.sessionLabel}.\n` +
		`Merci de bien vouloir justifier cette absence. Cordialement.`
	);
}
