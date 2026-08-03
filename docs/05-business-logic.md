# Business Logic

## 1. Domain boundaries

Business logic is organized into four independent domains:

1. Keyboard input and Unicode composition.
2. Legacy/Unicode conversion.
3. Typing practice and scoring.
4. Stenography sessions and evaluation.

The domain layer is pure TypeScript wherever native file handling is not required.

## 2. Core domain types

```ts
type TypingMode = "simple-smart" | "advanced-classic";
type OutputMode = "unicode" | "legacy";
type ConversionDirection = "legacy-to-unicode" | "unicode-to-legacy";
type Modifier = "shift" | "ctrl" | "alt" | "alt-graph";

interface KeyStroke {
  code: string;
  modifiers: ReadonlySet<Modifier>;
  timestamp: number;
}

interface ConversionResult {
  output: string;
  warnings: ConversionWarning[];
  inputCharacters: number;
  outputCharacters: number;
}
```

Branded IDs and validated value objects are used for layout IDs, Unicode sequences, shortcut signatures, and scoring profiles.

## 3. Keyboard processing pipeline

```mermaid
flowchart LR
    K["Physical key event"] --> M["Resolve active mapping"]
    M --> MODE{"Typing mode"}
    MODE -->|Simple Smart| S["Smart sequence rules"]
    MODE -->|Advanced Classic| A["Exact shortcut/manual rules"]
    S --> C["Unicode composition"]
    A --> C
    C --> N["Unicode normalization"]
    N --> O["Insert output"]
```

### Simple Smart Mode rules

- Apply the selected Classic Hindi mapping.
- Resolve common intended joint characters.
- Reorder pre-base and post-base matras correctly.
- Handle halant, reph, and half-letter sequences.
- Reject impossible internal states without losing user input.
- Offer suggestions without silently replacing text when confidence is low.

### Advanced Classic Mode rules

- Resolve the most specific enabled shortcut first.
- Preserve explicit manual sequences.
- Report conflicting shortcuts at configuration time.
- Do not apply a smart correction that changes an explicitly mapped output.

## 4. Exchange Converter pipeline

```text
Validate request
    ↓
Select source and target profiles
    ↓
Tokenize using longest valid source sequence
    ↓
Map legacy sequences to logical Unicode units (or reverse)
    ↓
Apply matra, reph, halant, and joint-letter ordering
    ↓
Normalize Unicode output where applicable
    ↓
Collect ambiguous/unsupported-character warnings
    ↓
Return output without mutating the source
```

### Conversion rules

- Mapping data is versioned and testable.
- Longest-match tokenization prevents short mappings from consuming larger valid sequences.
- Unknown characters pass through only when the selected profile permits it; otherwise they produce warnings.
- Line endings and paragraph boundaries are preserved.
- Reverse conversion may be lossy; the result must identify warnings instead of claiming perfect round-trip fidelity.
- History is saved only after explicit user consent/settings.

## 5. Document conversion rules

1. Validate extension, size, and readable path.
2. Open the document without modifying the source.
3. Extract supported text runs while retaining their structural location.
4. Convert only runs associated with the selected source profile.
5. Generate a new output document.
6. Write to a temporary sibling file and then finalize atomically.
7. Return output path, converted-run count, skipped-run count, and warnings.

The UI cannot pass an arbitrary unrestricted file-system operation to Tauri. Native commands accept validated, narrowly scoped inputs.

## 6. Keyboard layout rules

- `BhashaYantra Smart` tokenizes Roman words with longest-match consonant/vowel rules, composes dependent matras and conjuncts, then applies a versioned original word dictionary.
- Smart input preserves Devanagari and punctuation, so palette insertion and mixed text remain safe.
- Smart, Classic, INSCRIPT, and English QWERTY source drafts are stored independently; changing a layout never reinterprets or destroys another layout's source.
- Typing language, keyboard layout, legacy encoding profile, Unicode display font, and interface language are separate typed concepts and must never share one dropdown value.
- Ready profiles are executable. Validation-pending profiles remain visible for roadmap clarity but disabled until a licensed acceptance corpus passes.
- DevLys and Shree-Lipi are conversion profiles, not keyboard layouts. Mangal, Noto Sans Devanagari, and Nirmala UI are display fonts, not encodings.
- Custom shortcuts and physical-key mappings belong to one layout ID; importing a layout file cannot overwrite another layout's custom layer.
- Built-in layout: immutable.
- User customization: clone, then edit.
- Mapping identity: physical key plus canonical modifier signature.
- Shortcut identity: canonical sorted modifier signature plus key/code.
- Empty output is allowed only when explicitly configured as a disabled key.
- Imports are validated for schema version, language, duplicates, and unsafe content.

## 7. Typing scoring

Raw measurements are stored before derived scores:

- elapsed milliseconds;
- total and correct keystrokes;
- submitted grapheme clusters;
- expected grapheme clusters;
- missing, extra, substituted, and transposed units;
- backspace count;
- applied scoring-profile version.

Default display formulas:

```text
Gross WPM = total typed characters / 5 / elapsed minutes
KDPH      = total key depressions / elapsed hours
Accuracy  = correct comparison units / total comparison units × 100
Net WPM   = scoring-profile-specific deduction from Gross WPM
```

Exam-specific full/half-mistake rules must be stored in a versioned scoring profile. The result screen shows which profile was used.

Comparison uses Unicode normalization and grapheme-aware segmentation so a visually equivalent character sequence is not incorrectly penalized merely because of code-point composition.

### Curriculum catalog version 1

- Ready layouts: BhashaYantra Smart, Classic Hindi/KrutiDev, Devanagari INSCRIPT, and English QWERTY.
- Each layout has 60 key drills, 90 word drills, 90 sentence drills, and 60 paragraph drills.
- Canonical Hindi targets are generated through the BhashaYantra Smart engine; Classic and INSCRIPT source keys are obtained through deterministic inverse mappings and then round-trip validated.
- Every exercise has a stable ID, sequence, focus keys, difficulty, estimated duration, tier, and conversion-warning count.
- The content is original project material. Competitor exercises, logos, and proprietary exam screens are not copied.

### Current attempt analysis

- Positional comparison reports correct, missing, extra, and substituted characters.
- WPM uses five source characters per word; KDPH uses typed key depressions per elapsed hour.
- Weak-key analysis ranks expected source keys that were missing or substituted.
- Completed practice and submitted/expired tests are persisted once with an immutable attempt ID and timestamp.
- Full/half-mistake deductions and official-exam-specific net-speed formulas remain a later, separately validated scoring-profile version.

## 8. Stenography state machine

```mermaid
stateDiagram-v2
    [*] --> Ready
    Ready --> Dictation: start
    Dictation --> ReadingTime: audio ends
    ReadingTime --> Transcription: timer ends or allowed start
    Transcription --> Submitted: submit or time expires
    Submitted --> Evaluated: compare and score
    Evaluated --> [*]
```

The selected session profile controls audio speed, pause/seek permissions, reading duration, transcription duration, and scoring.

## 9. Initial application use cases

- `SwitchTypingMode`
- `ProcessKeyStroke`
- `CloneKeyboardLayout`
- `SaveKeyMapping`
- `SaveCustomShortcut`
- `ConvertText`
- `ConvertDocument`
- `StartPracticeAttempt`
- `SubmitPracticeAttempt`
- `StartStenographySession`
- `SubmitStenographyTranscript`
- `UpdateUserPreferences`
- `SyncUserConfiguration`

Each use case accepts a typed request and returns a typed success or application error. It never depends on a React component.

## 10. Test corpus

Before implementation is considered correct, create fixtures for:

- independent vowels and dependent matras;
- half letters and halant sequences;
- reph before/after relevant clusters;
- `क्ष`, `त्र`, `ज्ञ`, `श्र`, and representative conjuncts;
- punctuation, numbers, Latin text, and mixed-script passages;
- malformed legacy sequences;
- round-trip cases marked lossless or intentionally lossy;
- Unicode normalization variants;
- shortcut conflicts and mapping precedence;
- exam scoring examples with manually verified expected results.
