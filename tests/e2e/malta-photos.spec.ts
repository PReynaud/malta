import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

const maltaPhotoPath = fileURLToPath(new URL('./fixtures/malta.png', import.meta.url));

test('a selected sitter can upload a Malta photo and gain two patounes', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByRole('heading', { name: 'Photos de Malta' })).toBeVisible();

  await page.getByTestId('malta-photo-input').setInputFiles(maltaPhotoPath);
  await expect(page.getByTestId('malta-photo-error')).toContainText(
    'Choisis d\'abord qui tu es, puis envoie une photo.'
  );
  await expect(page.getByRole('img', { name: /Photo de Malta/ })).toHaveCount(0);

  const name = `Photo-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  await page.getByTestId('malta-photo-input').setInputFiles(maltaPhotoPath);
  await expect(page.getByTestId('cat-mood-burst')).toContainText('+2');
  await expect(page.getByRole('img', { name: `Photo de Malta par ${name}` }).first()).toBeVisible();
  await expect(page.getByText('2 patounes')).toBeVisible();
  await expect(page.getByText('Pas encore de photo. Malta attend son premier shooting.')).toHaveCount(0);
});
