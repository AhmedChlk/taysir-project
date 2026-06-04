import { expect, test } from "@playwright/test";

test.describe("Schedule Bug Reproduction", () => {
	test("infinite loading on session confirmation", async ({ page }) => {
		// 1. Login
		await page.goto("/fr/login", { waitUntil: "networkidle" });
		await page.locator('input[type="email"]').fill("admin@taysir.dz");
		await page.locator('input[type="password"]').fill("GerantPass789!");
		await page.click('button[type="submit"]');
		await page.waitForURL("**/dashboard**");

		// 2. Navigate to schedule
		await page.goto("/fr/dashboard/schedule", { waitUntil: "networkidle" });

		// 3. Open new session drawer
		await page.click('button:has-text("Planifier")');

		// Wait for drawer to open
		await page.waitForSelector('form:has-text("Confirmer la séance")');

		// 4. Fill the form
		// We need to select options. Since IDs are dynamic, we'll pick first non-empty options.
		const selects = page.locator("select");
		const count = await selects.count();
		for (let i = 0; i < count; i++) {
			const select = selects.nth(i);
			const options = select.locator("option");
			const optionCount = await options.count();
			if (optionCount > 1) {
				await select.selectOption({ index: 1 });
			}
		}

		// 5. Submit the form
		const submitBtn = page.locator('button:has-text("Confirmer la séance")');
		await submitBtn.click();

		// 6. Check for infinite loading
		// We expect the drawer to close or at least the button to not be in loading state for too long.
		// If it stays in "Planification en cours..." for more than 5 seconds, it's a bug.
		const loadingBtn = page.locator(
			'button:has-text("Planification en cours...")',
		);

		try {
			await expect(loadingBtn).not.toBeVisible({ timeout: 10000 });
			console.log("Success: Button is no longer loading.");
		} catch (e) {
			await page.screenshot({ path: "tests/screenshots/reproduction-bug.png" });
			console.log("Bug reproduced: Button stayed in loading state.");
			throw e;
		}
	});
});
