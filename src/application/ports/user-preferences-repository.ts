import type { UserPreferences } from "@/domain/settings/user-preferences";

export interface UserPreferencesRepository {
  load(userId?: string): Promise<UserPreferences>;
  save(preferences: UserPreferences): Promise<void>;
}
