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

export function nextBonusPatounes(current: number, delta: number): number {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeDelta = Number.isFinite(delta) ? delta : 0;
  return Math.max(0, Math.trunc(safeCurrent + safeDelta));
}

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
