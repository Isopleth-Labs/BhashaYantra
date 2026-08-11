import type { ConversionResult, ConversionWarning } from "@/domain/conversion/types";

export const INSCRIPT_KEY_MAP: Readonly<Record<string, string>> = {
  q: "ौ", w: "ै", e: "ा", r: "ी", t: "ू", y: "ब", u: "ह", i: "ग", o: "द", p: "ज", "[": "ड", "]": "़", "\\": "ॉ", "=": "ृ",
  a: "ो", s: "े", d: "्", f: "ि", g: "ु", h: "प", j: "र", k: "क", l: "त", ";": "च", "'": "ट",
  x: "ं", c: "म", v: "न", b: "व", n: "ल", m: "स", ",": ",", ".": ".", "/": "य",
  Q: "औ", W: "ऐ", E: "आ", R: "ई", T: "ऊ", Y: "भ", U: "ङ", I: "घ", O: "ध", P: "झ", "{": "ढ", "}": "ञ", "|": "ऑ", "+": "ऋ",
  A: "ओ", S: "ए", D: "अ", F: "इ", G: "उ", H: "फ", J: "ऱ", K: "ख", L: "थ", ":": "छ", "\"": "ठ",
  X: "ँ", C: "ण", N: "ळ", M: "श", "<": "ष", ">": "।", "?": "य़",
};

// Base/Shift layer adapted from SIL Global's MIT-licensed Remington GAIL map.
// Unicode GAIL enters the short-i matra after its consonant (d + f = कि).
export const REMINGTON_GAIL_KEY_MAP: Readonly<Record<string, string>> = {
  "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "0": "0",
  "!": "।", "@": "/", "#": "ः", "$": "*", "%": "-", "^": "‘", "&": "’", "*": "द्ध", "(": "त्र", ")": "ऋ",
  "-": ";", "_": ".", "=": "ृ", "+": "्",
  q: "ु", w: "ू", e: "म", r: "त", t: "ज", y: "ल", u: "न", i: "प", o: "व", p: "च", "[": "ख्", "]": ",", "\\": "(",
  Q: "फ", W: "ॅ", E: "म्", R: "त्", T: "ज्", Y: "ल्", U: "न्", I: "प्", O: "व्", P: "च्", "{": "क्ष्", "}": "द्व", "|": ")",
  a: "ं", s: "े", d: "क", f: "ि", g: "ह", h: "ी", j: "र", k: "ा", l: "स", ";": "य", "'": "श्", "`": "़",
  A: "ा", S: "ै", D: "क्", F: "थ्", G: "ळ", H: "भ्", J: "श्र", K: "ज्ञ", L: "स्", ":": "रू", "\"": "ष्", "~": "द्य",
  z: "्र", x: "ग", c: "ब", v: "अ", b: "इ", n: "द", m: "उ", ",": "ए", ".": "ण्", "/": "ध्",
  Z: "र्", X: "ग्", C: "ब्", V: "ट", B: "ठ", N: "छ", M: "ड", "<": "ढ", ">": "झ", "?": "घ्",
};

function isPassThrough(value: string) {
  return /[\s0-9!@#$%^&*()_+={}\[\]:;"'<>.,?/~`\-–—|\\]/u.test(value) || /[\u0900-\u097f]/u.test(value);
}

function isInversePassThrough(value: string) {
  return /[\s0-9!@#$%^&*()_+={}\[\]:;"'<>.,?/~`\-–—|\\]/u.test(value);
}

export function directLayoutToUnicode(input: string, keyMap: Readonly<Record<string, string>>): ConversionResult {
  const normalizedInput = input.replace(/\r\n?/g, "\n");
  const warnings: ConversionWarning[] = [];
  let output = "";
  let index = 0;

  for (const value of Array.from(normalizedInput)) {
    const mapped = keyMap[value];
    if (mapped !== undefined) {
      output += mapped;
    } else {
      output += value;
      if (!isPassThrough(value)) {
        warnings.push({
          code: "unsupported-character",
          index,
          input: value,
          message: `No direct-layout mapping is available for “${value}”.`,
        });
      }
    }
    index += value.length;
  }

  return {
    output: output.normalize("NFC"),
    warnings,
    inputCharacters: Array.from(normalizedInput).length,
    outputCharacters: Array.from(output.normalize("NFC")).length,
  };
}

export function englishQwertyToUnicode(input: string): ConversionResult {
  const output = input.replace(/\r\n?/g, "\n").normalize("NFC");
  return {
    output,
    warnings: [],
    inputCharacters: Array.from(output).length,
    outputCharacters: Array.from(output).length,
  };
}

export function unicodeToDirectLayout(input: string, keyMap: Readonly<Record<string, string>>): ConversionResult {
  const inverseMap = new Map<string, string>();
  for (const [key, value] of Object.entries(keyMap)) {
    if (!inverseMap.has(value)) inverseMap.set(value, key);
  }

  const inverseEntries = [...inverseMap.entries()].sort((left, right) => right[0].length - left[0].length);
  const normalizedInput = input.replace(/\r\n?/g, "\n").normalize("NFC");
  const warnings: ConversionWarning[] = [];
  let output = "";
  let cursor = 0;

  while (cursor < normalizedInput.length) {
    const pair = inverseEntries.find(([value]) => normalizedInput.startsWith(value, cursor));
    if (pair) {
      output += pair[1];
      cursor += pair[0].length;
      continue;
    }

    const value = Array.from(normalizedInput.slice(cursor))[0] ?? "";
    output += value;
    if (!isInversePassThrough(value)) {
      warnings.push({
        code: "unsupported-character",
        index: cursor,
        input: value,
        message: `No inverse direct-layout mapping is available for “${value}”.`,
      });
    }
    cursor += value.length;
  }

  return {
    output,
    warnings,
    inputCharacters: Array.from(normalizedInput).length,
    outputCharacters: Array.from(output).length,
  };
}

function composeRemingtonUnicode(value: string) {
  return value
    .replace(/([क-हक़-य़])्ा/gu, "$1")
    .replaceAll("अा", "आ")
    .replaceAll("आॅ", "ऑ")
    .replaceAll("आे", "ओ")
    .replaceAll("आै", "औ")
    .replaceAll("ाॅ", "ॉ")
    .replaceAll("ाे", "ो")
    .replaceAll("ाै", "ौ")
    .replaceAll("एॅ", "ऍ")
    .replaceAll("एे", "ऐ")
    .replaceAll("इी", "ई")
    .replaceAll("उु", "ऊ")
    .replaceAll("ॅं", "ँ")
    .normalize("NFC");
}

function expandRemingtonUnicode(value: string) {
  return value
    .normalize("NFC")
    .replaceAll("ऑ", "अाॅ")
    .replaceAll("ओ", "अाे")
    .replaceAll("औ", "अाै")
    .replaceAll("आ", "अा")
    .replaceAll("ऍ", "एॅ")
    .replaceAll("ऐ", "एे")
    .replaceAll("ई", "इी")
    .replaceAll("ऊ", "उु")
    .replaceAll("ँ", "ॅं")
    .replaceAll("ॉ", "ाॅ")
    .replaceAll("ो", "ाे")
    .replaceAll("ौ", "ाै")
    .replace(/[खघणथधभशष]/gu, (character) => `${character}्ा`);
}

export function remingtonCbiToUnicode(input: string): ConversionResult {
  const converted = directLayoutToUnicode(input, REMINGTON_GAIL_KEY_MAP);
  const output = composeRemingtonUnicode(converted.output);
  return {
    ...converted,
    output,
    outputCharacters: Array.from(output).length,
  };
}

export function unicodeToRemingtonCbi(input: string): ConversionResult {
  const converted = unicodeToDirectLayout(expandRemingtonUnicode(input), REMINGTON_GAIL_KEY_MAP);
  return {
    ...converted,
    inputCharacters: Array.from(input.replace(/\r\n?/g, "\n").normalize("NFC")).length,
  };
}

export function remingtonGailToUnicode(input: string): ConversionResult {
  const converted = directLayoutToUnicode(input, REMINGTON_GAIL_KEY_MAP);
  const output = composeRemingtonUnicode(converted.output);
  return {
    ...converted,
    output,
    outputCharacters: Array.from(output).length,
  };
}

export function unicodeToRemingtonGail(input: string): ConversionResult {
  const converted = unicodeToDirectLayout(expandRemingtonUnicode(input), REMINGTON_GAIL_KEY_MAP);
  return {
    ...converted,
    inputCharacters: Array.from(input.replace(/\r\n?/g, "\n").normalize("NFC")).length,
  };
}
