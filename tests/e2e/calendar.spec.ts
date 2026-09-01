import { expect, test } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

test('a sitter can join, claim a hungry day, then leave it', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Sitter-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(name);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();

  await expect(page.getByText(`Tu es ${name}`)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ton profil' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rejoindre l\'équipe' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeHidden();

  const day = page.getByRole('button', { name: /^vendredi 4 septembre 2026,/ });
  await expect(day).toBeEnabled();
  await expect(day).toContainText('Faim');

  await day.click();
  await expect(page.getByTestId('cat-mood-burst')).toContainText('😺');
  await expect(page.getByTestId('cat-mood-burst')).toContainText('+20');
  await expect(day).toContainText(name);
  await expect(day).not.toContainText('Faim');
  await expect(page.getByText(/Ministre des croquettes/)).toBeVisible();

  await day.click();
  await expect(page.getByTestId('cat-mood-burst')).toContainText('😿');
  await expect(page.getByTestId('cat-mood-burst')).toContainText('-20');
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

  await page.getByRole('heading', { name: 'Ton profil' }).click();
  const renamed = `${name}-edit`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(renamed);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText(`Tu es ${renamed}`)).toBeVisible();

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('heading', { name: 'Qui es-tu ?' })).toBeVisible();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toBeVisible();

  const otherName = `Autre-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Tatie, voisin, cousin...').fill(otherName);
  await page.getByRole('button', { name: 'Rejoindre l\'équipe' }).click();
  await expect(page.getByText(`Tu es ${otherName}`)).toBeVisible();
  await expect(page.getByRole('button', { name: renamed, exact: true })).toHaveCount(0);

  await page.getByRole('heading', { name: 'Ton profil' }).click();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.getByRole('button', { name: renamed, exact: true }).click();
  await expect(page.getByText(`Tu es ${renamed}`)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ton profil' })).toBeVisible();
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

test('the blinking patoune banner can be dismissed', async ({ page }) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const banner = page.getByLabel('Jauge collective de Malta');
  await expect(banner).toBeVisible();
  await page.getByRole('button', { name: 'Fermer la pub' }).click();
  await expect(banner).toHaveCount(0);
  await page.getByRole('button', { name: 'Réafficher la pub' }).click();
  await expect(banner).toBeVisible();
});

test('care instructions show food and water photos, with leftover placeholders', async ({ page }) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
  await expect(page.getByText('Image à venir').first()).toBeHidden();

  await page.locator('summary', { hasText: 'Savoir identifier le chat' }).click();
  const identify = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Savoir identifier le chat' }) });
  await expect(identify.getByText(/le chat est blanc et gris/)).toBeVisible();
  await expect(identify.getByRole('img', { name: 'Malta, le chat blanc et gris' })).toHaveAttribute('src', '/care/identify-malta.jpg');
  await expect(identify.getByText(/Appelez la police/)).toBeVisible();
  await expect(identify.getByText('Image à venir')).toHaveCount(0);

  await page.locator('summary', { hasText: 'Nourriture' }).click();
  const food = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Nourriture' }) });
  await expect(food.getByText(/distributeur dans le couloir/)).toBeVisible();
  await expect(food.getByRole('img', { name: 'Le distributeur automatique de croquettes de Malta' })).toHaveAttribute('src', '/care/food-feeder.jpg');
  await expect(food.getByRole('img', { name: 'Le sac de croquettes Hill\'s Science Plan' })).toHaveAttribute('src', '/care/food-kibble-bag.jpg');
  await expect(food.getByRole('img', { name: 'Malta qui attend sa pâtée' })).toHaveAttribute('src', '/care/food-pate-malta.jpg');
  await expect(food.getByRole('img', { name: 'La pâtée de Malta dans son assiette' })).toHaveAttribute('src', '/care/food-pate-plate.jpg');
  await expect(food.getByText('Image à venir')).toHaveCount(0);
  await expect(food.getByText(/pâtée/i).first()).toBeVisible();

  await expect(page.locator('summary', { hasText: 'Friandises' })).toHaveCount(0);
  await page.locator('summary', { hasText: 'Jouets' }).click();
  const toys = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Jouets' }) });
  await expect(toys.getByRole('img', { name: 'Les jouets de Malta' })).toHaveAttribute('src', '/care/toys-collection.jpg');
  await expect(toys.getByRole('img', { name: 'La canne à plumes de Malta' })).toHaveAttribute('src', '/care/toys-feather-wand.jpg');
  await expect(toys.getByRole('img', { name: 'Le sachet de friandises Catisfactions à l\'herbe à chat' })).toHaveAttribute('src', '/care/treats-catisfactions.jpg');
  await expect(toys.getByText(/Catisfactions/)).toBeVisible();
  await expect(toys.getByText(/bouchon de champagne/)).toBeVisible();
  await expect(toys.getByText('Image à venir')).toHaveCount(0);

  await page.locator('summary', { hasText: 'Eau' }).click();
  const water = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Eau' }) });
  const fountain = water.getByRole('img', { name: 'La fontaine à eau automatique de Malta' });
  const bowl = water.getByRole('img', { name: 'Une gamelle à remplir de temps en temps' });
  await expect(fountain).toBeVisible();
  await expect(bowl).toBeVisible();
  await expect(fountain).toHaveAttribute('src', '/care/water-fountain.jpg');
  await expect(bowl).toHaveAttribute('src', '/care/water-bowl.jpg');
  await expect(water.getByText(/gamelles à remplir/)).toBeVisible();
  await expect(water.getByText('Image à venir')).toHaveCount(0);

  await page.locator('summary', { hasText: 'Litières' }).click();
  const litter = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Litières' }) });
  await expect(litter.getByRole('img', { name: 'Une des litières de Malta, avec la pelle sur le couvercle' })).toHaveAttribute('src', '/care/litter-box.jpg');
  await expect(litter.getByText('Image à venir')).toHaveCount(0);

  await page.locator('summary', { hasText: 'Gratouilles' }).click();
  const pets = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Gratouilles' }) });
  await expect(pets.getByRole('img', { name: 'Malta ventre en l\'air sur son arbre à chat, prête pour les gratouilles' })).toHaveAttribute('src', '/care/pets-belly.jpg');
  await expect(pets.getByText(/barbe/)).toBeVisible();
  await expect(pets.getByText('Image à venir')).toHaveCount(0);

  await page.locator('summary', { hasText: 'Saletés' }).click();
  await expect(page.getByText(/papier toilette/)).toBeVisible();
  await expect(page.getByText('Image à venir')).toHaveCount(0);

  await page.locator('summary', { hasText: 'Urgences' }).click();
  const emergency = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Urgences' }) });
  await expect(emergency.getByRole('link', { name: /Vétérinaire de Malta/ })).toBeVisible();
  await expect(emergency.getByRole('img', { name: 'Le sac de transport de Malta' })).toHaveAttribute('src', '/care/emergency-carrier.jpg');
  await expect(emergency.getByText('Image à venir')).toHaveCount(0);
});
