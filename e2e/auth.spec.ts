import { test, expect } from '@playwright/test';

test.describe('Phase 2 Authentication & Role Access', () => {
  const accounts = [
    { email: 'admin@nerlogix.com', pass: 'Demo@1234', role: 'ADMIN' },
    { email: 'moderator@nerlogix.com', pass: 'Demo@1234', role: 'MODERATOR' },
    { email: 'user@nerlogix.com', pass: 'Demo@1234', role: 'USER' },
  ];

  for (const acc of accounts) {
    test(`sign in as ${acc.role} (${acc.email})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/login');
      await page.fill('input[type="email"]', acc.email);
      await page.fill('input[type="password"]', acc.pass);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.getByText(`Role: ${acc.role}`)).toBeVisible();
      expect(consoleErrors).toHaveLength(0);
    });
  }
});
