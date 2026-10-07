import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { assertLocalSupabaseUrl, LOCAL_SUPABASE_SERVICE_ROLE_KEY, LOCAL_SUPABASE_URL } from '../local-supabase';

export const MALTA_PHOTO_FIXTURES = [
  '007ba76a-d86b-4d48-830c-ccd97641d941/0f0339b5-b8b2-404e-8966-bf459a5c02d7.jpg',
  '007ba76a-d86b-4d48-830c-ccd97641d941/180ff757-695a-449a-a736-30dcdf794bc8.jpg',
  '007ba76a-d86b-4d48-830c-ccd97641d941/2024f183-0069-4ead-8f8a-888d301316d8.jpg',
  '007ba76a-d86b-4d48-830c-ccd97641d941/23d85d0b-7318-4a5d-8843-83397f71c588.jpg',
  '007ba76a-d86b-4d48-830c-ccd97641d941/2ae1c175-d41c-4cbd-8a06-c9542dc15028.jpg',
  '007ba76a-d86b-4d48-830c-ccd97641d941/2c9a0032-6f94-4a1d-8cfb-b7156f277d79.jpg'
] as const;

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

export const seedMaltaPhoto = async (sitterId: string, storagePath: string) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();
  const assetRoot = resolve(process.cwd(), 'public/malta-photos');
  const assetPath = resolve(assetRoot, storagePath);
  if (!assetPath.startsWith(`${assetRoot}${sep}`) || !existsSync(assetPath)) {
    throw new Error(`Committed Malta photo fixture is missing: ${storagePath}`);
  }

  const removeExisting = await fetch(
    `${supabaseUrl}/rest/v1/malta_photos?storage_path=eq.${encodeURIComponent(storagePath)}`,
    {
      method: 'DELETE',
      headers: serviceHeaders(serviceRoleKey, { Prefer: 'return=minimal' }),
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!removeExisting.ok) {
    throw new Error(
      `Failed to clear stale photo fixture: ${removeExisting.status} ${await removeExisting.text()}`
    );
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
