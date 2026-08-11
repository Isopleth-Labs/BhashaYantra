# Training and Exam Validation

Updated: 11 August 2026

## Purpose

This document prevents the learning and test modules from becoming a shallow exercise picker. It records the observed behavior baseline, the original BhashaYantra curriculum contract, the official public rule sources, and the checks required before an exam profile can be described as validated.

## Competitive behavior audit

A read-only structural audit of the locally installed Soni Typing Tutor data found 525 chapter containers, 2,077 categorized test-data files, 40 skill pages in one set, and 70 in another. A live manual interaction audit of the running 5.1.178 desktop build verified the following behavior:

- The English tutor moves through Read Instructions, Learn Keys, Practice Words, and Type Paragraphs. The observed catalogs contained 32 key exercises, 26 word exercises, and 50 paragraph exercises, with previous/next navigation and a remembered exercise position.
- Key and word lessons use source and answer panes, F/J home-row guidance, left/right hand diagrams, a finger-colored keyboard, active-key emphasis, backspace policy, show-keyboard, sound, move-on-error, bold, and text-size controls.
- English Number Typing is a distinct dashboard entry rather than a disguised word lesson.
- The general English test exposed 500 selectable papers, custom/add-exercise entry, print mode, duration, 50–1,500 word limits, 200–50,000 keystroke limits, three backspace modes, word/word-error/no-highlight modes, scrollbar and auto-scroll, paragraph/tab/correction controls, and font size.
- The timer began on the first key. Configuration locked during the active attempt; correct copy used green feedback, the current/error location used yellow feedback, and Submit/Pause became active.
- The observed result dialog separated Keystroke Based, Word Based, RSSB LDC, and Raj HC Steno views. It displayed net/gross speed, KDPH, accuracy/error percentage, duration, correct/incorrect/omitted words, backspace count, comparison text, and omission/substitution/addition/spelling/capitalization error explanations.

The audit is used only to understand category breadth and interaction depth. BhashaYantra does not decrypt, extract, ship, or reproduce competitor exercises, logos, mappings, or screen designs. All shipped curriculum text is original project material; exam rules come from public official sources.

## BhashaYantra Academy contract

Each of the six ready layouts has 470 exercises. English QWERTY adds a dedicated 40-lesson numeric/data-entry stage, for 2,860 original exercises total:

| Stage | Count | Required structure |
|---|---:|---|
| Learn Keys | 60 | Warm-up, Control, Application, Checkpoint |
| Practice Words | 200 | Alphabetic-control sets followed by professional vocabulary; Repeated Recognition, two-round Accuracy Circuit, sustained Timed Run; at least 28 distinct terms |
| Number & Data Entry (English QWERTY) | 40 | Number-row reach, amounts, dates, time, percentages, identifiers, ledgers, statistics, codes, and professional structured records; Reach Pattern, Accuracy Fields, Timed Data Run |
| Type Sentences | 120 | Accuracy Build, Rhythm Build, Timed Copy |
| Type Paragraphs | 90 | Document Copy, Exam Run |

Every exercise stores a stable ID, phase, module position, competency, practice mode, focus keys, original source/target copy, accuracy gate, target speed, required clean passes, tier, and conversion-validation result. Every lesson is available immediately and the last selected stage/exercise is remembered per layout. Checkpoints can require multiple clean attempts for mastery; merely opening a lesson never marks it complete. The course method screen documents posture, F/J anchors, left/right finger zones, accuracy-first progression, and exam-safe settings.

Hindi Learn Keys content keeps every intended letter or syllable as a separate drill unit. It never concatenates Roman source tokens in a way that silently creates a different Devanagari syllable. Practice Words uses 20 ordered alphabetic-control modules plus 30 professional vocabulary modules per layout, with four distinct lessons per module. The academy uses a fixed-height workstation with independently scrollable source, keyboard, course, and coach panels so typing focus does not move the browser page.

Practice error handling is deliberately non-blocking: a wrong physical key remains in the answer, is marked red in the live key stream, and the next character remains available. Sound is optional and defaults off. Mock results expose separate keystroke, word, and error-analysis views with local alignment, correction counts, speed measures, and print support. Word and Excel Efficiency are separate functional simulations rather than labels inside the typing test.

The legacy-compatible training label is `KrutiDev 010 Keyboard (Classic)`. It describes one physical keyboard/encoding compatibility profile, not two fonts or two simultaneous layouts. Lessons expose token-level examples such as `v → अ`, `vk → आ`, `b → इ`, and `bZ → ई`; users press the shown physical keys and receive Unicode preview/output. A round-trip test validates every generated lesson against its Devanagari target.

Word Efficiency provides original document-preparation, correspondence, minutes, Hindi noting/order, and full-simulation tasks. Excel Efficiency provides original register, attendance, budget/formula, inventory, candidate-result, and mixed simulation tasks. Text or cell accuracy and workflow completion are scored separately.

Stenography separates rule profiles from audio provenance. Local system narration is always labeled synthetic. Real-voice sessions accept original/licensed human audio or a microphone recording made against the displayed original script and target WPM. No competitor, leaked exam, or unlicensed courtroom recording is bundled or represented as official audio. Hindi and English profiles remain independently selectable.

Mock papers are assembled from original English and Hindi passages using a separate subject order for SSC clerical/data-entry, RRB railway operations, DDA urban administration, DSSSB education/Delhi administration, CPCT e-governance, Rajasthan courts, and Allahabad courts. They reproduce the size and interaction contract of the selected profile without copying a competitor or an authority's test passage. The workstation labels every built-in paper `Original pattern paper`; an official rule source does not turn original practice copy into an official past paper.

## Remington validation

- Remington GAIL and CBI remain selectable operational layouts with 470 original exercises each, but their verification status is deliberately different.
- Remington GAIL base and Shift behavior follows SIL Global's MIT-licensed Unicode implementation. Its documented order is consonant followed by short-i (`d` + `f` → `कि`), not the visual-order behavior previously claimed by this project.
- Remington CBI currently uses a round-trip-tested core compatibility map. Public recruitment notices name CBI as an available layout but do not publish a complete authoritative bit-for-bit key corpus, so the UI marks it `Mapping validation required` rather than certified.
- Automated acceptance tests assert GAIL phonetic-order behavior, CBI core round trips, all generated-course round trips, zero course conversion warnings, and keyboard-profile readiness.
- GAIL AltGr rare-character coverage and an authoritative CBI corpus remain explicit expansion/validation items; neither is silently described as complete.

References: [SIL Remington GAIL source](https://github.com/keymanapp/keyboards/tree/master/release/r/remington_gail), [SIL Remington GAIL help](https://help.keyman.com/keyboard/remington_gail/1.1/remington_gail), and [DDA Circular 29/2025 naming GAIL, InScript, and CBI](https://dda.gov.in/sites/default/files/Personnel/circular_no_2911062025.pdf).

## Layout, encoding, and font truth matrix

| Item | Kind | Current status | Claim boundary |
|---|---|---|---|
| BhashaYantra Smart | Keyboard/composition engine | Working, product-owned | Original BhashaYantra input method; not an official exam standard |
| KrutiDev 010 Keyboard (Classic) | Physical-key compatibility profile | Working common-map round trips | KrutiDev 010 is a legacy encoding/font workflow, not a Unicode keyboard standard |
| Devanagari INSCRIPT | Keyboard layout | Working base/Shift; BIS-standard reference | Standard layout provenance is official; BhashaYantra's implementation is still software that must be regression-tested |
| Remington GAIL | Keyboard layout | Working base/Shift against SIL Keyman reference | Extended AltGr coverage is incomplete |
| Remington CBI | Keyboard layout | Working core compatibility map | Authoritative complete public mapping corpus not yet found; not certified |
| Kruti Dev 010 converter | Legacy encoding conversion | Working common bidirectional mapping | Coverage is a versioned compatibility corpus, not every historical font variant |
| DevLys 010 converter | Legacy encoding conversion | Validation pending | Not available as a verified converter profile |
| Shree-Lipi converter | Legacy encoding conversion | Exact variant required | A family name is insufficient because variants use different mappings |
| Noto Sans Devanagari | Unicode display font | Uses local installation, then fallback | The current app does not bundle the font file |
| Mangal / Nirmala UI / Segoe UI | Unicode display fonts | Use Windows/Office installation, then fallback | Display choice never changes the underlying Unicode characters |

Unicode is the text encoding/output model. A keyboard layout decides which physical keys create those Unicode characters. A display font decides how the same Unicode characters look. These are intentionally presented separately in Settings.

## Official-reference profiles

| Profile family | Implemented reference behavior | Public source |
|---|---|---|
| SSC CHSL English/Hindi | 10 minutes; 35 WPM English or 30 WPM Hindi; 10,500/9,000 KDPH equivalence | [SSC CHSL 2025 notice](https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf) |
| SSC Data Entry | 15 minutes; 8,000 or 15,000 KDPH profiles with expected key-depression ranges | [SSC CHSL 2025 notice](https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf) |
| RRB NTPC CBTST English/Hindi | One-minute warm-up, 30-second break, then 10 evaluated minutes; 30 WPM English or 25 WPM Hindi; 300/250-word minimum; no editing tools or spell-check; published 5% allowance and mistake formula | [RRB NTPC CBTST instructions dated 22 December 2025](https://www.rrbcdg.gov.in/uploads/2024/05-NTPCG/052024-CBTST_Instructions.pdf) |
| DDA Stenographer Grade C/PA English/Hindi | 10 minutes; 40 WPM English or 35 WPM Hindi; the circular names the SSC CGL/CHSL Soni module and Remington GAIL/InScript/Remington CBI for Hindi | [DDA Circular 29/2025](https://dda.gov.in/sites/default/files/Personnel/circular_no_2911062025.pdf) |
| DSSSB Post Code 802/23 English/Hindi | Screen-to-screen 10-minute test; 35 WPM English or 30 WPM Hindi; KrutiDev/Mangal with Remington GAIL/InScript as stated for Hindi | [DSSSB instructions dated 16 July 2026](https://dsssb.delhi.gov.in/dsssb/general-instructions-candidates-typing-skill-test-various-posts-grade-ivjunior-0) |
| MP CPCT English/Hindi | 15 minutes; 30 NWPM English or 20 NWPM Hindi; unrestricted correction | [CPCT Rule Book v1.4](https://www.cpct.mp.gov.in/per/g01/pub/1172/ASM/WebPortal/1/Hindi/PDF/CPCT_Rule_book-V1.4.pdf) and [assessment formula](https://www.cpct.mp.gov.in/per/g01/pub/1172/ASM/WebPortal/1/Hindi/PDF/CPCT_Assessment_Formula.PDF) |
| Rajasthan High Court | Speed-test duration, KDPH target, auto-stop, and referenced correction restrictions | [Subordinate-court rules](https://hcraj.nic.in/hcraj/latestupdates/rulessubcourts08022017.pdf) and [speed-test instructions](https://hcraj.nic.in/hcraj/recruitment/Instructions-ldc-26102017.pdf) |
| Allahabad High Court | Referenced 300-word English or 250-word Hindi ten-minute paper; InScript/Mangal guard for the cited Hindi instruction | [Computer type-test scheme](https://www.allahabadhighcourt.in/event/Admit_card_notice_Stenographer_GrIII.html) and [Hindi type-test instruction](https://www.allahabadhighcourt.in/event/event_5218_26-02-2019.html) |

Official-reference means the profile records a checked public source and simulates the cited rule set. It does not mean the built-in passage is an official or previously administered question paper, and it is not a guarantee that every future recruitment cycle is identical. The UI therefore separates `Official rule profile` from `Original pattern paper`, and shows the authority, checked date, rules, source link, and a current-notice warning.

## Scoring contract

- Correct WPM uses correctly matched characters divided by five and elapsed minutes; official-reference WPM profiles use this value for speed qualification without inventing a separate accuracy cut-off.
- Gross WPM uses all typed characters divided by five and elapsed minutes.
- KDPH uses correctly matched key depressions and elapsed hours.
- CPCT-style NWPM uses correctly matched words and elapsed minutes.
- RRB practice scoring applies the published 5% mistake allowance and penalty formula. Full-versus-half-mistake classification is an explicit practice estimate because the authority's examination software remains the final evaluator.
- Missing, extra, substituted, and correction counts remain separately visible.
- Optional keystroke limits are Unicode-safe and apply to physical source keys before the expected Unicode comparison text is produced.
- No unverified recruitment-specific deduction rule is silently invented.

## Release checks

An official-reference profile is ready only when:

1. Duration, target speed, scoring unit, correction policy, passage size, and layout/font requirement are linked to a public authority source.
2. Automated tests assert the core rule values.
3. The visible workstation locks official duration and correction settings.
4. A verified environment mismatch blocks Start.
5. Browser QA confirms responsive layout, focus order, disabled states, timer lifecycle, scoring output, and source-link visibility. A 1280×720 active-session check must keep page scroll at zero with both passage and editor visible.
6. The current recruitment notice is rechecked before a public content update or marketing claim.
