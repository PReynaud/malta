-- E2E helpers use the service role key against PostgREST. Table grants are still
-- required even though service_role bypasses RLS.

grant select, insert, update, delete on table public.locked_feed_dates to service_role;
