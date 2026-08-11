# Security Policy

## Supported builds

Only the newest published beta or stable release will receive security fixes. `0.2.0-beta.1` is currently a release candidate and has not been publicly released.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, private user data, or an unpatched vulnerability. Until GitHub private vulnerability reporting is enabled, use a minimal public issue asking the maintainers to establish a private channel; do not include the vulnerability itself.

The repository owner should enable **Settings → Security → Private vulnerability reporting** before public beta.

## Build and secret boundaries

- The desktop app may contain only the Supabase project URL and publishable key. These identify the public client and are not authorization secrets.
- Supabase service-role keys, database passwords, translation-provider secrets, signing certificates, and updater private keys remain server-side or in protected GitHub environments.
- User-data authorization is enforced with database Row Level Security, not by hiding a client key.
- GitHub Actions use least-privilege tokens, pinned action commits, dependency scanning, SHA-256 checksums, and build provenance attestations.
- Public release remains blocked until Windows Authenticode signing and Tauri updater signing are configured.

## Copying and tampering

No downloadable desktop application can be made impossible to copy or reverse engineer. BhashaYantra reduces practical risk with copyright terms, code signing, checksums, provenance, minimal native permissions, server-side secrets, RLS, and server-verified entitlements. Security-sensitive business rules and private provider credentials must not be placed in React bundles or recoverable desktop resources.

## Release verification

For a public build, compare the published SHA-256 checksum and verify GitHub provenance:

```powershell
Get-FileHash .\BhashaYantra.exe -Algorithm SHA256
gh attestation verify .\BhashaYantra.exe -R Isopleth-Labs/BhashaYantra
```
