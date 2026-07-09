import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock jsPDF (hoisted so the factory can reference it as a real constructor)
const { mockJsPDF } = vi.hoisted(() => ({
	mockJsPDF: {
		setFontSize: vi.fn().mockReturnThis(),
		setTextColor: vi.fn().mockReturnThis(),
		setFillColor: vi.fn().mockReturnThis(),
		setDrawColor: vi.fn().mockReturnThis(),
		setLineWidth: vi.fn().mockReturnThis(),
		setFont: vi.fn().mockReturnThis(),
		text: vi.fn().mockReturnThis(),
		line: vi.fn().mockReturnThis(),
		rect: vi.fn().mockReturnThis(),
		roundedRect: vi.fn().mockReturnThis(),
		addImage: vi.fn().mockReturnThis(),
		output: vi.fn().mockReturnValue(new ArrayBuffer(8)),
		save: vi.fn(),
		splitTextToSize: vi.fn((text) => [text]),
	},
}));

vi.mock("jspdf", () => {
	class jsPDF {
		constructor() {
			// Copy mock fn refs onto the instance instead of returning from the
			// constructor (noConstructorReturn); assertions on mockJsPDF.* still hold.
			Object.assign(this, mockJsPDF);
		}
	}
	return { jsPDF, default: jsPDF };
});

import { generatePaymentReceiptPDF } from "@/lib/pdf-generators/payment-receipt";
import { generateStudentProfilePDF } from "@/lib/pdf-generators/student-profile";

describe("PDF Generators Audit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("generatePaymentReceiptPDF", () => {
		const validData = {
			paiementId: "pay-123-abc",
			paiementDate: new Date("2026-04-22"),
			amount: 15000.5,
			method: "CASH",
			reference: "REF-999",
			resteSurTranche: 5000,
			studentFirstName: "Mohamed",
			studentLastName: "L'Arabe",
			schoolName: "Taysir Academy",
		};

		it("Happy Path: génère un reçu complet avec les bons montants", () => {
			const result = generatePaymentReceiptPDF(validData);

			expect(result).toBeInstanceOf(ArrayBuffer);
			expect(mockJsPDF.text).toHaveBeenCalledWith(
				"Taysir Academy",
				105,
				20,
				expect.anything(),
			);
			expect(mockJsPDF.text).toHaveBeenCalledWith(
				expect.stringContaining("15000.5 DZD"),
				20,
				100,
			);
			expect(mockJsPDF.text).toHaveBeenCalledWith(
				expect.stringContaining("5000 DZD"),
				20,
				140,
			);
		});

		it("Gestion du Vide: gère l'absence de référence", () => {
			generatePaymentReceiptPDF({ ...validData, reference: null });
			expect(mockJsPDF.text).not.toHaveBeenCalledWith(
				expect.stringContaining("Référence"),
				expect.anything(),
				expect.anything(),
			);
		});

		it("Caractères Spéciaux: résiste aux noms contenant des accents ou apostrophes", () => {
			generatePaymentReceiptPDF({
				...validData,
				studentFirstName: "Étudiant",
				studentLastName: "O'Conner",
			});
			expect(mockJsPDF.text).toHaveBeenCalledWith(
				expect.stringContaining("Étudiant O'Conner"),
				20,
				90,
			);
		});

		it("Edge Case: gère un paiementId sans tiret (repli sans numéro de reçu)", () => {
			generatePaymentReceiptPDF({ ...validData, paiementId: "simpleid" });
			expect(mockJsPDF.text).toHaveBeenCalledWith(
				expect.stringContaining("Reçu SIMPLEID"),
				20,
				60,
			);
		});

		it("Utilise le numéro de reçu séquentiel quand il est fourni", () => {
			generatePaymentReceiptPDF({ ...validData, receiptNumber: 42 });
			expect(mockJsPDF.text).toHaveBeenCalledWith(
				expect.stringContaining("Reçu N° 0042"),
				20,
				60,
			);
		});
	});

	describe("generateStudentProfilePDF", () => {
		const student = {
			id: "s1",
			firstName: "Amine",
			lastName: "Benali",
			isActive: true,
			isMinor: true,
			address: "123 Rue de la Liberté, Alger, Algérie",
			parentName: "Zohra Benali",
			parentPhone: "0555-11-22-33",
			registrationDate: new Date(),
			groups: [
				{ id: "g1", name: "Math Grade 10" },
				{ id: "g2", name: "Physics" },
			],
		} as any;

		// Layout-agnostic: flatten every text() call (string or string[]) so the
		// assertions check WHAT is printed, not WHERE — survives PDF redesigns.
		const allText = () =>
			mockJsPDF.text.mock.calls
				.flatMap((c) => {
					const a = c[0] as string | string[];
					return Array.isArray(a) ? a : [a];
				})
				.join(" | ");

		it("Happy Path: génère un profil élève complet (Mineur)", () => {
			const doc = generateStudentProfilePDF(student);
			expect(doc).toBeDefined();
			const text = allText();
			expect(text).toContain("Amine Benali");
			expect(text).toContain("Zohra Benali");
			expect(text).toContain("MINEUR");
			expect(text).toContain("Math Grade 10, Physics");
		});

		it("Happy Path: génère un profil élève adulte (Majeur) et INACTIF", () => {
			const adult = {
				...student,
				isActive: false,
				isMinor: false,
				phone: "0666-77-88-99",
				email: "amine@test.com",
			};
			generateStudentProfilePDF(adult);
			const text = allText();
			expect(text).toContain("INACTIF");
			expect(text).toContain("ADULTE");
			expect(text).toContain("0666-77-88-99");
			expect(text).toContain("amine@test.com");
		});

		it("Gestion du Vide: gère l'absence d'adresse, de groupes et les fallbacks N/A", () => {
			const minimal = {
				...student,
				address: null,
				groups: [],
				parentName: null,
				parentPhone: null,
			};
			generateStudentProfilePDF(minimal);
			const text = allText();
			expect(text).toContain("Aucun groupe");
			expect(text).toContain("N/A"); // parentName / parentPhone null -> N/A
		});

		it("Gestion du Vide: fallbacks N/A pour adulte", () => {
			const adultMinimal = {
				...student,
				isMinor: false,
				phone: null,
				email: null,
			};
			generateStudentProfilePDF(adultMinimal);
			expect(allText()).toContain("N/A"); // phone / email null -> N/A
		});

		it("Données Massives: vérifie la pagination/découpage de texte pour les adresses très longues", () => {
			const longAddress = "A".repeat(500);
			generateStudentProfilePDF({ ...student, address: longAddress });
			expect(mockJsPDF.splitTextToSize).toHaveBeenCalled();
		});
	});
});
