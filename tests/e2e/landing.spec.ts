import { test, expect } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

test('landing page shows the September feeding calendar', async ({ page }) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByRole('heading', { name: 'Who feeds Malta?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'September 2026' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join the crew' })).toBeVisible();
});
