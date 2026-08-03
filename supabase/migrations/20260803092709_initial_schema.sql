CREATE TYPE "public"."conversion_status" AS ENUM('completed', 'completed-with-warnings', 'failed');--> statement-breakpoint
CREATE TYPE "public"."output_mode" AS ENUM('unicode', 'legacy');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."typing_mode" AS ENUM('simple-smart', 'advanced-classic');--> statement-breakpoint
CREATE TABLE "conversion_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_format" text NOT NULL,
	"target_format" text NOT NULL,
	"input_kind" text DEFAULT 'text' NOT NULL,
	"status" "conversion_status" NOT NULL,
	"input_characters" integer DEFAULT 0 NOT NULL,
	"output_characters" integer DEFAULT 0 NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"storage_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_shortcuts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"layout_id" uuid NOT NULL,
	"shortcut_signature" text NOT NULL,
	"output_sequence" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_id" uuid NOT NULL,
	"physical_key" text NOT NULL,
	"modifier_signature" text DEFAULT 'NONE' NOT NULL,
	"output_sequence" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyboard_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"name" text NOT NULL,
	"language_code" text DEFAULT 'hi' NOT NULL,
	"layout_kind" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_read_only" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_id" uuid NOT NULL,
	"duration_ms" integer NOT NULL,
	"gross_keystrokes" integer NOT NULL,
	"correct_keystrokes" integer NOT NULL,
	"error_count" integer NOT NULL,
	"gross_wpm" numeric(8, 2) NOT NULL,
	"net_wpm" numeric(8, 2) NOT NULL,
	"accuracy" numeric(5, 2) NOT NULL,
	"kdph" integer NOT NULL,
	"error_breakdown" jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"language_code" text DEFAULT 'hi' NOT NULL,
	"passage" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"scoring_profile" jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"preferred_language" text DEFAULT 'hi' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "steno_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"audio_reference" text,
	"dictation_wpm" integer NOT NULL,
	"transcription_duration_ms" integer NOT NULL,
	"accuracy" numeric(5, 2) NOT NULL,
	"error_breakdown" jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_dictionary_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"language_code" text DEFAULT 'hi' NOT NULL,
	"source_sequence" text NOT NULL,
	"output_text" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"typing_mode" "typing_mode" DEFAULT 'simple-smart' NOT NULL,
	"active_layout_id" uuid,
	"output_mode" "output_mode" DEFAULT 'unicode' NOT NULL,
	"theme" "theme_mode" DEFAULT 'light' NOT NULL,
	"font_scale" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"suggestions_enabled" boolean DEFAULT true NOT NULL,
	"autocorrect_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_shortcuts" ADD CONSTRAINT "custom_shortcuts_layout_id_keyboard_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."keyboard_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_mappings" ADD CONSTRAINT "key_mappings_layout_id_keyboard_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."keyboard_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_test_id_practice_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."practice_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_active_layout_id_keyboard_layouts_id_fk" FOREIGN KEY ("active_layout_id") REFERENCES "public"."keyboard_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversion_jobs_user_created_idx" ON "conversion_jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_shortcuts_user_layout_signature_uidx" ON "custom_shortcuts" USING btree ("user_id","layout_id","shortcut_signature");--> statement-breakpoint
CREATE INDEX "custom_shortcuts_user_idx" ON "custom_shortcuts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "key_mappings_layout_key_modifiers_uidx" ON "key_mappings" USING btree ("layout_id","physical_key","modifier_signature");--> statement-breakpoint
CREATE INDEX "keyboard_layouts_owner_idx" ON "keyboard_layouts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "practice_attempts_user_completed_idx" ON "practice_attempts" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "steno_sessions_user_completed_idx" ON "steno_sessions" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_dictionary_entry_uidx" ON "user_dictionary_entries" USING btree ("user_id","language_code","source_sequence");