import { jsPDF } from "jspdf";
import type { Group, Student } from "@/types/schema";
import { formatDate, formatFullName } from "@/utils/format";

const BRAND: [number, number, number] = [15, 81, 92];

export interface StudentPdfOptions {
	/** JPEG/PNG data URL for the student photo (see loadImageAsDataUrl). */
	photoDataUrl?: string | null;
}

/* Premium one-page student fiche. Photo (or initials disc fallback) top-right,
   FR dates, tokenised brand header, clean labelled sections. */
export function generateStudentProfilePDF(
	student: Student & { groups: Group[] },
	opts: StudentPdfOptions = {},
): jsPDF {
	const doc = new jsPDF();
	const fullName = formatFullName(student.firstName, student.lastName);

	/* ---- header band ---- */
	doc.setFillColor(...BRAND);
	doc.rect(0, 0, 210, 44, "F");
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(19);
	doc.setFont("helvetica", "bold");
	doc.text("TAYSIR — FICHE ÉTUDIANT", 20, 22);
	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.text(`Généré le ${formatDate(new Date())}`, 20, 31);
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text(fullName, 20, 39);

	/* ---- photo / initials disc (top-right) ---- */
	const ps = 30;
	const px = 210 - ps - 16;
	const py = 7;
	doc.setFillColor(255, 255, 255);
	doc.roundedRect(px - 1.5, py - 1.5, ps + 3, ps + 3, 4, 4, "F");
	if (opts.photoDataUrl) {
		try {
			doc.addImage(
				opts.photoDataUrl,
				"JPEG",
				px,
				py,
				ps,
				ps,
				undefined,
				"FAST",
			);
		} catch {
			drawInitials(doc, fullName, px, py, ps);
		}
	} else {
		drawInitials(doc, fullName, px, py, ps);
	}

	/* ---- sections ---- */
	let y = 60;
	y = section(doc, "INFORMATIONS PERSONNELLES", y);
	y = row(doc, "Nom complet", fullName, y);
	y = row(doc, "Statut", student.isActive ? "ACTIF" : "INACTIF", y);
	y = row(doc, "Âge / Type", student.isMinor ? "MINEUR" : "ADULTE", y);
	y = row(doc, "Adresse", student.address || "Non renseignée", y);

	y += 6;
	y = section(doc, "COORDONNÉES", y);
	if (student.isMinor) {
		y = row(doc, "Parent / Tuteur", student.parentName || "N/A", y);
		y = row(doc, "Téléphone parent", student.parentPhone || "N/A", y);
	} else {
		y = row(doc, "Téléphone", student.phone || "N/A", y);
		y = row(doc, "Email", student.email || "N/A", y);
	}

	y += 6;
	y = section(doc, "CURSUS ACADÉMIQUE", y);
	const groupsList =
		student.groups.map((g) => g.name).join(", ") || "Aucun groupe";
	y = row(doc, "Groupes inscrits", groupsList, y);
	y = row(doc, "Date d'inscription", formatDate(student.registrationDate), y);

	/* ---- footer ---- */
	doc.setFontSize(8);
	doc.setTextColor(150, 150, 150);
	doc.text("Taysir — Système de gestion d'établissement scolaire", 105, 288, {
		align: "center",
	});

	return doc;
}

function drawInitials(
	doc: jsPDF,
	name: string,
	x: number,
	y: number,
	size: number,
): void {
	const initials =
		name
			.split(" ")
			.map((w) => w[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() || "?";
	doc.setFillColor(...BRAND);
	doc.roundedRect(x, y, size, size, 4, 4, "F");
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(size * 0.8);
	doc.setFont("helvetica", "bold");
	doc.text(initials, x + size / 2, y + size / 2 + size * 0.28, {
		align: "center",
	});
}

function section(doc: jsPDF, title: string, y: number): number {
	doc.setTextColor(...BRAND);
	doc.setFontSize(13);
	doc.setFont("helvetica", "bold");
	doc.text(title, 20, y);
	doc.setDrawColor(...BRAND);
	doc.setLineWidth(0.4);
	doc.line(20, y + 2.5, 190, y + 2.5);
	return y + 12;
}

function row(doc: jsPDF, label: string, value: string, y: number): number {
	doc.setTextColor(90, 90, 90);
	doc.setFontSize(11);
	doc.setFont("helvetica", "bold");
	doc.text(`${label} :`, 20, y);
	doc.setTextColor(20, 20, 20);
	doc.setFont("helvetica", "normal");
	const lines = doc.splitTextToSize(value, 120) as string[];
	doc.text(lines, 70, y);
	return y + Math.max(10, lines.length * 6);
}
