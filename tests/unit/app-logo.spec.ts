import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AppLogo', () => {
  it('renders the circular Malta emblem from public/logo.png', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/components/AppLogo.vue'), 'utf8');
    const logoPath = resolve(process.cwd(), 'public/logo.png');
    const png = readFileSync(logoPath);

    expect(source).toMatch(/<img/);
    expect(source).toMatch(/src="\/logo\.png"/);
    expect(existsSync(logoPath)).toBe(true);
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  });
});
