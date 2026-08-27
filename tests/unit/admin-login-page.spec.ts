import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin login page', () => {
  it('is sign-in only and has no signup control', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/pages/admin/login.vue'), 'utf8');

    expect(source).toMatch(/Se connecter/);
    expect(source).not.toMatch(/signUp|signup|S'inscrire|Créer un compte/i);
  });
});
