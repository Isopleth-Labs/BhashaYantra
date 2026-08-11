import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const typingMode = pgEnum("typing_mode", [
  "simple-smart",
  "advanced-classic",
]);
export const outputMode = pgEnum("output_mode", ["unicode", "legacy"]);
export const themeMode = pgEnum("theme_mode", ["light", "dark", "system"]);
export const conversionStatus = pgEnum("conversion_status", [
  "completed",
  "completed-with-warnings",
  "failed",
]);
export const accountWorkspaceRole = pgEnum("account_workspace_role", ["student", "institute"]);
export const institutionMemberRole = pgEnum("institution_member_role", ["owner", "admin", "instructor", "student"]);
export const institutionMemberStatus = pgEnum("institution_member_status", ["invited", "active", "suspended"]);
export const accountStatus = pgEnum("account_status", ["trialing", "active", "expired", "suspended"]);
export const planTier = pgEnum("plan_tier", ["free", "pro", "institution"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  username: text("username").notNull(),
  loginEmail: text("login_email").notNull(),
  displayName: text("display_name"),
  accountRole: accountWorkspaceRole("account_role").default("student").notNull(),
  accountStatus: accountStatus("account_status").default("trialing").notNull(),
  planTier: planTier("plan_tier").default("free").notNull(),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }).defaultNow().notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  deviceLimit: integer("device_limit").default(1).notNull(),
  preferredLanguage: text("preferred_language").default("hi").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("profiles_username_lower_uidx").on(sql`lower(${table.username})`)]);

export const registeredDevices = pgTable("registered_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  deviceHash: text("device_hash").notNull(),
  deviceLabel: text("device_label").default("Windows device").notNull(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("registered_devices_user_hash_unique").on(table.userId, table.deviceHash),
  index("registered_devices_user_active_idx").on(table.userId, table.lastSeenAt),
]);

export const institutions = pgTable(
  "institutions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").notNull(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    seatLimit: integer("seat_limit").default(25).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("institutions_code_uidx").on(table.code),
    index("institutions_owner_idx").on(table.ownerUserId),
  ],
);

export const institutionMembers = pgTable(
  "institution_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").notNull(),
    role: institutionMemberRole("role").default("student").notNull(),
    status: institutionMemberStatus("status").default("invited").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("institution_members_institution_user_uidx").on(table.institutionId, table.userId),
    index("institution_members_user_idx").on(table.userId),
  ],
);

export const studentProfiles = pgTable("student_profiles", {
  userId: uuid("user_id").primaryKey(),
  institutionId: uuid("institution_id").references(() => institutions.id, { onDelete: "set null" }),
  candidateId: text("candidate_id"),
  targetExam: text("target_exam"),
  studyLanguage: text("study_language").default("hi").notNull(),
  ...timestamps,
});

export const keyboardLayouts = pgTable(
  "keyboard_layouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id"),
    name: text("name").notNull(),
    languageCode: text("language_code").default("hi").notNull(),
    layoutKind: text("layout_kind").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    isReadOnly: boolean("is_read_only").default(false).notNull(),
    version: integer("version").default(1).notNull(),
    ...timestamps,
  },
  (table) => [index("keyboard_layouts_owner_idx").on(table.ownerUserId)],
);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  typingMode: typingMode("typing_mode").default("simple-smart").notNull(),
  activeLayoutId: uuid("active_layout_id").references(() => keyboardLayouts.id),
  outputMode: outputMode("output_mode").default("unicode").notNull(),
  theme: themeMode("theme").default("light").notNull(),
  fontScale: numeric("font_scale", { precision: 4, scale: 2 })
    .default("1.00")
    .notNull(),
  suggestionsEnabled: boolean("suggestions_enabled").default(true).notNull(),
  autocorrectEnabled: boolean("autocorrect_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const keyMappings = pgTable(
  "key_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    layoutId: uuid("layout_id")
      .references(() => keyboardLayouts.id, { onDelete: "cascade" })
      .notNull(),
    physicalKey: text("physical_key").notNull(),
    modifierSignature: text("modifier_signature").default("NONE").notNull(),
    outputSequence: text("output_sequence").notNull(),
    priority: integer("priority").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("key_mappings_layout_key_modifiers_uidx").on(
      table.layoutId,
      table.physicalKey,
      table.modifierSignature,
    ),
  ],
);

export const customShortcuts = pgTable(
  "custom_shortcuts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    layoutId: uuid("layout_id")
      .references(() => keyboardLayouts.id, { onDelete: "cascade" })
      .notNull(),
    shortcutSignature: text("shortcut_signature").notNull(),
    outputSequence: text("output_sequence").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("custom_shortcuts_user_layout_signature_uidx").on(
      table.userId,
      table.layoutId,
      table.shortcutSignature,
    ),
    index("custom_shortcuts_user_idx").on(table.userId),
  ],
);

export const conversionJobs = pgTable(
  "conversion_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    sourceFormat: text("source_format").notNull(),
    targetFormat: text("target_format").notNull(),
    inputKind: text("input_kind").default("text").notNull(),
    status: conversionStatus("status").notNull(),
    inputCharacters: integer("input_characters").default(0).notNull(),
    outputCharacters: integer("output_characters").default(0).notNull(),
    warnings: jsonb("warnings").$type<readonly unknown[]>().default([]).notNull(),
    storagePath: text("storage_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("conversion_jobs_user_created_idx").on(table.userId, table.createdAt)],
);

export const practiceTests = pgTable("practice_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  languageCode: text("language_code").default("hi").notNull(),
  passage: text("passage").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  scoringProfile: jsonb("scoring_profile")
    .$type<Record<string, unknown>>()
    .notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  ...timestamps,
});

export const practiceAttempts = pgTable(
  "practice_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    testId: uuid("test_id")
      .references(() => practiceTests.id)
      .notNull(),
    durationMs: integer("duration_ms").notNull(),
    grossKeystrokes: integer("gross_keystrokes").notNull(),
    correctKeystrokes: integer("correct_keystrokes").notNull(),
    errorCount: integer("error_count").notNull(),
    grossWpm: numeric("gross_wpm", { precision: 8, scale: 2 }).notNull(),
    netWpm: numeric("net_wpm", { precision: 8, scale: 2 }).notNull(),
    accuracy: numeric("accuracy", { precision: 5, scale: 2 }).notNull(),
    kdph: integer("kdph").notNull(),
    errorBreakdown: jsonb("error_breakdown")
      .$type<Record<string, unknown>>()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("practice_attempts_user_completed_idx").on(
      table.userId,
      table.completedAt,
    ),
  ],
);

export const stenoSessions = pgTable(
  "steno_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    audioReference: text("audio_reference"),
    dictationWpm: integer("dictation_wpm").notNull(),
    transcriptionDurationMs: integer("transcription_duration_ms").notNull(),
    accuracy: numeric("accuracy", { precision: 5, scale: 2 }).notNull(),
    errorBreakdown: jsonb("error_breakdown")
      .$type<Record<string, unknown>>()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("steno_sessions_user_completed_idx").on(
      table.userId,
      table.completedAt,
    ),
  ],
);

export const userDictionaryEntries = pgTable(
  "user_dictionary_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    languageCode: text("language_code").default("hi").notNull(),
    sourceSequence: text("source_sequence").notNull(),
    outputText: text("output_text").notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_dictionary_entry_uidx").on(
      table.userId,
      table.languageCode,
      table.sourceSequence,
    ),
  ],
);
