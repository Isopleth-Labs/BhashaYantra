begin;
select plan(8);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'keyboard_layouts', 'keyboard layouts table exists');
select has_table('public', 'conversion_jobs', 'conversion jobs table exists');
select has_table('public', 'practice_attempts', 'practice attempts table exists');

select policies_are(
  'public',
  'profiles',
  array['profiles_select_own', 'profiles_update_own'],
  'profiles exposes only owner policies'
);

select policies_are(
  'public',
  'keyboard_layouts',
  array[
    'layouts_delete_own',
    'layouts_insert_own',
    'layouts_select_system_or_own',
    'layouts_update_own'
  ],
  'keyboard layouts has system-read and owner-write policies'
);

select policies_are(
  'public',
  'conversion_jobs',
  array['conversion_jobs_manage_own'],
  'conversion history is owner-scoped'
);

select policies_are(
  'public',
  'user_dictionary_entries',
  array['dictionary_manage_own'],
  'dictionary entries are owner-scoped'
);

select * from finish();
rollback;
