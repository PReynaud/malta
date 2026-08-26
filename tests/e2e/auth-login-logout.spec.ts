import { expect, test } from './fixtures/auth.fixture';

test('logs in with a generated account and allows logout', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.getByRole('heading', { name: 'Accueil' })).toBeVisible();
  await expect(authenticatedPage.getByRole('button', { name: 'Déconnexion' }).first()).toBeVisible();

  await authenticatedPage.getByRole('button', { name: 'Déconnexion' }).first().click();

  await expect(authenticatedPage).toHaveURL(/\/login/);
  await expect(authenticatedPage.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});
