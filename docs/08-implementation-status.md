# Implementation Status

Updated: 3 August 2026

## Completed

- React + TypeScript + Vite application foundation.
- Tauri 2 Rust project, desktop window configuration, and scoped capabilities.
- Tailwind CSS v4 and shadcn-compatible project-owned UI primitives.
- Final three-column BhashaYantra dashboard matching the approved reference.
- Light and dark semantic theme tokens.
- Simple Smart / Advanced Classic mode interaction.
- Original BhashaYantra Smart Roman-phonetic engine with live Unicode and KrutiDev output.
- Distinct interface-language, typing-language, keyboard-layout, output-encoding, and Unicode display-font selectors.
- Ready BhashaYantra Smart, Classic Hindi/KrutiDev, Devanagari INSCRIPT, and English QWERTY profiles with independently persisted drafts.
- Remington Gail/CBI and DevLys/Shree-Lipi catalog entries are explicitly validation-pending and cannot be selected as working engines.
- Hindi-first UI localization with a persistent Hindi/English interface selector.
- Complete in-app Start Typing workspace with familiar-key input and live Unicode/Legacy output switching.
- Automatic matra, reph, conjunct, and normalization behavior shared with the tested conversion engine.
- Clickable Smart, Classic Hindi, INSCRIPT, and English QWERTY keyboards with normal/Shift layers and a five-group Hindi character palette.
- Searchable complete character and shortcut dialogs with direct insertion into the typing pad.
- Built-in expert shortcuts, custom shortcut conflict validation, and a working Advanced-mode manager with layout-scoped physical-key overrides.
- Offline draft/preferences/custom-layout persistence plus import, export, protected-default reset, copy, open, and save flows.
- Live typing metrics for words, characters, lines, and estimated WPM.
- Original 1,200-exercise professional curriculum across the four ready layouts: 60 progressive key drills, 90 distinct-word drills, 90 sustained sentence drills, and 60 two-paragraph drills per layout.
- Academy-style staged practice with a course map, sequential lesson locks, phase/module position, multi-block drills, one-to-three clean-pass mastery requirements, named objectives, recommended WPM, Free/Pro labels, next-key/finger guidance, clickable keyboard, error sound, text size, and backspace controls.
- Twelve mock-test profiles: two flexible baselines and ten official-reference profiles covering SSC CHSL/D.E.S.T., MP CPCT, Rajasthan High Court, and Allahabad High Court, with 60 selectable papers per layout and cited official sources.
- Working exam controls for 1/5/10/15-minute timers, speed/accuracy targets, full/current-word/disabled backspace, word/error/letter highlighting, scrollbar and auto-scroll, 150–1,200 word limits, paragraphs, tabs, corrections, custom Unicode passages, font sizing, and printing.
- Live correct/gross/net WPM, KDPH, accuracy, missing/extra/substituted counts, weak-key analysis, completion state, and once-only attempt saving.
- Verified official duration/correction locking and a layout/font environment guard for profiles with an explicit requirement.
- Versioned local attempt repository, layout-specific history deletion, real dashboard summaries, and recent-speed trend.
- Live bidirectional KrutiDev 010 ↔ Unicode text converter.
- Converter profile selector with KrutiDev ready and DevLys/Shree-Lipi visibly blocked until validation, plus selectable Noto/Mangal/Nirmala Unicode preview fonts.
- Longest-token mapping, short-i handling, Unicode normalization, and warnings.
- Text open, paste, clear, copy, and save/download actions with browser fallback.
- Character browser, complete-library modal, and shortcut search/manager interactions.
- Drizzle schema for profiles, preferences, layouts, mappings, shortcuts, history, practice, stenography, and dictionary data.
- Supabase schema migrations, Auth ownership foreign keys, RLS policies, triggers, constraints, seed data, and pgTAP policy tests.
- Local and Supabase preference repository implementations.
- Free/Pro/Institution product-entitlement vocabulary and profitability-focused packaging documentation.
- Strict TypeScript, forty-two converter/typing/training/repository/licensing tests, production web build, and browser visual/interaction QA.
- Local Supabase reset, eight pgTAP/RLS tests, and schema linting.
- Rust formatting and Clippy checks.
- Local development desktop executable, MSI installer, and NSIS setup executable.

## Current verification commands

```powershell
npm run typecheck
npm run test
npm run build
npm run tauri build -- --debug --no-bundle
npm run db:reset
npm run db:test
npx supabase db lint --local
cargo clippy --manifest-path .\src-tauri\Cargo.toml -- -D warnings
```

## Partially implemented

| Area | Current state | Next implementation |
|---|---|---|
| KrutiDev profile | Common alphabet, matras, conjuncts, digits, and acceptance fixtures | Validate/expand against a licensed full test corpus |
| Document converter | Drop-zone UI and text-file flow | RTF/DOC/DOCX parsing with structure-preserving native conversion |
| Keyboard modes | Own Smart phonetic, Classic familiar-key, initial INSCRIPT, and English QWERTY inputs; per-layout drafts, keyboards, and custom layers | Expand INSCRIPT acceptance fixtures, validate licensed Remington Gail/CBI fixtures, then optional Windows IME integration |
| Legacy encoding profiles | KrutiDev 010 working; DevLys and Shree-Lipi registered as validation-pending | Add licensed fixtures and round-trip acceptance corpora before enabling each profile |
| Shortcut manager | Built-in shortcuts, custom creation/deletion, conflict validation, persistence, import/export, and reset | Editing existing custom entries in place and cloud sync |
| Typing practice/test | 1,200 professional exercises with multi-block mastery gates and depth/uniqueness checks; focused mock workstation; 60 papers/layout; 12 profiles including 10 official-reference profiles; locked rules; WPM/NWPM/KDPH scoring; weak-key analysis; local history | Independently validate remaining recruitment-specific deduction rules, then add adaptive lessons and exportable reports |
| Stenography | Navigation and schema | Audio state machine, transcript editor, evaluation |
| Supabase | Schema, repositories, local configuration | Auth UI and opt-in sync wiring |

## Not yet release-ready

- Complete production KrutiDev mapping validation.
- Full legacy document-family support.
- Windows code signing and installer publication.
- Privacy policy, terms, and final license.
- Production Supabase project and environment values.
- End-to-end automated desktop tests.

The application should be described as an implemented MVP foundation, not as a finished public release, until these release gates are complete.
