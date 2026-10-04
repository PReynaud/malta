export const ADMIN_EMAIL = 'pierre.reynaud@outlook.com';

export interface AdminAuthUser {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
}

export function isAdminUser(user: AdminAuthUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  const role = user.app_metadata?.role;
  const email = user.email?.trim().toLowerCase();

  return role === 'admin' && email === ADMIN_EMAIL.toLowerCase();
}

const DEFAULT_ADMIN_CLAIMS_TIMEOUT_MS = 8000;

export function waitForAdminUser(
  readUser: () => AdminAuthUser | null | undefined,
  subscribe: (listener: () => void) => () => void,
  timeoutMs = DEFAULT_ADMIN_CLAIMS_TIMEOUT_MS
): Promise<boolean> {
  if (isAdminUser(readUser())) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};

    const finish = (ready: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(ready);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    unsubscribe = subscribe(() => {
      if (isAdminUser(readUser())) {
        finish(true);
      }
    });

    if (isAdminUser(readUser())) {
      finish(true);
    }
  });
}

export function nextBonusPatounes(current: number, delta: number): number {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  return Math.max(0, Math.trunc(safeCurrent + safeDelta));
}

export const nextMalusPatounes = nextBonusPatounes;

export function parseBonusDelta(value: string | number | null | undefined): number {
  const maxDelta = 9999;

  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) {
      return 0;
    }

    return Math.min(maxDelta, value);
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return 0;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.min(maxDelta, parsed);
}
