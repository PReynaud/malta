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
