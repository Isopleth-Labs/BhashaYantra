# Authentication and JWT

Supabase is the only backend dependency for user login, account activation, trials, cloud data and server-side functions.

## Login flow

1. The desktop app opens with a product-owned animated splash.
2. Supabase restores and refreshes any saved session.
3. A new user selects Student or Institute, creates a username, verifies email and receives a 14-day trial.
4. Email login uses Supabase Password Auth directly. Username login calls the `login-with-username` Edge Function, which resolves the username privately and delegates password verification to Supabase Auth.
5. Supabase returns an access-token JWT and refresh token.
6. `custom_access_token_hook` adds server-controlled `username`, `account_role`, `account_status`, `plan_tier` and `trial_ends_at` claims.
7. The app verifies claims with `supabase.auth.getClaims()` and opens only the matching workspace.

Passwords are never stored by BhashaYantra tables or returned to the app after login.

## API requests

Authenticated requests carry:

```http
Authorization: Bearer <user-access-token>
apikey: <project-publishable-key>
```

The shared `invokeAuthenticatedFunction` adapter obtains the current access token and attaches it to Edge Function calls. Supabase refreshes short-lived tokens automatically.

The backend can read identity and account metadata from verified claims without querying `profiles` on every request. This reduces repeated lookups; it does **not** replace RLS, resource ownership checks or fresh billing/security decisions.

## Claim safety

- Authorization claims originate from protected profile columns and the Custom Access Token hook.
- Users cannot update role, account status, plan or trial dates.
- Do not authorize from user-editable `user_metadata`.
- Claim changes become visible after token refresh; suspend critical sessions and force refresh/sign-out when access changes.
- Access tokens are short lived (`jwt_expiry = 3600`) and refresh tokens are managed by Supabase Auth.

## Required production setup

- Deploy migrations and both Edge Functions.
- Activate the Custom Access Token hook in Supabase Dashboard.
- Enable email confirmations and configure Site URL/redirect URLs.
- Configure custom SMTP, CAPTCHA, password policy and rate limits.
- Add only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to desktop/GitHub build variables.
- Keep service-role and provider secrets only in Supabase secret storage.
