insert into public.keyboard_layouts (
  id,
  owner_user_id,
  name,
  language_code,
  layout_kind,
  is_system,
  is_read_only,
  version
)
values (
  '00000000-0000-4000-8000-000000000001',
  null,
  'Classic Hindi Default',
  'hi',
  'classic-hindi',
  true,
  true,
  1
)
on conflict (id) do nothing;

insert into public.key_mappings (
  layout_id,
  physical_key,
  modifier_signature,
  output_sequence,
  priority
)
values
  ('00000000-0000-4000-8000-000000000001', 'KeyD', 'NONE', 'क', 0),
  ('00000000-0000-4000-8000-000000000001', 'BracketLeft', 'NONE', 'ख', 0),
  ('00000000-0000-4000-8000-000000000001', 'KeyX', 'NONE', 'ग', 0),
  ('00000000-0000-4000-8000-000000000001', 'KeyE', 'NONE', 'म', 0),
  ('00000000-0000-4000-8000-000000000001', 'KeyJ', 'NONE', 'र', 0),
  ('00000000-0000-4000-8000-000000000001', 'KeyK', 'NONE', 'ा', 0)
on conflict (layout_id, physical_key, modifier_signature) do nothing;

insert into public.practice_tests (
  id,
  name,
  language_code,
  passage,
  duration_seconds,
  scoring_profile,
  is_system
)
values (
  '00000000-0000-4000-8000-000000000101',
  'Hindi Practice — परिचय',
  'hi',
  'भाषा हमारी पहचान है। हिंदी हमारी राजभाषा है। हमें इसका सम्मान करना चाहिए।',
  300,
  '{"version":"1.0","charactersPerWord":5,"fullMistakePenalty":1,"halfMistakePenalty":0.5}'::jsonb,
  true
)
on conflict (id) do nothing;
