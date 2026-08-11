-- Keep trigger and RLS helper functions out of the exposed public RPC schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, supabase_auth_admin;

alter function public.handle_new_user() set schema private;
alter function public.is_institution_owner(uuid) set schema private;
alter function public.is_active_institution_member(uuid, uuid) set schema private;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

revoke all on function private.is_institution_owner(uuid) from public, anon;
revoke all on function private.is_active_institution_member(uuid, uuid) from public, anon;
grant execute on function private.is_institution_owner(uuid) to authenticated;
grant execute on function private.is_active_institution_member(uuid, uuid) to authenticated;

-- The Auth hook stays public because Supabase Auth addresses it by schema/name,
-- but it is executable only by the Auth service and resolves no caller schemas.
alter function public.custom_access_token_hook(jsonb) set search_path = '';
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

-- Supabase's RLS event-trigger helper is not a client RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;

-- Recreate the affected policies with private helpers and one permissive policy
-- per operation. This avoids redundant policy evaluation on every row.
drop policy if exists institution_members_read_self_or_owner on public.institution_members;
drop policy if exists institution_members_manage_owner on public.institution_members;

create policy institution_members_select
on public.institution_members for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_institution_owner(institution_id)
);

create policy institution_members_insert_owner
on public.institution_members for insert to authenticated
with check (private.is_institution_owner(institution_id));

create policy institution_members_update_owner
on public.institution_members for update to authenticated
using (private.is_institution_owner(institution_id))
with check (private.is_institution_owner(institution_id));

create policy institution_members_delete_owner
on public.institution_members for delete to authenticated
using (private.is_institution_owner(institution_id));

drop policy if exists student_profiles_read_own_or_institute_owner on public.student_profiles;
drop policy if exists student_profiles_manage_own on public.student_profiles;

create policy student_profiles_select
on public.student_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    institution_id is not null
    and private.is_institution_owner(institution_id)
  )
);

create policy student_profiles_insert_own
on public.student_profiles for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    institution_id is null
    or private.is_active_institution_member(institution_id, (select auth.uid()))
  )
);

create policy student_profiles_update_own
on public.student_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    institution_id is null
    or private.is_active_institution_member(institution_id, (select auth.uid()))
  )
);

create policy student_profiles_delete_own
on public.student_profiles for delete to authenticated
using (user_id = (select auth.uid()));

create index if not exists custom_shortcuts_layout_idx
  on public.custom_shortcuts (layout_id);
create index if not exists practice_attempts_test_idx
  on public.practice_attempts (test_id);
create index if not exists student_profiles_institution_idx
  on public.student_profiles (institution_id);
create index if not exists user_preferences_active_layout_idx
  on public.user_preferences (active_layout_id);
