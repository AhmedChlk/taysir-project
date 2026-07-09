import { jsPDF } from "jspdf";

export interface ReceiptData {
	paiementId: string;
	/** Numéro de reçu séquentiel par établissement (fiscal). */
	receiptNumber?: number | null;
	paiementDate: Date;
	amount: number;
	method: string;
	reference: string | null;
	resteSurTranche: number;
	studentFirstName: string;
	studentLastName: string;
	schoolName: string;
}

export function generatePaymentReceiptPDF(data: ReceiptData): ArrayBuffer {
	const doc = new jsPDF();

	doc.setFontSize(22);
	doc.setTextColor(15, 81, 92);
	doc.text(data.schoolName, 105, 20, { align: "center" });
	doc.setDrawColor(15, 81, 92);
	doc.line(20, 25, 190, 25);

	doc.setFontSize(16);
	doc.setTextColor(0, 0, 0);
	doc.text("REÇU DE PAIEMENT", 105, 40, { align: "center" });

	doc.setFontSize(12);
	// Numéro de reçu séquentiel (ex. « N° 0042 ») ; repli sur le préfixe d'ID
	// pour les anciens paiements sans numéro attribué.
	const receiptLabel =
		data.receiptNumber != null
			? `N° ${String(data.receiptNumber).padStart(4, "0")}`
			: (data.paiementId.split("-")[0]?.toUpperCase() ?? "");
	doc.text(`Reçu ${receiptLabel}`, 20, 60);
	doc.text(`Date : ${data.paiementDate.toLocaleDateString("fr-FR")}`, 20, 70);
	doc.text(`Élève : ${data.studentFirstName} ${data.studentLastName}`, 20, 90);
	doc.text(`Montant payé : ${data.amount} DZD`, 20, 100);
	doc.text(`Méthode : ${data.method}`, 20, 110);

	if (data.reference) {
		doc.text(`Référence : ${data.reference}`, 20, 120);
	}

	doc.text(`Reste à payer : ${data.resteSurTranche} DZD`, 20, 140);

	return doc.output("arraybuffer");
}

/* -------------------------------------------------------------------------
   Plan-level receipt (all règlements of a payment plan) — rendered in the
   in-app preview modal. Returns the jsPDF doc (not a buffer).
   ------------------------------------------------------------------------- */

const BRAND: [number, number, number] = [15, 81, 92];
const da = (n: number) => `${n.toLocaleString("fr-FR")} DA`;
const METHOD_LABEL: Record<string, string> = {
	CASH: "Espèces",
	CARD: "Carte",
	TRANSFER: "Virement",
	CHECK: "Chèque",
	CHEQUE: "Chèque",
};

export interface PlanReceiptPayment {
	paidDate: string;
	dueLabel: string;
	method: string;
	amount: number;
}

export interface PlanReceiptData {
	school: string;
	studentName: string;
	activity: string;
	receiptNumber: string;
	date: string;
	paidAmount: number;
	remaining: number;
	payments: PlanReceiptPayment[];
}

export function generatePaymentPlanReceiptPDF(data: PlanReceiptData): jsPDF {
	const doc = new jsPDF();

	doc.setFillColor(...BRAND);
	doc.rect(0, 0, 210, 40, "F");
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(18);
	doc.setFont("helvetica", "bold");
	doc.text("REÇU DE PAIEMENT", 20, 21);
	doc.setFontSize(11);
	doc.setFont("helvetica", "normal");
	doc.text(data.school, 20, 30);
	doc.setFontSize(9);
	doc.text(`N° ${data.receiptNumber}`, 190, 16, { align: "right" });
	doc.text(`Émis le ${data.date}`, 190, 23, { align: "right" });

	let y = 56;
	const field = (label: string, value: string) => {
		doc.setTextColor(90, 90, 90);
		doc.setFontSize(11);
		doc.setFont("helvetica", "bold");
		doc.text(label, 20, y);
		doc.setTextColor(20, 20, 20);
		doc.setFont("helvetica", "normal");
		doc.text(value, 60, y);
		y += 9;
	};
	field("Élève :", data.studentName);
	field("Prestation :", data.activity);

	y += 7;
	doc.setTextColor(...BRAND);
	doc.setFontSize(13);
	doc.setFont("helvetica", "bold");
	doc.text("DÉTAIL DES RÈGLEMENTS", 20, y);
	doc.setDrawColor(...BRAND);
	doc.setLineWidth(0.4);
	doc.line(20, y + 2.5, 190, y + 2.5);

	y += 11;
	doc.setFontSize(9);
	doc.setTextColor(120, 120, 120);
	doc.setFont("helvetica", "bold");
	doc.text("DATE", 20, y);
	doc.text("ÉCHÉANCE", 60, y);
	doc.text("MODE", 110, y);
	doc.text("MONTANT", 190, y, { align: "right" });
	y += 3;
	doc.setDrawColor(220, 220, 220);
	doc.line(20, y, 190, y);
	y += 7;

	doc.setFont("helvetica", "normal");
	doc.setTextColor(30, 30, 30);
	doc.setFontSize(10);
	if (data.payments.length === 0) {
		doc.setTextColor(140, 140, 140);
		doc.text("Aucun règlement enregistré.", 20, y);
		y += 8;
	} else {
		for (const p of data.payments) {
			doc.text(p.paidDate, 20, y);
			doc.text(p.dueLabel, 60, y);
			doc.text(METHOD_LABEL[p.method] ?? p.method, 110, y);
			doc.text(da(p.amount), 190, y, { align: "right" });
			y += 8;
		}
	}

	y += 4;
	doc.setDrawColor(...BRAND);
	doc.line(110, y, 190, y);
	y += 8;
	doc.setFont("helvetica", "bold");
	doc.setTextColor(...BRAND);
	doc.text("Total réglé :", 110, y);
	doc.text(da(data.paidAmount), 190, y, { align: "right" });
	y += 8;
	if (data.remaining > 0) doc.setTextColor(184, 68, 42);
	else doc.setTextColor(21, 128, 61);
	doc.text("Reste à régler :", 110, y);
	doc.text(da(data.remaining), 190, y, { align: "right" });

	doc.setFontSize(8);
	doc.setTextColor(150, 150, 150);
	doc.setFont("helvetica", "normal");
	doc.text(
		`${data.school} — Reçu généré via Taysir. Document à conserver.`,
		105,
		288,
		{ align: "center" },
	);

	return doc;
}
