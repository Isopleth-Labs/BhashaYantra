# Architecture

## Runtime boundaries

```text
React UI
  ├─ Domain engines: typing, conversion, scoring, curriculum
  ├─ Application workflows and repository ports
  ├─ Local persistence for offline drafts/preferences/results
  └─ Supabase client for authenticated cloud operations

Tauri/Rust
  ├─ Window lifecycle
  ├─ Narrow file-system commands
  ├─ Direct Typing bridge
  └─ Native stenography audio

Supabase
  ├─ Auth: email/password, refresh sessions, JWT issuance
  ├─ PostgreSQL: profiles, attempts, institutions and settings
  ├─ RLS: per-user and per-institution data isolation
  ├─ Edge Functions: username login and protected server workflows
  └─ Storage/Realtime: reserved for explicit cloud features
```

Deterministic typing, layout conversion and scoring stay local for speed and offline reliability. Identity, account activation, trial state, institution membership and server data are Supabase-owned.

## Repository rules

- Presentation state belongs in `src/features` and `src/components`.
- Deterministic rules belong in `src/domain`.
- Workflows and ports belong in `src/application`.
- Supabase/local adapters belong in `src/data`.
- Native capabilities belong in `src-tauri` and must be allowlisted.
- Schema changes are versioned in `supabase/migrations`; production is never edited ad hoc.

Detailed source documents remain versioned under `docs/` in the main repository.
