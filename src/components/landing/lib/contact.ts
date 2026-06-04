// Central contact config for the landing CTAs.
// TODO(ahmed): replace placeholders with the real numbers before going live.
export const CONTACT = {
	// International format, digits only (no +, no spaces) for wa.me links.
	whatsapp: "213000000000",
	phoneDisplay: "+213 00 00 00 00",
	email: "contact@taysir.dz",
} as const;

export function whatsappUrl(message?: string): string {
	const base = `https://wa.me/${CONTACT.whatsapp}`;
	return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const DEFAULT_WA_MESSAGE =
	"Bonjour Taysir, je gère un établissement et je souhaite une démo de la plateforme.";
