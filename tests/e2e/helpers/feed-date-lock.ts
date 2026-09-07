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

export const lockFeedDateForTest = async (feedDate: string) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();

  const response = await fetch(`${supabaseUrl}/rest/v1/locked_feed_dates`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ feed_date: feedDate })
  });

  if (!response.ok) {
    throw new Error(`Failed to lock ${feedDate}: ${response.status} ${await response.text()}`);
  }
};

export const unlockFeedDateForTest = async (feedDate: string) => {
  const { supabaseUrl, serviceRoleKey } = adminHeaders();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/locked_feed_dates?feed_date=eq.${encodeURIComponent(feedDate)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to unlock ${feedDate}: ${response.status} ${await response.text()}`);
  }
};
