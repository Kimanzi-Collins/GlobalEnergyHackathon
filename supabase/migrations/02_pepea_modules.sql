-- ==========================================
-- PEPEA (NG'AMBO) MODULE SCHEMA (adds to 01_pepea_schema.sql)
-- Modules: Student Context, Application Guide, GPA Converter,
--          Financial Aid, Essays (types x schools), LOR Review, Advisory
-- Run AFTER 01_pepea_schema.sql, BEFORE seed.sql and seed_02_modules.sql
-- ==========================================

-- ------------------------------------------
-- A. STUDENT CONTEXT MODULE
-- One profile per phone number (MSISDN). Every module and every Gemini call reads this.
-- ------------------------------------------
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS school_type TEXT CHECK (school_type IN ('national', 'extra_county', 'county', 'sub_county', 'private', 'other')),
  ADD COLUMN IF NOT EXISTS kcse_year INT,
  ADD COLUMN IF NOT EXISTS kcse_points INT CHECK (kcse_points BETWEEN 7 AND 84),
  ADD COLUMN IF NOT EXISTS kcse_subject_grades JSONB DEFAULT '{}'::jsonb,   -- {"MATH":"A","PHY":"A-",...}
  ADD COLUMN IF NOT EXISTS sat_score INT,
  ADD COLUMN IF NOT EXISTS act_score INT,
  ADD COLUMN IF NOT EXISTS english_test JSONB,                               -- {"type":"duolingo","score":125}
  ADD COLUMN IF NOT EXISTS intended_majors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS family_income_band TEXT CHECK (family_income_band IN ('under_5k', '5k_20k', '20k_60k', '60k_100k', 'over_100k', 'unknown')) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS max_family_contribution_usd INT,
  ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb,             -- [{"title","role","years","summary"}]
  ADD COLUMN IF NOT EXISTS preferred_channel TEXT CHECK (preferred_channel IN ('ussd', 'whatsapp', 'sms', 'web')) DEFAULT 'ussd',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT CHECK (preferred_language IN ('en', 'sw')) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS active_module TEXT,                                -- last module the student was in
  ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ,                     -- Kenya Data Protection Act 2019
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Chat memory so a student can start on USSD/SMS and continue on WhatsApp or web.
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('ussd', 'sms', 'whatsapp', 'web', 'voice')),
  module TEXT,                                          -- 'guide','gpa','aid','essay','lor','advisor','context'
  role TEXT NOT NULL CHECK (role IN ('student', 'assistant', 'system')),
  content TEXT NOT NULL,
  provider_message_id TEXT,                             -- AT message id, used for idempotency
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conv_provider_msg ON conversation_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conv_student_time ON conversation_messages(student_id, created_at DESC);

-- Durable facts Gemini extracts from chats ("wants to study CS", "mother is a farmer in Kitui").
CREATE TABLE IF NOT EXISTS student_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  source TEXT CHECK (source IN ('student_said', 'ai_inferred', 'form', 'ussd')) DEFAULT 'student_said',
  confidence NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, fact_key)
);

-- ------------------------------------------
-- B. GPA CONVERTER MODULE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS kcse_grade_scale (
  grade TEXT PRIMARY KEY,                               -- 'A','A-','B+',...,'E'
  points_per_subject INT NOT NULL,                      -- 12..1
  aggregate_min INT NOT NULL,                           -- 7-subject aggregate band (out of 84)
  aggregate_max INT NOT NULL,
  gpa_4_0 NUMERIC NOT NULL,                             -- indicative, see `method`
  ussd_code INT UNIQUE,                                 -- numeric USSD menu code
  method TEXT NOT NULL DEFAULT 'pepea_heuristic_v1',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS gpa_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  input JSONB NOT NULL,                                 -- {"mean_grade":"A-","points":76,"subjects":{...}}
  gpa_unweighted NUMERIC NOT NULL,
  gpa_scale NUMERIC DEFAULT 4.0,
  method TEXT NOT NULL,
  explanation TEXT,                                     -- plain-language note an AO can read
  channel TEXT CHECK (channel IN ('ussd', 'sms', 'whatsapp', 'web')) DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- C. APPLICATION GUIDE MODULE (step-by-step "how to apply to US universities")
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS guide_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_order INT NOT NULL UNIQUE,
  phase TEXT NOT NULL CHECK (phase IN ('prepare', 'choose', 'apply', 'fund', 'decide', 'visa')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,                                -- <= 160 chars, fits one SMS
  body_md TEXT NOT NULL,                                -- full guidance (web + WhatsApp)
  est_minutes INT,
  cost_usd NUMERIC DEFAULT 0,
  external_url TEXT,
  ussd_code INT UNIQUE,                                 -- numeric menu position
  data_verified_at DATE
);

CREATE TABLE IF NOT EXISTS student_guide_progress (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES guide_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done', 'skipped')) DEFAULT 'todo',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, step_id)
);

-- ------------------------------------------
-- D. UNIVERSITY ADVISORY MODULE
-- ------------------------------------------
ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS setting TEXT CHECK (setting IN ('urban', 'suburban', 'rural')),
  ADD COLUMN IF NOT EXISTS undergrad_enrollment INT,
  ADD COLUMN IF NOT EXISTS application_platform TEXT CHECK (application_platform IN ('common_app', 'coalition', 'questbridge', 'own_portal')) DEFAULT 'common_app',
  ADD COLUMN IF NOT EXISTS css_profile_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS test_policy TEXT CHECK (test_policy IN ('required', 'optional', 'blind')) DEFAULT 'optional',
  ADD COLUMN IF NOT EXISTS cost_of_attendance_usd INT,
  ADD COLUMN IF NOT EXISTS strong_majors TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intl_aid_notes TEXT,
  ADD COLUMN IF NOT EXISTS data_verified_at DATE;        -- NULL means NOT yet verified against the school's own site

CREATE UNIQUE INDEX IF NOT EXISTS uq_universities_name ON universities(name);

CREATE TABLE IF NOT EXISTS university_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('reach', 'target', 'likely')),
  fit_score INT CHECK (fit_score BETWEEN 0 AND 100),
  aid_outlook TEXT CHECK (aid_outlook IN ('full_need', 'partial', 'merit_only', 'unlikely')),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  student_status TEXT CHECK (student_status IN ('suggested', 'saved', 'applying', 'applied', 'dismissed')) DEFAULT 'suggested',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, university_id)
);

-- ------------------------------------------
-- E. FINANCIAL AID SCOUT MODULE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS aid_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('institutional_need', 'institutional_merit', 'external_scholarship', 'fee_waiver', 'pathway_program')),
  provider TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,   -- NULL for external programs
  covers_full_cost BOOLEAN DEFAULT FALSE,
  amount_usd_min INT,
  amount_usd_max INT,
  kenya_eligible BOOLEAN DEFAULT TRUE,
  intl_eligible BOOLEAN DEFAULT TRUE,
  requires_css_profile BOOLEAN DEFAULT FALSE,
  deadline DATE,
  eligibility_md TEXT,
  how_to_apply_md TEXT,
  official_url TEXT,
  data_verified_at DATE,                                -- NULL means NOT yet verified. UI must show "unverified".
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_aid_programs_name ON aid_programs(name);

CREATE TABLE IF NOT EXISTS student_aid_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES aid_programs(id) ON DELETE CASCADE,
  match_score INT CHECK (match_score BETWEEN 0 AND 100),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('suggested', 'saved', 'applying', 'submitted', 'dismissed')) DEFAULT 'suggested',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, program_id)
);

-- ------------------------------------------
-- F. ESSAY MODULE, split by TYPE and by SCHOOL
-- ------------------------------------------
-- Essay TYPES: the kind of essay (reusable across schools).
CREATE TABLE IF NOT EXISTS essay_types (
  code TEXT PRIMARY KEY,                                -- 'personal_statement','why_us',...
  label TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('common', 'school_specific', 'scholarship', 'aid')),
  default_word_limit INT,
  rubric JSONB NOT NULL DEFAULT '[]'::jsonb,            -- [{"key":"specificity","label":"...","max":25}]
  guidance_md TEXT,
  ussd_code INT UNIQUE
);

-- School PROMPTS: the actual question each school asks, per essay type and cycle.
-- Supersedes the universities.supplemental_prompts JSONB (kept only for backward compatibility).
CREATE TABLE IF NOT EXISTS school_essay_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  essay_type TEXT NOT NULL REFERENCES essay_types(code),
  prompt_key TEXT NOT NULL,                             -- stable slug, e.g. 'mit_field_of_study'
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  word_limit INT,
  is_required BOOLEAN DEFAULT TRUE,
  admission_cycle TEXT NOT NULL DEFAULT '2026-27',
  source_url TEXT,
  data_verified_at DATE,                                -- NULL means NOT yet verified against the school's site
  UNIQUE (university_id, prompt_key, admission_cycle)
);
CREATE INDEX IF NOT EXISTS idx_prompts_uni ON school_essay_prompts(university_id, essay_type);

-- A student's essay (one per type per school/prompt) and its versions.
CREATE TABLE IF NOT EXISTS essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  essay_type TEXT NOT NULL REFERENCES essay_types(code),
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,   -- NULL for common/scholarship essays
  school_prompt_id UUID REFERENCES school_essay_prompts(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT CHECK (status IN ('brainstorm', 'drafting', 'in_review', 'final')) DEFAULT 'drafting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_essays_student ON essays(student_id, essay_type);

CREATE TABLE IF NOT EXISTS essay_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  version_no INT NOT NULL,
  content TEXT NOT NULL,
  word_count INT NOT NULL,
  channel TEXT CHECK (channel IN ('web', 'whatsapp', 'sms')) DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (essay_id, version_no)
);

-- Link existing AO reviews to the new essay model; widen essay_type to the new codes.
ALTER TABLE essay_reviews DROP CONSTRAINT IF EXISTS essay_reviews_essay_type_check;
ALTER TABLE essay_reviews
  ADD COLUMN IF NOT EXISTS essay_id UUID REFERENCES essays(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS essay_version_id UUID REFERENCES essay_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_prompt_id UUID REFERENCES school_essay_prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT;          -- Gemini prompt id used, e.g. 'ESSAY_REVIEW_V1'

-- ------------------------------------------
-- G. LOR REVIEW MODULE (text review of recommendation letters; the voice call flow was removed)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS lor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  recommender_role TEXT NOT NULL CHECK (recommender_role IN ('teacher', 'counselor', 'other')),
  recommender_name TEXT,
  subject_taught TEXT,
  draft_content TEXT NOT NULL,
  submitted_by TEXT CHECK (submitted_by IN ('student', 'recommender')) DEFAULT 'student',
  overall_score INT,
  rubric_scores JSONB,                                  -- {"specificity":..,"context":..,"endorsement":..,"tone":..}
  verdict TEXT,                                         -- 'Strong', 'Needs Specifics', 'Generic'
  feedback JSONB,                                       -- {"strengths":[],"gaps":[],"kenya_context_to_add":[],"rewrites":[]}
  channel TEXT CHECK (channel IN ('web', 'whatsapp')) DEFAULT 'web',
  prompt_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------
-- H. ROW LEVEL SECURITY
-- The Next.js server uses the service-role key and bypasses RLS. Browser (anon) clients get NO table access
-- until Supabase Auth is wired; reference tables are read-only for anon.
-- ------------------------------------------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpa_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_aid_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE kcse_grade_scale ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_essay_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_agencies ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['kcse_grade_scale','guide_steps','aid_programs','essay_types','school_essay_prompts','universities','flagged_agencies']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public read %1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "public read %1$s" ON %1$I FOR SELECT USING (true)', t);
  END LOOP;
END $$;

-- ------------------------------------------
-- I. REALTIME + INDEXES
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gpa_student ON gpa_conversions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_student ON university_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_aid_matches_student ON student_aid_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_lor_student ON lor_reviews(student_id);

ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE essay_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE lor_reviews;
