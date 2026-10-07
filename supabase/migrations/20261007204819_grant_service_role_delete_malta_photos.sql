-- E2E helpers clear committed static-photo fixture rows before reinserting them.
grant delete on table public.malta_photos to service_role;
