/* ==========================================================================
   Hero live-demo — data & timeline (no JSX, no React).
   The hero shows a REAL Taysir workflow running live: filtrer les impayés →
   encaisser → confirmer → relancer le parent sur WhatsApp. Marché algérien :
   montants en DA, écoles privées, douleur n°1 = recouvrement des scolarités.
   ========================================================================== */

export type RowStatus = "paid" | "unpaid" | "relanced" | "justPaid";

export type Student = {
	id: string;
	name: string;
	group: string;
	due: number;
	deadline: string;
	initialStatus: RowStatus;
	grad: string;
};

export const STUDENTS: Student[] = [
	{
		id: "amina",
		name: "Amina Belkacem",
		group: "Maths · 3AS",
		due: 7500,
		deadline: "05/06",
		initialStatus: "unpaid",
		grad: "linear-gradient(135deg,#1a7a89,#0f515c)",
	},
	{
		id: "yacine",
		name: "Yacine Meziane",
		group: "Physique · 2AS",
		due: 12000,
		deadline: "15/06",
		initialStatus: "unpaid",
		grad: "linear-gradient(135deg,#c6a24a,#9c7c2f)",
	},
	{
		id: "lina",
		name: "Lina Cherif",
		group: "Français · 1AS",
		due: 9000,
		deadline: "10/06",
		initialStatus: "unpaid",
		grad: "linear-gradient(135deg,#d5573b,#b8442a)",
	},
	{
		id: "sofiane",
		name: "Sofiane Khelifi",
		group: "Maths · 3AS",
		due: 7500,
		deadline: "02/06",
		initialStatus: "paid",
		grad: "linear-gradient(135deg,#0a7d33,#066325)",
	},
	{
		id: "meriem",
		name: "Meriem Saadi",
		group: "Anglais · 2AS",
		due: 8000,
		deadline: "01/06",
		initialStatus: "paid",
		grad: "linear-gradient(135deg,#2ba0a6,#157180)",
	},
	{
		id: "rayan",
		name: "Rayan Toumi",
		group: "SVT · 1AS",
		due: 6500,
		deadline: "03/06",
		initialStatus: "paid",
		grad: "linear-gradient(135deg,#114c57,#0b2a30)",
	},
];

export const fmtDA = (n: number) => `${n.toLocaleString("fr-FR")} DA`;

/* ---------- scripted timeline (the ghost cursor performs the workflow) ---------- */

export type Phase =
	| "idle"
	| "moveFilter"
	| "clickFilter"
	| "moveEncaisser"
	| "clickEncaisser"
	| "moveConfirm"
	| "clickConfirm"
	| "moveRelance"
	| "clickRelance"
	| "settle"
	| "reset";

export const TIMELINE: { phase: Phase; ms: number }[] = [
	{ phase: "idle", ms: 1200 },
	{ phase: "moveFilter", ms: 750 },
	{ phase: "clickFilter", ms: 700 },
	{ phase: "moveEncaisser", ms: 800 },
	{ phase: "clickEncaisser", ms: 750 },
	{ phase: "moveConfirm", ms: 800 },
	{ phase: "clickConfirm", ms: 1600 },
	{ phase: "moveRelance", ms: 800 },
	{ phase: "clickRelance", ms: 2800 },
	{ phase: "settle", ms: 2400 },
	{ phase: "reset", ms: 900 },
];

/* Cursor coordinates inside the 640 × 560 screen */
export const CURSOR: Record<Phase, { x: number; y: number }> = {
	idle: { x: 470, y: 120 },
	moveFilter: { x: 283, y: 180 },
	clickFilter: { x: 283, y: 180 },
	moveEncaisser: { x: 562, y: 244 },
	clickEncaisser: { x: 562, y: 244 },
	moveConfirm: { x: 395, y: 352 },
	clickConfirm: { x: 395, y: 352 },
	moveRelance: { x: 514, y: 292 },
	clickRelance: { x: 514, y: 292 },
	settle: { x: 470, y: 430 },
	reset: { x: 470, y: 430 },
};

export const CLICK_PHASES: Phase[] = [
	"clickFilter",
	"clickEncaisser",
	"clickConfirm",
	"clickRelance",
];

/* ---------- stroke icon paths ---------- */

export const PATHS = {
	grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
	users:
		"M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
	wallet:
		"M21 12V7H5a2 2 0 010-4h14v4 M3 5v14a2 2 0 002 2h16v-5 M18 12a2 2 0 000 4h4v-4z",
	calendar:
		"M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
	check: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
	door: "M3 21h18 M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16 M14 12h.01",
	gear: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
	search: "M21 21l-4.35-4.35 M11 19a8 8 0 100-16 8 8 0 000 16z",
	bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
	plus: "M12 5v14 M5 12h14",
	receipt:
		"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z M8 7h8 M8 11h8 M8 15h5",
} as const;
