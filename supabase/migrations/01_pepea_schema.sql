-- ==========================================
-- PEPEA (NG'AMBO) SUPABASE DATABASE SCHEMA
-- Hackathon: Africa's Talking Admissions Officer & Tracker
-- ==========================================

-- 1. Universities & Real 2026/2027 Supplemental Prompts
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  meets_100_pct_need BOOLEAN DEFAULT TRUE,
  is_need_blind_intl BOOLEAN DEFAULT FALSE,
  ed_ea_deadline DATE NOT NULL,
  rd_deadline DATE NOT NULL,
  min_kcse_grade TEXT NOT NULL,
  avg_sat INT,
  acceptance_rate NUMERIC DEFAULT 4.5,
  website_url TEXT,
  supplemental_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student Profiles (Created via USSD, Web, or WhatsApp)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  kcse_grade TEXT,
  gpa_equivalent NUMERIC,
  intended_major TEXT,
  target_university TEXT,
  needs_full_aid BOOLEAN DEFAULT TRUE,
  onboarding_step INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Application Checklist & Deadline Tracker
CREATE TABLE IF NOT EXISTS application_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  category TEXT CHECK (category IN ('account', 'essay', 'recommendation', 'financial_aid', 'testing')),
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gemini Admissions Officer (AO) Essay Reviews
CREATE TABLE IF NOT EXISTS essay_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  essay_type TEXT CHECK (essay_type IN ('common_app_personal', 'supplemental', 'scholarship')),
  university_name TEXT,
  prompt_text TEXT NOT NULL,
  ao_persona TEXT DEFAULT 'ivy_committee_chair',
  draft_content TEXT NOT NULL,
  overall_score INT,
  specificity_score INT,
  voice_score INT,
  school_fit_score INT,
  ao_verdict TEXT, -- 'Strong Admit', 'Waitlist - Too Generic', 'Rewrite Needed'
  committee_summary TEXT,
  line_by_line_critique JSONB,
  kenyan_context_tips TEXT,
  rewrite_example TEXT,
  channel TEXT CHECK (channel IN ('web', 'whatsapp', 'sms')) DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Voice API Mock Interviews
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('mock_interview')) DEFAULT 'mock_interview',
  participant_phone TEXT NOT NULL,
  participant_name TEXT,
  target_school TEXT,
  audio_recording_url TEXT,
  raw_transcript TEXT,
  ai_generated_output TEXT, -- Mock interview feedback (JSON)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'calling', 'recorded', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUE Flagged Rogue Agencies & Illegal Universities (Jan 2026 Blacklist)
CREATE TABLE IF NOT EXISTS flagged_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('illegal_agency', 'unaccredited_university')),
  location_city TEXT NOT NULL,
  warning_reason TEXT,
  cue_notice_date TEXT DEFAULT 'January 2026'
);

-- Indexes for lightning fast queries & USSD timeouts (<3s requirement)
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone_number);
CREATE INDEX IF NOT EXISTS idx_tasks_student ON application_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student ON essay_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_flagged_name ON flagged_agencies(entity_name);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE essay_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE application_tasks;
