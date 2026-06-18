alter table public.clients
  add column if not exists billing_street text,
  add column if not exists billing_city text,
  add column if not exists billing_zip text;
