<p align="center"><img src="docs/assets/bhashayantra-app-icon.svg" alt="BhashaYantra" width="88" /></p>

<h1 align="center">BhashaYantra</h1>

<p align="center"><strong>A professional Indian-language typing, exam, stenography and Office-skills workspace.</strong></p>

<p align="center">
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/actions/workflows/build.yml"><img alt="Build" src="https://github.com/Isopleth-Labs/BhashaYantra/actions/workflows/build.yml/badge.svg" /></a>
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/actions/workflows/security.yml"><img alt="Security" src="https://github.com/Isopleth-Labs/BhashaYantra/actions/workflows/security.yml/badge.svg" /></a>
  <img alt="Beta candidate" src="https://img.shields.io/badge/channel-beta%20candidate-0b63f6" />
  <img alt="Windows" src="https://img.shields.io/badge/platform-Windows-0078D4?logo=windows11&logoColor=white" />
</p>

<p align="center">
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/wiki"><strong>Documentation Wiki</strong></a> ·
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/wiki/Getting-Started">Getting Started</a> ·
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/wiki/Authentication-and-JWT">Auth & JWT</a> ·
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/wiki/Security-and-Release">Security</a> ·
  <a href="https://github.com/Isopleth-Labs/BhashaYantra/wiki/Legal-and-Support">Support</a>
</p>

> `0.2.0-beta.1` is a controlled beta candidate. It is not a signed public production release yet.

![BhashaYantra desktop workspace](docs/assets/bhashayantra-implemented-ui.png)

## Why it matters

Hindi and English learners currently move between disconnected typing tutors, legacy-font tools, exam simulators and office practice software. BhashaYantra unifies them in one Windows-first product with a product-owned Smart layout, compatibility workflows and measurable learning progress.

| Product strength | Current beta foundation |
|---|---|
| Structured learning | 2,860 original exercises across six ready layouts |
| Exam preparation | 18 configurable profiles and detailed result analysis |
| Professional workflows | Unicode/KrutiDev conversion, Direct Typing, Word and Excel practice |
| Stenography | Hindi/English dictation, transcription phases and scoring |
| Accounts | Supabase Auth/JWT/RLS, 14-day trial and server-enforced device licensing |
| Trust | Offline deterministic engines, pinned CI, CodeQL, audits, checksums and provenance |

## Business direction

- **Free trial:** complete product evaluation for new verified accounts.
- **₹149 / ₹349 Exam Pass:** one personal account on one registered device for 30/90 days.
- **Individual Pro:** one named individual on one registered device.
- **Institution:** purchased seats/devices, separate member accounts, assignments and cohort reporting.

The acquisition wedge is a useful typing utility; the recurring value is exam readiness, professional workflow continuity and institution management.

## Technology

React 19 · TypeScript · Tauri 2 · Rust · Tailwind CSS · Drizzle ORM · Supabase Auth/PostgreSQL/RLS/Edge Functions

```powershell
git clone https://github.com/Isopleth-Labs/BhashaYantra.git
cd BhashaYantra
npm ci
npm run tauri dev
```

Setup, architecture, account activation, JWT flow, database, security, feature coverage and troubleshooting now live in the **[BhashaYantra Wiki](https://github.com/Isopleth-Labs/BhashaYantra/wiki)**.

---

Security reports: [private advisory](https://github.com/Isopleth-Labs/BhashaYantra/security/advisories) · General support: [issues](https://github.com/Isopleth-Labs/BhashaYantra/issues) · [Privacy](PRIVACY.md) · [Terms](TERMS.md)
