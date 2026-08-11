# BhashaYantra Privacy Policy

**Beta draft — effective 12 August 2026. Legal review is required before public release.**

## Local-first operation

BhashaYantra stores typing drafts, preferences, custom mappings, local lesson progress, and local test results on the user's device. Core typing, practice, tests, conversion, and stenography do not upload typed content merely because those workspaces are used.

## Optional online services

An online transfer occurs only when the user deliberately uses a configured online feature, such as account sign-in, institute synchronization, cloud translation, or a future paid service. The app identifies the provider and purpose before the action is available. Only the data required to perform that selected feature should be sent.

## Accounts

When production login is enabled, Supabase processes account identity and server-synchronized workspace data. The desktop app uses a public project URL and publishable key; authorization is enforced by Row Level Security. Service-role keys, database passwords, and provider secrets must never ship in the desktop application.

For per-device licensing, the app creates a random installation id on the device and sends only its SHA-256 digest, a generic device label, and registration timestamps to Supabase. BhashaYantra does not collect a hardware serial number or use browser fingerprinting for this check.

## Local backups

The Data & privacy screen can export and transactionally restore BhashaYantra-owned local data. Authentication sessions are excluded from backups. A backup may contain the user's drafts, results, profile fields, and preferences, so the user should store it securely.

## Diagnostics

Crash reporting is disabled by default in the beta candidate. The current beta toggle does not upload crash reports. Any future diagnostic provider must be disclosed here before collection begins.

## Retention and deletion

Local data remains on the device until the user resets it, removes it, or uninstalls the application. Production cloud retention, account export, and account deletion flows must be verified against the deployed Supabase project before public beta activation.

## Contact

Use the [BhashaYantra support tracker](https://github.com/Isopleth-Labs/BhashaYantra/issues) for privacy requests while the beta is under development. Do not include passwords, API keys, private documents, or sensitive personal information in a public issue. A monitored private privacy email must be published before public release.
