# Supabase Login Activation

Student and Institute authentication is implemented, but a production build remains intentionally disabled until a Supabase project is connected.

## 1. Create and link the project

1. Create a Supabase project controlled by the BhashaYantra production owner.
2. Install/login to the CLI, then link this repository:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. Run the local database verification before applying production changes:

   ```powershell
   npm run db:reset
   npm run db:test
   npx supabase db lint --local
   ```

The migrations create the Student/Institute role trigger, account tables, constraints, and Row Level Security policies.

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

## 4. Production checklist

- Enable Point-in-Time Recovery or scheduled database backups appropriate to the launch plan.
- Enable Supabase security notifications and review database/advisor warnings.
- Publish a monitored private support/privacy email and an account-deletion workflow.
- Test email confirmation, password reset, expired sessions, role mismatch, sign-out, and RLS isolation from a clean machine.
- Do not enable public releases until code signing, signed updater configuration, and environment protection are complete.
