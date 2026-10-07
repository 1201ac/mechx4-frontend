import { test, expect } from '@playwright/test';

test.describe('Phase 4 GIS Dashboard, Roads & Blocked Route Status', () => {
  test('Moderator can view roads, filter, and change road status', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Sign in as MODERATOR
    await page.goto('/login');
    await page.fill('input[type="email"]', 'moderator@nerlogix.com');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Role: MODERATOR')).toBeVisible();

    // Navigate to Roads page using locator href
    await page.locator('a[href="/roads"]').click();
    await expect(page.getByText('Road Corridor & Status Management')).toBeVisible();

    // Check table loaded segments (target text inside table)
    await expect(page.getByRole('table').getByText('OPEN').first()).toBeVisible();

    // Click Change status button on first row
    await page.getByRole('button', { name: 'Change status' }).first().click();

    // Verify modal appears
    await expect(page.getByText('Update Road Status')).toBeVisible();

    // Select BLOCKED status and type reason
    await page.getByRole('button', { name: 'BLOCKED' }).click();
    await page.fill('textarea', 'E2E Automated Landslide Blockage Test');
    await page.getByRole('button', { name: 'Update Status' }).click();

    // Verify modal closes and status updates to BLOCKED in table
    await expect(page.getByRole('table').getByText('BLOCKED').first()).toBeVisible();
    await expect(page.getByRole('table').getByText('E2E Automated Landslide Blockage Test').first()).toBeVisible();

    // Navigate to Live Map
    await page.locator('a[href="/map"]').click();
    await expect(page.getByText('Map Layer Controls')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('USER cannot see Change status button and receives 403 on API status change', async ({ page, request }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Sign in as USER in browser
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@nerlogix.com');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Roads page using locator href
    await page.locator('a[href="/roads"]').click();
    await expect(page.getByText('Road Corridor & Status Management')).toBeVisible();

    // Verify 'Change status' button does NOT exist for USER
    await expect(page.getByRole('button', { name: 'Change status' })).toHaveCount(0);

    // Get access token for user via API
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'user@nerlogix.com', password: 'Demo@1234' }
    });
    const { accessToken } = await loginRes.json();

    // Direct PATCH API request attempt by USER -> expecting 403 Forbidden
    const patchRes = await request.patch('/api/roads/1/status', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'BLOCKED', reason: 'Unauthorized block attempt' }
    });

    expect(patchRes.status()).toBe(403);
    expect(consoleErrors).toHaveLength(0);
  });
});
