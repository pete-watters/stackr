import { test, expect } from '@playwright/test';

test('dashboard page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Portfolio')).toBeVisible();
});

test('shows empty state when no wallets', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No wallets yet')).toBeVisible();
});

test('navigates to add wallet page', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Add Wallet').first().click();
  await expect(page.getByText('Add Wallet')).toBeVisible();
});
