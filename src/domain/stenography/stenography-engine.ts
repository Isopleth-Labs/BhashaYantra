export interface TranscriptScore {
  readonly expectedWords: number;
  readonly typedWords: number;
  readonly correct: number;
  readonly substitutions: number;
  readonly missing: number;
  readonly extra: number;
  readonly accuracy: number;
}

type EditStep = "match" | "substitution" | "missing" | "extra";

export function tokenizeStenographyText(value: string): readonly string[] {
  return value
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

export function scoreTranscript(expected: string, actual: string): TranscriptScore {
  const expectedWords = tokenizeStenographyText(expected);
  const actualWords = tokenizeStenographyText(actual);
  const rows = expectedWords.length + 1;
  const columns = actualWords.length + 1;
  const cost = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  const matches = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  const step = Array.from({ length: rows }, () => Array<EditStep | null>(columns).fill(null));

  for (let row = 1; row < rows; row += 1) {
    cost[row][0] = row;
    step[row][0] = "missing";
  }
  for (let column = 1; column < columns; column += 1) {
    cost[0][column] = column;
    step[0][column] = "extra";
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const isMatch = expectedWords[row - 1] === actualWords[column - 1];
      const diagonal = cost[row - 1][column - 1] + (isMatch ? 0 : 1);
      const missing = cost[row - 1][column] + 1;
      const extra = cost[row][column - 1] + 1;
      const candidates = [
        { cost: diagonal, matches: matches[row - 1][column - 1] + (isMatch ? 1 : 0), operation: isMatch ? "match" as const : "substitution" as const },
        { cost: missing, matches: matches[row - 1][column], operation: "missing" as const },
        { cost: extra, matches: matches[row][column - 1], operation: "extra" as const },
      ];
      candidates.sort((left, right) => left.cost - right.cost || right.matches - left.matches);
      cost[row][column] = candidates[0].cost;
      matches[row][column] = candidates[0].matches;
      step[row][column] = candidates[0].operation;
    }
  }

  let row = expectedWords.length;
  let column = actualWords.length;
  let correct = 0;
  let substitutions = 0;
  let missing = 0;
  let extra = 0;

  while (row > 0 || column > 0) {
    const operation = step[row][column];
    if (operation === "match") {
      correct += 1;
      row -= 1;
      column -= 1;
    } else if (operation === "substitution") {
      substitutions += 1;
      row -= 1;
      column -= 1;
    } else if (operation === "missing") {
      missing += 1;
      row -= 1;
    } else {
      extra += 1;
      column -= 1;
    }
  }

  const denominator = Math.max(expectedWords.length, actualWords.length, 1);
  return {
    expectedWords: expectedWords.length,
    typedWords: actualWords.length,
    correct,
    substitutions,
    missing,
    extra,
    accuracy: Math.round((correct / denominator) * 1000) / 10,
  };
}

export function dictationIntervalMs(wordsPerMinute: number) {
  const safeWpm = Math.min(240, Math.max(20, wordsPerMinute));
  return Math.round(60_000 / safeWpm);
}

export function calculateTranscriptWpm(typedWords: number, elapsedSeconds: number) {
  if (typedWords <= 0 || elapsedSeconds <= 0) return 0;
  return Math.round((typedWords / elapsedSeconds) * 60);
}
