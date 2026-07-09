import { expect, test } from "@playwright/test";

/* ==========================================================================
   Salles — E2E. Verifies the rooms page concords with the rest (PageHeader,
   KPIs), surfaces the Planning dependency (occupation = séances per room),
   and has a single, non-duplicated Actions column. BASE_URL (:3001).
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

test.describe("Salles — concordance + dépendances", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard/rooms", { waitUntil: "networkidle" });
	});

	test("translated header + no raw i18n keys", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /Gestion des/i }),
		).toBeVisible();
		const body = await page.locator("body").innerText();
		expect(body).not.toMatch(/MISSING_MESSAGE|rooms_title|room_name|add_room/);
	});

	test("KPIs concord with the dashboard (total / capacity / sessions)", async ({
		page,
	}) => {
		await expect(page.getByText(/Total salles/i)).toBeVisible();
		await expect(page.getByText(/Capacité totale/i)).toBeVisible();
		await expect(page.getByText(/Séances planifiées/i)).toBeVisible();
	});

	test("Planning dependency: occupation column shows séances or Libre", async ({
		page,
	}) => {
		await expect(
			page.getByRole("columnheader", { name: /Occupation/i }),
		).toBeVisible();
		const occupied = await page
			.getByText(/\d+\s*séances?/i)
			.first()
			.isVisible()
			.catch(() => false);
		const free = await page
			.getByText(/^Libre$/i)
			.first()
			.isVisible()
			.catch(() => false);
		expect(occupied || free).toBeTruthy();
	});

	test("single Actions column (no duplicate)", async ({ page }) => {
		await expect(
			page.getByRole("columnheader", { name: /^Actions$/i }),
		).toHaveCount(1);
	});
});
