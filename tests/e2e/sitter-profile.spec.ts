import { expect, test } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';
import { SELECTED_SITTER_KEY } from '../../app/utils/sitter-session';

test('a sitter can join, rename, leave, and come back', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Profil-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ton profil' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rejoindre l\'équipe' })).toHaveCount(0);

  await page.getByRole('heading', { name: 'Ton profil' }).click();
  const renamed = `${name}-edit`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(renamed);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText(`Tu es ${renamed}`)).toBeVisible();

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('heading', { name: 'Qui es-tu ?' })).toBeVisible();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toBeVisible();
  expect(await page.evaluate(key => window.localStorage.getItem(key), SELECTED_SITTER_KEY)).toBeNull();

  await page.reload();
  await waitForNuxtHydration(page);
  await page.getByRole('button', { name: renamed, exact: true }).click();
  await expect(page.getByText(`Tu es ${renamed}`)).toBeVisible();
});

test.describe('mobile contest page', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  test('fits the contest page on a phone', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForNuxtHydration(page);

    await expect(page.getByRole('heading', { name: 'Concours photo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Septembre 2026' })).toHaveCount(0);

    const overflowing = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflowing).toBe(false);

    const name = `Mobile-${testInfo.parallelIndex}-${testInfo.retry}`;
    await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
    await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
    await expect(page.getByText(`Tu es ${name}`)).toBeVisible();
  });
});
