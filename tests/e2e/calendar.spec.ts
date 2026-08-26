import { expect, test } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

test('a sitter can join, claim a hungry day, then leave it', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Sitter-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();

  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rejoindre l\'équipe' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible();

  const day = page.getByRole('button', { name: /^vendredi 4 septembre 2026,/ });
  await expect(day).toContainText('Faim');

  await day.click();
  await expect(day).toContainText(name);
  await expect(day).not.toContainText('Faim');

  await day.click();
  await expect(day).toContainText('Faim');
});

test('owner-covered days are not claimable, and the profile stays locked', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByText('Bon maître')).toHaveCount(0);
  await expect(page.getByLabel('dimanche 13 septembre 2026, Malta est tout triste, le maître part demain')).toBeVisible();
  await expect(page.getByLabel('jeudi 1 octobre 2026, Malta est tout content, le maître rentre')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jusqu\'au 14 septembre' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jusqu\'au 1er octobre' })).toBeVisible();

  const name = `Profil-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  const renamed = `${name}-edit`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(renamed);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText(`Tu es ${renamed}`)).toBeVisible();
});

test.describe('mobile calendar', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  test('fits the September grid on a phone', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForNuxtHydration(page);

    await expect(page.getByRole('heading', { name: 'Qui nourrit Malta ?' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Septembre 2026' })).toBeVisible();

    const overflowing = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflowing).toBe(false);

    const name = `Mobile-${testInfo.parallelIndex}-${testInfo.retry}`;
    await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
    await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();

    const day = page.getByRole('button', { name: /^vendredi 4 septembre 2026,/ });
    await day.click();
    await expect(day).not.toContainText('Faim');
  });
});

test('care instructions expand a placeholder section', async ({ page }) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
  await expect(page.getByText('Image à venir').first()).toBeHidden();

  await page.locator('summary', { hasText: 'Nourriture' }).click();
  await expect(page.getByText('Image à venir').first()).toBeVisible();
  await expect(page.getByText(/À remplir/).first()).toBeVisible();
});
