# Frontend Design System

## 1. Approved reference

The final visual reference is [bhashayantra-final-reference.png](assets/bhashayantra-final-reference.png).

The implementation must preserve its information hierarchy. The central keyboard layout and typing-demo region has been replaced by the Exchange Converter. The top layout selector remains available because it controls typing behavior elsewhere in the product.

## 2. Design principles

- Familiar rather than experimental.
- High information density without visual clutter.
- Hindi and English receive equal typographic care.
- Primary actions are obvious; destructive actions are visibly distinct.
- Advanced controls exist without overwhelming Simple Smart Mode users.
- Every interaction works by keyboard as well as pointer.

## 3. Application shell

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo + top controls + Windows actions                       │
├──────────────┬─────────────────────────────┬────────────────┤
│ Left nav     │ Main workspace              │ Right rail     │
│              │ Mode switch                 │ Shortcuts      │
│              │ Exchange Converter          │ File convert   │
│              │ Character browser           │ Test summary   │
└──────────────┴─────────────────────────────┴────────────────┘
```

- Desktop-first minimum target width: 1280 px.
- At narrower supported widths, the right rail becomes a drawer before the main converter becomes unusably narrow.
- Left navigation can collapse to icons only.
- Main text editors remain side by side when enough space exists and stack vertically only at compact widths.

## 4. Typography

### UI font

`Inter` for Latin UI labels, numbers, and controls.

Fallback:

```css
font-family: Inter, "Segoe UI", system-ui, sans-serif;
```

### Devanagari font

`Noto Sans Devanagari` for Unicode Hindi content and examples.

Fallback:

```css
font-family: "Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif;
```

### Legacy preview font

The selected legacy font is applied only inside the legacy editor/preview. It must not replace the application UI font.

### Type scale

| Token | Size / line height | Use |
|---|---|---|
| `display` | 30/38 | Primary workspace title |
| `heading-1` | 24/32 | Screen title |
| `heading-2` | 18/26 | Card title |
| `body` | 14/22 | Standard UI text |
| `label` | 13/18 | Inputs and compact controls |
| `caption` | 12/16 | Counts, hints, metadata |
| `editor` | 20/34 | Hindi conversion text |

## 5. Color themes

### Light theme — default

| Token | Value | Use |
|---|---|---|
| `background` | `#F8FAFC` | App background |
| `surface` | `#FFFFFF` | Cards and editors |
| `foreground` | `#0F172A` | Main text |
| `muted` | `#64748B` | Secondary text |
| `border` | `#E2E8F0` | Dividers and fields |
| `primary` | `#0B63F6` | Active navigation and primary actions |
| `primary-hover` | `#0954D1` | Primary hover |
| `legacy` | `#F97316` | KrutiDev/legacy identity |
| `unicode` | `#15803D` | Unicode identity and success |
| `danger` | `#DC2626` | Clear/delete/error |
| `focus` | `#2563EB` | Focus ring |

### Dark theme — supported after MVP UI parity

| Token | Value |
|---|---|
| `background` | `#08111F` |
| `surface` | `#0F1B2D` |
| `foreground` | `#F8FAFC` |
| `muted` | `#94A3B8` |
| `border` | `#26364D` |
| `primary` | `#4F8CFF` |
| `legacy` | `#FB923C` |
| `unicode` | `#4ADE80` |
| `danger` | `#F87171` |

Colors are implemented as semantic CSS variables consumed by Tailwind and shadcn/ui. Feature code does not hardcode raw hex values.

## 6. Spacing and shape

- Base spacing unit: 4 px.
- Common gaps: 8, 12, 16, 24, and 32 px.
- Input/control height: 40 px; compact controls: 32 px.
- Card radius: 12 px.
- Input/button radius: 8 px.
- Border: 1 px neutral border.
- Shadows: subtle elevation only for floating surfaces; ordinary cards use border rather than heavy shadow.

## 7. Exchange Converter specification

### Header

- Title: `Exchange Converter`.
- Subtitle: `KrutiDev and Unicode conversion`.
- Direction/status chip: `KrutiDev ↔ Unicode`.

### Left editor

- Identity color: legacy orange.
- Heading: `KrutiDev / Legacy`.
- Font selector: default `Kruti Dev 010`.
- Actions: open file, paste, clear.

### Center controls

- Bidirectional swap button.
- Primary `Convert` button in BhashaYantra blue.
- Swap changes direction and editor roles without losing text.

### Right editor

- Identity color: Unicode green.
- Heading: `Unicode`.
- Font selector: default `Noto Sans Devanagari`.
- Actions: copy and download.

### States

- Empty editors include short instructional placeholders.
- Converting state disables duplicate submission and shows progress.
- Warnings appear beneath the affected editor and remain accessible to screen readers.
- Success is not communicated by color alone.
- Clear is destructive and requires confirmation only when meaningful unsaved input exists.

## 8. shadcn/ui component policy

Use project-owned shadcn component source for:

- Button
- Card
- Input and Textarea
- Select
- Tabs
- Dialog and Alert Dialog
- Dropdown Menu
- Tooltip
- Toast/Sonner equivalent selected during setup
- Sheet for compact right rail
- Table
- Progress
- Switch

Feature-specific components compose these primitives. Do not modify primitive behavior inside individual feature folders; update the shared component or create a clearly named variant.

## 9. Interaction standards

- Visible focus ring for every interactive element.
- `Tab` order follows visual reading order.
- Icon-only buttons have accessible labels and tooltips.
- Primary actions use verbs: Convert, Save, Download, Start Test.
- Loading operations preserve layout to avoid jumps.
- Form errors appear beside the relevant input and in a summary when submission fails.
- Keyboard shortcuts never override common OS shortcuts without explicit user configuration.

## 10. Hindi and localization rules

- UI strings are stored outside components.
- Devanagari content must not be clipped at the top or bottom.
- Line heights are tested with matras above and below the base character.
- Do not apply letter-spacing to Devanagari text.
- Use Unicode normalization only in domain processing, not as a visual CSS workaround.
- All screenshots and test fixtures use meaningful Hindi rather than random glyph strings.

## 11. Screen inventory

| Screen | Primary purpose |
|---|---|
| Start Typing | Modes, Exchange Converter, characters, shortcuts, recent summary |
| Convert Document | File conversion, preview, warnings, save report |
| Typing Practice | Lessons, custom passage, live metrics |
| Typing Test | Exam profile, timer, passage, submission, result |
| Stenography | Audio, timing phases, transcript, evaluation |
| Settings | Language, layout, theme, fonts, suggestions, privacy, account |
| Keyboard Layout Editor | Key mapping, shortcut conflicts, import/export |
| Reports | Progress, attempts, weak keys, downloadable summaries |

## 12. Visual QA checklist

- Compare implementation beside the approved reference at desktop width.
- Confirm main column, right rail, and navigation proportions.
- Verify both editor areas at 100%, 125%, and 150% Windows scaling.
- Test Hindi glyph clipping in every control.
- Check light-theme contrast and all focus states.
- Confirm no on-screen keyboard or Typing Demo appears in the final start-screen center region.
