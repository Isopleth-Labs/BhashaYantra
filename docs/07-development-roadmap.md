# Development Roadmap

## Delivery principle

Build the smallest vertical slice that proves the architecture, then add features behind tested domain interfaces. Do not begin cloud synchronization before local conversion and typing behavior are stable.

## Phase 0 — Documentation and design

Deliverables:

- Final UI reference image.
- README and download/run contract.
- Product specification.
- Architecture and security boundary.
- Database ERD and RLS plan.
- Repository and business-logic contracts.
- Frontend design system.

Exit gate: product owner and technical lead approve these documents.

## Phase 1 — Project foundation

Deliverables:

- Tauri 2 + React + TypeScript scaffold.
- Tailwind CSS and shadcn/ui initialized.
- Folder boundaries from the architecture document.
- Formatting, linting, type-checking, and basic test command.
- Light-theme tokens and application shell.
- Tauri capability baseline.

Exit gate: `npm run tauri dev` opens the shell and automated checks pass.

## Phase 2 — Exchange Converter vertical slice

Deliverables:

- Final converter UI.
- Versioned KrutiDev 010 mapping fixture.
- Legacy-to-Unicode conversion engine.
- Unicode-to-legacy conversion engine with warnings.
- Copy, paste, clear, swap, open, and download actions.
- Representative conversion corpus and deterministic tests.

Exit gate: agreed fixtures pass in both directions, with lossy cases reported.

## Phase 3 — Keyboard modes and customization

Deliverables:

- Classic Hindi default profile.
- Simple Smart Mode processing.
- Advanced Classic Mode shortcut resolution.
- Character browser and shortcut manager.
- Clone-and-customize layout workflow.
- Import/export validation.

Exit gate: continuous typing has no visible lag and the keyboard corpus passes.

## Phase 4 — Practice and testing

Deliverables:

- Practice passage flow.
- Timer and keystroke capture.
- Versioned scoring profiles.
- WPM, KDPH, accuracy, and error reports.
- Local history and reports UI.

Exit gate: metrics match manually verified fixtures.

## Phase 5 — Stenography

Deliverables:

- Audio selection and playback.
- Dictation, reading, transcription, and evaluation phases.
- Profile-controlled pause/seek behavior.
- Unicode-aware error report.

Exit gate: state transitions and timing remain correct during pause, resume, timeout, and app focus changes.

## Phase 6 — Supabase and Drizzle integration

Deliverables:

- Drizzle schema and generated Supabase migrations.
- Local Supabase environment and seed data.
- RLS policies and pgTAP ownership tests.
- Optional authentication.
- Repository implementations for settings, layouts, and result history.
- Offline-first reconciliation rules.

Exit gate: owner/non-owner security tests pass and no secret exists in the desktop bundle.

## Phase 7 — Document conversion and packaging

Deliverables:

- Safe native file commands.
- Initial supported document formats.
- Atomic output writing and conversion reports.
- Windows installer build.
- Version metadata, icons, signing plan, and release notes.
- Download links inserted into README.

Exit gate: clean Windows machine installation, run, update/uninstall, and source-file preservation tests pass.

## Definition of done for every feature

- Acceptance criteria are linked to implementation.
- Domain behavior has deterministic tests.
- UI covers loading, empty, success, warning, and error states.
- Keyboard navigation and focus are verified.
- Hindi glyph rendering is visually checked.
- New persistence follows repository boundaries and RLS rules.
- No privileged credential is added to frontend configuration.
- Relevant documentation is updated.

## First implementation ticket

Create the Tauri + React + TypeScript scaffold, install the approved styling stack, reproduce the three-column application shell from the final reference, and leave feature panels backed by typed placeholder use cases. Do not connect Supabase or implement conversion rules in this first ticket.
