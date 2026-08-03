# Business Model and Product Packaging

Updated: 3 August 2026

## Objective

BhashaYantra must become a sustainable, profitable Windows typing product without weakening the free learning experience. Revenue comes from durable workflow value: exam preparation, advanced layouts, analytics, document conversion, cloud continuity, stenography, and institutional administration.

The product remains private and in development until mapping validation, code signing, legal documents, billing, and production support are ready.

## Market baseline

The current Soni Typing Tutor offer establishes a useful baseline: Hindi, English and numeric typing; Mangal, KrutiDev and DevLys compatibility; Remington Gail/CBI and InScript layouts; 1,000+ exercises; live tests and rankings; exam-oriented settings; and detailed speed/accuracy results.

Reference:

- https://www.sonitypingtutor.com/download-hindi-typing-software/
- https://www.sonitypingtutor.com/

BhashaYantra will not copy proprietary exercises, mappings, screens, or other protected content. Its engine, curriculum, datasets, and UI must be original, licensed, or derived from public official exam rules.

## Product tiers

| Tier | Customer | Included value | Revenue role |
|---|---|---|---|
| Free | New learner and casual typist | BhashaYantra Smart, basic Classic typing, starter lessons, basic text conversion, local progress | Acquisition, trust, referrals |
| Pro | Serious learner, exam candidate, office user | All layouts, Custom Layout Studio, full exam library, advanced analytics, document conversion, stenography, cloud sync | Primary recurring revenue |
| Institution | Coaching center, school, training lab, employer | Pro features, managed seats, admin dashboard, assignments, cohort reports, centralized configuration | Higher-value annual contracts |

The free tier must solve a real problem. Artificial typing delays, intrusive advertising during tests, and locking a user's own text are prohibited. Paid conversion should be driven by saved time, deeper preparation, and continuity.

### Current curriculum packaging

- Catalog v1 contains 1,200 original exercises across four ready layouts.
- The first 10 exercises in each of four stages are Free: 40 per layout and 160 total.
- The remaining 1,040 exercises are marked Pro for future packaging.
- General Hindi and English simulations are marked Free; specialized exam-style simulations are marked Pro.
- These labels currently explain the planned product boundary only. The development build does not block Pro content because signed entitlements, account recovery, billing, and offline grace are not implemented yet.
- No payment should be accepted until the monetization release gate below passes.

## Initial pricing hypotheses

These are experiments, not final published prices:

| Offer | Hypothesis |
|---|---:|
| 30-day Exam Pass | ₹149 |
| 90-day Exam Pass | ₹349 |
| Individual Pro annual | ₹799 introductory |
| Institution annual | Quote based on active seats and support level |

Before pricing is finalized, validate willingness to pay with trial users and track activation-to-purchase conversion. Never hard-code prices in the desktop client; serve signed catalog data from the trusted billing backend.

## Entitlement principles

- The domain entitlement catalog is the single product-feature vocabulary.
- The desktop may cache signed entitlements for offline use, but it never grants paid access based only on editable local state.
- Payment secrets and service-role credentials never enter the desktop bundle.
- Expiration failures receive a clear grace period and preserve all user-created data.
- A user can export personal layouts and results even after a paid plan expires.
- Institution admins can view their cohort data only; Supabase RLS enforces tenant boundaries.

## Differentiation

1. **Own input method:** BhashaYantra Smart converts natural Roman Hindi into Unicode while Classic profiles preserve familiar professional workflows.
2. **Simple and Advanced:** beginners see safe automatic choices; experts get mappings, shortcuts, scoring rules, and import/export.
3. **One engine across the product:** the same versioned layout/conversion rules power typing, practice, tests, and documents.
4. **Adaptive learning:** weak-key and error-pattern analysis creates the next exercise instead of presenting only a fixed list.
5. **Auditable exam simulator:** every result records the exact timer, backspace, full/half-mistake, WPM, KDPH, and accuracy rules used.
6. **Offline first:** core typing and purchased content continue without a permanent connection; sync remains optional.
7. **Professional conversion:** text and document conversion provide previews, warnings, batch operations, and recoverable output.

## Funnel and metrics

| Funnel stage | Product event | Primary metric |
|---|---|---|
| Discover | Installer/site visit | Qualified download rate |
| Activate | First successful Hindi output | Activation rate |
| Learn | Complete first lesson/test | Day-1 and Day-7 retention |
| Value | Improve speed/accuracy or convert a document | Weekly successful outcome |
| Convert | Start Exam Pass or Pro | Free-to-paid conversion |
| Retain | Continue practice, history, and sync | Renewal and churn |

Initial operating targets to validate, not promises: 3–7% free-to-paid conversion, greater than 80% software gross margin, support cost below 10% of revenue, and paid acquisition payback within three months.

## Delivery sequence

1. Complete BhashaYantra Smart and the versioned multi-layout engine.
2. Build original starter lessons and deterministic scoring.
3. Add exam profiles and advanced analytics. *(Current development milestone complete for simulations and local history.)*
4. Complete multi-profile text/document conversion.
5. Add authentication, signed entitlements, billing, and offline grace behavior.
6. Pilot Institution management with a small controlled cohort.
7. Add code signing, legal documents, support operations, and public release.

## Release gate for monetization

Billing cannot launch until purchase, renewal, cancellation, refund, expiry, offline grace, account recovery, entitlement sync, data export, and tenant security have automated tests and written support procedures.
