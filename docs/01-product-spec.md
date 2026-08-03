# Product Specification

## 1. Product summary

BhashaYantra is a Windows-first desktop suite for users who type Hindi using familiar legacy keyboard habits but need modern Unicode output. It combines typing, conversion, practice, testing, stenography, and customization in one application.

## 2. Target users

- Existing KrutiDev and DevLys typists.
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
- Default profile: `Classic Hindi Default`.
- Familiar KrutiDev-style key positions.
- Unicode output by default.
- Automatic matra placement and normalization.
- Automatic reph and half-letter handling.
- Joint-character composition.
- Smart sequence correction.
- Character search and character palette.
- Suggestions and optional autocorrection.
- User can duplicate the default layout and customize the copy.

### 5.2 Advanced Classic Mode

- Normal and Shift mappings.
- Ctrl/Alt shortcut combinations.
- Searchable rare-character shortcuts.
- User-created shortcuts and mappings.
- Manual sequence control where required.
- Import/export of custom keyboard profiles.
- Reset to protected system defaults.

### 5.3 Exchange Converter

- Two editors: `KrutiDev / Legacy` and `Unicode`.
- Bidirectional conversion.
- Source and target font selectors.
- Open file, paste, clear, convert, copy, and download actions.
- Character counts for both editors.
- Detect unsupported or ambiguous characters.
- Preserve paragraphs and ordinary punctuation.
- Conversion works locally without account login.
- Conversion history is opt-in.

### 5.4 Document Converter

- Initial supported inputs: `.txt`, `.rtf`, `.doc`, and `.docx`, subject to the selected conversion engine's capabilities.
- Drag-and-drop or file picker.
- Output preview before saving when practical.
- Original file is never overwritten automatically.
- Save to a new filename and show a conversion report.
- Batch conversion is a post-MVP extension unless separately approved.

### 5.5 Typing Practice

- Guided lessons and custom text.
- Hindi Unicode-aware comparison.
- WPM, KDPH, accuracy, and error breakdown.
- Weak-key and repeated-error reporting.
- Local progress without mandatory login.

### 5.6 Typing Test

- Configurable duration and passage.
- Exam profiles with explicit scoring rules.
- Gross speed, net speed, accuracy, full mistakes, half mistakes, missing text, extra text, and backspace count.
- Immutable completed-result summary.
- Result history and export.

### 5.7 Stenography

- Local or supplied dictation audio.
- Playback-speed control.
- Reading time and transcription time.
- Pause/seek permissions controlled by test profile.
- Unicode-aware transcription comparison.
- Speed, accuracy, and mistake report.

### 5.8 User customization

- Keyboard layouts, shortcuts, suggestions, theme, font size, and output defaults.
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
- Classic Hindi default profile and editable user copy.
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
3. A user can type using the Classic Hindi default mapping.
4. Simple Smart Mode correctly handles the agreed matra, reph, and joint-letter test corpus.
5. Advanced Classic Mode can save and use a conflict-free custom shortcut.
6. A practice attempt produces reproducible metrics.
7. No source file is overwritten during document conversion.
8. User-owned cloud data is protected by Row Level Security.
