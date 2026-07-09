/**
 * Localisation des libellés « métier » standard stockés en base : matières
 * (activités) et préfixe des salles. Ces valeurs sont des données, mais les
 * intitulés courants du système scolaire algérien forment un ensemble fini
 * connu → on peut les afficher en arabe sans les stocker en double.
 *
 * Repli : toute valeur non reconnue est renvoyée telle quelle (une école qui
 * saisit déjà en arabe, ou une matière personnalisée, s'affiche sans altération).
 */

const isAr = (locale: string) => locale.startsWith("ar");

// Matières standard FR → AR (rapprochement insensible à la casse/accents).
const SUBJECTS_AR: Record<string, string> = {
	mathematiques: "الرياضيات",
	maths: "الرياضيات",
	physique: "الفيزياء",
	"sciences physiques": "العلوم الفيزيائية",
	francais: "الفرنسية",
	anglais: "الإنجليزية",
	arabe: "العربية",
	sciences: "العلوم",
	"sciences naturelles": "علوم الطبيعة",
	informatique: "الإعلام الآلي",
	"histoire-geo": "التاريخ والجغرافيا",
	"histoire geographie": "التاريخ والجغرافيا",
	philosophie: "الفلسفة",
	"soutien primaire": "دعم ابتدائي",
	"education islamique": "التربية الإسلامية",
	"education civique": "التربية المدنية",
	svt: "علوم الطبيعة والحياة",
};

function normalize(s: string): string {
	return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** Libellé localisé d'une matière/activité (repli sur la valeur d'origine). */
export function localizedSubject(name: string, locale: string): string {
	if (!isAr(locale)) return name;
	return SUBJECTS_AR[normalize(name)] ?? name;
}

/**
 * Libellé localisé d'une salle : traduit le préfixe « Salle » → « قاعة » (le
 * numéro/nom propre est conservé). Repli sur la valeur d'origine.
 */
export function localizedRoom(name: string, locale: string): string {
	if (!isAr(locale)) return name;
	return name.replace(/^salle\s*/i, "قاعة ");
}

/**
 * Libellé localisé d'un groupe : traduit le préfixe « Groupe » → « فوج » (le
 * code/nom propre est conservé). Repli sur la valeur d'origine.
 */
export function localizedGroup(name: string, locale: string): string {
	if (!isAr(locale)) return name;
	return name.replace(/^groupe\s*/i, "فوج ");
}
