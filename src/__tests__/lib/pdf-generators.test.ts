import { describe, expect, it, vi } from "vitest";
import { generateStudentProfilePDF } from "@/lib/pdf-generators/student-profile";
import { generatePaymentReceiptPDF } from "@/lib/pdf-generators/payment-receipt";

const mockDocInstance = {
	setFillColor: vi.fn(),
	rect: vi.fn(),
	setTextColor: vi.fn(),
	setFontSize: vi.fn(),
	setFont: vi.fn(),
	text: vi.fn(),
	setDrawColor: vi.fn(),
	line: vi.fn(),
	splitTextToSize: vi.fn((text: string) => [text]),
	save: vi.fn(),
	output: vi.fn().mockReturnValue(new ArrayBuffer(0)),
};

vi.mock("jspdf", () => {
	class MockJsPDF {
		setFillColor = vi.fn();
		rect = vi.fn();
		setTextColor = vi.fn();
		setFontSize = vi.fn();
		setFont = vi.fn();
		text = vi.fn();
		setDrawColor = vi.fn();
		line = vi.fn();
		splitTextToSize = vi.fn((text: string) => [text]);
		save = vi.fn();
		output = vi.fn().mockReturnValue(new ArrayBuffer(0));
	}
	return { jsPDF: MockJsPDF };
});

const mockStudent = {
	id: "student-1",
	firstName: "Ahmed",
	lastName: "Benali",
	isActive: true,
	isMinor: false,
	address: "123 Rue Test",
	phone: "0555123456",
	email: "ahmed@test.dz",
	parentName: null,
	parentPhone: null,
	parentEmail: null,
	photoUrl: null,
	birthDate: new Date("2000-01-01"),
	registrationDate: new Date("2024-09-01"),
	etablissementId: "etab-1",
	createdAt: new Date(),
	updatedAt: new Date(),
	groups: [
		{ id: "g1", name: "Groupe A", etablissementId: "etab-1", isActive: true },
	],
} as Parameters<typeof generateStudentProfilePDF>[0];

// suppress unused variable warning — mockDocInstance is kept for reference clarity
void mockDocInstance;

describe("generateStudentProfilePDF", () => {
	it("génère un PDF sans lever d'exception", () => {
		expect(() => generateStudentProfilePDF(mockStudent)).not.toThrow();
	});

	it("retourne un objet jsPDF", () => {
		const doc = generateStudentProfilePDF(mockStudent);
		expect(doc).toBeDefined();
	});

	it("gère un élève mineur avec parentName", () => {
		const minorStudent = {
			...mockStudent,
			isMinor: true,
			parentName: "Karim Benali",
			parentPhone: "0555000000",
		};
		expect(() => generateStudentProfilePDF(minorStudent)).not.toThrow();
	});

	it("gère un élève sans adresse", () => {
		const studentWithoutAddress = { ...mockStudent, address: null };
		expect(() =>
			generateStudentProfilePDF(studentWithoutAddress),
		).not.toThrow();
	});

	it("gère un élève sans groupes", () => {
		const studentWithoutGroups = { ...mockStudent, groups: [] };
		expect(() => generateStudentProfilePDF(studentWithoutGroups)).not.toThrow();
	});
});

describe("generatePaymentReceiptPDF", () => {
	const mockReceiptData = {
		paiementId: "pay-123-abc",
		paiementDate: new Date("2024-04-20"),
		amount: 5000,
		method: "CASH",
		reference: null,
		resteSurTranche: 2000,
		studentFirstName: "Ahmed",
		studentLastName: "Benali",
		schoolName: "Ecole Taysir",
	};

	it("génère un reçu de paiement sans lever d'exception", () => {
		expect(() => generatePaymentReceiptPDF(mockReceiptData)).not.toThrow();
	});

	it("génère un reçu avec référence", () => {
		expect(() =>
			generatePaymentReceiptPDF({ ...mockReceiptData, reference: "REF-456" })
		).not.toThrow();
	});

	it("génère un reçu si paiementId est vide", () => {
		expect(() =>
			generatePaymentReceiptPDF({ ...mockReceiptData, paiementId: "" })
		).not.toThrow();
	});
});
