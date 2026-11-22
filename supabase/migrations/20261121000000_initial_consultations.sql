create type public.consultation_status as enum ('booked', 'completed', 'cancelled');

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text not null check (char_length(last_name) between 1 and 100),
  reason text not null check (char_length(reason) between 1 and 1000),
  scheduled_at timestamptz not null,
  status public.consultation_status not null default 'booked',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index consultations_user_scheduled_idx
  on public.consultations (user_id, scheduled_at);

create index consultations_status_scheduled_idx
  on public.consultations (status, scheduled_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger consultations_set_updated_at
before update on public.consultations
for each row execute function public.set_updated_at();

alter table public.consultations enable row level security;

create policy "Students read their consultations; admins read all consultations"
  on public.consultations
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "Students insert consultations for themselves"
  on public.consultations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Students update their own consultations"
  on public.consultations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.consultations from anon;
revoke all on public.consultations from authenticated;
grant select, insert, update on public.consultations to authenticated;
