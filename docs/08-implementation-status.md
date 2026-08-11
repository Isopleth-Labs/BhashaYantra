# Implementation Status

Updated: 12 August 2026

## Completed

- React + TypeScript + Vite application foundation.
- Tauri 2 Rust project, desktop window configuration, and scoped capabilities.
- Tailwind CSS v4 and shadcn-compatible project-owned UI primitives.
- Final three-column BhashaYantra dashboard matching the approved reference.
- Light and dark semantic theme tokens.
- Simple Smart / Advanced Classic mode interaction.
- Original BhashaYantra Smart Roman-phonetic engine with live Unicode and KrutiDev output.
- Distinct interface-language, typing-language, keyboard-layout, output-encoding, and Unicode display-font selectors.
- Ready BhashaYantra Smart, KrutiDev 010 Keyboard (Classic), Devanagari INSCRIPT, Remington GAIL, Remington CBI, and English QWERTY profiles with independently persisted drafts.
- Remington GAIL/CBI include dedicated on-screen keyboards, before/after short-i behavior, Unicode conversion routes, acceptance fixtures, and complete course catalogs. DevLys/Shree-Lipi remain validation-pending legacy encodings.
- Hindi-first UI localization with a persistent Hindi/English interface selector.
- Complete in-app Start Typing workspace with familiar-key input and live Unicode/Legacy output switching.
- Explicit Windows Direct Typing switch with native per-keystroke composition, automatic minimize, layout/output profile updates, BhashaYantra-process exclusion, shortcut pass-through, focus reset, duplicate-input prevention, and `Ctrl + Alt + F12` emergency-off.
- Automatic matra, reph, conjunct, and normalization behavior shared with the tested conversion engine.
- Clickable Smart, Classic Hindi, INSCRIPT, and English QWERTY keyboards with normal/Shift layers and a five-group Hindi character palette.
- Searchable complete character and shortcut dialogs with direct insertion into the typing pad.
- Built-in expert shortcuts, custom shortcut conflict validation, and a working Advanced-mode manager with layout-scoped physical-key overrides.
- Offline draft/preferences/custom-layout persistence plus import, export, protected-default reset, copy, open, and save flows.
- Live typing metrics for words, characters, lines, and estimated WPM.
- Original 2,860-exercise professional curriculum: 470 exercises across each of the six ready layouts, plus 40 dedicated English QWERTY Number & Data Entry lessons covering number-row reach, dates, amounts, identifiers, ledgers, statistics, and structured records.
- Learn Keys keeps Hindi units separate through repetition, alternation, application, and checkpoint patterns. Practice Words contains 20 ordered alphabetic-control modules plus 30 professional vocabulary modules per layout with four distinct lessons per module, at least 28 distinct terms, and repeated recognition, accuracy, and sustained-copy rounds.
- Fixed-height practice/test shell prevents page-level focus jumps; source copy, answer editor, Unicode preview, and compact keyboard remain in the workstation with independent panel scrolling. A running test becomes a distraction-free full-viewport workstation, including at 1280×720.
- Academy-style staged practice with an immediately open lesson catalog, remembered per-layout lesson position, a detailed posture/home-row/finger-zone orientation, phase/module position, multi-block drills, optional one-to-three clean-pass mastery tracking, named objectives, recommended WPM, Free/Pro labels, next-key/finger guidance, clickable keyboard, error sound, text size, and backspace controls.
- Eighteen mock-test profiles: two flexible baselines and sixteen official-reference profiles covering SSC CHSL/D.E.S.T., RRB NTPC CBTST, DDA, DSSSB, MP CPCT, Rajasthan High Court, and Allahabad High Court, with 60 selectable papers per layout and cited official sources.
- Original English and Hindi government-office passage banks cover records, recruitment, railways, courts, audit, health, rural development, disaster response, education, environment, digital services, and election duty; no competitor passage text is shipped.
- Working exam controls for 1/5/10/15-minute timers, speed/accuracy targets, full/current-word/disabled backspace, word/error/letter highlighting, scrollbar and auto-scroll, 150–1,200 word limits, 200–50,000 keystroke limits, paragraphs, tabs, corrections, custom Unicode passages, font sizing, and printing.
- Live correct/gross/net WPM, KDPH, accuracy, missing/extra/substituted counts, weak-key analysis, completion state, RRB published-formula practice estimate, and once-only attempt saving.
- Verified official duration/correction locking and a layout/font environment guard for profiles with an explicit requirement.
- Versioned local attempt repository, layout-specific history deletion, real dashboard summaries, and recent-speed trend.
- Responsive Stenography Studio with fourteen original Hindi/English courtroom, office, SSC, and High Court profiles, matching-language voice detection, chunked web fallback, voice test, human-recording import/playback, strict exam phases, editable Listen & Type practice, word-aligned scoring, transcript WPM, detailed result card, and offline recent-attempt history.
- Non-blocking practice feedback: wrong keys advance, appear red in a live physical-key stream, and are retained in scoring; error sound is opt-in.
- Word & Excel Efficiency workspace with functional document-formatting and register-entry simulations, validation, accuracy, workflow, and speed results.
- Mock-test result report now separates keystroke, word, and error analysis, including aligned colour-coded copy and word-level correct/wrong/omitted/extra rows.
- Restrained product-owned startup animation followed by a polished mandatory Supabase Student/Institute entry gate, email-or-username login, verified signup, email-confirmation handling, mismatch sign-out, 14-day trial access, expired/suspended access handling, and no local authentication bypass.
- Supabase Custom Access Token hook with server-managed username, role, status, plan, trial, and device-limit claims; automatic access-token refresh; protected username-login and device-registration Edge Functions; explicit Bearer-token API adapter; and an authenticated no-profile-query account endpoint.
- Server-enforced one-device default: a SHA-256 digest of a random installation id is atomically registered, same-device launches remain valid, and a second device fails closed. No hardware fingerprint is collected; institute scaling uses server-managed seats and separate member accounts.
- Compact professional Settings control center with interface/theme controls, typing defaults, persisted training feedback preferences, offline/privacy status, safe backup/reset, in-app Privacy Policy, Terms & Conditions, Contact/Support, and About surfaces.
- Responsive BhashaYantra Pro pricing and order-preview surface with explicit one-device terms on ₹149, ₹349, and Individual Pro hypotheses plus managed institution seats; checkout is intentionally disabled and the development client cannot collect payment.
- Live bidirectional KrutiDev 010 ↔ Unicode text converter.
- Converter profile selector exposes verified KrutiDev conversion only; separate coverage cards explain that DevLys requires its own validated corpus and Shree-Lipi requires an exact family variant instead of pretending disabled entries are working support.
- Longest-token mapping, short-i handling, Unicode normalization, and warnings.
- Text open, paste, clear, copy, and save/download actions with browser fallback, plus real offline Word `.docx`, Excel `.xlsx`, browser `.html`, and plain-text exports from typing and conversion workspaces.
- Character browser, complete-library modal, and shortcut search/manager interactions.
- Drizzle schema for profiles, preferences, layouts, mappings, shortcuts, history, practice, stenography, and dictionary data.
- Supabase schema migrations, Auth ownership foreign keys, RLS policies, triggers, constraints, seed data, and pgTAP policy tests.
- Local and Supabase preference repository implementations.
- Free/Pro/Institution product-entitlement vocabulary and profitability-focused packaging documentation.
- Strict TypeScript, frontend domain/application tests, seven native Direct Typing composition/lifecycle tests, production web build, and browser visual/interaction QA including 1600×900, 900×780, and 700×780 layouts.
- Public-beta data manifest plus namespaced backup/transactional restore, synchronized prerelease version contract, production CSP, and a CI publication gate that refuses unsigned or updater-less releases.
- Repository and executable supply-chain hardening: pinned GitHub Actions commits, least-privilege tokens, CodeQL, npm/Rust dependency audits, Dependabot, secret-boundary checks, SHA-256 release checksums, GitHub build provenance, and an Authenticode signing step gated behind protected certificate secrets.
- Versioned beta Privacy, Terms, Support, Security, and source-available evaluation documents plus a production Supabase login activation runbook and a repository-synchronized GitHub Wiki documentation hub.
- Local Supabase reset, eight pgTAP/RLS tests, and schema linting.
- Rust formatting and Clippy checks.
- One local portable development executable; old debug/installer application builds are intentionally not retained.

## Current verification commands

```powershell
npm run typecheck
npm run test
npm run build
npm run beta:check
npx tauri build --no-bundle
npm run db:reset
npm run db:test
npx supabase db lint --local
cargo test --manifest-path .\src-tauri\Cargo.toml
cargo clippy --manifest-path .\src-tauri\Cargo.toml --all-targets -- -D warnings
```

## Partially implemented

| Area | Current state | Next implementation |
|---|---|---|
| KrutiDev profile | Common alphabet, matras, conjuncts, digits, and acceptance fixtures | Validate/expand against a licensed full test corpus |
| Document converter | Drop-zone UI and text-file flow | RTF/DOC/DOCX parsing with structure-preserving native conversion |
| Keyboard modes | Own Smart phonetic, Classic familiar-key, INSCRIPT, Remington GAIL, Remington CBI, and English QWERTY inputs; per-layout drafts, keyboards, round-trip fixtures, custom layers, and an opt-in low-level Direct Typing development bridge | Expand AltGr/escape-key acceptance corpora, then replace the development bridge with a signed TSF IME for public distribution |
| Legacy encoding profiles | KrutiDev 010 working; DevLys and Shree-Lipi registered as validation-pending | Add licensed fixtures and round-trip acceptance corpora before enabling each profile |
| Shortcut manager | Built-in shortcuts, custom creation/deletion, conflict validation, persistence, import/export, and reset | Editing existing custom entries in place and cloud sync |
| Typing practice/test | 2,860 professional exercises with alphabetic, numeric/data-entry, and domain progression, multi-round patterns, mastery gates, depth checks, a distraction-free fixed-height workstation, 60 original papers/layout, 18 profiles including 16 official-reference profiles, WPM/NWPM/KDPH/RRB practice scoring, weak-key analysis, and local history | Independently validate remaining recruitment-specific deduction rules, then add adaptive lessons and exportable reports |
| Stenography | Fourteen original audio profiles, native/browser narration, strict exam and Listen & Type workflows, deterministic evaluation, and history | Licensed publisher partnerships, more validated recruitment profiles, and exportable reports |
| Supabase | Schema, RLS, role-aware signup trigger, JWT claim hook, username/email sign-in, trial gate, protected Edge Functions, separate Student/Institute Auth UI, repositories, and local verification | Production project values, dashboard hook activation, SMTP/CAPTCHA, institute onboarding transactions, billing webhook, and opt-in result sync |

## Not yet release-ready

- Complete production KrutiDev mapping validation.
- Full legacy document-family support.
- Windows code signing and installer publication.
- Qualified legal review of the beta Privacy/Terms drafts and final commercial license/support jurisdiction.
- Production Supabase project and environment values.
- End-to-end automated desktop tests.

The application should be described as an implemented MVP foundation, not as a finished public release, until these release gates are complete.
