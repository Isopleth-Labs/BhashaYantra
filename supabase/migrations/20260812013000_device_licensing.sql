alter table public.profiles
  add column device_limit integer not null default 1,
  add constraint profiles_device_limit_check check (device_limit between 1 and 5000);

create table public.registered_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_hash text not null,
  device_label text not null default 'Windows device',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint registered_devices_hash_check check (device_hash ~ '^[a-f0-9]{64}$'),
  constraint registered_devices_label_check check (char_length(device_label) between 1 and 80),
  constraint registered_devices_user_hash_unique unique (user_id, device_hash)
);

create index registered_devices_user_active_idx
  on public.registered_devices (user_id, last_seen_at desc)
  where revoked_at is null;

alter table public.registered_devices enable row level security;
grant select on public.registered_devices to authenticated;
grant all on public.registered_devices to service_role;
revoke insert, update, delete on public.registered_devices from authenticated;

create policy registered_devices_read_own
on public.registered_devices for select
to authenticated
using ((select auth.uid()) = user_id);

-- Atomically registers the current installation. The client sends only a SHA-256
-- digest of a random installation id; no hardware serial or fingerprint is stored.
create or replace function public.register_current_device(
  p_device_hash text,
  p_device_label text default 'Windows device'
)
returns table (
  allowed boolean,
  active_devices integer,
  allowed_devices integer,
  new_registration boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_limit integer;
  current_count integer;
  existing_device_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_device_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid device identifier';
  end if;
  if char_length(trim(p_device_label)) not between 1 and 80 then
    raise exception 'Invalid device label';
  end if;

  select device_limit
  into current_limit
  from public.profiles
  where user_id = current_user_id
  for update;

  if current_limit is null then
    raise exception 'Account profile is unavailable';
  end if;

  select id
  into existing_device_id
  from public.registered_devices
  where user_id = current_user_id
    and device_hash = p_device_hash
    and revoked_at is null;

  if existing_device_id is not null then
    update public.registered_devices
    set last_seen_at = now(), device_label = trim(p_device_label)
    where id = existing_device_id;

    select count(*)::integer
    into current_count
    from public.registered_devices
    where user_id = current_user_id and revoked_at is null;

    return query select true, current_count, current_limit, false;
    return;
  end if;

  select count(*)::integer
  into current_count
  from public.registered_devices
  where user_id = current_user_id and revoked_at is null;

  if current_count >= current_limit then
    return query select false, current_count, current_limit, false;
    return;
  end if;

  insert into public.registered_devices (user_id, device_hash, device_label)
  values (current_user_id, p_device_hash, trim(p_device_label))
  on conflict (user_id, device_hash) do update
    set revoked_at = null,
        last_seen_at = now(),
        device_label = excluded.device_label;

  return query select true, current_count + 1, current_limit, true;
end;
$$;

revoke execute on function public.register_current_device(text, text) from public, anon;
grant execute on function public.register_current_device(text, text) to authenticated;

-- Refresh the access-token hook so device limits are server-issued JWT claims.
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
  claim_device_limit integer;
begin
  select username, display_name, account_role, account_status, plan_tier, trial_ends_at, device_limit
  into claim_username, claim_display_name, claim_role, claim_status, claim_plan, claim_trial_ends_at, claim_device_limit
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
  claims := jsonb_set(claims, '{device_limit}', to_jsonb(claim_device_limit));
  return jsonb_build_object('claims', claims);
end;
$$;

grant select (user_id, username, display_name, account_role, account_status, plan_tier, trial_ends_at, device_limit)
  on public.profiles to supabase_auth_admin;
