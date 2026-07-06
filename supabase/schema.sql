-- Rally MVP schema.
-- The app talks to Supabase only from server-side code using the service role key.

create extension if not exists pgcrypto;

do $$
begin
  create type public.lesson_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.session_type as enum (
    'lesson',
    'clinic',
    'other_event',
    'freshmen',
    'varsity',
    'team'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.session_type add value if not exists 'freshmen';
alter type public.session_type add value if not exists 'varsity';
alter type public.session_type add value if not exists 'team';

create table if not exists public.instructor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists instructor_profiles_user_id_idx
  on public.instructor_profiles (user_id)
  where user_id is not null;

-- Fresh projects get the final lessons shape here. Existing MVP databases are
-- migrated by the alter/update/drop statements below.
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  instructor_profile_id uuid not null references public.instructor_profiles(id) on delete cascade,
  student_name text not null,
  student_phone text not null,
  session_type public.session_type not null default 'lesson',
  event_title text,
  lesson_start_time timestamptz not null,
  location text not null,
  notes text,
  status public.lesson_status not null default 'scheduled',
  reminder_sent boolean not null default false,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_students (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_name text not null,
  student_phone text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_instructors (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  instructor_profile_id uuid not null references public.instructor_profiles(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (lesson_id, instructor_profile_id)
);

alter table public.lessons
  add column if not exists instructor_profile_id uuid,
  add column if not exists session_type public.session_type default 'lesson',
  add column if not exists event_title text,
  add column if not exists lesson_start_time timestamptz,
  add column if not exists location text,
  add column if not exists notes text,
  add column if not exists status public.lesson_status default 'scheduled',
  add column if not exists reminder_sent boolean default false,
  add column if not exists reminder_sent_at timestamptz;

-- Migrate instructor name/phone stored directly on old lessons into reusable
-- instructor profiles. This block only runs when the old columns exist.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'instructor_name'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'instructor_phone'
  ) then
    execute $migration$
      insert into public.instructor_profiles (full_name, phone_number)
      select distinct instructor_name, instructor_phone
      from public.lessons old_lessons
      where instructor_name is not null
        and instructor_phone is not null
        and not exists (
          select 1
          from public.instructor_profiles existing_profiles
          where existing_profiles.full_name = old_lessons.instructor_name
            and existing_profiles.phone_number = old_lessons.instructor_phone
        )
    $migration$;

    execute $migration$
      update public.lessons
      set instructor_profile_id = profiles.id
      from public.instructor_profiles profiles
      where public.lessons.instructor_profile_id is null
        and profiles.full_name = public.lessons.instructor_name
        and profiles.phone_number = public.lessons.instructor_phone
    $migration$;
  end if;
end $$;

-- Convert old lesson_date/lesson_time columns into one timestamp. The default
-- timezone matches the app default and can be adjusted before running if needed.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'lesson_date'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'lesson_time'
  ) then
    execute $migration$
      update public.lessons
      set lesson_start_time =
        ((lesson_date::text || ' ' || lesson_time::text)::timestamp at time zone 'America/New_York')
      where lesson_start_time is null
        and lesson_date is not null
        and lesson_time is not null
    $migration$;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'lesson_location'
  ) then
    execute $migration$
      update public.lessons
      set location = lesson_location
      where location is null
        and lesson_location is not null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'lesson_notes'
  ) then
    execute $migration$
      update public.lessons
      set notes = lesson_notes
      where notes is null
        and lesson_notes is not null
    $migration$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'reminder_status'
  ) then
    execute $migration$
      update public.lessons
      set reminder_sent = reminder_status = 'sent'
      where reminder_status is not null
    $migration$;
  end if;
end $$;

alter table public.lessons
  alter column instructor_profile_id set not null,
  alter column session_type set default 'lesson',
  alter column session_type set not null,
  alter column lesson_start_time set not null,
  alter column location set not null,
  alter column status set default 'scheduled',
  alter column status set not null,
  alter column reminder_sent set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lessons_instructor_profile_id_fkey'
  ) then
    alter table public.lessons
      add constraint lessons_instructor_profile_id_fkey
      foreign key (instructor_profile_id)
      references public.instructor_profiles(id)
      on delete cascade;
  end if;
end $$;

alter table public.lessons
  drop column if exists instructor_name,
  drop column if exists instructor_phone,
  drop column if exists lesson_date,
  drop column if exists lesson_time,
  drop column if exists lesson_location,
  drop column if exists lesson_notes,
  drop column if exists reminder_status;

drop type if exists public.reminder_status;

create index if not exists lessons_start_time_idx
  on public.lessons (lesson_start_time);

create index if not exists lessons_reminder_sent_idx
  on public.lessons (reminder_sent);

create index if not exists lessons_instructor_profile_id_idx
  on public.lessons (instructor_profile_id);

create index if not exists lessons_session_type_idx
  on public.lessons (session_type);

create index if not exists lessons_status_idx
  on public.lessons (status);

create index if not exists lesson_students_lesson_id_idx
  on public.lesson_students (lesson_id, sort_order);

create index if not exists lesson_instructors_lesson_id_idx
  on public.lesson_instructors (lesson_id, sort_order);

create index if not exists lesson_instructors_instructor_profile_id_idx
  on public.lesson_instructors (instructor_profile_id);

insert into public.lesson_students (lesson_id, student_name, student_phone, sort_order)
select lessons.id, lessons.student_name, lessons.student_phone, 0
from public.lessons
where not exists (
  select 1
  from public.lesson_students
  where lesson_students.lesson_id = lessons.id
);

insert into public.lesson_instructors (lesson_id, instructor_profile_id, sort_order)
select lessons.id, lessons.instructor_profile_id, 0
from public.lessons
where lessons.instructor_profile_id is not null
  and not exists (
    select 1
    from public.lesson_instructors
    where lesson_instructors.lesson_id = lessons.id
      and lesson_instructors.instructor_profile_id = lessons.instructor_profile_id
  );

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists instructor_profiles_set_updated_at on public.instructor_profiles;

create trigger instructor_profiles_set_updated_at
before update on public.instructor_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;

create trigger lessons_set_updated_at
before update on public.lessons
for each row
execute function public.set_updated_at();

alter table public.instructor_profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_students enable row level security;
alter table public.lesson_instructors enable row level security;

-- No public policies are added for this MVP. Server-side routes use the
-- Supabase service role key, which bypasses RLS. Do not expose that key.
