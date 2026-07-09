import { expect, test } from "@playwright/test";

/* ==========================================================================
   Planning (schedule) — E2E + critical-path coverage.
   Run against the Taysir app (BASE_URL, default :3001). Logs in as gérant,
   asserts the planning page renders, the calendar exposes the full 24h grid
   (evening/night courses), navigation is single-sourced, and Planifier works.
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

test.describe("Planning — critical path", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard/schedule", { waitUntil: "networkidle" });
	});

	test("page loads with editorial header and no missing i18n key", async ({
		page,
	}) => {
		// Editorial title renders
		await expect(
			page.getByRole("heading", { name: /Agenda de/i }),
		).toBeVisible();
		// Topbar contextual eyebrow is translated, not a raw key
		const body = await page.locator("body").innerText();
		expect(body).not.toContain("SCHEDULE_MANAGE_TITLE");
		expect(body).not.toMatch(/\bschedule_manage_title\b/);
	});

	test("Planifier action is present and opens the new-session drawer", async ({
		page,
	}) => {
		const planifier = page.getByRole("button", { name: /Planifier/i });
		await expect(planifier).toBeVisible();
		await planifier.click();
		// Drawer is driven by ?drawer=new-session in the URL
		await expect(page).toHaveURL(/drawer=new-session/);
	});

	test("calendar exposes the full 24h grid (00:00 → 23:00) for evening courses", async ({
		page,
	}) => {
		// react-big-calendar renders every hour row in the time gutter, even when
		// scrolled. Full 24h range means both the first and last hour labels exist.
		const gutter = page.locator(".rbc-time-gutter, .rbc-time-column").first();
		await expect(gutter).toBeVisible();
		await expect(gutter.getByText("00:00", { exact: false })).toBeVisible();
		await expect(gutter.getByText("23:00", { exact: false })).toBeVisible();
	});

	test("single date navigation lives in the calendar toolbar", async ({
		page,
	}) => {
		// The redundant header week-nav was removed; the calendar toolbar is the
		// single source of date navigation.
		await expect(
			page.getByRole("button", { name: /Aujourd'hui/i }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /^Semaine$/i }),
		).toBeVisible();
		// No duplicate "Précédent/Suivant" pair outside the calendar card.
		await expect(page.getByRole("button", { name: /^Suivant$/i })).toHaveCount(
			1,
		);
	});

	test("filters bar shows the three scoped selectors", async ({ page }) => {
		// Native <select> options are not "visible" to Playwright; assert the three
		// select controls themselves and their default labels.
		const selects = page.locator("select");
		await expect(selects).toHaveCount(3);
		await expect(selects.nth(0)).toBeVisible();
		await expect(selects.nth(0)).toHaveValue("all");
		await expect(selects.nth(0)).toContainText("Toutes les salles");
		await expect(selects.nth(1)).toContainText("Tous les professeurs");
		await expect(selects.nth(2)).toContainText("Tous les groupes");
	});
});
