import { expect, test } from "@playwright/test";

/* ==========================================================================
   Guichet secrétaire (SECRETAIRE) — vérifie le cockpit « Mon guichet »,
   la nav restreinte (pas de pilotage : personnel / activités), la garde de
   sécurité par URL, et le masquage des réglages école dans les paramètres.
   ========================================================================== */

const EMAIL = process.env.E2E_SECRETARY_EMAIL || "secretaire@taysir.dz";
const PASSWORD = process.env.E2E_SECRETARY_PASSWORD || "SecretairePass123!";

async function loginSecretary(page: import("@playwright/test").Page) {
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

test.describe("Guichet secrétaire", () => {
	test.beforeEach(async ({ page }) => {
		await loginSecretary(page);
	});

	test("la secrétaire atterrit sur son guichet (Mon guichet)", async ({
		page,
	}) => {
		await expect(
			page.getByRole("heading", { name: /Mon guichet/i }),
		).toBeVisible();
		await expect(page.getByText(/À encaisser aujourd'hui/i)).toBeVisible();
		await expect(
			page.getByRole("link", { name: /Encaisser un paiement/i }),
		).toBeVisible();
	});

	test("la nav exclut le pilotage (personnel, activités)", async ({ page }) => {
		const nav = page.locator("aside");
		await expect(nav.getByRole("link", { name: /Paiements/i })).toBeVisible();
		await expect(nav.getByRole("link", { name: /Élèves/i })).toBeVisible();
		await expect(nav.getByRole("link", { name: /Personnel/i })).toHaveCount(0);
		await expect(nav.getByRole("link", { name: /Activités/i })).toHaveCount(0);
	});

	test("garde de sécurité — le pilotage redirige vers le guichet", async ({
		page,
	}) => {
		await page.goto("/fr/dashboard/staff", { waitUntil: "networkidle" });
		await expect(page).toHaveURL(/\/dashboard$/);
	});

	test("les réglages école sont masqués dans les paramètres", async ({
		page,
	}) => {
		await page.goto("/fr/dashboard/settings", { waitUntil: "networkidle" });
		const tabs = page.locator("nav").filter({ hasText: /Mon Compte/i });
		await expect(tabs.getByText(/École/i)).toHaveCount(0);
		await expect(tabs.getByText(/Mon Compte/i)).toBeVisible();
	});
});
