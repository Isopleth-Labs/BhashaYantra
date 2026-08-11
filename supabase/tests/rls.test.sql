begin;
select plan(20);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'keyboard_layouts', 'keyboard layouts table exists');
select has_table('public', 'conversion_jobs', 'conversion jobs table exists');
select has_table('public', 'practice_attempts', 'practice attempts table exists');
select has_table('public', 'institutions', 'institutions table exists');
select has_table('public', 'institution_members', 'institution members table exists');
select has_table('public', 'student_profiles', 'student profiles table exists');
select has_column('public', 'profiles', 'username', 'profiles include a unique login username');
select has_column('public', 'profiles', 'login_email', 'profiles include a server-managed username lookup address');
select has_column('public', 'profiles', 'account_status', 'profiles include server-managed account status');
select has_column('public', 'profiles', 'trial_ends_at', 'profiles include trial expiry');
select has_function('public', 'custom_access_token_hook', array['jsonb'], 'JWT custom-claims hook exists');
select has_function('public', 'has_product_access', array[]::text[], 'JWT entitlement helper exists');

select policies_are(
  'public',
  'profiles',
  array['profiles_auth_hook_read', 'profiles_select_own', 'profiles_update_own'],
  'profiles exposes owner policies plus the isolated Auth hook policy'
);

select policies_are(
  'public',
  'institutions',
  array['institutions_create_own', 'institutions_delete_owner', 'institutions_read_membership', 'institutions_update_owner'],
  'institutions are member-readable and owner-managed'
);

select policies_are(
  'public',
  'institution_members',
  array['institution_members_manage_owner', 'institution_members_read_self_or_owner'],
  'institution membership is owner managed'
);

select policies_are(
  'public',
  'student_profiles',
  array['student_profiles_manage_own', 'student_profiles_read_own_or_institute_owner'],
  'student profiles are private except verified institute reporting'
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
