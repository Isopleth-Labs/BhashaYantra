# Security Policy

## Supported builds

Only the newest published beta or stable release will receive security fixes. `0.2.0-beta.1` is currently a release candidate and has not been publicly released.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, private user data, or an unpatched vulnerability. Use the repository's **Security → Advisories → Report a vulnerability** flow; private vulnerability reporting is enabled for this public repository.

## Build and secret boundaries

- The desktop app may contain only the Supabase project URL and publishable key. These identify the public client and are not authorization secrets.
- Supabase service-role keys, database passwords, translation-provider secrets, signing certificates, and updater private keys remain server-side or in protected GitHub environments.
- User-data authorization is enforced with database Row Level Security, not by hiding a client key.
- GitHub secret scanning, push protection, Dependabot security updates, and private vulnerability reporting are enabled. Actions use least-privilege tokens, pinned action commits, dependency scanning, SHA-256 checksums, and build provenance attestations.
- Public release remains blocked until Windows Authenticode signing and Tauri updater signing are configured.

The beta is a Windows-only build. A dependency advisory that exists solely in an unshipped target (for example, Tauri's Linux GTK tree) may be dismissed only after its dependency path, reachability, and upstream upgrade constraint are documented. It must be reviewed again before adding that platform or changing the desktop runtime.

## Copying and tampering

No downloadable desktop application can be made impossible to copy or reverse engineer. BhashaYantra reduces practical risk with copyright terms, code signing, checksums, provenance, minimal native permissions, server-side secrets, RLS, and server-verified entitlements. Security-sensitive business rules and private provider credentials must not be placed in React bundles or recoverable desktop resources.

## Release verification

For a public build, compare the published SHA-256 checksum and verify GitHub provenance:

```powershell
Get-FileHash .\BhashaYantra.exe -Algorithm SHA256
gh attestation verify .\BhashaYantra.exe -R Isopleth-Labs/BhashaYantra
```
