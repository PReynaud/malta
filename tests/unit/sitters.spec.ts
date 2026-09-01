import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  nextSelectedSitterId,
  readSelectedSitterId,
  SELECTED_SITTER_KEY,
  writeSelectedSitterId
} from '../../app/utils/sitter-session';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    }
  };
}

describe('sitter session', () => {
  it('persists, restores, and clears the selected sitter id', () => {
    const storage = memoryStorage();

    expect(readSelectedSitterId(storage)).toBeNull();

    writeSelectedSitterId(storage, 'sitter-a');
    expect(storage.getItem(SELECTED_SITTER_KEY)).toBe('sitter-a');
    expect(readSelectedSitterId(storage)).toBe('sitter-a');

    writeSelectedSitterId(storage, null);
    expect(storage.getItem(SELECTED_SITTER_KEY)).toBeNull();
    expect(readSelectedSitterId(storage)).toBeNull();
  });

  it('refuses switching to another sitter while one is already selected', () => {
    expect(nextSelectedSitterId(null, 'a')).toBe('a');
    expect(nextSelectedSitterId('a', 'a')).toBe('a');
    expect(nextSelectedSitterId('a', 'b')).toBe('a');
  });
});

describe('sitters store wiring', () => {
  const source = readFileSync(resolve(process.cwd(), 'app/stores/sitters.ts'), 'utf8');
  const picker = readFileSync(resolve(process.cwd(), 'app/components/SitterPicker.vue'), 'utf8');
  const calendar = readFileSync(resolve(process.cwd(), 'app/components/MonthCalendar.vue'), 'utf8');
  const home = readFileSync(resolve(process.cwd(), 'app/pages/index.vue'), 'utf8');

  it('clears the selected sitter through the store and picker logout', () => {
    expect(source).toContain('clearSelectedSitter');
    expect(source).toContain('writeSelectedSitterId(clientStorage(), null)');
    expect(source).toContain('nextSelectedSitterId');
    expect(home).toContain('@logout="store.clearSelectedSitter"');
    expect(picker).toContain('Se déconnecter');
    expect(picker).toContain('emit(\'logout\')');
  });

  it('keeps the lock legend but uses an icon-only badge on locked days', () => {
    expect(calendar).toContain('Verrouillé');
    const badge = calendar.match(
      /v-else-if="isAdminLocked\(cell\.isoDate\)"[\s\S]*?<\/span>\s*<\/span>/
    )?.[0];
    expect(badge).toContain('🔒');
    expect(badge).not.toMatch(/>\s*Verrouillé\s*</);
  });
});
