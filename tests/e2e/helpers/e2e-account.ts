import { ADMIN_EMAIL } from '../../../app/utils/admin';
import { assertLocalSupabaseUrl, LOCAL_SUPABASE_SERVICE_ROLE_KEY, LOCAL_SUPABASE_URL } from '../local-supabase';

export interface E2EAccount {
  userId: string;
  email: string;
  password: string;
}

const toToken = (seed: string) => seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'e2euser';

export const generateE2EAccountData = (seed: string) => {
  const token = toToken(seed);
  const suffix = Date.now();
  return {
    email: `e2e_${token}_${suffix}@example.com`,
    password: `Pw_${token}_${suffix}!`
  };
};

const adminHeaders = () => {
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  assertLocalSupabaseUrl(supabaseUrl);

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    serviceRoleKey
  };
};

export const createE2EAccountForTest = async (seed: string): Promise<E2EAccount> => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const generated = generateE2EAccountData(seed);

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: generated.email,
      password: generated.password,
      email_confirm: true
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create E2E account: ${await response.text()}`);
  }

  const payload = await response.json() as { id: string; email?: string };

  return {
    userId: payload.id,
    email: payload.email || generated.email,
    password: generated.password
  };
};

const listAuthUsers = async (): Promise<Array<{ id: string; email?: string }>> => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list auth users: ${await response.text()}`);
  }

  const payload = await response.json() as { users?: Array<{ id: string; email?: string }> };
  return payload.users ?? [];
};

export const ensureAdminE2EAccount = async (): Promise<E2EAccount> => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const generated = generateE2EAccountData('malta-admin');

  const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: generated.password,
      email_confirm: true,
      app_metadata: { role: 'admin', provider: 'email', providers: ['email'] }
    })
  });

  if (createResponse.ok) {
    const payload = await createResponse.json() as { id: string; email?: string };
    return {
      userId: payload.id,
      email: payload.email || ADMIN_EMAIL,
      password: generated.password
    };
  }

  const existing = (await listAuthUsers()).find(
    user => user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  if (!existing) {
    throw new Error(`Failed to create admin E2E account: ${await createResponse.text()}`);
  }

  const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existing.id}`, {
    method: 'PUT',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      password: generated.password,
      email_confirm: true,
      app_metadata: { role: 'admin', provider: 'email', providers: ['email'] }
    })
  });

  if (!updateResponse.ok) {
    throw new Error(`Failed to update admin E2E account: ${await updateResponse.text()}`);
  }

  return {
    userId: existing.id,
    email: ADMIN_EMAIL,
    password: generated.password
  };
};

export const deleteE2EAccountForTest = async (userId: string): Promise<void> => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete E2E account: ${await response.text()}`);
  }
};
