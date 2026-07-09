import { expect, test } from "@playwright/test";

/* ==========================================================================
   Tableau de bord (cockpit dirigeant) — E2E. Money-first KPIs, 1-click quick
   actions (≤3 clics par action), and the recouvrement relance. BASE_URL :3001.
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

test.describe("Tableau de bord — cockpit dirigeant", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard", { waitUntil: "networkidle" });
	});

	test("masthead + money-first KPIs", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /Pilotage de/i }),
		).toBeVisible();
		await expect(page.getByText("Reste à recouvrer")).toBeVisible();
		await expect(page.getByText("Taux de recouvrement")).toBeVisible();
		await expect(page.getByText("Encaissé ce mois")).toBeVisible();
		const body = await page.locator("body").innerText();
		expect(body).not.toMatch(/MISSING_MESSAGE/);
	});

	test("quick actions are one click to the right page (≤3 clics)", async ({
		page,
	}) => {
		await page.getByRole("link", { name: /Encaisser un paiement/i }).click();
		await expect(page).toHaveURL(/\/dashboard\/payments/);

		await page.goBack();
		// Exact: un panneau d'alerte peut aussi proposer « Faire l'appel → ».
		await page
			.getByRole("link", { name: "Faire l'appel", exact: true })
			.click();
		await expect(page).toHaveURL(/\/dashboard\/attendance/);
	});

	test("recouvrement panel relance is one click to WhatsApp", async ({
		page,
	}) => {
		const wa = page.locator('a[href*="wa.me"]').first();
		const hasRelance = await wa.isVisible().catch(() => false);
		test.skip(!hasRelance, "Nothing to relancer in this dataset");
		const href = (await wa.getAttribute("href")) || "";
		expect(href).toMatch(/wa\.me\/213\d+/);
		expect(decodeURIComponent(href)).toMatch(/scolarité|solde|rappel/i);
	});
});
