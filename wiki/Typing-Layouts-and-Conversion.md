# Typing, Layouts and Conversion

## Concepts are kept separate

- **Languages:** Hindi and English.
- **Keyboard layouts:** BhashaYantra Smart, KrutiDev 010 Keyboard (Classic), Devanagari INSCRIPT, Remington GAIL, Remington CBI and English QWERTY.
- **Legacy encodings:** KrutiDev, DevLys and Shree-Lipi families.
- **Unicode display fonts:** Mangal, Noto Sans Devanagari, Nirmala UI and Segoe UI.

BhashaYantra Smart is the product-owned phonetic input engine. KrutiDev is a legacy encoding and a familiar keyboard workflow—not a synonym for Hindi or Unicode.

## Current readiness

- Six selectable typing layouts are implemented with separate drafts, keyboards and course catalogs.
- KrutiDev 010 ↔ Unicode text conversion is working and covered by acceptance fixtures.
- Roman Hindi transliteration is local and offline.
- DevLys and Shree-Lipi remain validation-pending until exact licensed mapping corpora are available.
- Direct Typing is an opt-in development bridge; a signed Windows TSF IME remains the public-distribution target.

No profile should be marked supported until bidirectional mappings, matras, reph, conjuncts, punctuation and round-trip fixtures pass.
