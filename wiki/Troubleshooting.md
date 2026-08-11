# Troubleshooting

## Login says Supabase is not configured

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then rebuild. For GitHub builds, add both as repository **Actions variables**.

## Token is missing role/trial claims

Apply the latest migration, activate `public.custom_access_token_hook` under Authentication → Hooks, sign out and sign in again. Existing tokens do not gain new claims until refresh.

## Username login fails but email works

Deploy `login-with-username` with `--no-verify-jwt`. Confirm the function has its default Supabase URL, anon/publishable compatibility key and service-role secret in server-side function storage. Never add the service-role key to the app.

## Email signup does not open the app

This is expected when email confirmation is enabled. Confirm the address, return to BhashaYantra and sign in.

## Local database verification

```powershell
npx supabase start
npm run db:reset
npm run db:test
npx supabase db lint --local
```

## Build verification

```powershell
npm run security:check
npm run typecheck
npm run test
npm run build
cargo test --manifest-path .\src-tauri\Cargo.toml
```
