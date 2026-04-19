import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatFullName } from "./format";

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
});
