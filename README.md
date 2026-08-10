<p align="center">
  <img src="docs/assets/bhashayantra-app-icon.svg" alt="BhashaYantra logo" width="112" />
</p>

<h1 align="center">BhashaYantra</h1>

<p align="center"><strong>Smart Hindi typing, legacy-font conversion, practice, and exam preparation for Windows.</strong></p>

BhashaYantra is a Windows-first Hindi typing, legacy-font conversion, typing-practice, testing, and stenography desktop application.

> Project status: the React/Tauri foundation, six-layout typing engine, complete original practice catalog, configurable exam simulator, offline result history, multi-tool converter, opt-in Windows Direct Typing bridge, Drizzle schema, Supabase migrations, and repository boundaries are implemented. Stenography, a signed Windows TSF IME, and structure-preserving document import remain roadmap modules.

![BhashaYantra implemented UI](docs/assets/bhashayantra-implemented-ui.png)

The approved design source is preserved at [docs/assets/bhashayantra-final-reference.png](docs/assets/bhashayantra-final-reference.png).

## Implemented now

- Responsive desktop dashboard matching the approved reference.
- Simple Smart and Advanced Classic mode switch.
- Hindi-first interface with an instant Hindi/English language switch.
- Fully interactive Start Typing pad with the original BhashaYantra Smart Roman-phonetic engine and familiar Classic/KrutiDev keys.
- Typed Hindi/English profile registry with BhashaYantra Smart, Classic Hindi/KrutiDev, Devanagari INSCRIPT, Remington GAIL, Remington CBI, and English QWERTY ready profiles.
- Remington GAIL uses the familiar before-consonant short-i flow; Remington CBI uses the documented after-consonant short-i flow. Both include dedicated keyboards, conversion routes, per-layout drafts, round-trip fixtures, and full courses.
- Separate offline drafts for every ready layout and live Unicode or KrutiDev output where applicable.
- Automatic short-i matra, reph, conjunct, and Unicode normalization through the shared typing engine.
- Clickable Smart, Classic Hindi, INSCRIPT, and English QWERTY on-screen keyboards, Shift layers, Smart suggestions, and five Hindi character-palette groups.
- Searchable full character library and full shortcut manager with direct character insertion.
- Built-in expert shortcuts plus conflict-checked custom shortcuts and physical-key mappings in the working Advanced Classic Manager.
- Offline draft, language, layout, display-font, output, shortcut, and custom-layout persistence.
- Layout-scoped custom shortcuts and physical-key mappings with JSON import/export.
- Custom layout import/export, reset, text open, output copy, and `.txt` save/download actions.
- Native offline productivity exports for Microsoft Word (`.docx`), Microsoft Excel (`.xlsx`), and browser-ready (`.html`) documents from both typing and conversion workspaces.
- Live words, characters, lines, elapsed-session WPM, and mapping-warning feedback.
- Live local KrutiDev 010 ↔ Unicode text conversion in both directions with warnings.
- Three separate converter workflows so encoding and language are not confused: verified legacy-font conversion, offline Roman Hindi transliteration, and meaning-preserving cloud translation.
- Selectable translation providers: local/self-hosted LibreTranslate for free open-source English/Hindi/Bengali translation, or a Supabase Edge Function for Google Cloud English/Hindi/Marathi/Punjabi/Bengali/Gujarati translation.
- Translation responses are accepted only from the selected provider, rejected when unchanged, and checked against the selected target-language script before export.
- Windows **Direct Typing** switch in Start Typing: turn it on once, BhashaYantra minimizes, and selected-layout keys are converted per keystroke in standard Word, Excel, browser, and Windows text fields. Office-safe delta rendering preserves the stable Unicode prefix and changes only the composed suffix instead of repeatedly selecting/replacing the whole word. It ignores injected events and BhashaYantra's own process, preserves Ctrl/Alt/Win shortcuts, resets composition on focus/navigation changes, and provides `Ctrl + Alt + F12` emergency-off.
- Direct Unicode typing prevents the earlier raw-key-plus-converted-text duplication. Legacy output remains real KrutiDev encoding, so the target editor must use the Kruti Dev 010 font.
- Text-file open, paste, clear, copy, and download actions.
- Selectable Unicode preview fonts: Noto Sans Devanagari, Mangal, Nirmala UI, and Segoe UI for English.
- Original 2,820-exercise professional curriculum: 470 exercises for each ready layout, split into Learn Keys (60), alphabetic and professional Practice Words (200), Sentences (120), and Paragraphs (90).
- Academy-style course map with every lesson available immediately, plus module progress, accuracy gates, and one-to-three required clean passes for optional mastery tracking.
- Key lessons use Warm-up, Control, Application, and Checkpoint blocks; Hindi key units remain intentionally separated instead of accidentally merging into different syllables. Word lessons use repeated Recognition, a two-round Accuracy Circuit, and a sustained Timed Run; sentence and paragraph lessons provide original long-form copy.
- 240 Free exercises and 2,580 Pro-marked exercises. These tier labels are catalog metadata until signed entitlement and billing enforcement are implemented.
- Fixed-height academy workstation keeps the source, typing editor, Unicode preview, and compact keyboard inside the application viewport; the browser page no longer jumps downward when typing.
- Guided layout-specific practice with named lessons, objectives, mastery accuracy, recommended speed, word/character counts, exercise selection, progressive difficulty, target keys, next-key/finger guidance, clickable keyboard, error sound, text-size, and backspace controls.
- Eighteen exam profiles: two flexible BhashaYantra baselines and sixteen official-reference profiles for SSC CHSL/D.E.S.T., RRB NTPC CBTST, DDA, DSSSB, MP CPCT, Rajasthan High Court, and Allahabad High Court.
- Focused mock-exam workstation with 60 original government-office-style papers per layout, rule-specific duration/speed/backspace controls, official source links, explicit Start/Pause/Resume/Submit states, and automatic timeout submission.
- Running exams use a compact distraction-free viewport: navigation and configuration panels collapse, the page position remains fixed, and only the passage/editor panels scroll at their edges.
- Configurable 1/5/10/15-minute tests with backspace rules, word/letter/error highlighting, passage auto-scroll, 150–1,200 word limits, paragraphs/tabs/correction controls, custom Unicode passage input, and print view.
- Completed mock results include accuracy, correct WPM, gross WPM, NWPM, KDPH, correct/missing/extra/substituted characters, correction count, weak-key analysis, and the scoring-rule notice.
- Official-profile environment guard blocks a test when a verified layout/font requirement is not selected, such as Devanagari INSCRIPT with Mangal for the referenced Allahabad High Court Hindi profile.
- Versioned offline attempt repository with per-layout history, completed-exercise count, best scores, average accuracy, recent-speed trend, and history deletion.
- Light/dark design tokens and Hindi font fallbacks.
- Character browser, shortcut search, honest document-engine readiness card, and test summary.
- Drizzle PostgreSQL schema for ten application tables.
- Supabase migrations, Auth ownership constraints, update triggers, and RLS policies.
- Local and Supabase user-preference repository implementations.
- Tauri 2 configuration with allowlisted dialog and text-file permissions.
- Tested Free/Pro/Institution feature-entitlement vocabulary for future secure billing integration.
- Sixty frontend converter/typing/training/document/repository/licensing tests plus seven native Direct Typing composition/lifecycle tests, strict TypeScript checking, Rust Clippy, and production builds.

## Final product direction

- Default keyboard experience: original BhashaYantra Smart Roman-phonetic input with Unicode output.
- `Simple Smart Mode`: natural Roman Hindi typing with automatic matra and joint-character composition.
- `Advanced Classic Mode`: shortcuts, Alt combinations, custom mappings, and expert controls.
- Central workspace: bidirectional `KrutiDev / Legacy ↔ Unicode` Exchange Converter.
- The development Direct Typing bridge provides explicit opt-in per-keystroke input while BhashaYantra is running. It uses a low-level Windows hook and `SendInput`, so it is limited to standard apps at the same or lower integrity level. The final distributable system keyboard remains a separately signed Text Services Framework IME.
- Additional modules: structure-preserving document conversion, stenography, exportable reports, signed Pro entitlements, and optional cloud sync.

## Approved technology stack

| Area | Technology | Responsibility |
|---|---|---|
| Desktop shell | Tauri 2 | Windows window, native file access, packaging, secure native commands |
| Frontend | React | Screens and interactive UI |
| Language | TypeScript | Typed application, domain, and data-access code |
| Styling | Tailwind CSS | Design tokens and utility styling |
| UI components | shadcn/ui | Accessible, project-owned component source |
| Database schema | Drizzle ORM + Drizzle Kit | TypeScript schema and generated migrations |
| Cloud platform | Supabase | PostgreSQL, Auth, Storage, Row Level Security, and optional sync |

No additional application framework is part of the approved base stack. Small supporting packages required by these tools may be installed during implementation.

## Documentation

Start with [Documentation Index](docs/00-documentation-index.md).

- [Product Specification](docs/01-product-spec.md)
- [System Architecture](docs/02-system-architecture.md)
- [Database ERD](docs/03-database-erd.md)
- [Repository Pattern](docs/04-repositories.md)
- [Business Logic](docs/05-business-logic.md)
- [Frontend Design System](docs/06-frontend-design-system.md)
- [Development Roadmap](docs/07-development-roadmap.md)
- [Implementation Status](docs/08-implementation-status.md)
- [Business Model](docs/09-business-model.md)
- [Training and Exam Validation](docs/10-training-exam-validation.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Download

Local Windows packages produced from this source tree:

| Download type | Location |
|---|---|
| Portable build output | [bhashayantra.exe](src-tauri/target/release/bhashayantra.exe) |

The portable executable is an unsigned private development build. Before public distribution, complete the signed TSF/input-service work, add Windows code signing, and publish intentionally from the repository release page.

### Download from GitHub Actions

The repository includes [`.github/workflows/build.yml`](.github/workflows/build.yml). After the project is pushed to GitHub, every push to `main`, pull request, or manual workflow run will:

1. Install the locked Node.js and Rust dependencies on a Windows runner.
2. Run the TypeScript check and converter tests.
3. Run native Direct Typing tests and build one portable Tauri executable.
4. Store them for 14 days in the workflow run under **Artifacts → BhashaYantra-Windows**.

The repository is private and in active development. Do not create a public GitHub Release or version tag yet. When all release gates are complete, the maintainer can intentionally create a version tag:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

Only that future version-tag workflow will create a release and attach the portable Windows download:

| Published item | URL |
|---|---|
| Source repository | [github.com/Isopleth-Labs/BhashaYantra](https://github.com/Isopleth-Labs/BhashaYantra) |
| Future release downloads | [Releases](https://github.com/Isopleth-Labs/BhashaYantra/releases) |

Developer source download after publication:

```powershell
git clone https://github.com/Isopleth-Labs/BhashaYantra.git
cd BhashaYantra
```

After production release, end users will not need Node.js, Rust, or Docker. Until then, installers remain private development artifacts.

## Development prerequisites

Windows development requires:

1. Git.
2. Current Node.js LTS and npm.
3. Rust stable with the MSVC toolchain.
4. Microsoft C++ Build Tools and WebView2 required by Tauri.
5. Docker Desktop or another Docker-compatible runtime for local Supabase.

Official setup references:

- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri project creation](https://v2.tauri.app/start/create-project/)
- [Supabase local development](https://supabase.com/docs/guides/local-development)
- [Drizzle Kit overview](https://orm.drizzle.team/docs/kit-overview)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui with Vite](https://ui.shadcn.com/docs/installation/vite)

## First-time setup

After cloning the repository:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

For the full desktop window, install the Tauri Windows prerequisites and run `npm run tauri dev`.

For local Supabase, start Docker Desktop and run `npx supabase start`. Supabase is optional for typing, legacy conversion, Roman Hindi, training, and tests; it is required only for cloud translation and optional sync.

## Environment variables

The desktop frontend may receive only public Supabase configuration:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Database credentials are for migration tooling or trusted backend environments only:

```dotenv
DATABASE_URL=
```

Meaning-preserving language translation uses the `translate-text` Supabase Edge Function. Configure the Google provider secret only in Supabase, never in `.env.local` or a `VITE_` variable:

```powershell
npx supabase secrets set GOOGLE_CLOUD_TRANSLATE_KEY=your-server-side-key
npx supabase functions deploy translate-text
```

Never expose `DATABASE_URL`, a service-role key, `GOOGLE_CLOUD_TRANSLATE_KEY`, or any other server secret through a `VITE_` variable or bundle it into the Tauri application.

For a free open-source local provider, start the included LibreTranslate stack:

```powershell
docker compose -f infra/libretranslate/compose.yml up -d
```

Then select **Convert Document → Translation → LibreTranslate** and use **Check provider**. The default endpoint is `http://127.0.0.1:5000`; no API key is required. See [infra/libretranslate/README.md](infra/libretranslate/README.md) for model coverage and operating instructions.

## Development commands

```powershell
# Install dependencies
npm install

# Start local Supabase services
npx supabase start

# Run the browser UI during frontend-only work
npm run dev

# Run the complete Tauri desktop app
npm run tauri dev

# Generate SQL from the Drizzle schema
npm run db:generate

# Rebuild the local Supabase database from migrations and seed data
npm run db:reset

# Run converter unit tests and database security tests
npm run test
npm run db:test

# Create a production frontend build
npm run build

# Create one portable Windows executable without installer bundles
npx tauri build --no-bundle
```

The first Tauri build can take longer because Rust dependencies must be downloaded and compiled.

## Verified build status

The current workspace has passed strict TypeScript checking, sixty frontend unit tests, seven native Direct Typing tests, eight database/RLS tests, Drizzle configuration validation, Supabase schema linting, Rust formatting and Clippy checks, frontend production build, browser interaction QA, and the portable desktop executable build.

## Database workflow

1. Drizzle TypeScript schema is the application schema source of truth.
2. Drizzle Kit generates timestamped SQL into `supabase/migrations/`.
3. Supabase CLI applies migrations locally with `supabase db reset` and remotely with `supabase db push`.
4. Production changes always use reviewed migration files; direct dashboard schema edits are not the normal workflow.

## Security baseline

- Supabase Row Level Security is enabled on every user-owned table.
- Desktop code uses only the Supabase publishable key.
- Secret keys and direct database credentials remain outside the desktop bundle.
- File conversion is local by default; user documents are not uploaded unless the user explicitly enables a cloud feature.
- Roman Hindi transliteration and legacy conversion remain offline. Only the explicit Translation tool sends its entered text to the configured provider.
- Direct Typing installs a low-level keyboard and focus hook only after the user explicitly turns it on. It transforms keystrokes in memory, stores no captured keys, sends nothing to the network, excludes BhashaYantra's own process, and unhooks on off/emergency-off/application exit.
- The bridge cannot inject into a higher-integrity target because Windows UIPI blocks that path. Do not run Word, Excel, or the browser as administrator when using Direct Typing.
- Tauri capabilities grant only the native permissions required by each feature.

## License

No license has been selected yet. Add a `LICENSE` file before public distribution.
