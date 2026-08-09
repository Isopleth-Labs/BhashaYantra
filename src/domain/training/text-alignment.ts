export type TextAlignmentKind = "correct" | "substitution" | "missing" | "extra";

export interface TextAlignmentOperation {
  readonly kind: TextAlignmentKind;
  readonly expected?: string;
  readonly actual?: string;
  readonly expectedIndex?: number;
  readonly actualIndex?: number;
}

const RESYNC_WINDOW = 6;

function nextMatch(values: readonly string[], start: number, target: string) {
  const end = Math.min(values.length, start + RESYNC_WINDOW + 1);
  for (let index = start + 1; index < end; index += 1) {
    if (values[index] === target) return index - start;
  }
  return undefined;
}

/** Keeps one omitted or extra character from shifting the whole typed paper. */
export function alignText(expectedText: string, actualText: string): readonly TextAlignmentOperation[] {
  const expected = Array.from(expectedText);
  const actual = Array.from(actualText);
  const operations: TextAlignmentOperation[] = [];
  let expectedIndex = 0;
  let actualIndex = 0;

  while (expectedIndex < expected.length && actualIndex < actual.length) {
    if (expected[expectedIndex] === actual[actualIndex]) {
      operations.push({ kind: "correct", expected: expected[expectedIndex], actual: actual[actualIndex], expectedIndex, actualIndex });
      expectedIndex += 1;
      actualIndex += 1;
      continue;
    }

    const missingDistance = nextMatch(expected, expectedIndex, actual[actualIndex]);
    const extraDistance = nextMatch(actual, actualIndex, expected[expectedIndex]);
    if (missingDistance !== undefined && (extraDistance === undefined || missingDistance <= extraDistance)) {
      for (let offset = 0; offset < missingDistance; offset += 1) {
        operations.push({ kind: "missing", expected: expected[expectedIndex], expectedIndex, actualIndex });
        expectedIndex += 1;
      }
      continue;
    }
    if (extraDistance !== undefined) {
      for (let offset = 0; offset < extraDistance; offset += 1) {
        operations.push({ kind: "extra", actual: actual[actualIndex], expectedIndex, actualIndex });
        actualIndex += 1;
      }
      continue;
    }

    operations.push({ kind: "substitution", expected: expected[expectedIndex], actual: actual[actualIndex], expectedIndex, actualIndex });
    expectedIndex += 1;
    actualIndex += 1;
  }

  while (expectedIndex < expected.length) {
    operations.push({ kind: "missing", expected: expected[expectedIndex], expectedIndex });
    expectedIndex += 1;
  }
  while (actualIndex < actual.length) {
    operations.push({ kind: "extra", actual: actual[actualIndex], actualIndex });
    actualIndex += 1;
  }
  return operations;
}
