-- ==========================================
-- PEPEA (NG'AMBO) SEED DATA
-- Top Need-Blind / 100% Need Universities & 2026 CUE Blacklist
-- ==========================================

INSERT INTO universities (name, country, meets_100_pct_need, is_need_blind_intl, ed_ea_deadline, rd_deadline, min_kcse_grade, avg_sat, acceptance_rate, website_url, supplemental_prompts)
VALUES
(
  'Massachusetts Institute of Technology (MIT)',
  'USA',
  TRUE,
  TRUE,
  '2026-11-01',
  '2027-01-05',
  'A',
  1540,
  3.9,
  'https://mit.edu',
  '[
    {
      "prompt_id": "mit_1",
      "title": "Field of Study",
      "word_limit": 100,
      "prompt_text": "What field of study appeals to you the most right now, and why does it appeal to you at MIT?"
    },
    {
      "prompt_id": "mit_2",
      "title": "Community Impact",
      "word_limit": 200,
      "prompt_text": "MIT brings people with diverse backgrounds together to collaborate and tackle the world''s biggest challenges. How have you contributed to your community?"
    },
    {
      "prompt_id": "mit_3",
      "title": "Something for Pure Pleasure",
      "word_limit": 100,
      "prompt_text": "We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it."
    }
  ]'::jsonb
),
(
  'Harvard University',
  'USA',
  TRUE,
  TRUE,
  '2026-11-01',
  '2027-01-01',
  'A',
  1520,
  3.4,
  'https://harvard.edu',
  '[
    {
      "prompt_id": "harv_1",
      "title": "Intellectual Journey",
      "word_limit": 150,
      "prompt_text": "Harvard has long recognized the importance of educational opportunity for students from all backgrounds. How have your life experiences shaped who you are today?"
    },
    {
      "prompt_id": "harv_2",
      "title": "Intellectual Passion",
      "word_limit": 150,
      "prompt_text": "Briefly describe an intellectual experience (a course, project, book, research) that has meant the most to you."
    }
  ]'::jsonb
),
(
  'Stanford University',
  'USA',
  TRUE,
  FALSE,
  '2026-11-01',
  '2027-01-05',
  'A',
  1530,
  3.6,
  'https://stanford.edu',
  '[
    {
      "prompt_id": "stan_1",
      "title": "What Matters to You",
      "word_limit": 250,
      "prompt_text": "What matters most to you, and why?"
    },
    {
      "prompt_id": "stan_2",
      "title": "Letter to Future Roommate",
      "word_limit": 250,
      "prompt_text": "Virtually all of Stanford''s undergraduates live on campus. Write a note to your future roommate that reveals something about you or will help your roommate—and us—get to know you better."
    }
  ]'::jsonb
),
(
  'Amherst College',
  'USA',
  TRUE,
  TRUE,
  '2026-11-01',
  '2027-01-03',
  'A-',
  1490,
  7.0,
  'https://amherst.edu',
  '[
    {
      "prompt_id": "amh_1",
      "title": "Intellectual Rigor",
      "word_limit": 175,
      "prompt_text": "Respond to a quote or share how you have engaged with a complex or controversial idea in your community or classroom."
    }
  ]'::jsonb
),
(
  'Williams College',
  'USA',
  TRUE,
  TRUE,
  '2026-11-15',
  '2027-01-08',
  'A-',
  1480,
  8.5,
  'https://williams.edu',
  '[
    {
      "prompt_id": "wil_1",
      "title": "Tutorial Education",
      "word_limit": 300,
      "prompt_text": "At Williams, students engage in tutorials where two students meet weekly with a professor. Tell us about an idea you look forward to debating in that setting."
    }
  ]'::jsonb
);

-- Official Commission for University Education (CUE) Flagged Rogue Agencies & Fake Degree Mills
INSERT INTO flagged_agencies (entity_name, entity_type, location_city, warning_reason) VALUES
('Globwise Consultancy Ltd', 'illegal_agency', 'Eldoret', 'Charged students KSh 150k for free Canadian/US visa processing forms. Flagged by DCI and CUE.'),
('Allure Education Consultants', 'illegal_agency', 'Eldoret', 'Unlicensed agency promising non-existent European work-study visas.'),
('Gatron Consulting Limited', 'illegal_agency', 'Nairobi - Ronald Ngala St', 'Charging students fees for Common App waiver submissions which are 100% free.'),
('Blitz Education Consultants Ltd', 'illegal_agency', 'Nairobi - Ronald Ngala St', 'Operates without CUE licensing; promises guaranteed admission to unaccredited schools.'),
('Askoni Kenya Study Abroad', 'illegal_agency', 'Nairobi - Eastleigh', 'Demanding money upfront for scholarship matching and falsified transcripts.'),
('Beacon Education Agency', 'illegal_agency', 'Nairobi - Safina Plaza', 'Flagged in January 2026 Ministry of Education crackdown on unregistered student recruitment hubs.'),
('American University of London', 'unaccredited_university', 'Online / Unaccredited', 'Unaccredited degree mill not recognized by CUE or US Department of Education.'),
('Atlantic International University (AIU)', 'unaccredited_university', 'Online / Hawaii', 'Disclaimed by UNESCO and Kenyan CUE; degrees ineligible for employment recognition in Kenya.');
