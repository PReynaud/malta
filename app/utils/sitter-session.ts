export const SELECTED_SITTER_KEY = 'malta-sitter-id';

export type SitterSessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readSelectedSitterId(storage: SitterSessionStorage | null): string | null {
  return storage?.getItem(SELECTED_SITTER_KEY) ?? null;
}

export function writeSelectedSitterId(storage: SitterSessionStorage | null, id: string | null): void {
  if (!storage) {
    return;
  }

  if (id) {
    storage.setItem(SELECTED_SITTER_KEY, id);
    return;
  }

  storage.removeItem(SELECTED_SITTER_KEY);
}

export function nextSelectedSitterId(currentId: string | null, requestedId: string): string | null {
  if (currentId && currentId !== requestedId) {
    return currentId;
  }

  return requestedId;
}
