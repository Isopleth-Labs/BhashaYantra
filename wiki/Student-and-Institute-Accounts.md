# Student and Institute Accounts

## Student

- Personal course progress, attempts and result cards
- Exam targets and preferred language
- Private typing, stenography and Office settings
- 14-day complete trial, followed by the selected entitlement

## Institute

- Separate administrator login and institution plan
- Managed seats, roster and membership roles
- Assignments, lab defaults and server-verified reports
- No silent switching between Student and Institute identities

The selected role must match the server-issued `account_role` JWT claim. A mismatch signs the session out. Institution access depends on verified `institution_members` records and RLS—not on a client-side switch.

Billing is not active in the beta. Trial and plan fields are server controlled so a future payment webhook can activate or suspend access safely.
