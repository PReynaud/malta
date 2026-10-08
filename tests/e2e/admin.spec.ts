import { expect, test, type Page, type Route } from '@playwright/test';
import { ADMIN_EMAIL } from '../../app/utils/admin';
import { SELECTED_SITTER_KEY } from '../../app/utils/sitter-session';
import { createE2EAccountForTest, deleteE2EAccountForTest, ensureAdminE2EAccount } from './helpers/e2e-account';
import {
  MALTA_PHOTO_FIXTURES,
  deleteSeededMaltaPhoto,
  seedContestVote,
  seedFeedingSlot,
  seedMaltaPhoto,
  sitterIdByName
} from './helpers/seed-contest';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

const ADMIN_VOTED_PHOTO = '007ba76a-d86b-4d48-830c-ccd97641d941/38437374-1837-42c0-827a-432a1be89a4f.jpg';
const ADMIN_UNVOTED_PHOTO = '007ba76a-d86b-4d48-830c-ccd97641d941/5413dcde-b802-4539-b203-9e815b2e6ecd.jpg';
const ADMIN_REMOVED_PHOTO = '007ba76a-d86b-4d48-830c-ccd97641d941/5b884abe-d8fe-4ec9-9898-1d7cc4e115ba.jpg';

type JsonRow = Record<string, unknown>;

async function fulfillFilteredRows(route: Route, keep: (row: JsonRow) => boolean) {
  if (route.request().method() !== 'GET') {
    await route.continue();
    return;
  }

  const response = await route.fetch();
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    await route.fulfill({ response, body: text });
    return;
  }

  if (!Array.isArray(parsed)) {
    await route.fulfill({ response, body: text });
    return;
  }

  const body = JSON.stringify(parsed.filter((row): row is JsonRow => {
    return typeof row === 'object' && row !== null && keep(row as JsonRow);
  }));
  const headers = { ...response.headers() };
  delete headers['content-length'];
  delete headers['content-encoding'];

  await route.fulfill({
    status: response.status(),
    headers,
    body
  });
}

async function joinTeam(page: Page, name: string) {
  await page.goto('/');
  await waitForNuxtHydration(page);
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();
}

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await waitForNuxtHydration(page);

  const admin = await ensureAdminE2EAccount();
  const form = page.getByTestId('admin-login-form');
  await form.getByLabel('E-mail').fill(admin.email);
  await form.locator('input[name="password"]').fill(admin.password);
  await form.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(url => url.pathname === '/admin');
  await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();
}

test.describe('admin dashboard', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sends a guest from /admin to the admin login', async ({ page }) => {
    await page.goto('/admin');
    await waitForNuxtHydration(page);

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { name: 'Admin Malta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'S\'inscrire' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('keeps the admin on login when the password is wrong', async ({ page }) => {
    await page.goto('/admin/login');
    await waitForNuxtHydration(page);

    const form = page.getByTestId('admin-login-form');
    await form.getByLabel('E-mail').fill(ADMIN_EMAIL);
    await form.locator('input[name="password"]').fill('WrongPass1!');
    await form.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toHaveCount(0);
  });

  test('rejects a non-admin account on the admin login and from /admin', async ({ page }, testInfo) => {
    const account = await createE2EAccountForTest(
      `admin-denied-${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`
    );

    try {
      await page.goto('/admin/login');
      await waitForNuxtHydration(page);

      const form = page.getByTestId('admin-login-form');
      await form.getByLabel('E-mail').fill(account.email);
      await form.locator('input[name="password"]').fill(account.password);
      await form.getByRole('button', { name: 'Se connecter' }).click();

      await expect(page.getByText('Ce compte n\'a pas accès à l\'admin.')).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toHaveCount(0);

      await page.goto('/login');
      await waitForNuxtHydration(page);
      const publicForm = page.locator('form').first();
      await publicForm.getByLabel('E-mail').fill(account.email);
      await publicForm.locator('input[name="password"]').fill(account.password);
      await publicForm.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page).toHaveURL(/\/home/);

      await page.goto('/admin');
      await waitForNuxtHydration(page);
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toHaveCount(0);
    } finally {
      await deleteE2EAccountForTest(account.userId);
    }
  });

  test('lets the admin adjust bonus patounes and delete a photo and a sitter', async ({ page }, testInfo) => {
    const suffix = `${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
    const sitterName = `Admin-${suffix}`;
    const storageMutationRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/storage/v1/') && request.method() !== 'GET') {
        storageMutationRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.goto('/');
    await waitForNuxtHydration(page);

    await page.getByPlaceholder('Tatie, voisin, cousin...').fill(sitterName);
    await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
    await expect(page.getByText(`Tu es ${sitterName}`)).toBeVisible();

    const sitterId = await sitterIdByName(sitterName);
    await seedMaltaPhoto(sitterId, MALTA_PHOTO_FIXTURES[5]);
    await page.reload();
    await waitForNuxtHydration(page);
    const photo = page.getByRole('img', { name: `Photo de Malta par ${sitterName}` });
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute('src', /^\/malta-photos\//);
    await expect(photo).toHaveJSProperty('complete', true);
    expect(await photo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole('listitem').filter({ hasText: sitterName }).getByText('2 patounes', { exact: true })).toBeVisible();

    await page.goto('/admin/login');
    await waitForNuxtHydration(page);

    const admin = await ensureAdminE2EAccount();
    const form = page.getByTestId('admin-login-form');
    await form.getByLabel('E-mail').fill(admin.email);
    await form.locator('input[name="password"]').fill(admin.password);
    await form.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(url => url.pathname === '/admin');
    await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();
    await expect(page.getByTestId('admin-contest')).toBeVisible();
    await expect(page.getByTestId('admin-contest-toggle')).toBeVisible();

    const sitterCard = page.locator('[data-testid^="admin-sitter-"]').filter({ hasText: sitterName });
    await expect(sitterCard).toBeVisible();
    await expect(sitterCard.getByText('2 patounes')).toBeVisible();
    await expect(sitterCard.getByTestId('admin-bonus-count')).toHaveText('bonus 0');

    await sitterCard.getByLabel(`Nombre de patounes bonus à ajouter ou retirer pour ${sitterName}`).fill('5');
    await sitterCard.getByRole('button', { name: `Ajouter des patounes bonus à ${sitterName}` }).click();
    await expect(sitterCard.getByTestId('admin-bonus-count')).toHaveText('bonus 5');
    await expect(sitterCard.getByText('7 patounes')).toBeVisible();

    await page.goto('/');
    await waitForNuxtHydration(page);
    await expect(page.getByRole('listitem').filter({ hasText: sitterName }).getByText('7 patounes', { exact: true })).toBeVisible();

    await page.goto('/admin');
    await waitForNuxtHydration(page);
    await expect(sitterCard).toBeVisible();

    await sitterCard.getByLabel(`Nombre de patounes bonus à ajouter ou retirer pour ${sitterName}`).fill('5');
    await sitterCard.getByRole('button', { name: `Retirer des patounes bonus à ${sitterName}` }).click();
    await expect(sitterCard.getByTestId('admin-bonus-count')).toHaveText('bonus 0');
    await expect(sitterCard.getByText('2 patounes')).toBeVisible();

    await sitterCard.getByLabel(`Nombre de malus à ajouter ou retirer pour ${sitterName}`).fill('1');
    await sitterCard.getByRole('button', { name: `Ajouter des malus à ${sitterName}` }).click();
    await expect(sitterCard.getByTestId('admin-malus-count')).toHaveText('malus 1');
    await expect(sitterCard.getByText('1 patoune')).toBeVisible();

    await page.goto('/');
    await waitForNuxtHydration(page);
    await expect(page.getByRole('listitem').filter({ hasText: sitterName }).getByText('1 patoune', { exact: true })).toBeVisible();

    await page.goto('/admin');
    await waitForNuxtHydration(page);
    await expect(sitterCard).toBeVisible();

    await sitterCard.getByLabel(`Nombre de malus à ajouter ou retirer pour ${sitterName}`).fill('1');
    await sitterCard.getByRole('button', { name: `Retirer des malus à ${sitterName}` }).click();
    await expect(sitterCard.getByTestId('admin-malus-count')).toHaveText('malus 0');
    await expect(sitterCard.getByText('2 patounes')).toBeVisible();

    const photoCard = page.locator('[data-testid^="admin-photo-"]').filter({ hasText: sitterName });
    await expect(photoCard).toBeVisible();
    await photoCard.getByRole('button', { name: 'Supprimer' }).click();
    await page.getByTestId('admin-confirm-delete').click();
    await expect(photoCard).toHaveCount(0);

    await page.goto('/');
    await waitForNuxtHydration(page);
    await expect(page.getByRole('img', { name: `Photo de Malta par ${sitterName}` })).toHaveCount(0);
    await expect(page.getByText(`Tu es ${sitterName}`)).toBeVisible();

    await page.goto('/admin');
    await waitForNuxtHydration(page);
    await expect(sitterCard).toBeVisible();
    await sitterCard.getByRole('button', { name: 'Supprimer' }).click();
    await page.getByTestId('admin-confirm-delete').click();
    await expect(sitterCard).toHaveCount(0);

    await page.goto('/');
    await waitForNuxtHydration(page);
    await expect(page.getByText(sitterName)).toHaveCount(0);
    await expect(page.getByRole('img', { name: `Photo de Malta par ${sitterName}` })).toHaveCount(0);

    await page.goto('/admin');
    await waitForNuxtHydration(page);
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('button', { name: 'S\'inscrire' })).toHaveCount(0);
    expect(storageMutationRequests).toEqual([]);
  });

  test('lets the admin remove an extra sitter and lock a day', async ({ page }, testInfo) => {
    const suffix = `${testInfo.parallelIndex}-${testInfo.retry}-${testInfo.workerIndex}`;
    const firstName = `LockA-${suffix}`;
    const secondName = `LockB-${suffix}`;
    const targetDay = '2026-09-16';

    await page.goto('/');
    await waitForNuxtHydration(page);

    await page.getByPlaceholder('Tatie, voisin, cousin...').fill(firstName);
    await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
    await expect(page.getByText(`Tu es ${firstName}`)).toBeVisible();

    await page.evaluate(key => window.localStorage.removeItem(key), SELECTED_SITTER_KEY);
    await page.reload();
    await waitForNuxtHydration(page);

    await page.getByPlaceholder('Tatie, voisin, cousin...').fill(secondName);
    await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
    await expect(page.getByText(`Tu es ${secondName}`)).toBeVisible();

    await seedFeedingSlot(await sitterIdByName(firstName), targetDay);
    await seedFeedingSlot(await sitterIdByName(secondName), targetDay);

    await page.goto('/admin/login');
    await waitForNuxtHydration(page);

    const admin = await ensureAdminE2EAccount();
    const form = page.getByTestId('admin-login-form');
    await form.getByLabel('E-mail').fill(admin.email);
    await form.locator('input[name="password"]').fill(admin.password);
    await form.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/admin');
    await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();

    const day = page.getByTestId(`admin-calendar-day-${targetDay}`);
    await expect(day).toBeEnabled();
    await day.click();
    const panel = page.getByTestId('admin-day-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(firstName)).toBeVisible();
    await expect(panel.getByText(secondName)).toBeVisible();

    const secondSlot = panel.locator('[data-testid^="admin-day-slot-"]').filter({ hasText: secondName });
    await secondSlot.getByRole('button', { name: 'Retirer' }).click();
    await page.getByTestId('admin-confirm-delete').click();
    await expect(panel.getByText(secondName)).toHaveCount(0);
    await expect(panel.getByText(firstName)).toBeVisible();

    await panel.getByTestId('admin-lock-day').click();
    await page.getByTestId('admin-confirm-delete').click();
    await expect(panel.getByText('Journée verrouillée pour tout le monde.')).toBeVisible();

    await page.getByTestId('admin-unlock-day').click();
    await expect(page.getByTestId('admin-day-panel')).toContainText('Encore modifiable par les volontaires.');
  });

  test('shows voted photos in the contest list and marks only those cards', async ({ page }, testInfo) => {
    const suffix = `${testInfo.workerIndex}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const authorName = `VoteA-${suffix}`;
    const voterName = `VoteB-${suffix}`;
    const photoIds: string[] = [];

    try {
      await joinTeam(page, authorName);
      const authorId = await sitterIdByName(authorName);
      await page.evaluate(key => window.localStorage.removeItem(key), SELECTED_SITTER_KEY);
      await joinTeam(page, voterName);
      const voterId = await sitterIdByName(voterName);

      const votedPhotoId = await seedMaltaPhoto(authorId, ADMIN_VOTED_PHOTO);
      photoIds.push(votedPhotoId);
      const otherPhotoId = await seedMaltaPhoto(authorId, ADMIN_UNVOTED_PHOTO);
      photoIds.push(otherPhotoId);
      await seedContestVote(authorId, votedPhotoId, 'cutest');
      await seedContestVote(voterId, votedPhotoId, 'cutest');
      await seedContestVote(authorId, votedPhotoId, 'funniest');

      // Other suites share this database. Keep the admin tally to this photo.
      await page.route('**/rest/v1/photo_contest_votes*', route => fulfillFilteredRows(
        route,
        row => row.photo_id === votedPhotoId
      ));
      await loginAsAdmin(page);

      const cutestRow = page.getByTestId(`admin-contest-row-cutest-${votedPhotoId}`);
      const funniestRow = page.getByTestId(`admin-contest-row-funniest-${votedPhotoId}`);
      const cutestPhoto = page.getByTestId(`admin-contest-photo-cutest-${votedPhotoId}`);
      const funniestPhoto = page.getByTestId(`admin-contest-photo-funniest-${votedPhotoId}`);
      const votedCard = page.getByTestId(`admin-photo-${votedPhotoId}`);
      const otherCard = page.getByTestId(`admin-photo-${otherPhotoId}`);

      await expect(cutestRow).toBeVisible();
      await expect(cutestRow).toContainText(authorName);
      await expect(cutestRow).toContainText('2 votes');
      await expect(cutestPhoto).toBeVisible();
      await expect(cutestPhoto).toHaveAttribute('alt', `Photo de Malta par ${authorName}`);

      await expect(funniestRow).toBeVisible();
      await expect(funniestRow).toContainText(authorName);
      await expect(funniestRow).toContainText('1 vote');
      await expect(funniestPhoto).toBeVisible();

      await expect(votedCard).toBeVisible();
      await expect(otherCard).toBeVisible();
      await expect(otherCard).toContainText(authorName);
      await expect(page.getByTestId(`admin-photo-votes-${otherPhotoId}`)).toHaveCount(0);

      const marks = votedCard.getByTestId(`admin-photo-votes-${votedPhotoId}`).locator('li');
      await expect(marks).toHaveCount(2);
      await expect(marks.nth(0)).toHaveAttribute('data-testid', `admin-photo-vote-${votedPhotoId}-cutest`);
      await expect(marks.nth(0)).toHaveText('🥰 2 votes');
      await expect(marks.nth(1)).toHaveAttribute('data-testid', `admin-photo-vote-${votedPhotoId}-funniest`);
      await expect(marks.nth(1)).toHaveText('😂 1 vote');

      const votedSrc = await votedCard.locator('img').getAttribute('src');
      const otherSrc = await otherCard.locator('img').getAttribute('src');
      expect(votedSrc).toMatch(/^\/malta-photos\//);
      expect(otherSrc).toMatch(/^\/malta-photos\//);
      expect(votedSrc).not.toBe(otherSrc);
      await expect(cutestPhoto).toHaveAttribute('src', votedSrc ?? '');
      await expect(funniestPhoto).toHaveAttribute('src', votedSrc ?? '');

      for (const category of ['cutest', 'funniest', 'lamest']) {
        await expect(page.getByTestId(`admin-contest-row-${category}-${otherPhotoId}`)).toHaveCount(0);
      }
      await expect(page.getByTestId(`admin-contest-row-lamest-${votedPhotoId}`)).toHaveCount(0);

      const lamest = page.locator('div.rounded-2xl', {
        has: page.getByRole('heading', { name: 'La plus nulle', exact: true })
      });
      await expect(lamest.getByText('Aucun vote.')).toBeVisible();
    } finally {
      await Promise.all(photoIds.map(photoId => deleteSeededMaltaPhoto(photoId)));
    }
  });

  test('shows Photo retirée and no image when votes point at a missing photo', async ({ page }, testInfo) => {
    const suffix = `${testInfo.workerIndex}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const authorName = `Gone-${suffix}`;
    const photoIds: string[] = [];

    try {
      await joinTeam(page, authorName);
      const authorId = await sitterIdByName(authorName);
      const photoId = await seedMaltaPhoto(authorId, ADMIN_REMOVED_PHOTO);
      photoIds.push(photoId);
      await seedContestVote(authorId, photoId, 'cutest');

      await page.route('**/rest/v1/malta_photos*', route => fulfillFilteredRows(
        route,
        row => row.id !== photoId
      ));
      await page.route('**/rest/v1/photo_contest_votes*', route => fulfillFilteredRows(
        route,
        row => row.photo_id === photoId
      ));
      await loginAsAdmin(page);

      const row = page.getByTestId(`admin-contest-row-cutest-${photoId}`);
      await expect(row).toBeVisible();
      await expect(row).toContainText('Photo retirée');
      await expect(row).toContainText('1 vote');
      await expect(row).not.toContainText(authorName);
      await expect(row.locator('img')).toHaveCount(0);
      await expect(page.getByTestId(`admin-contest-photo-cutest-${photoId}`)).toHaveCount(0);
      await expect(page.getByTestId(`admin-photo-${photoId}`)).toHaveCount(0);

      const funniest = page.locator('div.rounded-2xl', {
        has: page.getByRole('heading', { name: 'La plus marrante', exact: true })
      });
      await expect(funniest.getByText('Aucun vote.')).toBeVisible();
    } finally {
      await Promise.all(photoIds.map(photoId => deleteSeededMaltaPhoto(photoId)));
    }
  });
});
