import type { UserPreferencesRepository } from "@/application/ports/user-preferences-repository";
import type { UserPreferences } from "@/domain/settings/user-preferences";
import { supabase } from "@/data/supabase/client";

interface PreferencesRow {
  user_id: string;
  typing_mode: UserPreferences["typingMode"];
  active_layout_id: string | null;
  output_mode: UserPreferences["outputMode"];
  theme: UserPreferences["theme"];
  font_scale: string;
  suggestions_enabled: boolean;
  autocorrect_enabled: boolean;
  updated_at: string;
}

function toDomain(row: PreferencesRow): UserPreferences {
  return {
    userId: row.user_id,
    typingMode: row.typing_mode,
    activeLayoutId: row.active_layout_id ?? undefined,
    outputMode: row.output_mode,
    theme: row.theme,
    fontScale: Number(row.font_scale),
    suggestionsEnabled: row.suggestions_enabled,
    autocorrectEnabled: row.autocorrect_enabled,
    updatedAt: row.updated_at,
  };
}

export class SupabaseUserPreferencesRepository
  implements UserPreferencesRepository
{
  async load(userId?: string): Promise<UserPreferences> {
    if (!supabase || !userId) {
      throw new Error("Supabase authentication is required.");
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select(
        "user_id, typing_mode, active_layout_id, output_mode, theme, font_scale, suggestions_enabled, autocorrect_enabled, updated_at",
      )
      .eq("user_id", userId)
      .single();

    if (error) throw new Error(error.message);
    return toDomain(data as PreferencesRow);
  }

  async save(preferences: UserPreferences): Promise<void> {
    if (!supabase || !preferences.userId) {
      throw new Error("Supabase authentication is required.");
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: preferences.userId,
      typing_mode: preferences.typingMode,
      active_layout_id: preferences.activeLayoutId ?? null,
      output_mode: preferences.outputMode,
      theme: preferences.theme,
      font_scale: preferences.fontScale,
      suggestions_enabled: preferences.suggestionsEnabled,
      autocorrect_enabled: preferences.autocorrectEnabled,
      updated_at: preferences.updatedAt,
    });

    if (error) throw new Error(error.message);
  }
}
