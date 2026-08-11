# Getting Started

## Requirements

- Windows 10/11
- Node.js 24+
- Rust stable and the Tauri Windows prerequisites
- A Supabase project for login, trial and cloud features

## Local development

```powershell
git clone https://github.com/Isopleth-Labs/BhashaYantra.git
cd BhashaYantra
npm ci
Copy-Item .env.example .env.local
npm run tauri dev
```

Add the project URL and publishable client key to `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

These two values identify the public client; they are not backend secrets. Never place a service-role key, database password, provider secret or signing key in a `VITE_` variable.

## Database and functions

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase functions deploy login-with-username --no-verify-jwt
npx supabase functions deploy account-me
```

In Supabase Dashboard, open **Authentication → Hooks** and select `public.custom_access_token_hook` for the Custom Access Token hook. Configure Email Auth, redirects, SMTP, CAPTCHA and production rate limits before inviting users.

## Verification

```powershell
npm run security:check
npm run typecheck
npm run test
npm run build
cargo test --manifest-path .\src-tauri\Cargo.toml
```

See [Authentication and JWT](Authentication-and-JWT) for the login lifecycle and [Security and Release](Security-and-Release) before distributing an executable.
