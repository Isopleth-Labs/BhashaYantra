export type ConversionDirection = "legacy-to-unicode" | "unicode-to-legacy";

export interface ConversionWarning {
  readonly code: "unsupported-character" | "lossy-sequence";
  readonly index: number;
  readonly input: string;
  readonly message: string;
}

export interface ConversionResult {
  readonly output: string;
  readonly warnings: readonly ConversionWarning[];
  readonly inputCharacters: number;
  readonly outputCharacters: number;
}
