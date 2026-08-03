import {
  legacyToUnicodePairs,
  preferredUnicodeToLegacyPairs,
} from "./krutidev-map";
import type {
  ConversionDirection,
  ConversionResult,
  ConversionWarning,
} from "./types";

const I_MATRA_MARKER = "\uFFF0";
const REPH_MARKER = "\uFFF1";

function characterCount(value: string) {
  return Array.from(value).length;
}

function isPassThrough(value: string) {
  return /[\s.,!?;:()\-–—/]/u.test(value);
}

function tokenize(
  input: string,
  pairs: readonly (readonly [string, string])[],
  direction: ConversionDirection,
) {
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  const warnings: ConversionWarning[] = [];
  let output = "";
  let cursor = 0;
  let pendingIMatra = false;

  while (cursor < input.length) {
    if (direction === "unicode-to-legacy" && input[cursor] === I_MATRA_MARKER) {
      output += I_MATRA_MARKER;
      cursor += 1;
      continue;
    }

    if (direction === "legacy-to-unicode" && input[cursor] === "f") {
      pendingIMatra = true;
      cursor += 1;
      continue;
    }

    if (direction === "legacy-to-unicode" && input[cursor] === "Z") {
      output += REPH_MARKER;
      cursor += 1;
      continue;
    }

    const pair = sorted.find(([source]) => input.startsWith(source, cursor));
    if (pair) {
      output += pair[1];
      if (pendingIMatra) {
        output += I_MATRA_MARKER;
        pendingIMatra = false;
      }
      cursor += pair[0].length;
      continue;
    }

    const value = Array.from(input.slice(cursor))[0] ?? "";
    output += value;
    if (!isPassThrough(value)) {
      warnings.push({
        code: "unsupported-character",
        index: cursor,
        input: value,
        message: `No ${direction} mapping is available for “${value}”.`,
      });
    }
    cursor += value.length;
  }

  if (pendingIMatra) {
    output += "ि";
    warnings.push({
      code: "lossy-sequence",
      index: Math.max(0, input.length - 1),
      input: "f",
      message: "The short-i marker had no following character.",
    });
  }

  return { output, warnings };
}

function arrangeLegacyMarkers(input: string) {
  return input
    .replaceAll(I_MATRA_MARKER, "ि")
    .replace(
      /([क-हक़-य़](?:्[क-हक़-य़])?)([ािीुूृेैोौंँःॅ]*)\uFFF1/gu,
      "र्$1$2",
    )
    .replaceAll(REPH_MARKER, "र्")
    .normalize("NFC");
}

function prepareUnicodeForLegacy(input: string) {
  return input
    .normalize("NFC")
    .replace(/([क-हक़-य़](?:्[क-हक़-य़])*)ि/gu, `${I_MATRA_MARKER}$1`);
}

function restoreLegacyIMatra(input: string) {
  return input.replaceAll(I_MATRA_MARKER, "f");
}

export function convertText(
  input: string,
  direction: ConversionDirection,
): ConversionResult {
  const normalizedInput = input.replace(/\r\n?/g, "\n");

  const converted =
    direction === "legacy-to-unicode"
      ? tokenize(normalizedInput, legacyToUnicodePairs, direction)
      : tokenize(
          prepareUnicodeForLegacy(normalizedInput),
          preferredUnicodeToLegacyPairs,
          direction,
        );

  const output =
    direction === "legacy-to-unicode"
      ? arrangeLegacyMarkers(converted.output)
      : restoreLegacyIMatra(converted.output);

  return {
    output,
    warnings: converted.warnings,
    inputCharacters: characterCount(normalizedInput),
    outputCharacters: characterCount(output),
  };
}
