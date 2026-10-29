-- ==========================================
-- PEPEA SEED DATA FOR MODULE TABLES (run after 02_pepea_modules.sql and seed.sql)
--
-- IMPORTANT: every row below that describes a school, prompt, fee or aid program has
-- data_verified_at = NULL. Esther/Geoffrey must verify each against the official site
-- and then set data_verified_at. The UI shows an "unverified" badge while it is NULL.
-- ==========================================

-- KCSE grade scale (aggregate of 7 subjects, max 84). GPA values are an INDICATIVE heuristic, not an official evaluation.
INSERT INTO kcse_grade_scale (grade, points_per_subject, aggregate_min, aggregate_max, gpa_4_0, ussd_code, notes) VALUES
('A',  12, 81, 84, 4.00, 1,  'Top band. Strongest signal for selective US schools.'),
('A-', 11, 74, 80, 3.85, 2,  NULL),
('B+', 10, 67, 73, 3.50, 3,  NULL),
('B',   9, 60, 66, 3.20, 4,  NULL),
('B-',  8, 53, 59, 2.90, 5,  NULL),
('C+',  7, 46, 52, 2.60, 6,  NULL),
('C',   6, 39, 45, 2.30, 7,  NULL),
('C-',  5, 32, 38, 2.00, 8,  NULL),
('D+',  4, 25, 31, 1.70, 9,  NULL),
('D',   3, 18, 24, 1.30, 10, NULL),
('D-',  2, 11, 17, 1.00, 11, NULL),
('E',   1,  7, 10, 0.00, 12, NULL)
ON CONFLICT (grade) DO NOTHING;

-- Essay types
INSERT INTO essay_types (code, label, scope, default_word_limit, rubric, guidance_md, ussd_code) VALUES
('personal_statement', 'Personal Statement (Common App)', 'common', 650,
 '[{"key":"specificity","label":"Specific moments, not summaries","max":25},{"key":"voice","label":"Authentic voice vs Insha register","max":25},{"key":"reflection","label":"Self-reflection and growth","max":25},{"key":"clarity_for_us_reader","label":"Kenyan context made clear to a US reader","max":25}]',
 'One story, told through a small concrete moment. Explain KCSE, boarding school or county terms the reader will not know.', 1),
('why_us', 'Why This School', 'school_specific', 250,
 '[{"key":"specificity","label":"Named courses, labs, professors, programs","max":30},{"key":"fit","label":"Fit between your goals and the school","max":30},{"key":"voice","label":"Authentic voice","max":20},{"key":"reflection","label":"Reflection","max":20}]',
 'Name real things: a course, a lab, a professor, a student group. Generic praise of prestige scores zero.', 2),
('why_major', 'Why This Major or Field', 'school_specific', 250,
 '[{"key":"specificity","label":"Concrete intellectual experiences","max":30},{"key":"depth","label":"Depth of curiosity","max":30},{"key":"voice","label":"Authentic voice","max":20},{"key":"fit","label":"Link to school resources","max":20}]',
 'Show the moment the field became real for you, then what you want to do with it.', 3),
('community', 'Community or Contribution', 'school_specific', 250,
 '[{"key":"specificity","label":"What you actually did","max":30},{"key":"impact","label":"Real impact, with scale","max":30},{"key":"voice","label":"Authentic voice","max":20},{"key":"reflection","label":"Reflection","max":20}]',
 'Describe one specific contribution and its result. Titles alone ("school captain") say nothing.', 4),
('short_answer', 'Short Answer or Quirky Prompt', 'school_specific', 100,
 '[{"key":"personality","label":"Personality and surprise","max":40},{"key":"specificity","label":"Specific detail","max":30},{"key":"economy","label":"Economy of words","max":30}]',
 'Short answers reward a vivid detail over a summary.', 5),
('activities', 'Activities List Descriptions', 'common', 50,
 '[{"key":"impact","label":"Verbs and measurable impact","max":40},{"key":"clarity","label":"Clarity for a US reader","max":40},{"key":"economy","label":"Economy","max":20}]',
 'Common App activity descriptions are tiny. Lead with the verb and the number.', 6),
('additional_info', 'Additional Information', 'common', 650,
 '[{"key":"relevance","label":"Genuinely needed context","max":50},{"key":"clarity","label":"Clarity and brevity","max":50}]',
 'Use for context the rest of the application cannot carry, such as the KCSE grading curve or school resource limits.', 7),
('scholarship_essay', 'Scholarship Essay', 'scholarship', 500,
 '[{"key":"need_and_merit","label":"Need and merit made specific","max":30},{"key":"plan","label":"Concrete plan for the funding","max":30},{"key":"voice","label":"Authentic voice","max":20},{"key":"return","label":"Commitment to Kenya or Africa","max":20}]',
 'Be specific about what the money unlocks. Avoid pity appeals; show agency.', 8),
('financial_circumstances', 'Financial Circumstances Statement', 'aid', 250,
 '[{"key":"clarity","label":"Clear, factual account","max":50},{"key":"documentation","label":"Consistent with documents","max":50}]',
 'Plain and factual. State income sources and obligations; the aid office is not scoring prose.', 9)
ON CONFLICT (code) DO NOTHING;

-- School prompts, split by essay type (carried over from universities.supplemental_prompts; unverified)
INSERT INTO school_essay_prompts (university_id, essay_type, prompt_key, title, prompt_text, word_limit)
SELECT u.id, v.essay_type, v.prompt_key, v.title, v.prompt_text, v.word_limit
FROM universities u
JOIN (VALUES
  ('Massachusetts Institute of Technology (MIT)', 'why_major',   'mit_field_of_study', 'Field of Study', 'What field of study appeals to you the most right now, and why does it appeal to you at MIT?', 100),
  ('Massachusetts Institute of Technology (MIT)', 'community',   'mit_community',      'Community Impact', 'MIT brings people with diverse backgrounds together to collaborate and tackle the world''s biggest challenges. How have you contributed to your community?', 200),
  ('Massachusetts Institute of Technology (MIT)', 'short_answer','mit_pleasure',       'Something for Pure Pleasure', 'We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it.', 100),
  ('Harvard University', 'short_answer', 'harv_life_experiences',  'Life Experiences', 'Harvard has long recognized the importance of educational opportunity for students from all backgrounds. How have your life experiences shaped who you are today?', 150),
  ('Harvard University', 'why_major',    'harv_intellectual',      'Intellectual Passion', 'Briefly describe an intellectual experience (a course, project, book, research) that has meant the most to you.', 150),
  ('Stanford University', 'short_answer','stan_what_matters',      'What Matters to You', 'What matters most to you, and why?', 250),
  ('Stanford University', 'short_answer','stan_roommate',          'Letter to Future Roommate', 'Virtually all of Stanford''s undergraduates live on campus. Write a note to your future roommate that reveals something about you or will help your roommate and us get to know you better.', 250),
  ('Amherst College', 'short_answer',    'amh_intellectual_rigor', 'Intellectual Rigor', 'Respond to a quote or share how you have engaged with a complex or controversial idea in your community or classroom.', 175),
  ('Williams College', 'why_us',         'wil_tutorial',           'Tutorial Education', 'At Williams, students engage in tutorials where two students meet weekly with a professor. Tell us about an idea you look forward to debating in that setting.', 300)
) AS v(uni_name, essay_type, prompt_key, title, prompt_text, word_limit) ON u.name = v.uni_name
ON CONFLICT (university_id, prompt_key, admission_cycle) DO NOTHING;

-- Application guide (SMS-sized summaries; check each external fee or rule before the demo)
INSERT INTO guide_steps (step_order, phase, title, summary, body_md, est_minutes, cost_usd, external_url, ussd_code) VALUES
(1,  'prepare', 'Understand how US admissions work', 'US schools read the whole application: grades, essays, activities, recommendations. No agent is needed.', 'US admissions are holistic. There is no single cutoff. Everything on the application is free to prepare yourself, and you never need to pay an agent.', 20, 0, 'https://educationusa.state.gov', 1),
(2,  'prepare', 'Convert your KCSE to a US GPA', 'Use Pepea''s GPA converter. Dial the code and pick your KCSE grade.', 'Use the GPA module. The result is indicative; always report your real KCSE grades on applications.', 5, 0, NULL, 2),
(3,  'prepare', 'Plan your tests', 'Check each school''s test policy: SAT/ACT may be required. Plan an English test if asked.', 'Policies change every cycle. Open the admissions page of each school on your list and record: SAT/ACT required, optional or blind, and which English tests are accepted.', 60, NULL, NULL, 3),
(4,  'choose',  'Build your college list', 'Pick 8-12 schools across reach, target and likely using the Advisory module.', 'Aim for a spread. Prioritise schools that meet full demonstrated need for international students.', 90, 0, NULL, 4),
(5,  'apply',   'Create your Common App account', 'Create a free account at commonapp.org with an email you check daily.', 'Use a personal email, not a school one. Add your colleges to the dashboard to see each school''s requirements.', 20, 0, 'https://www.commonapp.org', 5),
(6,  'fund',    'Request application fee waivers', 'Fee waivers can make applications cost nothing. Check your eligibility early.', 'Eligibility rules differ by programme. Check the current criteria on the Common App and each school''s site.', 30, 0, 'https://www.commonapp.org', 6),
(7,  'apply',   'Write your personal statement', 'One 650-word story told through a specific moment. Review it in the Essays module.', 'Avoid Insha-style openings. Start in the middle of a scene.', 600, 0, NULL, 7),
(8,  'apply',   'Write school-specific essays', 'Each school asks its own questions. Open Essays, pick a school, then pick the prompt.', 'The Essays module lists every prompt per school and essay type.', 600, 0, NULL, 8),
(9,  'apply',   'Request recommendations', 'Ask 2 teachers and your counsellor in person. Give them a short brag sheet.', 'Give recommenders at least 3 weeks. Offer a one-page summary of your work. Their drafts can be reviewed in the LOR module.', 60, 0, NULL, 9),
(10, 'fund',    'Submit financial aid forms', 'Most schools need the CSS Profile plus their own forms. Dates differ per school.', 'Gather family income documents early. Use the Financial Aid module to see which forms each school requires.', 180, NULL, 'https://cssprofile.collegeboard.org', 10),
(11, 'apply',   'Submit and track deadlines', 'Submit before the deadline and keep proof. Track dates on your Pepea checklist.', 'Early deadlines differ from regular ones. Submit a day early because portals slow down near deadlines.', 60, 0, NULL, 11),
(12, 'visa',    'Decide and start your student visa', 'After admission you will need an I-20 and an F-1 visa. Check fees on the US State Dept site.', 'Visa fees and steps change. Always check the current official US Department of State instructions for Kenya.', 120, NULL, 'https://travel.state.gov', 12)
ON CONFLICT (step_order) DO NOTHING;

-- Financial aid programs (all unverified; verify before demo)
INSERT INTO aid_programs (name, program_type, provider, university_id, covers_full_cost, requires_css_profile, eligibility_md, official_url)
SELECT u.name || ' need-based aid', 'institutional_need', u.name, u.id, u.meets_100_pct_need, TRUE,
       'International students may apply for need-based aid. Confirm the school''s current policy, forms and deadline.', u.website_url
FROM universities u
WHERE NOT EXISTS (SELECT 1 FROM aid_programs a WHERE a.university_id = u.id AND a.program_type = 'institutional_need');

INSERT INTO aid_programs (name, program_type, provider, covers_full_cost, requires_css_profile, eligibility_md, official_url)
SELECT * FROM (VALUES
  ('Common App fee waiver', 'fee_waiver', 'Common App', FALSE, FALSE, 'Check current eligibility criteria on the Common App.', 'https://www.commonapp.org'),
  ('CSS Profile fee waiver', 'fee_waiver', 'College Board', FALSE, TRUE, 'Check current eligibility criteria on the College Board site.', 'https://cssprofile.collegeboard.org'),
  ('EducationUSA Kenya advising', 'pathway_program', 'U.S. Department of State', FALSE, FALSE, 'Free advising for students applying to US colleges.', 'https://educationusa.state.gov'),
  ('KenSAP', 'pathway_program', 'Kenya Scholar-Access Program', FALSE, FALSE, 'Selective programme for high-achieving Kenyan students. Confirm current intake and criteria.', NULL)
) AS v(name, program_type, provider, covers_full_cost, requires_css_profile, eligibility_md, official_url)
WHERE NOT EXISTS (SELECT 1 FROM aid_programs a WHERE a.name = v.name);
