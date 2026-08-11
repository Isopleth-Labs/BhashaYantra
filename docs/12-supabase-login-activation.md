# Supabase Login Activation

Student and Institute authentication is implemented with password sign-in, username sign-in, six-digit email verification, JWT claims, and device licensing.

## 1. Create and link the project

1. Create a Supabase project controlled by the BhashaYantra production owner.
2. Install/login to the CLI, then link this repository:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   npx supabase config push
   npx supabase functions deploy login-with-username --no-verify-jwt
   npx supabase functions deploy account-me
   npx supabase functions deploy register-device
   ```

3. Run the local database verification before applying production changes:

   ```powershell
   npm run db:reset
   npm run db:test
   npx supabase db lint --local
   ```

The migrations create the Student/Institute role trigger, account/trial tables, one-device default allowance, privacy-safe device registry, JWT claim hook, and Row Level Security policies. After deployment, open **Authentication → Hooks** and select `public.custom_access_token_hook` for the Custom Access Token hook.

Trigger and RLS helper functions are kept in a non-exposed `private` schema. The public device-registration RPC is the deliberate exception: it derives the user from `auth.uid()`, validates the privacy-safe digest, locks the profile row, and enforces the server-managed device limit atomically.

## 2. Configure the desktop client

Copy `.env.example` to `.env.local` and add only public client values from the Supabase **Connect** dialog:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never use a service-role/secret key, database password, provider secret, or signing key in a `VITE_` variable. Vite embeds these variables in the desktop web bundle.

For GitHub builds, create repository **Actions variables** named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. They are public client configuration; RLS remains the authorization boundary.

`supabase/templates/confirmation.html` is the source-controlled six-digit OTP email. `supabase config push` publishes the template after the project has custom SMTP enabled.

## 3. Configure production Auth

- Enable Email in **Authentication → Providers**.
- Keep email confirmation enabled. Signup opens the in-app OTP screen; Supabase verifies the six-digit code and returns the authenticated session.
- Configure a real Site URL and allowed redirect URLs.
- Configure custom SMTP before public testing. The hosted default sender only delivers to organization members, is limited to two messages per hour, and new Free projects cannot customize its email templates.
- A zero-monthly-cost beta option is Brevo Free (currently 300 sends per day). Create a verified sender, copy its SMTP host/port/user/key into **Authentication → Emails → SMTP Settings**, then run `npx supabase config push`. SMTP credentials stay in Supabase and never enter the desktop app or GitHub.
- Review Auth rate limits and enable CAPTCHA for signup/sign-in abuse protection.
- Test signup, resend cooldown, invalid/expired OTP, a Student signup, and an Institute signup. Confirm each user receives the matching `profiles.account_role`, and verify that attempting the other login role signs the session out.

The desktop client accepts email or username plus password. An unconfirmed email is routed back to the OTP screen instead of showing a generic login failure. Email login goes directly to Supabase Password Auth. Username login uses the `login-with-username` Edge Function, which privately resolves the server-managed login address and delegates password verification back to Supabase Auth. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the desktop app.

Supabase issues the access-token JWT and refresh token. The app verifies claims with `supabase.auth.getClaims()`, persists and refreshes the session, and sends `Authorization: Bearer <token>` for protected Edge Function calls. JWT metadata reduces repeated profile lookups; RLS and fresh server-side entitlement checks remain mandatory.

The device registration endpoint accepts only a SHA-256 digest of a random installation id. `profiles.device_limit` defaults to one and cannot be changed by the signed-in user. Paid billing/admin webhooks may increase institution capacity; desktop code never grants itself another device.

## 4. Production checklist

- Enable Point-in-Time Recovery or scheduled database backups appropriate to the launch plan.
- Enable Supabase security notifications and review database/advisor warnings.
- Publish a monitored private support/privacy email and an account-deletion workflow.
- Test email OTP delivery to a non-team address, resend throttling, password reset, expired sessions, role mismatch, sign-out, and RLS isolation from a clean machine.
- Test first-device registration, same-device reopen, second-device rejection, and support-authorized transfer.
- Do not enable public releases until code signing, signed updater configuration, and environment protection are complete.
