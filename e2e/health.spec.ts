import { test, expect } from '@playwright/test';

test('health check page renders backend status', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/');
  await expect(page.getByText('Backend is up')).toBeVisible({ timeout: 15000 });
  expect(errors).toHaveLength(0);
});
