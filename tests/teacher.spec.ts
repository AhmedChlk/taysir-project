import { expect, test } from "@playwright/test";

/* ==========================================================================
   Espace enseignant (INTERVENANT) — vérifie la vue focalisée du prof :
   son cockpit « Mon espace », la barre latérale réduite, et la garde de
   sécurité qui l'empêche d'atteindre les pages de gestion par URL.
   ========================================================================== */

const EMAIL = process.env.E2E_TEACHER_EMAIL || "intervenant@taysir.dz";
const PASSWORD = process.env.E2E_TEACHER_PASSWORD || "ProfPass123!";

async function loginTeacher(page: import("@playwright/test").Page) {
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

test.describe("Espace enseignant", () => {
	test.beforeEach(async ({ page }) => {
		await loginTeacher(page);
	});

	test("le prof atterrit sur son espace focalisé (Mon espace)", async ({
		page,
	}) => {
		await expect(
			page.getByRole("heading", { name: /Mon espace/i }),
		).toBeVisible();
		await expect(page.getByText(/Séances aujourd'hui/i).first()).toBeVisible();
		await expect(page.getByText(/À pointer/i).first()).toBeVisible();
	});

	test("la barre latérale est réduite — pas de pages de gestion", async ({
		page,
	}) => {
		const nav = page.locator("aside");
		await expect(nav.getByRole("link", { name: /Présences/i })).toBeVisible();
		await expect(nav.getByRole("link", { name: /Paiements/i })).toHaveCount(0);
		await expect(nav.getByRole("link", { name: /Personnel/i })).toHaveCount(0);
		await expect(nav.getByRole("link", { name: /Élèves/i })).toHaveCount(0);
	});

	test("garde de sécurité — une page de gestion redirige vers l'espace", async ({
		page,
	}) => {
		await page.goto("/fr/dashboard/payments", { waitUntil: "networkidle" });
		await expect(page).toHaveURL(/\/dashboard$/);

		await page.goto("/fr/dashboard/students", { waitUntil: "networkidle" });
		await expect(page).toHaveURL(/\/dashboard$/);
	});

	test("le prof garde accès aux présences (pointage)", async ({ page }) => {
		await page.goto("/fr/dashboard/attendance", { waitUntil: "networkidle" });
		await expect(page).toHaveURL(/\/attendance$/);
	});
});
