create type public.account_workspace_role as enum ('student', 'institute');
create type public.institution_member_role as enum ('owner', 'admin', 'instructor', 'student');
create type public.institution_member_status as enum ('invited', 'active', 'suspended');

alter table public.profiles
  add column account_role public.account_workspace_role not null default 'student';

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text not null unique,
  seat_limit integer not null default 25 check (seat_limit between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institution_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.institution_member_role not null default 'student',
  status public.institution_member_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, user_id)
);

create table public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  candidate_id text,
  target_exam text,
  study_language text not null default 'hi' check (study_language in ('hi', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index institutions_owner_idx on public.institutions(owner_user_id);
create index institution_members_user_idx on public.institution_members(user_id);

create trigger institutions_set_updated_at before update on public.institutions
for each row execute function public.set_updated_at();
create trigger institution_members_set_updated_at before update on public.institution_members
for each row execute function public.set_updated_at();
create trigger student_profiles_set_updated_at before update on public.student_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_institution_owner(check_institution_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.institutions institution
    where institution.id = check_institution_id
      and institution.owner_user_id = (select auth.uid())
  );
$$;

create or replace function public.is_active_institution_member(check_institution_id uuid, check_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.institution_members member
    where member.institution_id = check_institution_id
      and member.user_id = check_user_id
      and member.status = 'active'
  );
$$;

revoke all on function public.is_institution_owner(uuid) from public;
revoke all on function public.is_active_institution_member(uuid, uuid) from public;
grant execute on function public.is_institution_owner(uuid) to authenticated;
grant execute on function public.is_active_institution_member(uuid, uuid) to authenticated;

alter table public.institutions enable row level security;
alter table public.institution_members enable row level security;
alter table public.student_profiles enable row level security;

create policy institutions_read_membership on public.institutions for select using (
  owner_user_id = (select auth.uid()) or public.is_active_institution_member(id, (select auth.uid()))
);
create policy institutions_create_own on public.institutions for insert with check (owner_user_id = (select auth.uid()));
create policy institutions_update_owner on public.institutions for update using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy institutions_delete_owner on public.institutions for delete using (owner_user_id = (select auth.uid()));

create policy institution_members_read_self_or_owner on public.institution_members for select using (
  user_id = (select auth.uid()) or public.is_institution_owner(institution_id)
);
create policy institution_members_manage_owner on public.institution_members for all using (
  public.is_institution_owner(institution_id)
) with check (
  public.is_institution_owner(institution_id)
);

create policy student_profiles_read_own_or_institute_owner on public.student_profiles for select using (
  user_id = (select auth.uid()) or (institution_id is not null and public.is_institution_owner(institution_id))
);
create policy student_profiles_manage_own on public.student_profiles for all using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid())
  and (institution_id is null or public.is_active_institution_member(institution_id, (select auth.uid())))
);

insert into public.student_profiles (user_id)
select user_id from public.profiles
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name, account_role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'student');
  insert into public.student_profiles (user_id) values (new.id);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;
