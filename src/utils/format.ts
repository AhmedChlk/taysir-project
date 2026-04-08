/**
 * Formatte le nom complet d'un utilisateur ou d'un étudiant.
 */
export function formatFullName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "";
  return `${firstName ?? ""} ${lastName ?? ""}`.trim();
}

/**
 * Formatte une date selon le locale et les options fournies.
 */
export function formatDate(date: Date | string, locale: string = "fr", options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, options);
}

/**
 * Formatte une heure selon le locale.
 */
export function formatTime(date: Date | string, locale: string = "fr", options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale, options);
}

/**
 * Formatte un montant monétaire.
 */
export function formatCurrency(amount: number, currency: string = "DZD"): string {
  return `${amount.toLocaleString()} ${currency}`;
}
