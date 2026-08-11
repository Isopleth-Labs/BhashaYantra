<p align="center">
  <img src="docs/assets/bhashayantra-app-icon.svg" alt="BhashaYantra logo" width="96" />
</p>

<h1 align="center">BhashaYantra</h1>

<p align="center"><strong>The professional Indian-language typing workspace for exam candidates, office users, and training institutions.</strong></p>

<p align="center">
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/actions/workflows/build.yml"><img alt="Build status" src="https://github.com/Isopleth-Labs/BhashaYantra/actions/workflows/build.yml/badge.svg" /></a>
  <img alt="Beta candidate" src="https://img.shields.io/badge/channel-beta%20candidate-0b63f6" />
  <img alt="Windows" src="https://img.shields.io/badge/platform-Windows-0078D4?logo=windows11&logoColor=white" />
  <img alt="Offline first" src="https://img.shields.io/badge/core-offline--first-138a4b" />
</p>

<p align="center">
  <a href="#the-opportunity">Opportunity</a> ·
  <a href="#product-advantage">Advantage</a> ·
  <a href="#business-model">Business model</a> ·
  <a href="#product-readiness">Readiness</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

> **Current status:** `0.2.0-beta.1` is a controlled beta candidate, not a public production release. The release workflow remains blocked until Windows code signing and signed auto-updates are configured.

![BhashaYantra desktop workspace](docs/assets/bhashayantra-implemented-ui.png)

<table>
  <tr>
    <td align="center"><strong>2,860</strong><br /><sub>original exercises</sub></td>
    <td align="center"><strong>18</strong><br /><sub>mock-test profiles</sub></td>
    <td align="center"><strong>6</strong><br /><sub>selectable layouts</sub></td>
    <td align="center"><strong>94</strong><br /><sub>automated tests</sub></td>
  </tr>
</table>

## The opportunity

Indian typing users currently move between separate tools for legacy Hindi input, Unicode conversion, exam practice, stenography, and Word/Excel work. Many products are dated, encoding-specific, difficult to learn, or disconnected from real professional workflows.

BhashaYantra brings those workflows into one modern desktop product:

- Learn Hindi and English typing from key drills to professional passages.
- Practise configurable exam-style tests using source-linked rule profiles.
- Type Unicode Hindi in Windows applications through an opt-in Direct Typing bridge.
- Convert Roman Hindi and supported legacy text without confusing fonts, encodings, and keyboard layouts.
- Train stenography and Word/Excel efficiency inside the same learning system.

> **Product thesis:** start with a trusted offline Windows utility, convert high-intent exam candidates into Pro users, then expand into recurring institution seats and managed training labs.

## Product advantage

| Advantage | Why it matters |
|---|---|
| Own language engine | BhashaYantra Smart is a product-owned Hindi input system; compatibility profiles are separately identified and tested. |
| One engine across workflows | The selected layout powers typing, practice, tests, conversion, and on-screen guidance. |
| Exam-oriented depth | 2,860 original exercises, 18 mock-test profiles, 60 original pattern papers per layout, detailed scoring, and weak-key analysis. |
| Modern + legacy bridge | Unicode output for modern apps with verified KrutiDev compatibility and explicit validation labels for incomplete profiles. |
| Offline-first trust | Core typing, training, local results, backup, and restore work without an account. |
| Institution-ready architecture | Separate Student and Institute roles, Supabase RLS, assignments/reporting schema, and planned managed seats. |

Official notices are used for layout, duration, correction, and scoring references. Built-in passages are original practice content—not copied proprietary exercise banks or falsely labelled past papers.

## Who it serves

- **Exam candidates:** SSC, RRB, DDA, DSSSB, CPCT, High Court, stenography, and data-entry preparation.
- **Office professionals:** Hindi/English typing, Unicode and KrutiDev workflows, document export, Word and Excel practice.
- **Institutions:** managed students, structured assignments, lab defaults, cohort analytics, and centralized reporting.

## Business model

| Plan | Customer | Value |
|---|---|---|
| Free | Learners and casual users | Core typing, starter curriculum, basic conversion, and local progress. |
| Pro | Serious candidates and professionals | Full curriculum, exam library, analytics, stenography, advanced conversion, and cloud continuity. |
| Institution | Coaching centres, schools, labs, and employers | Managed seats, assignments, administrative controls, and cohort reports. |

Revenue is designed around durable workflow value—not advertisements, artificial typing delays, or locking users out of their own text. Pricing remains a market-validation hypothesis until secure billing and entitlement recovery are implemented.

The model combines individual subscriptions with higher-value institution contracts while keeping a useful free tier as the acquisition and trust channel.

## Product readiness

**Working today**

- Six selectable typing layouts with visible standard/reference/compatibility status.
- Hindi and English typing, guided practice, mock tests, result history, stenography, and Office Skills.
- KrutiDev 010 ↔ Unicode text conversion, Roman Hindi transliteration, and optional translation providers.
- Native Word (`.docx`), Excel (`.xlsx`), browser (`.html`), and text export.
- Versioned local-data manifest, downgrade protection, backup/restore, and separate account roles.
- 87 frontend tests, 7 native tests, strict TypeScript/Rust checks, production build, and visual QA.

**Before public beta**

- Windows executable and installer code signing.
- Signed Tauri updater and beta-channel update manifest.
- Clean-machine `beta.1 → beta.2` install/update/restore test.
- Final privacy policy, licence, support route, and beta feedback consent.

The repository release workflow enforces these gates so an unsigned, updater-less build cannot be published accidentally.

## Roadmap

| Phase | Outcome |
|---|---|
| Signed beta | Auto-updatable Windows build for a controlled candidate cohort. |
| Learning validation | Measure activation, practice completion, retention, and exam-profile usefulness. |
| Individual Pro | Secure entitlements, recovery, analytics, and paid continuity. |
| Institution pilot | Managed seats, assignments, lab controls, and cohort reporting. |
| Scale | Licensed conversion coverage, deeper analytics, and professional document workflows. |

## Technology

React 19 · TypeScript · Tauri 2 · Rust · Tailwind CSS · Drizzle ORM · Supabase/PostgreSQL

The architecture is offline-first: deterministic typing and scoring stay local, while authentication, optional sync, translation, billing, and institution services use explicit cloud boundaries.

<details>
<summary><strong>Run locally</strong></summary>

<br />

Requirements: Node.js 24+, Rust stable, and the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/).

```powershell
git clone https://github.com/Isopleth-Labs/BhashaYantra.git
cd BhashaYantra
npm ci
npm run tauri dev
```

Validation:

```powershell
npm run beta:check
npm run typecheck
npm run test
cargo test --manifest-path .\src-tauri\Cargo.toml
```

Supabase is optional for offline typing and training. Copy `.env.example` to `.env.local` only when testing account or cloud features; never place service-role or translation-provider secrets in frontend variables.

</details>

<details>
<summary><strong>Technical documentation</strong></summary>

<br />

- [Product specification](docs/01-product-spec.md)
- [System architecture](docs/02-system-architecture.md)
- [Business model](docs/09-business-model.md)
- [Training and exam validation](docs/10-training-exam-validation.md)

</details>

---

**BhashaYantra is building a trusted bridge from learning a keyboard to passing an exam and working professionally in Indian languages.**
