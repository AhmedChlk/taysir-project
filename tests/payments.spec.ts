import { expect, test } from "@playwright/test";

/* ==========================================================================
   Paiements — E2E for the recouvrement (P0) features: focal "reste à
   recouvrer", aging band (ancienneté des impayés) and the one-click WhatsApp
   relance with a pre-filled, internationally-normalised DZ number.
   ========================================================================== */

const EMAIL = process.env.E2E_EMAIL || "admin@taysir.dz";
const PASSWORD = process.env.E2E_PASSWORD || "GerantPass789!";

async function login(page: import("@playwright/test").Page) {
	await page.goto("/fr/login", { waitUntil: "networkidle" });
	await page
		.locator('input[type="email"], input[name="email"]')
		.first()
		.fill(EMAIL);
	await page
		.locator('input[type="password"], input[name="password"]')
		.first()
		.fill(PASSWORD);
	await page.locator('input[type="password"]').first().press("Enter");
	await page.waitForURL("**/dashboard**", { timeout: 20000 });
}

test.describe("Paiements — recouvrement", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard/payments", { waitUntil: "networkidle" });
	});

	test("focal header + no raw i18n keys", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /Suivi des/i }),
		).toBeVisible();
		const body = await page.locator("body").innerText();
		expect(body).not.toMatch(/MISSING_MESSAGE|payments_subtitle/);
	});

	test("WhatsApp relance: pre-filled, internationalised DZ number", async ({
		page,
	}) => {
		const wa = page.locator('a[href*="wa.me"]').first();
		const hasRelance = await wa.isVisible().catch(() => false);
		test.skip(!hasRelance, "No outstanding plan to relancer in this dataset");

		const href = (await wa.getAttribute("href")) || "";
		// International DZ form (213…), not a leading 0.
		expect(href).toMatch(/wa\.me\/213\d+/);
		// Message is pre-filled.
		expect(href).toContain("text=");
		expect(decodeURIComponent(href)).toMatch(/scolarité|solde|rappel/i);
	});

	test("aging band surfaces overdue amount when present", async ({ page }) => {
		const band = page.getByText(/En retard de paiement/i);
		const hasOverdue = await band.isVisible().catch(() => false);
		test.skip(!hasOverdue, "No overdue tranche in this dataset");

		// Aging buckets are shown.
		await expect(page.getByText(/0[–-]30 j/i)).toBeVisible();
		await expect(page.getByText(/30[–-]60 j/i)).toBeVisible();
		await expect(page.getByText(/60 j\s*\+/i)).toBeVisible();
	});
});
