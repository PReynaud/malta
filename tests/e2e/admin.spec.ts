import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL } from '../../app/utils/admin';
import { SELECTED_SITTER_KEY } from '../../app/utils/sitter-session';
import { createE2EAccountForTest, deleteE2EAccountForTest, ensureAdminE2EAccount } from './helpers/e2e-account';
import {
  MALTA_PHOTO_FIXTURES,
  seedFeedingSlot,
  seedMaltaPhoto,
  sitterIdByName
} from './helpers/seed-contest';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

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
});
