# Supabase Login Activation

Student and Institute authentication is implemented, but a production build remains intentionally disabled until a Supabase project is connected.

## 1. Create and link the project

1. Create a Supabase project controlled by the BhashaYantra production owner.
2. Install/login to the CLI, then link this repository:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   npx supabase functions deploy login-with-username --no-verify-jwt
   npx supabase functions deploy account-me
   ```

3. Run the local database verification before applying production changes:

   ```powershell
   npm run db:reset
   npm run db:test
   npx supabase db lint --local
   ```

The migrations create the Student/Institute role trigger, account/trial tables, constraints, JWT claim hook, and Row Level Security policies. After deployment, open **Authentication → Hooks** and select `public.custom_access_token_hook` for the Custom Access Token hook.

## 2. Configure the desktop client

Copy `.env.example` to `.env.local` and add only public client values from the Supabase **Connect** dialog:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never use a service-role/secret key, database password, provider secret, or signing key in a `VITE_` variable. Vite embeds these variables in the desktop web bundle.

For GitHub builds, create repository **Actions variables** named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. They are public client configuration; RLS remains the authorization boundary.

## 3. Configure production Auth

- Enable Email in **Authentication → Providers**.
- Keep email confirmation enabled for production. The user confirms in the browser, returns to the desktop app, and signs in.
- Configure a real Site URL and allowed redirect URLs.
- Configure custom SMTP before public testing; the default Supabase mail service is not a production delivery channel.
- Review Auth rate limits and enable CAPTCHA for signup/sign-in abuse protection.
- Test a Student signup and an Institute signup. Confirm each user receives the matching `profiles.account_role`, and verify that attempting the other login role signs the session out.

The desktop client accepts email or username plus password. Email login goes directly to Supabase Password Auth. Username login uses the `login-with-username` Edge Function, which privately resolves the server-managed login address and delegates password verification back to Supabase Auth. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the desktop app.

Supabase issues the access-token JWT and refresh token. The app verifies claims with `supabase.auth.getClaims()`, persists and refreshes the session, and sends `Authorization: Bearer <token>` for protected Edge Function calls. JWT metadata reduces repeated profile lookups; RLS and fresh server-side entitlement checks remain mandatory.

## 4. Production checklist

- Enable Point-in-Time Recovery or scheduled database backups appropriate to the launch plan.
- Enable Supabase security notifications and review database/advisor warnings.
- Publish a monitored private support/privacy email and an account-deletion workflow.
- Test email confirmation, password reset, expired sessions, role mismatch, sign-out, and RLS isolation from a clean machine.
- Do not enable public releases until code signing, signed updater configuration, and environment protection are complete.
