import { describe, expect, it } from "vitest";
import {
	cn,
	formatCurrency,
	formatDate,
	formatFullName,
	formatTime,
} from "./format";

describe("formatFullName", () => {
	it("returns empty string when both params are undefined", () => {
		expect(formatFullName(undefined, undefined)).toBe("");
	});

	it("returns first name only when last name is missing", () => {
		expect(formatFullName("Ahmed", undefined)).toBe("Ahmed");
	});

	it("returns last name only when first name is missing", () => {
		expect(formatFullName(undefined, "Choulak")).toBe("Choulak");
	});

	it("concatenates first and last name with a space", () => {
		expect(formatFullName("Ahmed", "Choulak")).toBe("Ahmed Choulak");
	});
});

describe("formatCurrency", () => {
	it("formats amount with default DZD currency", () => {
		expect(formatCurrency(1500)).toContain("DZD");
	});

	it("formats amount with custom currency", () => {
		expect(formatCurrency(100, "EUR")).toContain("EUR");
	});
});

describe("cn", () => {
	it("merges class names correctly", () => {
		expect(cn("px-4", "py-2")).toBe("px-4 py-2");
	});

	it("handles conditional class names", () => {
		const isActive = true;
		expect(cn("base", isActive && "active")).toBe("base active");
	});

	it("resolves tailwind conflicts by keeping the last value", () => {
		expect(cn("p-4", "p-8")).toBe("p-8");
	});

	it("ignores falsy values", () => {
		expect(cn("base", false, undefined, null)).toBe("base");
	});
});

describe("formatDate", () => {
	const testDate = new Date("2024-09-15T10:00:00Z");

	it("formate une date avec le locale fr par défaut", () => {
		const result = formatDate(testDate);
		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});

	it("accepte une string ISO en entrée", () => {
		const result = formatDate("2024-09-15");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("formate avec locale ar", () => {
		const result = formatDate(testDate, "ar");
		expect(typeof result).toBe("string");
	});

	it("accepte des options personnalisées", () => {
		const result = formatDate(testDate, "fr", {
			year: "numeric",
			month: "long",
		});
		expect(result.toLowerCase()).toContain("2024");
	});
});

describe("formatTime", () => {
	const testDate = new Date("2024-09-15T14:30:00Z");

	it("formate l'heure en format 2-digit par défaut", () => {
		const result = formatTime(testDate, "fr");
		expect(typeof result).toBe("string");
		expect(result).toMatch(/\d+:\d+/);
	});

	it("accepte une string ISO", () => {
		const result = formatTime("2024-09-15T14:30:00Z");
		expect(typeof result).toBe("string");
	});

	it("accepte des options personnalisées", () => {
		const result = formatTime(testDate, "fr", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		expect(result).toMatch(/\d+:\d+:\d+/);
	});
});
