# Security and Release

## Implemented controls

- Tauri CSP and narrowly scoped capabilities
- No service-role/database/provider secrets in desktop variables
- Supabase Auth, short-lived JWTs, refresh sessions and RLS
- Server-managed role, plan, trial, and device-limit fields
- Atomic per-device registration using only a SHA-256 installation digest; second-device access fails closed
- Pinned GitHub Actions, least-privilege permissions and Dependabot
- CodeQL, npm audit, Rust audit, TypeScript/Rust checks and tests
- SHA-256 artifacts and GitHub build provenance
- Secret scanning, push protection and private vulnerability reporting

## Public beta gates

- Buy a trusted Authenticode certificate and configure protected signing secrets.
- Configure Tauri updater signing keys and endpoint.
- Configure production Supabase, SMTP, CAPTCHA and monitoring.
- Verify database migrations, device-limit concurrency, and all Edge Functions in staging.
- Run clean Windows install/update/uninstall/data-recovery tests.
- Obtain legal review and provide monitored private support/privacy channels.

No downloadable desktop software can be made impossible to copy or reverse engineer. Signing, licensing, server-side entitlements and keeping secrets/backend logic off-device reduce risk; they do not create absolute copy protection.

Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/Isopleth-Labs/BhashaYantra/security/advisories).
