import { test, expect } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

test('landing page shows the photo contest', async ({ page }) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByRole('heading', { name: 'Concours photo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Malta Calendar' })).toBeVisible();
  await expect(page.locator('header a img[src="/logo.png"]')).toBeVisible();
  await expect(page.getByText('Petit tigre en vacances')).toHaveCount(0);
  await expect(page.getByText(/La plus mignonne, la plus marrante/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rejoindre l\'équipe' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Classement des patounes' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Photos de Malta' })).toBeVisible();
  await expect(
    page.getByText('Pas encore de photo.').or(page.getByTestId('malta-photo-grid'))
  ).toBeVisible();
  await expect(page.getByTestId('contest-ballot')).toBeVisible();
  await expect(page.getByTestId('malta-photo-input')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Septembre 2026' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Instructions' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Jusqu\'au 14 septembre' })).toHaveCount(0);
  await expect(page.getByLabel('Jauge collective de Malta')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Réafficher la pub' })).toHaveCount(0);
});
