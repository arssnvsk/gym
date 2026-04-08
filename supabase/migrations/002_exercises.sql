-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.exercises (
  id                text PRIMARY KEY,
  name              text NOT NULL,
  icon              text NOT NULL,
  category          text NOT NULL,
  primary_muscles   text[] NOT NULL DEFAULT '{}',
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  is_custom         boolean NOT NULL DEFAULT false,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercises_category_idx   ON public.exercises(category);
CREATE INDEX IF NOT EXISTS exercises_sort_order_idx ON public.exercises(sort_order);
CREATE INDEX IF NOT EXISTS exercises_user_id_idx    ON public.exercises(user_id);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Built-in exercises visible to all authenticated users;
-- custom exercises visible only to their owner
CREATE POLICY "exercises_select" ON public.exercises
  FOR SELECT USING (is_custom = false OR (auth.uid() IS NOT NULL AND user_id = auth.uid()));

CREATE POLICY "exercises_insert" ON public.exercises
  FOR INSERT WITH CHECK (is_custom = true AND auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "exercises_update" ON public.exercises
  FOR UPDATE USING (is_custom = true AND user_id = auth.uid());

CREATE POLICY "exercises_delete" ON public.exercises
  FOR DELETE USING (is_custom = true AND user_id = auth.uid());

-- ── Seed built-in exercises ─────────────────────────────────────────────────
INSERT INTO public.exercises
  (id, name, icon, category, primary_muscles, secondary_muscles, is_custom, user_id, sort_order)
VALUES
-- Chest
('bench_press',           'Жим лёжа',                        '🏋️', 'chest',     ARRAY['chest','triceps','front_delts'],          ARRAY[]::text[],                          false, NULL,  1),
('incline_press',         'Жим наклонный',                   '📐', 'chest',     ARRAY['chest','front_delts','triceps'],          ARRAY[]::text[],                          false, NULL,  2),
('decline_press',         'Жим на наклонной вниз',           '📉', 'chest',     ARRAY['chest','triceps'],                        ARRAY['front_delts'],                     false, NULL,  3),
('dumbbell_fly',          'Разводка гантелей лёжа',          '🦅', 'chest',     ARRAY['chest'],                                  ARRAY['front_delts','biceps'],            false, NULL,  4),
('cable_fly',             'Сведения на блоке',               '🔗', 'chest',     ARRAY['chest'],                                  ARRAY['front_delts'],                     false, NULL,  5),
('push_up',               'Отжимания',                       '🤸', 'chest',     ARRAY['chest','triceps','front_delts'],          ARRAY['abs'],                             false, NULL,  6),
('pec_deck',              'Тренажёр бабочка',                '🦋', 'chest',     ARRAY['chest'],                                  ARRAY['front_delts'],                     false, NULL,  7),
('dip',                   'Отжимания на брусьях',            '🔽', 'chest',     ARRAY['chest','triceps'],                        ARRAY['front_delts'],                     false, NULL,  8),
-- Legs
('squat',                 'Приседания со штангой',           '🦵', 'legs',      ARRAY['quads','glutes'],                         ARRAY['hamstrings','lower_back','calves'], false, NULL,  9),
('leg_press',             'Жим платформы ногами',            '🦿', 'legs',      ARRAY['quads','glutes'],                         ARRAY['hamstrings','calves'],             false, NULL, 10),
('romanian_deadlift',     'Румынская тяга',                  '🇷🇴','legs',      ARRAY['hamstrings','glutes'],                    ARRAY['lower_back','calves'],             false, NULL, 11),
('leg_curl',              'Сгибание ног лёжа',               '🌀', 'legs',      ARRAY['hamstrings'],                             ARRAY['glutes','calves'],                 false, NULL, 12),
('leg_extension',         'Разгибание ног',                  '🦾', 'legs',      ARRAY['quads'],                                  ARRAY[]::text[],                          false, NULL, 13),
('calf_raise',            'Подъём на носки',                 '👣', 'legs',      ARRAY['calves'],                                 ARRAY[]::text[],                          false, NULL, 14),
('lunge',                 'Выпады',                          '🚶', 'legs',      ARRAY['quads','glutes'],                         ARRAY['hamstrings','calves'],             false, NULL, 15),
('hack_squat',            'Гакк-приседания',                 '⚙️', 'legs',      ARRAY['quads','glutes'],                         ARRAY['hamstrings','calves'],             false, NULL, 16),
('front_squat',           'Приседания со штангой спереди',   '🏅', 'legs',      ARRAY['quads'],                                  ARRAY['glutes','abs','upper_back'],       false, NULL, 17),
('glute_bridge',          'Ягодичный мостик',                '🍑', 'legs',      ARRAY['glutes','hamstrings'],                    ARRAY['lower_back','calves'],             false, NULL, 18),
-- Back
('deadlift',              'Становая тяга',                   '⚡', 'back',      ARRAY['lower_back','glutes','hamstrings'],        ARRAY['quads','upper_back','lats','forearms'], false, NULL, 19),
('barbell_row',           'Тяга штанги в наклоне',           '🔄', 'back',      ARRAY['lats','upper_back'],                      ARRAY['biceps','rear_delts','lower_back','forearms'], false, NULL, 20),
('lat_pulldown',          'Тяга верхнего блока',             '⬇️', 'back',      ARRAY['lats'],                                   ARRAY['biceps','upper_back','rear_delts'], false, NULL, 21),
('pull_up',               'Подтягивания',                    '🆙', 'back',      ARRAY['lats','biceps'],                          ARRAY['upper_back','rear_delts','forearms'], false, NULL, 22),
('cable_row',             'Горизонтальная тяга блока',       '↔️', 'back',      ARRAY['lats','upper_back'],                      ARRAY['biceps','rear_delts'],             false, NULL, 23),
('t_bar_row',             'Тяга Т-грифа',                    '🔩', 'back',      ARRAY['lats','upper_back'],                      ARRAY['biceps','rear_delts','lower_back'], false, NULL, 24),
('dumbbell_row',          'Тяга гантели в наклоне',          '🏃', 'back',      ARRAY['lats','upper_back'],                      ARRAY['biceps','rear_delts'],             false, NULL, 25),
('hyperextension',        'Гиперэкстензия',                  '🌉', 'back',      ARRAY['lower_back','glutes'],                    ARRAY['hamstrings'],                      false, NULL, 26),
('face_pull',             'Тяга каната к лицу',              '🎯', 'back',      ARRAY['rear_delts','upper_back'],                ARRAY['biceps'],                          false, NULL, 27),
('straight_arm_pulldown', 'Тяга прямых рук вниз',            '📡', 'back',      ARRAY['lats'],                                   ARRAY['triceps','abs'],                   false, NULL, 28),
-- Shoulders
('overhead_press',        'Жим стоя',                        '🙌', 'shoulders', ARRAY['front_delts','triceps'],                  ARRAY['side_delts','upper_back'],         false, NULL, 29),
('lateral_raise',         'Разводка гантелей в стороны',     '🕊️','shoulders', ARRAY['side_delts'],                             ARRAY['front_delts','upper_back'],        false, NULL, 30),
('front_raise',           'Подъём гантелей перед собой',     '⬆️', 'shoulders', ARRAY['front_delts'],                            ARRAY['side_delts'],                      false, NULL, 31),
('rear_delt_fly',         'Разводка на задние дельты',       '🦆', 'shoulders', ARRAY['rear_delts'],                             ARRAY['upper_back'],                      false, NULL, 32),
('arnold_press',          'Жим Арнольда',                    '🤜', 'shoulders', ARRAY['front_delts','side_delts','triceps'],     ARRAY['upper_back'],                      false, NULL, 33),
('shrug',                 'Шраги',                           '🤷', 'shoulders', ARRAY['upper_back'],                             ARRAY['forearms'],                        false, NULL, 34),
('upright_row',           'Тяга к подбородку',               '🪝', 'shoulders', ARRAY['side_delts','upper_back'],                ARRAY['front_delts','biceps'],            false, NULL, 35),
-- Arms
('bicep_curl',            'Сгибания на бицепс',              '💪', 'arms',      ARRAY['biceps'],                                 ARRAY['forearms'],                        false, NULL, 36),
('tricep_pushdown',       'Разгибания трицепса',             '📏', 'arms',      ARRAY['triceps'],                                ARRAY['forearms'],                        false, NULL, 37),
('hammer_curl',           'Молотковые сгибания',             '🔨', 'arms',      ARRAY['biceps','forearms'],                      ARRAY[]::text[],                          false, NULL, 38),
('preacher_curl',         'Сгибания на скамье Скотта',       '🪑', 'arms',      ARRAY['biceps'],                                 ARRAY['forearms'],                        false, NULL, 39),
('skull_crusher',         'Французский жим',                 '💀', 'arms',      ARRAY['triceps'],                                ARRAY[]::text[],                          false, NULL, 40),
('tricep_overhead',       'Разгибания трицепса над головой', '🏹', 'arms',      ARRAY['triceps'],                                ARRAY[]::text[],                          false, NULL, 41),
('close_grip_bench',      'Жим узким хватом',                '🤝', 'arms',      ARRAY['triceps','chest'],                        ARRAY['front_delts'],                     false, NULL, 42),
('cable_curl',            'Сгибания на блоке',               '🔌', 'arms',      ARRAY['biceps'],                                 ARRAY['forearms'],                        false, NULL, 43),
-- Core
('plank',                 'Планка',                          '🪵', 'core',      ARRAY['abs'],                                    ARRAY['obliques','lower_back','glutes'],  false, NULL, 44),
('crunch',                'Скручивания',                     '🔁', 'core',      ARRAY['abs'],                                    ARRAY['obliques'],                        false, NULL, 45),
('leg_raise',             'Подъём ног лёжа',                 '🦵', 'core',      ARRAY['abs'],                                    ARRAY['obliques'],                        false, NULL, 46),
('ab_wheel',              'Ролик для пресса',                '🎡', 'core',      ARRAY['abs'],                                    ARRAY['obliques','lower_back','lats'],    false, NULL, 47),
('russian_twist',         'Русские скручивания',             '🌪️','core',      ARRAY['obliques'],                               ARRAY['abs'],                             false, NULL, 48),
('cable_crunch',          'Скручивания на блоке',            '⚡', 'core',      ARRAY['abs'],                                    ARRAY['obliques'],                        false, NULL, 49),
('hanging_leg_raise',     'Подъём ног в висе',               '🪢', 'core',      ARRAY['abs','obliques'],                         ARRAY['forearms','lats'],                 false, NULL, 50)
ON CONFLICT (id) DO NOTHING;
