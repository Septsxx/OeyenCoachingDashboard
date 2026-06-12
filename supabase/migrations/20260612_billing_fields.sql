alter table public.clients
  add column if not exists company_name text,
  add column if not exists tav text,
  add column if not exists vat_number text,
  add column if not exists billing_address text,
  add column if not exists billing_phone text;
