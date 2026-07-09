import { describe, expect, it } from "vitest";
import { csvDateStamp, toCsv } from "@/lib/export-csv";

describe("toCsv", () => {
	it("sérialise en-têtes + lignes avec CRLF (RFC 4180)", () => {
		const csv = toCsv(
			["Nom", "Montant"],
			[
				["Amine", 1500],
				["Sara", 2000],
			],
		);
		expect(csv).toBe("Nom,Montant\r\nAmine,1500\r\nSara,2000");
	});

	it("échappe les virgules en entourant de guillemets", () => {
		const csv = toCsv(["Adresse"], [["Alger, Algérie"]]);
		expect(csv).toBe('Adresse\r\n"Alger, Algérie"');
	});

	it("double les guillemets internes", () => {
		const csv = toCsv(["Note"], [['Il a dit "présent"']]);
		expect(csv).toBe('Note\r\n"Il a dit ""présent"""');
	});

	it("échappe les retours à la ligne et points-virgules", () => {
		expect(toCsv(["A"], [["x\ny"]])).toBe('A\r\n"x\ny"');
		expect(toCsv(["A"], [["a;b"]])).toBe('A\r\n"a;b"');
	});

	it("gère null/undefined comme cellule vide", () => {
		const csv = toCsv(["A", "B", "C"], [[null, undefined, "ok"]]);
		expect(csv).toBe("A,B,C\r\n,,ok");
	});

	it("préserve les accents et l'arabe sans altération", () => {
		const csv = toCsv(["Nom"], [["ناصر"], ["Étudiant"]]);
		expect(csv).toContain("ناصر");
		expect(csv).toContain("Étudiant");
	});
});

describe("csvDateStamp", () => {
	it("formate AAAA-MM-JJ", () => {
		expect(csvDateStamp(new Date("2026-06-29T10:00:00Z"))).toBe("2026-06-29");
	});
});
