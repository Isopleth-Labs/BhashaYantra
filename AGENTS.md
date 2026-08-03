# BhashaYantra agent instructions

## Product source of truth

- Read `README.md` and `docs/00-documentation-index.md` before large changes.
- Preserve `docs/assets/bhashayantra-final-reference.png` as the approved design source.
- Update `docs/08-implementation-status.md` when feature status changes materially.

## Approved stack

- React + TypeScript + Vite
- Tauri 2
- Tailwind CSS
- shadcn/ui-style project-owned components
- Drizzle ORM/Kit
- Supabase PostgreSQL, Auth, Storage, and RLS

Do not introduce another application framework or state-management framework without explicit approval. Small supporting dependencies are allowed when required by the approved stack.

## Architecture boundaries

- React components contain presentation and interaction state only.
- Deterministic conversion, keyboard, scoring, and stenography rules belong under `src/domain/`.
- Workflows belong under `src/application/use-cases/`.
- Application code depends on interfaces under `src/application/ports/`.
- Supabase and local persistence implementations belong under `src/data/`.
- Native file and OS capabilities belong under `src-tauri/` and must be narrowly allowlisted.
- Never put a service-role key or `DATABASE_URL` in a `VITE_` variable or desktop bundle.

## Database workflow

- Drizzle schema lives under `src/db/schema/`.
- Drizzle Kit generates reviewed SQL into `supabase/migrations/`.
- Supabase CLI applies migrations and runs pgTAP tests.
- Enable and test RLS for every user-owned table.
- Do not make production schema changes directly in the Supabase dashboard.

## Required verification

Run before handing off application changes:

```powershell
npm run typecheck
npm run test
npm run build
```

Run `npm run tauri build -- --debug --no-bundle` when native configuration or Tauri code changes.

For database changes, run local Supabase and then:

```powershell
npm run db:reset
npm run db:test
```

## UI rules

- Use semantic CSS variables from `src/styles/globals.css`; do not scatter raw feature colors.
- Keep Devanagari line height generous and do not apply letter spacing to Hindi text.
- Preserve keyboard navigation, accessible names, visible focus, and screen-reader status messages.
- The start screen center contains the Exchange Converter, not an on-screen keyboard or Typing Demo.
