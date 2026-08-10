create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_role public.account_workspace_role;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'account_role' = 'institute' then 'institute'::public.account_workspace_role
    else 'student'::public.account_workspace_role
  end;

  insert into public.profiles (user_id, display_name, account_role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), requested_role);

  if requested_role = 'student' then
    insert into public.student_profiles (user_id) values (new.id);
  end if;

  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

