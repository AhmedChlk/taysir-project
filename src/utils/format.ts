import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne les classes Tailwind de manière conditionnelle et gère les conflits.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formatte le nom complet d'un utilisateur ou d'un étudiant.
 */
export function formatFullName(firstName?: string, lastName?: string): string {
	if (!firstName && !lastName) return "";
	return `${firstName ?? ""} ${lastName ?? ""}`.trim();
}

/**
 * Formatte une date selon le locale et les options fournies.
 * Défaut FR : jj/MM/aaaa (jamais le format US M/J/AAAA).
 */
export function formatDate(
	date: Date | string,
	locale: string = "fr-FR",
	options: Intl.DateTimeFormatOptions = {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	},
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString(locale, options);
}

/**
 * Formatte une heure selon le locale.
 */
export function formatTime(
	date: Date | string,
	locale: string = "fr",
	options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleTimeString(locale, options);
}

/**
 * Formatte un montant monétaire. Défaut marché algérien : « 1 500 DA »
 * (groupage des milliers fr-FR).
 */
export function formatCurrency(
	amount: number,
	currency: string = "DA",
): string {
	return `${amount.toLocaleString("fr-FR")} ${currency}`;
}
