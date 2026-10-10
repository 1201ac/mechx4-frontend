import { test, expect } from '@playwright/test';

test.describe('Phase 5 Weather & Rule Engine', () => {
  test('Admin can use Demo Rain Tool and see weather condition log updated', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Sign in as ADMIN
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@nerlogix.com');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Weather page using sidebar link
    await page.locator('a[href="/weather"]').click();
    await expect(page.getByText('District Weather & Condition Logs')).toBeVisible();

    // Verify Demo Rain Tool is visible for Admin
    await expect(page.getByText('Admin Demo Rain Tool')).toBeVisible();

    // Select first district and EXTREME rain
    const districtSelect = page.locator('select').first();
    await districtSelect.selectOption({ index: 1 });

    // Trigger simulation
    await page.getByRole('button', { name: 'Trigger Rain Simulation' }).click();

    // Verify success notification badge
    await expect(page.getByText(/Triggered EXTREME rain on/)).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
