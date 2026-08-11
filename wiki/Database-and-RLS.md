# Database and RLS

## Core ownership

- `profiles`: username, display name, Student/Institute role, plan, trial status, and server-managed device allowance.
- `registered_devices`: privacy-safe installation digests, timestamps, labels, and revocation state.
- `student_profiles`: candidate targets and optional institute link.
- `institutions` and `institution_members`: owner-managed workspaces and roster membership.
- `user_preferences`, `custom_shortcuts`, `conversion_jobs`, `practice_attempts`, `steno_sessions` and dictionary entries: user-owned records.
- `keyboard_layouts` and `practice_tests`: system-readable content plus owner-scoped custom content.

Every user-owned table has Row Level Security. `auth.uid()` scopes normal ownership; institute helpers permit only verified membership or owner reporting. The Auth hook has a dedicated read policy and restricted column grant.

Sensitive `profiles` fields are server-managed. Authenticated users may update only `display_name` and `preferred_language`; they cannot promote themselves, extend trials or activate plans.

Users can read only their own registered devices. Direct client inserts, updates, and deletes are revoked. The security-definer `register_current_device` function serializes registrations under the profile row lock so concurrent launches cannot exceed the limit.

Trigger and RLS helper functions live in a non-exposed `private` schema. The authenticated device RPC remains public by design, validates `auth.uid()`, and is the only client-callable security-definer function required by the desktop licensing flow.

## Migration workflow

```powershell
npm run db:reset
npm run db:test
npx supabase db lint --local
npm run db:push
```

Run pgTAP policies after every ownership or authorization change. Never use the service-role key in the desktop app; it bypasses RLS.
