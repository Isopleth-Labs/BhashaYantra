create type public.account_status as enum ('trialing', 'active', 'expired', 'suspended');
create type public.plan_tier as enum ('free', 'pro', 'institution');

alter table public.profiles
  add column username text,
  add column login_email text,
  add column account_status public.account_status not null default 'trialing',
  add column plan_tier public.plan_tier not null default 'free',
  add column trial_started_at timestamptz not null default now(),
  add column trial_ends_at timestamptz default (now() + interval '14 days');

update public.profiles
set username = 'user_' || replace(substr(public.profiles.user_id::text, 1, 12), '-', ''),
    login_email = auth.users.email
from auth.users
where public.profiles.user_id = auth.users.id
  and (public.profiles.username is null or public.profiles.login_email is null);

alter table public.profiles
  alter column username set not null,
  alter column login_email set not null,
  add constraint profiles_username_format_check
    check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  add constraint profiles_trial_window_check
    check (trial_ends_at is null or trial_ends_at > trial_started_at);

create unique index profiles_username_lower_uidx on public.profiles (lower(username));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_role public.account_workspace_role;
  requested_username text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'account_role' = 'institute' then 'institute'::public.account_workspace_role
    else 'student'::public.account_workspace_role
  end;
  requested_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if requested_username !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then
    requested_username := 'user_' || replace(substr(new.id::text, 1, 12), '-', '');
  end if;

  insert into public.profiles (
    user_id, username, login_email, display_name, account_role, account_status, plan_tier, trial_started_at, trial_ends_at
  ) values (
    new.id,
    requested_username,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    requested_role,
    'trialing',
    case when requested_role = 'institute' then 'institution'::public.plan_tier else 'free'::public.plan_tier end,
    now(),
    now() + interval '14 days'
  );

  if requested_role = 'student' then
    insert into public.student_profiles (user_id) values (new.id);
  end if;
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

-- Authorization-bearing fields are server managed. A signed-in user may only edit presentation fields.
revoke update on public.profiles from authenticated;
grant update (display_name, preferred_language) on public.profiles to authenticated;
grant select (username, login_email) on public.profiles to service_role;

-- Runs once when Supabase Auth issues or refreshes a JWT. Normal API calls then reuse these claims.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  claim_username text;
  claim_display_name text;
  claim_role public.account_workspace_role;
  claim_status public.account_status;
  claim_plan public.plan_tier;
  claim_trial_ends_at timestamptz;
begin
  select username, display_name, account_role, account_status, plan_tier, trial_ends_at
  into claim_username, claim_display_name, claim_role, claim_status, claim_plan, claim_trial_ends_at
  from public.profiles
  where user_id = (event ->> 'user_id')::uuid;

  if claim_username is null then
    return jsonb_build_object(
      'error', jsonb_build_object('http_code', 403, 'message', 'Account profile is unavailable')
    );
  end if;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{username}', to_jsonb(claim_username));
  claims := jsonb_set(claims, '{display_name}', to_jsonb(coalesce(claim_display_name, '')));
  claims := jsonb_set(claims, '{account_role}', to_jsonb(claim_role::text));
  claims := jsonb_set(claims, '{account_status}', to_jsonb(claim_status::text));
  claims := jsonb_set(claims, '{plan_tier}', to_jsonb(claim_plan::text));
  claims := jsonb_set(claims, '{trial_ends_at}', coalesce(to_jsonb(claim_trial_ends_at), 'null'::jsonb));
  return jsonb_build_object('claims', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select (user_id, username, display_name, account_role, account_status, plan_tier, trial_ends_at)
  on public.profiles to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;

create policy profiles_auth_hook_read
on public.profiles for select
to supabase_auth_admin
using (true);

create or replace function public.has_product_access()
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when (select auth.jwt() ->> 'account_status') = 'active' then true
    when (select auth.jwt() ->> 'account_status') = 'trialing'
      then coalesce(((select auth.jwt() ->> 'trial_ends_at')::timestamptz > now()), false)
    else false
  end;
$$;

revoke execute on function public.has_product_access() from public, anon;
grant execute on function public.has_product_access() to authenticated;
