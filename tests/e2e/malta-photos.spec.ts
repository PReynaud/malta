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

  const name = `Photo-${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  await page.getByTestId('malta-photo-input').setInputFiles(maltaPhotoPath);
  await expect(page.getByTestId('cat-mood-burst')).toContainText('+2');
  await expect(page.getByRole('img', { name: `Photo de Malta par ${name}` })).toBeVisible();

  await page.getByRole('button', { name: `Agrandir Photo de Malta par ${name}` }).click();
  const lightbox = page.getByTestId('malta-photo-lightbox');
  await expect(lightbox).toBeVisible();
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', /.+/);
  await expect(page.getByTestId('malta-photo-lightbox-author')).toHaveText(`Par ${name}`);
  await expect(page.getByTestId('malta-photo-lightbox-published')).toHaveText(/.+/);
  await expect(page.getByTestId('malta-photo-lightbox-prev')).toHaveCount(0);
  await expect(page.getByTestId('malta-photo-lightbox-next')).toHaveCount(0);
  await page.getByTestId('malta-photo-lightbox-close').click();
  await expect(lightbox).toHaveCount(0);

  const row = page.getByRole('listitem').filter({ hasText: name });
  await expect(row.getByText('2 patounes', { exact: true })).toBeVisible();
});

test('lightbox shows publication metadata and navigates between photos', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Nav-${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  await page.getByTestId('malta-photo-input').setInputFiles(maltaPhotoPath);
  await expect(page.getByTestId('cat-mood-burst')).toContainText('+2');
  await expect(page.getByRole('button', { name: `Agrandir Photo de Malta par ${name}` })).toHaveCount(1);

  await page.getByTestId('malta-photo-input').setInputFiles(maltaPhotoPath);
  await expect(page.getByTestId('cat-mood-burst')).toContainText('+2');
  const ownThumbs = page.getByRole('button', { name: `Agrandir Photo de Malta par ${name}` });
  await expect(ownThumbs).toHaveCount(2);

  const firstSrc = await ownThumbs.nth(0).locator('img').getAttribute('src');
  const secondSrc = await ownThumbs.nth(1).locator('img').getAttribute('src');
  expect(firstSrc).toBeTruthy();
  expect(secondSrc).toBeTruthy();
  expect(firstSrc).not.toBe(secondSrc);

  await ownThumbs.nth(0).click();
  const lightbox = page.getByTestId('malta-photo-lightbox');
  await expect(lightbox).toBeVisible();
  await expect(page.getByTestId('malta-photo-lightbox-author')).toHaveText(`Par ${name}`);
  await expect(page.getByTestId('malta-photo-lightbox-published')).toHaveText(/\d{4}|\d{1,2}/);
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', firstSrc!);

  await page.getByTestId('malta-photo-lightbox-next').click();
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', secondSrc!);
  await expect(page.getByTestId('malta-photo-lightbox-author')).toHaveText(`Par ${name}`);

  await page.getByTestId('malta-photo-lightbox-prev').click();
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', firstSrc!);

  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', secondSrc!);

  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', firstSrc!);

  // Wrap: previous from the newest photo leaves this image, next returns to it.
  // Other sitters' photos may exist in the shared gallery, so we do not assume
  // the adjacent wrap target is always this sitter's second upload.
  await page.getByTestId('malta-photo-lightbox-prev').click();
  await expect(page.getByTestId('malta-photo-lightbox-image')).not.toHaveAttribute('src', firstSrc!);
  await page.getByTestId('malta-photo-lightbox-next').click();
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', firstSrc!);

  await page.getByTestId('malta-photo-lightbox-close').click();
  await expect(lightbox).toHaveCount(0);
});
