/**
 * Export CSV — utilitaire partagé (DRY) pour les rapports du dirigeant
 * (impayés, effectifs, assiduité). Pensé pour le marché DZ : échappement
 * correct (RFC 4180) + BOM UTF-8 pour que **Excel** affiche les accents et
 * l'arabe sans les corrompre.
 */

export type CsvCell = string | number | boolean | null | undefined;

/**
 * Sérialise des lignes en CSV (RFC 4180). Échappe les valeurs contenant
 * `, " \n \r ;` en les entourant de guillemets et en doublant les guillemets
 * internes. Fonction **pure** → testable sans DOM.
 */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
	const escapeCell = (value: CsvCell): string => {
		const s = value === null || value === undefined ? "" : String(value);
		return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	return [headers, ...rows]
		.map((row) => row.map(escapeCell).join(","))
		.join("\r\n");
}

/**
 * Déclenche le téléchargement d'un CSV côté navigateur, préfixé d'un BOM
 * UTF-8 pour Excel. À n'appeler que dans un composant client.
 */
export function downloadCsv(filename: string, csv: string): void {
	const BOM = String.fromCharCode(0xfeff);
	const blob = new Blob([BOM + csv], {
		type: "text/csv;charset=utf-8;",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/** Suffixe de date `AAAA-MM-JJ` pour nommer les fichiers exportés. */
export function csvDateStamp(now: Date = new Date()): string {
	return now.toISOString().split("T")[0] ?? "";
}
