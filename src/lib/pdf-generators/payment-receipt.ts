import { jsPDF } from "jspdf";

export interface ReceiptData {
	paiementId: string;
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
	doc.text(
		`Reçu N° : ${data.paiementId.split("-")[0]?.toUpperCase() ?? ""}`,
		20,
		60,
	);
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
