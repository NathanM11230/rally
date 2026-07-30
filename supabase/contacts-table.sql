-- Run this if Rally says the contacts table is missing.
-- It is safe to run more than once.

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  normalized_name text not null,
  normalized_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_normalized_phone_idx
  on public.contacts (normalized_phone);

create index if not exists contacts_normalized_name_idx
  on public.contacts (normalized_name);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contacts_set_updated_at on public.contacts;

create trigger contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

alter table public.contacts enable row level security;

-- Ask Supabase/PostgREST to refresh its schema cache right away.
notify pgrst, 'reload schema';
