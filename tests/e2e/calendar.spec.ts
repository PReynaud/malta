import { expect, test } from '@playwright/test';
import { waitForNuxtHydration } from './helpers/wait-for-hydration';

test('a sitter can join, claim a hungry day, then leave it', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitForNuxtHydration(page);

  const name = `Sitter-${testInfo.parallelIndex}-${testInfo.retry}`;
  await page.getByPlaceholder('Auntie, neighbor, cousin...').fill(name);
  await page.getByRole('button', { name: 'Join the crew' }).click();

  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();

  const day = page.getByRole('button', { name: /^1 September 2026,/ });
  await expect(day).toContainText('Hungry');

  await day.click();
  await expect(day).toContainText(name);
  await expect(day).not.toContainText('Hungry');

  await day.click();
  await expect(day).toContainText('Hungry');
});
