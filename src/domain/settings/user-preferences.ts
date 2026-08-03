export type TypingMode = "simple-smart" | "advanced-classic";
export type OutputMode = "unicode" | "legacy";
export type ThemeMode = "light" | "dark" | "system";

export interface UserPreferences {
  readonly userId?: string;
  readonly typingMode: TypingMode;
  readonly activeLayoutId?: string;
  readonly outputMode: OutputMode;
  readonly theme: ThemeMode;
  readonly fontScale: number;
  readonly suggestionsEnabled: boolean;
  readonly autocorrectEnabled: boolean;
  readonly updatedAt: string;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  typingMode: "simple-smart",
  outputMode: "unicode",
  theme: "light",
  fontScale: 1,
  suggestionsEnabled: true,
  autocorrectEnabled: true,
  updatedAt: new Date(0).toISOString(),
};
