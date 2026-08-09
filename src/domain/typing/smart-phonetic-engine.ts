import type { ConversionResult } from "@/domain/conversion/types";
import { HINDI_PROFESSIONAL_LEXICON } from "@/domain/typing/hindi-professional-lexicon";

const VIRAMA = "्";

export const SMART_PHONETIC_DICTIONARY: Readonly<Record<string, string>> = {
  ...HINDI_PROFESSIONAL_LEXICON,
  aadhar: "आधार",
  aaj: "आज",
  abhyas: "अभ्यास",
  adhikar: "अधिकार",
  apna: "अपना",
  aap: "आप",
  aur: "और",
  avsar: "अवसर",
  bhaarat: "भारत",
  bharat: "भारत",
  bhasha: "भाषा",
  bhashayantra: "भाषायंत्र",
  bhi: "भी",
  chhote: "छोटे",
  dhanyavaad: "धन्यवाद",
  dhanyavad: "धन्यवाद",
  desh: "देश",
  dekhen: "देखें",
  dhyan: "ध्यान",
  din: "दिन",
  galti: "गलती",
  gati: "गति",
  gyan: "ज्ञान",
  har: "हर",
  hamari: "हमारी",
  hai: "है",
  hain: "हैं",
  ham: "हम",
  hindi: "हिन्दी",
  hum: "हम",
  jeevan: "जीवन",
  kaam: "काम",
  ka: "का",
  ke: "के",
  ki: "की",
  ko: "को",
  krutidev: "कृतिदेव",
  kary: "कार्य",
  kare: "करे",
  karen: "करें",
  koshish: "कोशिश",
  kal: "कल",
  lakshya: "लक्ष्य",
  late: "लाते",
  liye: "लिए",
  main: "मैं",
  me: "में",
  mein: "में",
  mera: "मेरा",
  mere: "मेरे",
  meri: "मेरी",
  mehnat: "मेहनत",
  milta: "मिलता",
  milti: "मिलती",
  naam: "नाम",
  nam: "नाम",
  namaste: "नमस्ते",
  nahi: "नहीं",
  naya: "नया",
  naukari: "नौकरी",
  niyam: "नियम",
  nyay: "न्याय",
  pariksha: "परीक्षा",
  parinam: "परिणाम",
  pahle: "पहले",
  pragati: "प्रगति",
  pratidin: "प्रतिदिन",
  prayas: "प्रयास",
  pura: "पूरा",
  rakhen: "रखें",
  roz: "रोज",
  safal: "सफल",
  safalta: "सफलता",
  sahi: "सही",
  samay: "समय",
  saral: "सरल",
  sath: "साथ",
  se: "से",
  shabd: "शब्द",
  shiksha: "शिक्षा",
  shuddh: "शुद्ध",
  shuddhata: "शुद्धता",
  sikhen: "सीखें",
  sudhar: "सुधार",
  taiyari: "तैयारी",
  tez: "तेज",
  text: "टेक्स्ट",
  typing: "टाइपिंग",
  unicode: "यूनिकोड",
  upyog: "उपयोग",
  vidya: "विद्या",
  vishvas: "विश्वास",
  word: "वर्ड",
  yantra: "यंत्र",
  yah: "यह",
  ye: "यह",
  den: "दें",
  hota: "होता",
  zaruri: "जरूरी",
};

const INDEPENDENT_VOWELS: Readonly<Record<string, string>> = {
  aa: "आ",
  ai: "ऐ",
  au: "औ",
  ee: "ई",
  ii: "ई",
  oo: "ऊ",
  uu: "ऊ",
  ri: "ऋ",
  a: "अ",
  i: "इ",
  u: "उ",
  e: "ए",
  o: "ओ",
};

const VOWEL_SIGNS: Readonly<Record<string, string>> = {
  aa: "ा",
  ai: "ै",
  au: "ौ",
  ee: "ी",
  ii: "ी",
  oo: "ू",
  uu: "ू",
  ri: "ृ",
  a: "",
  i: "ि",
  u: "ु",
  e: "े",
  o: "ो",
};

const CONSONANTS: Readonly<Record<string, string>> = {
  ksh: "क्ष",
  chh: "छ",
  ddh: "ढ",
  tth: "ठ",
  shr: "श्र",
  gya: "ज्ञ",
  jny: "ज्ञ",
  kh: "ख",
  gh: "घ",
  ng: "ङ",
  ch: "च",
  jh: "झ",
  ny: "ञ",
  tt: "ट",
  th: "थ",
  dd: "ड",
  dh: "ध",
  nn: "ण",
  ph: "फ",
  bh: "भ",
  sh: "श",
  ss: "ष",
  tr: "त्र",
  gy: "ज्ञ",
  k: "क",
  g: "ग",
  c: "च",
  j: "ज",
  t: "त",
  d: "द",
  n: "न",
  p: "प",
  f: "फ",
  b: "ब",
  m: "म",
  y: "य",
  r: "र",
  l: "ल",
  v: "व",
  w: "व",
  s: "स",
  h: "ह",
  q: "क़",
  x: "क्ष",
  z: "ज़",
};

const CASE_SENSITIVE_CONSONANTS: Readonly<Record<string, string>> = {
  Th: "ठ",
  Dh: "ढ",
  T: "ट",
  D: "ड",
  N: "ण",
};

const vowelTokens = Object.keys(INDEPENDENT_VOWELS).sort((left, right) => right.length - left.length);
const consonantTokens = Object.keys(CONSONANTS).sort((left, right) => right.length - left.length);
const caseSensitiveTokens = Object.keys(CASE_SENSITIVE_CONSONANTS).sort((left, right) => right.length - left.length);

function characterCount(value: string) {
  return Array.from(value).length;
}

function transliterateRomanWord(word: string) {
  const dictionaryMatch = SMART_PHONETIC_DICTIONARY[word.toLocaleLowerCase()];
  if (dictionaryMatch) return dictionaryMatch;

  let output = "";
  let pendingConsonant = "";
  let cursor = 0;

  function flushPending(withVirama: boolean) {
    if (!pendingConsonant) return;
    output += `${pendingConsonant}${withVirama ? VIRAMA : ""}`;
    pendingConsonant = "";
  }

  while (cursor < word.length) {
    const remaining = word.slice(cursor);
    const caseToken = caseSensitiveTokens.find((token) => remaining.startsWith(token));
    if (caseToken) {
      flushPending(true);
      pendingConsonant = CASE_SENSITIVE_CONSONANTS[caseToken];
      cursor += caseToken.length;
      continue;
    }

    const lowerRemaining = remaining.toLocaleLowerCase();
    const vowel = vowelTokens.find((token) => lowerRemaining.startsWith(token));
    if (vowel) {
      if (pendingConsonant) {
        output += `${pendingConsonant}${VOWEL_SIGNS[vowel]}`;
        pendingConsonant = "";
      } else {
        output += INDEPENDENT_VOWELS[vowel];
      }
      cursor += vowel.length;
      continue;
    }

    const consonant = consonantTokens.find((token) => lowerRemaining.startsWith(token));
    if (consonant) {
      flushPending(true);
      pendingConsonant = CONSONANTS[consonant];
      cursor += consonant.length;
      continue;
    }

    flushPending(false);
    output += remaining[0];
    cursor += 1;
  }

  flushPending(false);
  return output.normalize("NFC");
}

export function smartPhoneticToUnicode(input: string): ConversionResult {
  const normalizedInput = input.replace(/\r\n?/g, "\n");
  const output = (normalizedInput.match(/[A-Za-z]+|[^A-Za-z]+/gu) ?? [])
    .map((segment) => /^[A-Za-z]+$/u.test(segment) ? transliterateRomanWord(segment) : segment)
    .join("")
    .normalize("NFC");

  return {
    output,
    warnings: [],
    inputCharacters: characterCount(normalizedInput),
    outputCharacters: characterCount(output),
  };
}
