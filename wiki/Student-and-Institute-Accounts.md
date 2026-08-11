# Student and Institute Accounts

## Student

- Personal course progress, attempts and result cards
- Exam targets and preferred language
- Private typing, stenography and Office settings
- 14-day complete trial, followed by the selected entitlement
- ₹149, ₹349 and Individual Pro offers are licensed to one personal account on one registered device

## Institute

- Separate administrator login and institution plan
- Managed seats, roster and membership roles
- Assignments, lab defaults and server-verified reports
- No silent switching between Student and Institute identities
- Purchased device/seat pool with separate member accounts; one shared centre password is not a valid deployment model

The selected role must match the server-issued `account_role` JWT claim. A mismatch signs the session out. Institution access depends on verified `institution_members` records and RLS—not on a client-side switch.

Billing is not active in the beta. Trial and plan fields are server controlled so a future payment webhook can activate or suspend access safely.

## Device registration

At first successful login the desktop creates a random installation id, hashes it with SHA-256, and sends only the digest to the protected `register-device` Supabase Edge Function. The database function `register_current_device` atomically checks the server-managed allowance before registering the installation.

- Reopening the same installation does not consume another slot.
- A second installation is blocked when the account limit is one.
- Hardware serials and browser fingerprints are not collected.
- Device transfer/revocation requires a verified recovery or support workflow; deleting local state must not silently bypass licensing.
