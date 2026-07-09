import { expect, test } from "@playwright/test";

/* ==========================================================================
   Élèves — E2E for the student list, action discoverability and the new
   in-app PDF preview (before download). Runs against the Taysir app
   (BASE_URL, default :3001).
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

test.describe("Élèves — list + PDF preview", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard/students", { waitUntil: "networkidle" });
	});

	test("page renders the editorial header and the student table", async ({
		page,
	}) => {
		await expect(
			page.getByRole("heading", { name: /Gestion des/i }),
		).toBeVisible();
		await expect(page.getByText(/Identité/i).first()).toBeVisible();
	});

	test("row actions menu exposes all four possibilities", async ({ page }) => {
		// Discoverability: the ⋮ menu lists Voir / Télécharger / Modifier / Supprimer.
		await page
			.locator("table tbody tr")
			.first()
			.getByRole("button")
			.last()
			.click();
		await expect(page.getByText("Voir la fiche")).toBeVisible();
		await expect(page.getByText("Télécharger la fiche")).toBeVisible();
		await expect(page.getByText("Modifier")).toBeVisible();
		await expect(page.getByText("Supprimer")).toBeVisible();
	});

	test("Télécharger la fiche opens an in-app PDF preview (not a blind download)", async ({
		page,
	}) => {
		await page
			.locator("table tbody tr")
			.first()
			.getByRole("button")
			.last()
			.click();
		await page.getByText("Télécharger la fiche").click();

		// Preview modal opens with a title, the PDF iframe, and a download action.
		await expect(page.getByText(/Aperçu —/i)).toBeVisible();
		const frame = page.locator('iframe[title*="PDF"]');
		await expect(frame).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Télécharger le PDF/i }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: /Imprimer/i })).toBeVisible();
	});

	test("no broken student photo — avatar falls back to initials", async ({
		page,
	}) => {
		// The robust avatar never renders a broken <img>: any <img> in the table
		// that fails still resolves to an initials disc, so no zero-size images.
		const brokenImages = await page.evaluate(() => {
			const imgs = Array.from(
				document.querySelectorAll("table img"),
			) as HTMLImageElement[];
			return imgs.filter((i) => i.complete && i.naturalWidth === 0).length;
		});
		expect(brokenImages).toBe(0);
	});
});
