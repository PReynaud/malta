import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADMIN_EMAIL, isAdminUser, nextBonusPatounes, parseBonusDelta } from '../../app/utils/admin';

describe('admin', () => {
  it('recognizes only the seeded admin email with app_metadata role', () => {
    expect(ADMIN_EMAIL).toBe('pierre.reynaud@outlook.com');

    expect(isAdminUser({
      email: ADMIN_EMAIL,
      app_metadata: { role: 'admin' }
    })).toBe(true);

    expect(isAdminUser({
      email: 'Pierre.Reynaud@outlook.com',
      app_metadata: { role: 'admin' }
    })).toBe(true);

    expect(isAdminUser({
      email: ADMIN_EMAIL,
      app_metadata: { role: 'admin', provider: 'email' }
    })).toBe(true);
  });

  it('does not store an admin password in SQL', () => {
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260827180000_admin_and_bonus_patounes.sql'),
      'utf8'
    );
    const seed = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8');

    expect(migration).not.toMatch(/crypt\(|encrypted_password|Test123/);
    expect(seed).not.toMatch(/crypt\(|encrypted_password|Test123/);
  });

  it('matches the public runtimeConfig admin email', () => {
    const source = readFileSync(resolve(process.cwd(), 'nuxt.config.ts'), 'utf8');
    expect(source).toContain(`adminEmail: '${ADMIN_EMAIL}'`);
  });

  it('does not let the PWA serve the homepage for /admin navigations', () => {
    const source = readFileSync(resolve(process.cwd(), 'nuxt.config.ts'), 'utf8');
    expect(source).toContain('navigateFallbackDenylist: [/^\\/admin/]');
  });

  it('retries unauthorized admin loads and keeps partial data', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/stores/admin.ts'), 'utf8');
    expect(source).toContain('refreshSession');
    expect(source).toContain('isUnauthorizedError');
    expect(source).toContain('if (sittersResult.data)');
    expect(source).toContain('if (photosResult.data)');
  });

  it('rejects missing users, the wrong email, or a user-editable role', () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser({ email: ADMIN_EMAIL })).toBe(false);

    expect(isAdminUser({
      email: 'intrus@example.com',
      app_metadata: { role: 'admin' }
    })).toBe(false);

    expect(isAdminUser({
      email: ADMIN_EMAIL,
      app_metadata: { role: 'sitter' }
    })).toBe(false);

    expect(isAdminUser({
      email: ADMIN_EMAIL,
      app_metadata: {},
      user_metadata: { role: 'admin' }
    })).toBe(false);
  });

  it('steps bonus patounes by delta and never below zero', () => {
    expect(nextBonusPatounes(0, 1)).toBe(1);
    expect(nextBonusPatounes(4, -1)).toBe(3);
    expect(nextBonusPatounes(0, -1)).toBe(0);
    expect(nextBonusPatounes(2, -5)).toBe(0);
    expect(nextBonusPatounes(Number.NaN, 1)).toBe(1);
    expect(nextBonusPatounes(1.8, 1.2)).toBe(3);
  });

  it('parses a positive whole number for bonus add or remove', () => {
    expect(parseBonusDelta('10')).toBe(10);
    expect(parseBonusDelta(' 3 ')).toBe(3);
    expect(parseBonusDelta(4)).toBe(4);
    expect(parseBonusDelta(10000)).toBe(9999);
    expect(parseBonusDelta('10000')).toBe(9999);
    expect(parseBonusDelta(1.8)).toBe(0);
    expect(parseBonusDelta('1.8')).toBe(0);
    expect(parseBonusDelta('10abc')).toBe(0);
    expect(parseBonusDelta('+3')).toBe(0);
    expect(parseBonusDelta('0')).toBe(0);
    expect(parseBonusDelta('-2')).toBe(0);
    expect(parseBonusDelta('abc')).toBe(0);
    expect(parseBonusDelta('')).toBe(0);
    expect(parseBonusDelta(null)).toBe(0);
    expect(parseBonusDelta(undefined)).toBe(0);
  });

  it('lets the admin type how many bonus patounes to add or remove', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/pages/admin/index.vue'), 'utf8');
    expect(source).toContain('data-testid="admin-bonus-delta"');
    expect(source).toContain('applyBonus');
    expect(source).toContain('parseBonusDelta');
  });
});
