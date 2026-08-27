import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { ADMIN_EMAIL } from '../../app/utils/admin';
import { createE2EAccountForTest, deleteE2EAccountForTest, ensureAdminE2EAccount } from './helpers/e2e-account';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

const maltaPhotoPath = fileURLToPath(new URL('./fixtures/malta.png', import.meta.url));

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

    await page.goto('/');
    await waitForNuxtHydration(page);

    await page.getByPlaceholder('Tatie, voisin, cousin...').fill(sitterName);
    await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
    await expect(page.getByText(`Tu es ${sitterName}`)).toBeVisible();

    await page.getByTestId('malta-photo-input').setInputFiles(maltaPhotoPath);
    await expect(page.getByRole('img', { name: `Photo de Malta par ${sitterName}` })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: sitterName }).getByText('2 patounes', { exact: true })).toBeVisible();

    await page.goto('/admin/login');
    await waitForNuxtHydration(page);

    const admin = await ensureAdminE2EAccount();
    const form = page.getByTestId('admin-login-form');
    await form.getByLabel('E-mail').fill(admin.email);
    await form.locator('input[name="password"]').fill(admin.password);
    await form.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Admin', exact: true })).toBeVisible();

    const sitterCard = page.locator('[data-testid^="admin-sitter-"]').filter({ hasText: sitterName });
    await expect(sitterCard).toBeVisible();
    await expect(sitterCard.getByText('2 patounes')).toBeVisible();
    await expect(sitterCard.getByTestId('admin-bonus-count')).toHaveText('0');

    await sitterCard.getByRole('button', { name: `Ajouter une patoune bonus à ${sitterName}` }).click();
    await expect(sitterCard.getByTestId('admin-bonus-count')).toHaveText('1');
    await expect(sitterCard.getByText('3 patounes')).toBeVisible();

    await page.goto('/');
    await waitForNuxtHydration(page);
    await expect(page.getByRole('listitem').filter({ hasText: sitterName }).getByText('3 patounes', { exact: true })).toBeVisible();

    await page.goto('/admin');
    await waitForNuxtHydration(page);
    await expect(sitterCard).toBeVisible();

    await sitterCard.getByRole('button', { name: `Retirer une patoune bonus à ${sitterName}` }).click();
    await expect(sitterCard.getByTestId('admin-bonus-count')).toHaveText('0');
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
  });
});
