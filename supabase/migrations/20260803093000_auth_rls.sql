-- Supabase Auth ownership, update triggers, and Row Level Security.

alter table public.profiles
  add constraint profiles_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_preferences
  add constraint user_preferences_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.keyboard_layouts
  add constraint keyboard_layouts_owner_auth_users_fk
  foreign key (owner_user_id) references auth.users(id) on delete cascade;

alter table public.custom_shortcuts
  add constraint custom_shortcuts_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.conversion_jobs
  add constraint conversion_jobs_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.practice_attempts
  add constraint practice_attempts_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.steno_sessions
  add constraint steno_sessions_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_dictionary_entries
  add constraint user_dictionary_entries_user_id_auth_users_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_preferences
  add constraint user_preferences_font_scale_check
  check (font_scale between 0.75 and 2.00);

alter table public.conversion_jobs
  add constraint conversion_jobs_character_counts_check
  check (input_characters >= 0 and output_characters >= 0);

alter table public.practice_tests
  add constraint practice_tests_duration_check
  check (duration_seconds > 0);

alter table public.practice_attempts
  add constraint practice_attempts_metrics_check
  check (
    duration_ms > 0
    and gross_keystrokes >= 0
    and correct_keystrokes >= 0
    and error_count >= 0
    and accuracy between 0 and 100
    and kdph >= 0
  );

alter table public.steno_sessions
  add constraint steno_sessions_metrics_check
  check (
    dictation_wpm > 0
    and transcription_duration_ms > 0
    and accuracy between 0 and 100
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger keyboard_layouts_set_updated_at
before update on public.keyboard_layouts
for each row execute function public.set_updated_at();

create trigger custom_shortcuts_set_updated_at
before update on public.custom_shortcuts
for each row execute function public.set_updated_at();

create trigger practice_tests_set_updated_at
before update on public.practice_tests
for each row execute function public.set_updated_at();

create trigger user_dictionary_entries_set_updated_at
before update on public.user_dictionary_entries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.keyboard_layouts enable row level security;
alter table public.key_mappings enable row level security;
alter table public.custom_shortcuts enable row level security;
alter table public.conversion_jobs enable row level security;
alter table public.practice_tests enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.steno_sessions enable row level security;
alter table public.user_dictionary_entries enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "preferences_select_own"
on public.user_preferences for select
using ((select auth.uid()) = user_id);

create policy "preferences_insert_own"
on public.user_preferences for insert
with check ((select auth.uid()) = user_id);

create policy "preferences_update_own"
on public.user_preferences for update
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    active_layout_id is null
    or exists (
      select 1
      from public.keyboard_layouts layout
      where layout.id = active_layout_id
        and (layout.is_system or layout.owner_user_id = (select auth.uid()))
    )
  )
);

create policy "layouts_select_system_or_own"
on public.keyboard_layouts for select
using (is_system or owner_user_id = (select auth.uid()));

create policy "layouts_insert_own"
on public.keyboard_layouts for insert
with check (owner_user_id = (select auth.uid()) and not is_system and not is_read_only);

create policy "layouts_update_own"
on public.keyboard_layouts for update
using (owner_user_id = (select auth.uid()) and not is_system and not is_read_only)
with check (owner_user_id = (select auth.uid()) and not is_system and not is_read_only);

create policy "layouts_delete_own"
on public.keyboard_layouts for delete
using (owner_user_id = (select auth.uid()) and not is_system and not is_read_only);

create policy "mappings_select_visible_layout"
on public.key_mappings for select
using (
  exists (
    select 1 from public.keyboard_layouts layout
    where layout.id = layout_id
      and (layout.is_system or layout.owner_user_id = (select auth.uid()))
  )
);

create policy "mappings_insert_owned_layout"
on public.key_mappings for insert
with check (
  exists (
    select 1 from public.keyboard_layouts layout
    where layout.id = layout_id
      and layout.owner_user_id = (select auth.uid())
      and not layout.is_system
      and not layout.is_read_only
  )
);

create policy "mappings_update_owned_layout"
on public.key_mappings for update
using (
  exists (
    select 1 from public.keyboard_layouts layout
    where layout.id = layout_id
      and layout.owner_user_id = (select auth.uid())
      and not layout.is_system
      and not layout.is_read_only
  )
)
with check (
  exists (
    select 1 from public.keyboard_layouts layout
    where layout.id = layout_id
      and layout.owner_user_id = (select auth.uid())
      and not layout.is_system
      and not layout.is_read_only
  )
);

create policy "mappings_delete_owned_layout"
on public.key_mappings for delete
using (
  exists (
    select 1 from public.keyboard_layouts layout
    where layout.id = layout_id
      and layout.owner_user_id = (select auth.uid())
      and not layout.is_system
      and not layout.is_read_only
  )
);

create policy "shortcuts_manage_own"
on public.custom_shortcuts for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "conversion_jobs_manage_own"
on public.conversion_jobs for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "practice_tests_read_system"
on public.practice_tests for select
using (is_system);

create policy "practice_attempts_select_own"
on public.practice_attempts for select
using ((select auth.uid()) = user_id);

create policy "practice_attempts_insert_own"
on public.practice_attempts for insert
with check ((select auth.uid()) = user_id);

create policy "practice_attempts_delete_own"
on public.practice_attempts for delete
using ((select auth.uid()) = user_id);

create policy "steno_sessions_select_own"
on public.steno_sessions for select
using ((select auth.uid()) = user_id);

create policy "steno_sessions_insert_own"
on public.steno_sessions for insert
with check ((select auth.uid()) = user_id);

create policy "steno_sessions_delete_own"
on public.steno_sessions for delete
using ((select auth.uid()) = user_id);

create policy "dictionary_manage_own"
on public.user_dictionary_entries for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
