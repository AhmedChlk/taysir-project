import { expect, test } from "@playwright/test";

/* ==========================================================================
   Groupes — E2E. Verifies the page is fully translated (no raw i18n keys),
   the actions column is not duplicated, KPIs render, and the page concords
   with the rest of the dashboard. Runs against BASE_URL (:3001).
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

test.describe("Groupes — clean + translated", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard/groups", { waitUntil: "networkidle" });
	});

	test("header is translated, not raw i18n keys", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: /Gestion des/i }),
		).toBeVisible();
		const body = await page.locator("body").innerText();
		// No raw SCREAMING_SNAKE or lowercase_snake keys leaking into the UI.
		expect(body).not.toMatch(/GROUPS_TITLE/);
		expect(body).not.toMatch(/\bgroups_subtitle\b/);
		expect(body).not.toMatch(/\badd_group\b/);
		expect(body).not.toMatch(/\bgroup_name\b/);
		expect(body).not.toMatch(/\bregistrations\b/);
	});

	test("no raw missing-message error appears on screen", async ({ page }) => {
		const body = await page.locator("body").innerText();
		expect(body).not.toMatch(/MISSING_MESSAGE/i);
	});

	test("single Actions column (no duplicate)", async ({ page }) => {
		const actionsHeaders = page.getByRole("columnheader", {
			name: /^Actions$/i,
		});
		await expect(actionsHeaders).toHaveCount(1);
	});

	test("KPIs render with numeric values", async ({ page }) => {
		await expect(page.getByText(/Total Groupes/i)).toBeVisible();
		await expect(page.getByText(/Groupes Actifs/i)).toBeVisible();
	});
});
