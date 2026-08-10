# Product Specification

## 1. Product summary

BhashaYantra is a Windows-first desktop suite for users who type Hindi using familiar legacy keyboard habits but need modern Unicode output. It combines typing, conversion, practice, testing, stenography, and customization in one application.

## 2. Target users

- Existing KrutiDev and DevLys typists.
- First-time Hindi typists who prefer natural Roman-phonetic input.
- Court, government-office, and data-entry operators.
- Typing-test and stenography candidates.
- Training institutes and instructors.
- Users converting old documents to Unicode.
- Advanced users who require custom keys and shortcuts.

## 3. Product goals

1. Preserve familiar typing habits while producing correct Unicode Hindi.
2. Remove the need to memorize rare-character Alt codes in Simple Smart Mode.
3. Retain full control for expert users in Advanced Classic Mode.
4. Convert text and supported documents between legacy encodings and Unicode.
5. Provide reliable exam-style typing and stenography measurement.
6. Keep core typing and text conversion usable offline.

## 4. Final navigation

- Start Typing
- Convert Document
- Typing Practice
- Typing Test
- Stenography
- Settings

The start screen contains both typing modes, the Exchange Converter, character browser, shortcut manager, document-converter drop zone, and recent test summary.

## 5. Core functional requirements

### 5.1 Simple Smart Mode

- Default mode for new installations.
- Default profile: `BhashaYantra Smart`.
- Natural Roman-phonetic Hindi input with the product's own versioned rules and dictionary.
- Unicode output by default.
- Automatic matra placement and normalization.
- Automatic reph and half-letter handling.
- Joint-character composition.
- Smart sequence correction.
- Character search and character palette.
- Suggestions and optional autocorrection.
- User can duplicate the default layout and customize the copy.
- Smart, Classic, INSCRIPT, and English QWERTY drafts remain separate when switching layouts.

### 5.2 Advanced Classic Mode

- Normal and Shift mappings.
- Default profile: `Classic Hindi Default` with familiar KrutiDev-style key positions.
- Ctrl/Alt shortcut combinations.
- Searchable rare-character shortcuts.
- User-created shortcuts and mappings.
- Manual sequence control where required.
- Import/export of custom keyboard profiles.
- Reset to protected system defaults.

### 5.3 Multi-profile boundaries

- Typing languages: Hindi and English.
- Ready keyboard layouts: BhashaYantra Smart, Classic Hindi/KrutiDev, Devanagari INSCRIPT, and English QWERTY.
- Validation-pending keyboard layouts: Remington Gail and Remington CBI.
- Ready legacy encoding profile: Kruti Dev 010.
- Validation-pending legacy encoding profiles: DevLys 010 and Shree-Lipi.
- Unicode display fonts: Noto Sans Devanagari, Mangal, Nirmala UI, and Segoe UI for English.
- A profile cannot be enabled until deterministic fixtures validate representative typing and round-trip conversion cases.

### 5.4 Exchange Converter

- Two editors: `KrutiDev / Legacy` and `Unicode`.
- Bidirectional conversion.
- Source and target font selectors.
- Open file, paste, clear, convert, copy, and download actions.
- Character counts for both editors.
- Detect unsupported or ambiguous characters.
- Preserve paragraphs and ordinary punctuation.
- Conversion works locally without account login.
- Conversion history is opt-in.

### 5.5 Document Converter

- Initial supported inputs: `.txt`, `.rtf`, `.doc`, and `.docx`, subject to the selected conversion engine's capabilities.
- Drag-and-drop or file picker.
- Output preview before saving when practical.
- Original file is never overwritten automatically.
- Save to a new filename and show a conversion report.
- Batch conversion is a post-MVP extension unless separately approved.

### 5.6 Typing Practice

- Four ready layout courses: BhashaYantra Smart, Classic Hindi/KrutiDev, Devanagari INSCRIPT, and English QWERTY.
- 300 original exercises per course: 60 key drills, 90 word drills, 90 sentence drills, and 60 paragraph drills.
- Twenty key modules progress through Precision, Alternation, and Fluency Review lessons. Each key lesson is divided into Warm-up, Control, Application, and Checkpoint blocks.
- Professional vocabulary is grouped by real work topics; every word lesson contains at least 28 distinct terms and Recognition, Recall, and Timed Set blocks.
- Every lesson exposes a name, module, objective, difficulty, mastery-accuracy requirement, recommended WPM, estimated duration, and content size.
- Sentence lessons contain at least 70 words and paragraph lessons contain at least 180 words in two-paragraph form.
- 1,200 exercises in catalog version 1, with 160 marked Free and 1,040 marked Pro.
- Every lesson is selectable immediately. Configured mastery accuracy and one-to-three clean saved passes measure progress without blocking another lesson.
- Hindi Unicode-aware comparison.
- WPM, KDPH, accuracy, and error breakdown.
- Weak-key and repeated-error reporting.
- On-screen keyboard, next-key prompt, finger guide, error sound, text-size, and backspace controls.
- Local progress without mandatory login.

### 5.7 Typing Test

- Configurable duration and passage.
- Exam simulation profiles with explicit duration, target speed, scoring model, correction policy, language, tier, verification date, and official source where applicable.
- Official-reference profiles are derived from cited public notices or rules; flexible baselines remain clearly labelled as BhashaYantra practice profiles. Users must still verify their own recruitment cycle.
- Focused workstation separates the scrollable question passage from the large answer editor and hides unrelated dashboard panels.
- Explicit `Ready → Running ↔ Paused → Submitted/Expired` lifecycle; typing and configuration stay locked outside their valid states.
- At least 60 selectable papers per ready layout, with long built-in passages and optional custom Unicode passage input.
- Full/current-word/disabled backspace, word/error/letter/no-highlight, scrollbar, auto-scroll, 150–1,200 word limit, paragraph, tab, correction, font-size, and print controls.
- Correct WPM, gross WPM, NWPM, KDPH, accuracy, missing text, extra text, substitutions, and backspace count.
- A verified layout/font requirement blocks Start until the matching environment is selected.
- Immutable completed-result summary.
- Result history and export.

### 5.8 Stenography

- Original Hindi and English professional dictation sets plus user-supplied local audio.
- 60–140 WPM cue pacing, synthesized voice option, native audio playback, and explicit ready/running/paused/finished session states.
- Unicode transcript editor with offline draft behavior.
- Word-aligned transcript comparison that distinguishes correct, missing, extra, and substituted words.
- Accuracy, transcript WPM, dictation speed, and offline recent-attempt history.
- Recruitment-profile-controlled reading, pause, seek, and timeout rules remain a later validation layer.

### 5.9 User customization

- Keyboard layouts, shortcuts, suggestions, theme, font size, and output defaults.
- Layout catalog separates language, physical keyboard layout, encoding profile, display font, and exam rules.
- System layouts are protected.
- User layouts can be duplicated, renamed, exported, imported, and reset.
- Invalid shortcut conflicts must be reported before saving.

## 6. Data and account behavior

- Account is optional for offline typing and conversion.
- Supabase account enables cross-device settings, saved layouts, history, and future institute features.
- A user can delete cloud history and account-owned records.
- Local-only documents are not uploaded automatically.

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Platform | Windows is the first supported desktop platform |
| Startup | Normal warm start should feel immediate on a typical supported PC |
| Typing latency | Key processing must not visibly lag during continuous typing |
| Correctness | Unicode output is normalized and tested against representative Hindi cases |
| Offline use | Typing, mappings, basic practice, and text conversion remain available offline |
| Security | No service-role or database secret is shipped in the desktop bundle |
| Privacy | Files remain local unless the user explicitly selects a cloud action |
| Accessibility | Keyboard navigation, visible focus, scalable text, and sufficient contrast |
| Recovery | Interrupted conversions must not corrupt or overwrite the source file |
| Auditability | Every scoring profile records which rules produced a result |

## 8. MVP scope

- Windows Tauri desktop shell.
- Final start-screen UI.
- Simple Smart and Advanced Classic mode switching.
- BhashaYantra Smart, Classic Hindi, Devanagari INSCRIPT, and English QWERTY profiles with separate offline drafts.
- Complete 1,200-exercise layout-specific curriculum, configurable exam simulations, local attempt history, and custom mapping layers.
- Text Exchange Converter for KrutiDev 010 and Unicode.
- Character palette and shortcut manager basics.
- Basic typing practice and result calculation.
- Local settings persistence.
- Optional Supabase login and settings sync after local features are stable.

## 9. Outside initial MVP

- macOS, Linux, Android, and iOS releases.
- Institute administration portal and live rankings.
- Subscription and billing.
- AI-generated passages or transcription.
- Every legacy font family.
- Full batch conversion of complex documents.
- System-wide input-method integration in every Windows application.

## 10. MVP acceptance criteria

1. A user can start the desktop app and see the approved reference layout.
2. A user can convert representative KrutiDev text to Unicode and back.
3. A user can type a representative Roman Hindi sentence using BhashaYantra Smart and receive correct Unicode output.
4. A user can switch to the Classic Hindi default mapping without losing either layout's draft.
5. Advanced Classic Mode can save and use a conflict-free custom shortcut.
6. Every ready layout exposes 300 deterministic exercises and converts its source keys to the expected target without catalog warnings.
7. A practice or test attempt produces reproducible WPM, KDPH, accuracy, character-error, and weak-key metrics and can be persisted offline.
8. Exam-style presets are never represented as official rules and show a current-notice warning.
9. No source file is overwritten during document conversion.
10. User-owned cloud data is protected by Row Level Security.
