import { test, expect } from '@playwright/test';

const now = Date.now();
// 24 hourly points, gently rising — enough for the chart to render (needs >= 2).
const mockPrices = Array.from({ length: 24 }, (_, i) => [
  now - (23 - i) * 3_600_000,
  50_000 + i * 100,
]);

async function mockCoinGecko(page: import('@playwright/test').Page) {
  await page.route('**/api.coingecko.com/**', route =>
    route.fulfill({ json: { prices: mockPrices } }),
  );
}

test('charts page is reachable from the nav', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Charts' }).click();
  await expect(page).toHaveURL(/\/charts/);
  await expect(page.getByRole('heading', { name: 'Charts' })).toBeVisible();
});

test('renders a price chart for the default asset with range controls', async ({ page }) => {
  await mockCoinGecko(page);
  await page.goto('/charts');

  await expect(page.getByRole('button', { name: '24H' })).toBeVisible();
  await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
  await expect(page.getByRole('button', { name: '1Y' })).toBeVisible();

  await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible();
});

test('switching the time range keeps the chart visible', async ({ page }) => {
  await mockCoinGecko(page);
  await page.goto('/charts');

  await page.getByRole('button', { name: '30D' }).click();
  await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible();
});
