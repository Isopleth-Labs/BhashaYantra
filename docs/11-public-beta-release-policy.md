# Public Beta Release Policy

## Current decision

BhashaYantra `0.2.0-beta.1` is a **beta candidate**, not a published release. A public download must remain blocked until Windows signing and the signed updater are configured and the upgrade test below passes.

The permanent Windows application identifier is `com.bhashayantra.desktop`. It must not be renamed after public distribution because the identifier anchors application identity and local WebView data continuity.

## User continuity contract

A user who installs a beta is treated as a long-term user:

- Updates must preserve drafts, preferences, custom mappings, practice/test results, stenography results, and local workspace profiles.
- Storage changes require a monotonic schema version and a tested forward migration. Existing keys are never silently deleted.
- A build must not write to a data schema created by a newer build.
- Settings → Data & privacy provides a versioned JSON backup and transactional restore. Supabase authentication sessions and secrets are excluded.
- Reset Preferences may reset preferences only; it must not remove drafts or result history.
- Uninstall, downgrade, corruption recovery, and account deletion behavior must be documented before stable release.

## Version and channel policy

- Beta versions use SemVer `major.minor.patch-beta.n`, beginning with `0.2.0-beta.1`.
- `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` must contain the same version.
- Git tags must exactly equal `v` plus the application version.
- Beta GitHub releases are marked as prereleases. Stable users must never receive a beta update unless they explicitly select the beta channel.
- Database, layout, scoring, curriculum, and local-data schemas are versioned independently of the application version.

## Required public-download pipeline

1. Build an NSIS or MSI installer on a clean Windows runner.
2. Sign the executable and installer with a trusted Windows code-signing identity.
3. Generate Tauri updater artifacts and signatures with an offline-protected updater private key.
4. Publish the signed artifact and signed update manifest to the configured HTTPS endpoint.
5. Verify install, update, repair, and uninstall on supported Windows versions.
6. Publish SHA-256 checksums, release notes, known limitations, privacy policy, license, and support route.

The workflow requires the repository variable `BETA_RELEASES_ENABLED=true`, the `WINDOWS_CODESIGN_CONFIGURED=true` confirmation, a Windows code-signing certificate/password in protected secrets, and the signed updater configuration. A public beta tag is Authenticode-signed and verified on the Windows runner before checksums and provenance are generated. Even then, `npm run beta:check -- --publish` blocks publication until the Tauri updater dependencies, endpoint, public key, updater signing secret, and Windows signing are present.

## Mandatory upgrade test

For every beta candidate:

1. Install version N on a clean Windows user profile.
2. Create a draft in every ready layout, one custom mapping, a practice result, a mock-test result, and a stenography result.
3. Export a local backup.
4. Install version N+1 over version N without manually deleting application data.
5. Confirm every item remains readable and editable and the data manifest records N as the first installed version and N+1 as the latest version.
6. Restore the version-N backup into N+1 and re-check the same data.
7. Confirm Direct Typing is off after update unless the user explicitly enables it again.
8. Confirm an interrupted update leaves the previous signed application runnable.

## Current blockers

- Tauri signed updater is not configured.
- Windows executable/installer code signing is not configured.
- A production installer and clean-machine upgrade test have not been completed.
- Privacy policy, end-user license, support policy, and beta feedback/crash-report consent are not final.
- Remington CBI, DevLys, Shree-Lipi, recruitment-specific scoring, and official/past-paper content must keep their existing validation labels; beta status does not convert them into verified claims.
- End-to-end desktop automation and restore testing are not yet part of CI.

Until these blockers are closed, CI artifacts are for controlled testing only and must not be advertised as a durable public installer.
