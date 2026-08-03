# System Architecture

## 1. Architecture goals

- Keep typing and conversion responsive and usable offline.
- Separate UI, business rules, data access, and native capabilities.
- Make conversion and scoring deterministic and testable.
- Use Supabase safely without embedding privileged credentials.
- Allow future language packs without rewriting the application.

## 2. High-level architecture

```mermaid
flowchart TB
    U["User"] --> UI["React + TypeScript UI"]
    UI --> APP["Application use cases"]
    APP --> DOMAIN["Domain engines and rules"]
    APP --> REPO["Repository interfaces"]
    APP --> NATIVE["Tauri command interfaces"]
    REPO --> LOCAL["Local settings/cache adapter"]
    REPO --> SB["Supabase client adapter"]
    NATIVE --> RUST["Tauri/Rust native layer"]
    RUST --> FS["Windows file system and dialogs"]
    SB --> AUTH["Supabase Auth"]
    SB --> PG["Supabase PostgreSQL + RLS"]
    SB --> STORAGE["Supabase Storage — opt-in only"]
    DRIZZLE["Drizzle schema"] --> MIGRATIONS["Supabase SQL migrations"]
    MIGRATIONS --> PG
```

## 3. Layer responsibilities

### Presentation layer

Technology: React, TypeScript, Tailwind CSS, shadcn/ui.

- Renders screens and components.
- Collects user input and displays state.
- Contains no Supabase queries, font-conversion algorithms, or scoring formulas.
- Calls typed application use cases.

### Application layer

- Coordinates workflows such as convert text, save layout, and finish test.
- Applies authorization and orchestration rules.
- Uses repository and native-command interfaces.
- Converts infrastructure errors into application errors.

### Domain layer

- Legacy/Unicode mapping rules.
- Unicode composition and normalization.
- Keyboard mapping and shortcut resolution.
- Typing-test scoring.
- Stenography session rules.
- Contains pure TypeScript wherever possible and does not depend on React or Supabase.

### Repository layer

- Defines domain-focused persistence interfaces.
- Supabase implementations translate between database rows and domain models.
- Local implementations support offline settings and cached data.
- React components never import a concrete repository.

### Native layer

Technology: Tauri 2 and its Rust project under `src-tauri/`.

- Native open/save dialogs.
- Safe file reads and atomic writes.
- Document parsing/conversion capabilities that require native access.
- OS integration and packaging.
- Exposes a small allowlisted command surface to the webview.

### Cloud and database layer

- Supabase Auth identifies users.
- PostgreSQL stores user-owned metadata, settings, layouts, and result history.
- Row Level Security enforces ownership.
- Storage is used only for explicitly uploaded content.
- Drizzle defines the application schema and generates reviewed SQL migrations.

## 4. Security boundary

The Tauri application is distributed to end users and must be treated as an untrusted client.

- Allowed in desktop bundle: Supabase URL and publishable key.
- Forbidden in desktop bundle: service-role key, direct database password, `DATABASE_URL`, signing secrets.
- User data access must succeed only through authenticated Supabase requests covered by RLS.
- Privileged administration belongs in a trusted backend or Supabase-managed function, not in React.

## 5. Planned repository structure

```text
BhashaYantra/
├── README.md
├── docs/
├── package.json
├── vite.config.ts
├── drizzle.config.ts
├── src/
│   ├── app/
│   │   ├── providers/
│   │   ├── routes/
│   │   └── shell/
│   ├── features/
│   │   ├── converter/
│   │   ├── typing/
│   │   ├── practice/
│   │   ├── tests/
│   │   ├── stenography/
│   │   ├── shortcuts/
│   │   └── settings/
│   ├── domain/
│   │   ├── conversion/
│   │   ├── keyboard/
│   │   ├── scoring/
│   │   └── stenography/
│   ├── application/
│   │   ├── ports/
│   │   └── use-cases/
│   ├── data/
│   │   ├── repositories/
│   │   ├── supabase/
│   │   └── local/
│   ├── db/
│   │   └── schema/
│   ├── components/
│   │   └── ui/
│   ├── styles/
│   └── shared/
├── src-tauri/
│   ├── capabilities/
│   └── src/
│       ├── commands/
│       └── services/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
└── tests/
```

## 6. Primary data flows

### Text conversion

```mermaid
sequenceDiagram
    actor User
    participant UI as Converter UI
    participant UC as ConvertText use case
    participant Engine as Conversion engine
    participant Repo as History repository
    User->>UI: Enter text and select direction
    UI->>UC: ConvertTextRequest
    UC->>Engine: validate and convert
    Engine-->>UC: output plus warnings
    UC-->>UI: ConversionResult
    opt User enabled history
        UC->>Repo: save metadata/result
    end
```

### Document conversion

```mermaid
sequenceDiagram
    actor User
    participant UI as Document UI
    participant UC as ConvertDocument use case
    participant Tauri as Tauri command
    participant FS as File system
    User->>UI: Select source file
    UI->>UC: request conversion
    UC->>Tauri: read and convert safely
    Tauri->>FS: read source
    Tauri->>FS: write new output atomically
    Tauri-->>UC: report and output path
    UC-->>UI: show success/warnings
```

## 7. Local-first behavior

- Conversion rules and keyboard profiles ship with the application.
- Anonymous users can type, convert text, and run basic practice offline.
- Local settings are authoritative while offline.
- Cloud sync is optional and reconciles only syncable records.
- Source documents do not enter the sync queue.

## 8. Migration ownership

Drizzle and Supabase have separate, explicit roles:

1. Drizzle schema files define tables and relations in TypeScript.
2. Drizzle Kit generates SQL using Supabase-compatible timestamp prefixes.
3. Generated SQL is stored under `supabase/migrations/` and reviewed.
4. Supabase CLI applies and verifies migrations locally and remotely.
5. Only one migration history workflow is used in production to avoid split ownership.

## 9. Architecture decisions

| Decision | Reason |
|---|---|
| Tauri rather than a browser-only app | Native Windows packaging and controlled file access |
| React SPA inside Tauri | Tauri recommends static SPA-style frontends and the approved stack uses React |
| Domain logic independent of React | Deterministic tests and reuse across UI/native workflows |
| Supabase client behind repositories | Prevent infrastructure details from spreading into UI and business logic |
| Drizzle for schema, Supabase CLI for applying migrations | Typed schema with one reviewed deployment path |
| RLS on all user-owned tables | Desktop clients cannot protect server data by hiding credentials |
| Local conversion by default | Privacy, speed, and offline operation |

## 10. Official references

- [Tauri project structure](https://v2.tauri.app/start/project-structure/)
- [Tauri frontend configuration](https://v2.tauri.app/start/frontend/)
- [Tauri architecture](https://v2.tauri.app/concept/architecture/)
- [Drizzle schema](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Supabase local workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
