import type { UserPreferencesRepository } from "@/application/ports/user-preferences-repository";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/domain/settings/user-preferences";

const STORAGE_KEY = "bhashayantra:user-preferences:v1";

function isPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UserPreferences>;
  return (
    (candidate.typingMode === "simple-smart" ||
      candidate.typingMode === "advanced-classic") &&
    (candidate.outputMode === "unicode" || candidate.outputMode === "legacy") &&
    (candidate.theme === "light" ||
      candidate.theme === "dark" ||
      candidate.theme === "system") &&
    typeof candidate.fontScale === "number" &&
    typeof candidate.suggestionsEnabled === "boolean" &&
    typeof candidate.autocorrectEnabled === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
}

export class LocalUserPreferencesRepository
  implements UserPreferencesRepository
{
  async load(): Promise<UserPreferences> {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return DEFAULT_USER_PREFERENCES;

    try {
      const parsed: unknown = JSON.parse(serialized);
      return isPreferences(parsed) ? parsed : DEFAULT_USER_PREFERENCES;
    } catch {
      return DEFAULT_USER_PREFERENCES;
    }
  }

  async save(preferences: UserPreferences): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }
}
