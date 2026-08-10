# Database ERD

## 1. Database scope

Supabase PostgreSQL stores account-linked settings, layouts, shortcuts, conversion metadata, practice results, and stenography results. Core mapping tables can also ship locally with the application so offline typing does not depend on the database.

Supabase owns `auth.users`. Application tables reference its UUID but do not duplicate authentication credentials.

The new-user trigger accepts `account_role` only as `student` or `institute`, stores the normalized role in `profiles`, and creates `student_profiles` only for Student registrations. React never decides institute authority: ownership and active membership remain enforced by RLS.

## 2. Entity relationship diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : has
    AUTH_USERS ||--|| USER_PREFERENCES : configures
    AUTH_USERS ||--o{ KEYBOARD_LAYOUTS : owns
    KEYBOARD_LAYOUTS ||--o{ KEY_MAPPINGS : contains
    AUTH_USERS ||--o{ CUSTOM_SHORTCUTS : creates
    KEYBOARD_LAYOUTS ||--o{ CUSTOM_SHORTCUTS : scopes
    AUTH_USERS ||--o{ CONVERSION_JOBS : runs
    AUTH_USERS ||--o{ PRACTICE_ATTEMPTS : completes
    PRACTICE_TESTS ||--o{ PRACTICE_ATTEMPTS : measures
    AUTH_USERS ||--o{ STENO_SESSIONS : completes
    AUTH_USERS ||--o{ USER_DICTIONARY_ENTRIES : stores

    AUTH_USERS {
      uuid id PK
      text email
    }
    PROFILES {
      uuid user_id PK_FK
      text display_name
      text preferred_language
      timestamptz created_at
      timestamptz updated_at
    }
    USER_PREFERENCES {
      uuid user_id PK_FK
      text typing_mode
      uuid active_layout_id FK
      text output_mode
      text theme
      numeric font_scale
      boolean suggestions_enabled
      boolean autocorrect_enabled
      timestamptz updated_at
    }
    KEYBOARD_LAYOUTS {
      uuid id PK
      uuid owner_user_id FK
      text name
      text language_code
      text layout_kind
      boolean is_system
      boolean is_read_only
      integer version
      timestamptz updated_at
    }
    KEY_MAPPINGS {
      uuid id PK
      uuid layout_id FK
      text physical_key
      text modifier_signature
      text output_sequence
      integer priority
    }
    CUSTOM_SHORTCUTS {
      uuid id PK
      uuid user_id FK
      uuid layout_id FK
      text shortcut_signature
      text output_sequence
      boolean enabled
    }
    CONVERSION_JOBS {
      uuid id PK
      uuid user_id FK
      text source_format
      text target_format
      text input_kind
      text status
      integer input_characters
      integer output_characters
      jsonb warnings
      text storage_path
      timestamptz created_at
    }
    PRACTICE_TESTS {
      uuid id PK
      text name
      text language_code
      text passage
      integer duration_seconds
      jsonb scoring_profile
      boolean is_system
    }
    PRACTICE_ATTEMPTS {
      uuid id PK
      uuid user_id FK
      uuid test_id FK
      integer duration_ms
      integer gross_keystrokes
      integer correct_keystrokes
      integer error_count
      numeric gross_wpm
      numeric net_wpm
      numeric accuracy
      integer kdph
      jsonb error_breakdown
      timestamptz completed_at
    }
    STENO_SESSIONS {
      uuid id PK
      uuid user_id FK
      text audio_reference
      integer dictation_wpm
      integer transcription_duration_ms
      numeric accuracy
      jsonb error_breakdown
      timestamptz completed_at
    }
    USER_DICTIONARY_ENTRIES {
      uuid id PK
      uuid user_id FK
      text language_code
      text source_sequence
      text output_text
      integer usage_count
      boolean enabled
    }
```

## 3. Table rules

### `profiles`

- One row per authenticated user.
- Created after user signup.
- Stores non-secret profile information only.

### `user_preferences`

- One row per authenticated user.
- `active_layout_id` must reference a system layout or a layout owned by the same user.
- Enum-like values are validated by database checks and domain types.

### `keyboard_layouts`

- `owner_user_id` is null for built-in system layouts.
- System layouts are read-only through user-facing APIs.
- A customization starts by cloning a system layout into a user-owned layout.
- `version` supports safe import/export and future migrations.

### `key_mappings`

- Unique key: `(layout_id, physical_key, modifier_signature)`.
- `output_sequence` stores Unicode text, not rendered glyph images.
- Duplicate or conflicting mappings are rejected.

### `custom_shortcuts`

- Unique key: `(user_id, layout_id, shortcut_signature)`.
- Shortcut signatures use a canonical order such as `CTRL+ALT+K`.

### `conversion_jobs`

- Stores metadata and optional history, not source-document content by default.
- `storage_path` is null unless the user explicitly uploads/saves a cloud file.
- Warnings are structured JSON for unsupported or ambiguous characters.

### `practice_attempts` and `steno_sessions`

- Completed results are append-only from the normal user flow.
- Raw scoring inputs are stored so metrics can be audited.
- `error_breakdown` records the scoring profile version.
- Anonymous practice attempts currently use the versioned local `TrainingAttempt` record and are never uploaded automatically.
- Future authenticated sync maps local attempt IDs to `practice_attempts`; reconciliation is idempotent by attempt ID and never replaces a newer completed result.

## 4. Row Level Security matrix

| Table | Read policy | Insert policy | Update policy | Delete policy |
|---|---|---|---|---|
| profiles | `user_id = auth.uid()` | own row | own row | own row/account deletion |
| user_preferences | own row | own row | own row | own row |
| keyboard_layouts | system rows or own rows | own rows | own non-system rows | own non-system rows |
| key_mappings | mappings for readable layout | through owned layout workflow | mappings for owned layout | mappings for owned layout |
| custom_shortcuts | own rows | own rows | own rows | own rows |
| conversion_jobs | own rows | own rows | limited status fields for own rows | own rows |
| practice_tests | published system rows plus permitted custom rows | privileged/custom flow | privileged/custom flow | privileged/custom flow |
| practice_attempts | own rows | own rows | normally none after completion | own rows if history deletion is allowed |
| steno_sessions | own rows | own rows | normally none after completion | own rows |
| user_dictionary_entries | own rows | own rows | own rows | own rows |

RLS policies must be tested under anonymous, authenticated owner, authenticated non-owner, and privileged migration/test roles.

## 5. Indexes and constraints

- Index every ownership foreign key used by RLS.
- Index `practice_attempts(user_id, completed_at desc)`.
- Index `steno_sessions(user_id, completed_at desc)`.
- Index `conversion_jobs(user_id, created_at desc)`.
- Unique index on each canonical layout mapping and shortcut signature.
- Check constraints for supported modes, statuses, non-negative counters, and percentage ranges.
- Use `timestamptz` and database-generated timestamps.

## 6. Migration workflow

```text
Edit Drizzle TypeScript schema
        ↓
Generate timestamped SQL migration
        ↓
Review SQL and RLS policies
        ↓
Run Supabase local database reset
        ↓
Run database tests
        ↓
Push reviewed migrations to remote environment
```

Recommended scripts after scaffolding:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:reset": "supabase db reset",
  "db:test": "supabase test db",
  "db:push": "supabase db push"
}
```

Use the Supabase timestamp migration prefix in `drizzle.config.ts` and output migrations to `./supabase/migrations`.

## 7. Data retention

- Local conversion text: not persisted unless the user saves it.
- Cloud conversion metadata: user-configurable and deletable.
- Source documents: local by default.
- Test results: retained until user deletion or policy-defined archival.
- Account deletion: delete or anonymize application-owned rows according to the final privacy policy.
