import type { ConversionResult, ConversionWarning } from "@/domain/conversion/types";

export const INSCRIPT_KEY_MAP: Readonly<Record<string, string>> = {
  q: "ौ", w: "ै", e: "ा", r: "ी", t: "ू", y: "ब", u: "ह", i: "ग", o: "द", p: "ज", "[": "ड", "]": "़", "\\": "ॉ",
  a: "ो", s: "े", d: "्", f: "ि", g: "ु", h: "प", j: "र", k: "क", l: "त", ";": "च", "'": "ट",
  x: "ं", c: "म", v: "न", b: "व", n: "ल", m: "स", ",": ",", ".": ".", "/": "य",
  Q: "औ", W: "ऐ", E: "आ", R: "ई", T: "ऊ", Y: "भ", U: "ङ", I: "घ", O: "ध", P: "झ", "{": "ढ", "}": "ञ", "|": "ऑ",
  A: "ओ", S: "ए", D: "अ", F: "इ", G: "उ", H: "फ", J: "ऱ", K: "ख", L: "थ", ":": "छ", "\"": "ठ",
  X: "ँ", C: "ण", N: "ळ", M: "श", "<": "ष", ">": "।", "?": "य़",
};

function isPassThrough(value: string) {
  return /[\s0-9!@#$%^&*()_+={}\[\]:;"'<>.,?/~`\-–—|\\]/u.test(value) || /[\u0900-\u097f]/u.test(value);
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
