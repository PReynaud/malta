import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { assertLocalSupabaseUrl, LOCAL_SUPABASE_SERVICE_ROLE_KEY, LOCAL_SUPABASE_URL } from '../local-supabase';

const adminHeaders = () => {
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_ROLE_KEY;
  assertLocalSupabaseUrl(supabaseUrl);

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    serviceRoleKey
  };
};

const serviceHeaders = (serviceRoleKey: string, extra: Record<string, string> = {}) => ({
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  ...extra
});

export const sitterIdByName = async (name: string) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/sitters?name=eq.${encodeURIComponent(name)}&select=id`,
    {
      headers: serviceHeaders(serviceRoleKey),
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to find ${name}: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json() as { id: string }[];
  const sitterId = rows[0]?.id;
  if (!sitterId) {
    throw new Error(`No sitter named ${name}`);
  }

  return sitterId;
};

export const seedFeedingSlot = async (sitterId: string, feedDate: string) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const response = await fetch(`${supabaseUrl}/rest/v1/feeding_slots`, {
    method: 'POST',
    headers: serviceHeaders(serviceRoleKey, {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }),
    body: JSON.stringify({ sitter_id: sitterId, feed_date: feedDate }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`Failed to seed slot: ${response.status} ${await response.text()}`);
  }
};

export const seedMaltaPhoto = async (sitterId: string, filePath: string) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const storagePath = `${sitterId}/${randomUUID()}.png`;
  const bytes = readFileSync(filePath);

  const upload = await fetch(
    `${supabaseUrl}/storage/v1/object/malta-photos/${storagePath}`,
    {
      method: 'POST',
      headers: serviceHeaders(serviceRoleKey, { 'Content-Type': 'image/png' }),
      body: bytes,
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!upload.ok) {
    throw new Error(`Failed to seed photo file: ${upload.status} ${await upload.text()}`);
  }

  const insert = await fetch(`${supabaseUrl}/rest/v1/malta_photos`, {
    method: 'POST',
    headers: serviceHeaders(serviceRoleKey, {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }),
    body: JSON.stringify({ sitter_id: sitterId, storage_path: storagePath }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!insert.ok) {
    throw new Error(`Failed to seed photo row: ${insert.status} ${await insert.text()}`);
  }

  const rows = await insert.json() as { id: string }[];
  const photoId = rows[0]?.id;
  if (!photoId) {
    throw new Error('Seeded photo row did not return an id');
  }

  return photoId;
};

export const setContestClosedForTest = async (closed: boolean) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const response = await fetch(`${supabaseUrl}/rest/v1/photo_contest?id=eq.1`, {
    method: 'PATCH',
    headers: serviceHeaders(serviceRoleKey, {
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }),
    body: JSON.stringify({ closed }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`Failed to set contest closed=${closed}: ${response.status} ${await response.text()}`);
  }
};
