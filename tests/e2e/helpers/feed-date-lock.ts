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

const assertIsoDate = (feedDate: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(feedDate)) {
    throw new Error(`Invalid feed date: ${feedDate}`);
  }
};

export const lockFeedDateForTest = async (feedDate: string) => {
  assertIsoDate(feedDate);
  const { supabaseUrl, serviceRoleKey } = adminHeaders();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/locked_feed_dates?on_conflict=feed_date`,
    {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({ feed_date: feedDate }),
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to lock ${feedDate}: ${response.status} ${await response.text()}`);
  }
};

export const unlockFeedDateForTest = async (feedDate: string) => {
  assertIsoDate(feedDate);
  const { supabaseUrl, serviceRoleKey } = adminHeaders();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/locked_feed_dates?feed_date=eq.${encodeURIComponent(feedDate)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to unlock ${feedDate}: ${response.status} ${await response.text()}`);
  }
};
