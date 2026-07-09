import { expect, test } from "@playwright/test";

/* ==========================================================================
   Présences — E2E for the redesigned attendance flow: clear session picker,
   live summary for the gérant, labelled present/late/absent pointage for the
   prof, and self-explanatory empty states. Runs against BASE_URL (:3001).
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

test.describe("Présences — pointage flow", () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
		await page.goto("/fr/dashboard/attendance", { waitUntil: "networkidle" });
	});

	test("self-explanatory: instructive header + numbered session picker", async ({
		page,
	}) => {
		await expect(page.getByText(/Séance à pointer/i)).toBeVisible();
		// Instructive subtitle tells the user what to do.
		await expect(
			page.getByText(/choisissez une séance|marquez chaque élève/i),
		).toBeVisible();
	});

	test("either a labelled roster or an actionable empty state", async ({
		page,
	}) => {
		const presentBtn = page.getByRole("button", { name: "Présent" }).first();
		const hasRoster = await presentBtn.isVisible().catch(() => false);

		if (hasRoster) {
			// Prof view: labelled present/late/absent buttons (parlant).
			await expect(presentBtn).toBeVisible();
			await expect(
				page.getByRole("button", { name: "Absent" }).first(),
			).toBeVisible();
			// Gérant view: live summary counters.
			await expect(page.getByText(/PRÉSENT/i).first()).toBeVisible();
			await expect(page.getByText(/ABSENT/i).first()).toBeVisible();
		} else {
			// Empty state must be actionable, not a dead end.
			await expect(
				page.getByRole("link", {
					name: /Gérer les groupes|Ouvrir le Planning/i,
				}),
			).toBeVisible();
		}
	});

	test("marking a student updates the live summary and enables save", async ({
		page,
	}) => {
		const lateBtn = page.locator('button[aria-label="Retard"]').first();
		const hasRoster = await lateBtn.isVisible().catch(() => false);
		test.skip(!hasRoster, "No roster in this dataset");

		await lateBtn.click();
		// At least one retard now counted.
		await expect(page.getByText(/[1-9]\d*\s*RETARD/i).first()).toBeVisible();
		// Save becomes enabled (dirty).
		await expect(
			page.getByRole("button", { name: /^Enregistrer$/i }).first(),
		).toBeEnabled();
	});
});
