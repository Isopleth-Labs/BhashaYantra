# Database and RLS

## Core ownership

- `profiles`: username, display name, Student/Institute role, plan and trial status.
- `student_profiles`: candidate targets and optional institute link.
- `institutions` and `institution_members`: owner-managed workspaces and roster membership.
- `user_preferences`, `custom_shortcuts`, `conversion_jobs`, `practice_attempts`, `steno_sessions` and dictionary entries: user-owned records.
- `keyboard_layouts` and `practice_tests`: system-readable content plus owner-scoped custom content.

Every user-owned table has Row Level Security. `auth.uid()` scopes normal ownership; institute helpers permit only verified membership or owner reporting. The Auth hook has a dedicated read policy and restricted column grant.

Sensitive `profiles` fields are server-managed. Authenticated users may update only `display_name` and `preferred_language`; they cannot promote themselves, extend trials or activate plans.

## Migration workflow

```powershell
npm run db:reset
npm run db:test
npx supabase db lint --local
npm run db:push
```

Run pgTAP policies after every ownership or authorization change. Never use the service-role key in the desktop app; it bypasses RLS.
