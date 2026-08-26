import { test, expect } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

test('landing page shows the September feeding calendar', async ({ page }) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByRole('heading', { name: 'Qui nourrit Malta ?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Malta Calendar' })).toBeVisible();
  await expect(page.getByText('Petit tigre en vacances')).toHaveCount(0);
  await expect(page.getByText(/chaton d'amour gris et blanc/)).toBeVisible();
  await expect(page.getByText('Attention, le clic sur une case est contractuelle.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Septembre 2026' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rejoindre l\'équipe' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Classement des patounes' })).toBeVisible();
  await expect(page.getByLabel('Jauge collective de Malta')).toBeVisible();
});
