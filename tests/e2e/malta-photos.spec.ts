import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';
import { seedMaltaPhoto, setContestClosedForTest, sitterIdByName } from './helpers/seed-contest';

const maltaPhotoPath = fileURLToPath(new URL('./fixtures/malta.png', import.meta.url));

test.describe.configure({ mode: 'serial' });

test.beforeEach(async () => {
  await setContestClosedForTest(false);
});

test('a selected sitter can vote, move that vote, and retract it without gaining patounes', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByTestId('malta-photo-input')).toHaveCount(0);

  const name = `Vote-${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  const sitterId = await sitterIdByName(name);
  const olderPhotoId = await seedMaltaPhoto(sitterId, maltaPhotoPath);
  const newerPhotoId = await seedMaltaPhoto(sitterId, maltaPhotoPath);

  await page.reload();
  await waitForNuxtHydration(page);

  const row = page.getByRole('listitem').filter({ hasText: name });
  await expect(row.getByText('4 patounes', { exact: true })).toBeVisible();

  const thumbs = page.getByRole('button', { name: `Agrandir Photo de Malta par ${name}` });
  await expect(thumbs).toHaveCount(2);

  await thumbs.nth(0).click();
  await page.getByTestId('contest-vote-cutest').click();
  await expect(page.getByTestId('contest-vote-cutest')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('contest-vote-cutest')).toContainText('1 vote');
  await page.getByTestId('malta-photo-lightbox-close').click();

  await expect(page.getByTestId(`contest-mark-${newerPhotoId}-cutest`)).toBeVisible();
  await expect(page.getByTestId('contest-ballot-cutest')).toContainText(name);
  await expect(row.getByText('4 patounes', { exact: true })).toBeVisible();

  await thumbs.nth(1).click();
  await page.getByTestId('contest-vote-cutest').click();
  await expect(page.getByTestId('contest-vote-cutest')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('contest-vote-cutest')).toContainText('1 vote');
  await page.getByTestId('contest-vote-lamest').click();
  await expect(page.getByTestId('contest-vote-lamest')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('malta-photo-lightbox-close').click();

  await expect(page.getByTestId(`contest-mark-${newerPhotoId}-cutest`)).toHaveCount(0);
  await expect(page.getByTestId(`contest-mark-${olderPhotoId}-cutest`)).toBeVisible();
  await expect(page.getByTestId(`contest-mark-${olderPhotoId}-lamest`)).toBeVisible();
  await expect(row.getByText('4 patounes', { exact: true })).toBeVisible();

  await thumbs.nth(1).click();
  await page.getByTestId('contest-vote-cutest').click();
  await expect(page.getByTestId('contest-vote-cutest')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('contest-vote-cutest')).toContainText('0 votes');
  await page.getByTestId('malta-photo-lightbox-close').click();
  await expect(page.getByTestId(`contest-mark-${olderPhotoId}-cutest`)).toHaveCount(0);
  await expect(page.getByTestId('contest-ballot-cutest')).toContainText('pas encore');
});

test('lightbox shows publication metadata and navigates between photos', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Nav-${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  const sitterId = await sitterIdByName(name);
  await seedMaltaPhoto(sitterId, maltaPhotoPath);
  await seedMaltaPhoto(sitterId, maltaPhotoPath);
  await page.reload();
  await waitForNuxtHydration(page);

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

  await page.getByTestId('malta-photo-lightbox-prev').click();
  await expect(page.getByTestId('malta-photo-lightbox-image')).not.toHaveAttribute('src', firstSrc!);
  await page.getByTestId('malta-photo-lightbox-next').click();
  await expect(page.getByTestId('malta-photo-lightbox-image')).toHaveAttribute('src', firstSrc!);

  await page.getByTestId('malta-photo-lightbox-close').click();
  await expect(lightbox).toHaveCount(0);
});

test('a closed contest keeps the vote visible and blocks a new one', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Closed-${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();

  const sitterId = await sitterIdByName(name);
  const photoId = await seedMaltaPhoto(sitterId, maltaPhotoPath);
  await page.reload();
  await waitForNuxtHydration(page);

  await page.getByRole('button', { name: `Agrandir Photo de Malta par ${name}` }).click();
  await page.getByTestId('contest-vote-funniest').click();
  await expect(page.getByTestId('contest-vote-funniest')).toContainText('1 vote');
  await page.getByTestId('malta-photo-lightbox-close').click();

  await setContestClosedForTest(true);

  try {
    await page.reload();
    await waitForNuxtHydration(page);
    await expect(page.getByTestId('contest-closed')).toBeVisible();
    await expect(page.getByTestId(`contest-mark-${photoId}-funniest`)).toBeVisible();

    await page.getByRole('button', { name: `Agrandir Photo de Malta par ${name}` }).click();
    await expect(page.getByTestId('contest-vote-hint')).toHaveText('Le concours est terminé.');
    await expect(page.getByTestId('contest-vote-funniest')).toBeDisabled();
    await expect(page.getByTestId('contest-vote-cutest')).toBeDisabled();
    await expect(page.getByTestId('contest-vote-funniest')).toContainText('1 vote');
  } finally {
    await setContestClosedForTest(false);
  }
});
