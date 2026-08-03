# Repository Pattern

## 1. Purpose

Repositories isolate the application and domain layers from Supabase, local storage, and Tauri implementation details. They express business-oriented operations rather than raw tables or generic CRUD.

## 2. Dependency direction

```text
React components
      ↓
Application use cases
      ↓
Repository interfaces (ports)
      ↑
Supabase/local implementations (adapters)
```

Domain and application code may import repository interfaces. Repository implementations may import Supabase and database row types. The reverse is not allowed.

## 3. Initial repositories

| Repository | Main operations |
|---|---|
| `UserPreferencesRepository` | load, save, observe sync state |
| `KeyboardLayoutRepository` | list available layouts, get layout, clone system layout, save user layout, delete user layout |
| `ShortcutRepository` | list, add, update, remove, detect conflicts |
| `ConversionHistoryRepository` | save optional job metadata, list recent jobs, delete history |
| `PracticeRepository` | list tests, save completed attempt, list attempts, summarize progress |
| `TrainingAttemptsRepository` | list offline attempts, save one completed attempt, clear all or filter history by layout and practice/test kind |
| `StenographyRepository` | save completed session, list sessions, summarize progress |
| `UserDictionaryRepository` | find suggestions, upsert entry, increment usage, disable entry |

## 4. Interface example

```ts
export interface KeyboardLayoutRepository {
  listAvailable(userId?: string): Promise<KeyboardLayoutSummary[]>;
  getById(id: LayoutId): Promise<KeyboardLayout | null>;
  cloneSystemLayout(input: CloneLayoutInput): Promise<KeyboardLayout>;
  saveOwnedLayout(layout: KeyboardLayout): Promise<void>;
  deleteOwnedLayout(id: LayoutId): Promise<void>;
}
```

Interfaces return domain models. Supabase row shapes, query builders, and storage paths do not cross this boundary.

## 5. Implementations

### Supabase repositories

- Use `@supabase/supabase-js` with the current authenticated session.
- Depend on RLS rather than manually trusting a supplied user ID.
- Select explicit columns instead of `select('*')` in stable paths.
- Convert database `snake_case` rows to domain naming in mappers.
- Translate Supabase errors into the application error taxonomy.

### Local repositories

- Store only data needed for offline behavior.
- Use versioned serialization.
- Validate all imported/cached records before returning domain models.
- Never store a Supabase service-role key or direct database credentials.
- `LocalTrainingAttemptsRepository` stores at most the 500 newest validated attempts under `bhashayantra:training-attempts:v1` and broadcasts a local update event for live dashboard summaries.

### Composite repositories

A composite implementation may coordinate local-first reads and optional cloud sync:

1. Read locally for fast startup.
2. Return cached value with freshness metadata.
3. Refresh from Supabase when authenticated and online.
4. Resolve changes using explicit per-entity rules.
5. Write the resolved version locally.

## 6. Planned folders

```text
src/
├── application/
│   └── ports/
│       ├── user-preferences-repository.ts
│       ├── keyboard-layout-repository.ts
│       ├── shortcut-repository.ts
│       ├── conversion-history-repository.ts
│       ├── practice-repository.ts
│       ├── training-attempts-repository.ts
│       └── stenography-repository.ts
└── data/
    ├── repositories/
    │   ├── supabase-user-preferences-repository.ts
    │   ├── local-training-attempts-repository.ts
    │   ├── supabase-keyboard-layout-repository.ts
    │   └── composite-keyboard-layout-repository.ts
    ├── mappers/
    ├── supabase/
    │   ├── client.ts
    │   └── database.types.ts
    └── local/
        ├── local-settings-store.ts
        └── schema-version.ts
```

## 7. Error taxonomy

```ts
export type RepositoryError =
  | { kind: "not-found"; resource: string }
  | { kind: "not-authorized" }
  | { kind: "conflict"; message: string }
  | { kind: "validation"; issues: readonly string[] }
  | { kind: "offline" }
  | { kind: "unavailable"; retryable: boolean }
  | { kind: "unknown"; cause?: unknown };
```

UI code receives application-friendly failures and decides how to display them. It does not parse Supabase error strings.

## 8. Transaction and consistency rules

- Saving a layout and its mappings is one logical operation.
- Conflict checking occurs before persistence and is enforced again with database constraints.
- Completed test results are inserted once and not partially updated.
- Cloud file metadata is created only after a successful explicit upload.
- Multi-step privileged operations belong in a trusted database function or backend boundary.

## 9. Repository tests

Every implementation must pass the same contract test suite:

- Owner can read and write owned data.
- Non-owner cannot read or mutate it.
- System layout is readable but not user-editable.
- Clone produces an independent user-owned layout.
- Duplicate mapping/shortcut returns a conflict.
- Offline implementation returns predictable offline behavior.
- Mappers reject invalid enum values and malformed JSON.
