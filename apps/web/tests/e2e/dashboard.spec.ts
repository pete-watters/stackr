import { test, expect } from '@playwright/test';

test('dashboard page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible();
});

test('shows empty state when nothing is tracked', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No assets yet')).toBeVisible();
});

test('navigates to add wallet page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '+ Wallet' }).click();
  await expect(page).toHaveURL(/\/wallet\/add/);
  await expect(page.getByRole('heading', { name: 'Add Wallet' })).toBeVisible();
});
