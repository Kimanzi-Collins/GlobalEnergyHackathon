export interface University {
  id: string;
  name: string;
  country: string;
  meets_100_pct_need: boolean;
  is_need_blind_intl: boolean;
  ed_ea_deadline: string;
  rd_deadline: string;
  min_kcse_grade: string;
  avg_sat: number;
  acceptance_rate: number;
  website_url: string;
  supplemental_prompts: Array<{
    prompt_id: string;
    title: string;
    word_limit: number;
    prompt_text: string;
  }>;
}

export const MOCK_UNIVERSITIES: University[] = [
  {
    id: 'uni-mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    country: 'USA',
    meets_100_pct_need: true,
    is_need_blind_intl: true,
    ed_ea_deadline: '2026-11-01',
    rd_deadline: '2027-01-05',
    min_kcse_grade: 'A',
    avg_sat: 1540,
    acceptance_rate: 3.9,
    website_url: 'https://mit.edu',
    supplemental_prompts: [
      {
        prompt_id: 'mit_1',
        title: 'Field of Study',
        word_limit: 100,
        prompt_text: 'What field of study appeals to you the most right now, and why does it appeal to you at MIT?',
      },
      {
        prompt_id: 'mit_2',
        title: 'Community Contribution',
        word_limit: 200,
        prompt_text: 'MIT brings people with diverse backgrounds together to collaborate and tackle the world\'s biggest challenges. How have you contributed to your community?',
      },
      {
        prompt_id: 'mit_3',
        title: 'Simple Pleasure',
        word_limit: 100,
        prompt_text: 'We know you lead a busy life, full of activities. Tell us about something you do simply for the pleasure of it.',
      },
    ],
  },
  {
    id: 'uni-harvard',
    name: 'Harvard University',
    country: 'USA',
    meets_100_pct_need: true,
    is_need_blind_intl: true,
    ed_ea_deadline: '2026-11-01',
    rd_deadline: '2027-01-01',
    min_kcse_grade: 'A',
    avg_sat: 1520,
    acceptance_rate: 3.4,
    website_url: 'https://harvard.edu',
    supplemental_prompts: [
      {
        prompt_id: 'harv_1',
        title: 'Intellectual Journey',
        word_limit: 150,
        prompt_text: 'Briefly describe an intellectual experience (a course, project, book, research) that has meant the most to you.',
      },
    ],
  },
  {
    id: 'uni-stanford',
    name: 'Stanford University',
    country: 'USA',
    meets_100_pct_need: true,
    is_need_blind_intl: false,
    ed_ea_deadline: '2026-11-01',
    rd_deadline: '2027-01-05',
    min_kcse_grade: 'A',
    avg_sat: 1530,
    acceptance_rate: 3.6,
    website_url: 'https://stanford.edu',
    supplemental_prompts: [
      {
        prompt_id: 'stan_1',
        title: 'What Matters to You',
        word_limit: 250,
        prompt_text: 'What matters most to you, and why?',
      },
      {
        prompt_id: 'stan_2',
        title: 'Letter to Future Roommate',
        word_limit: 250,
        prompt_text: 'Virtually all of Stanford\'s undergraduates live on campus. Write a note to your future roommate that reveals something about you.',
      },
    ],
  },
  {
    id: 'uni-amherst',
    name: 'Amherst College',
    country: 'USA',
    meets_100_pct_need: true,
    is_need_blind_intl: true,
    ed_ea_deadline: '2026-11-01',
    rd_deadline: '2027-01-03',
    min_kcse_grade: 'A-',
    avg_sat: 1490,
    acceptance_rate: 7.0,
    website_url: 'https://amherst.edu',
    supplemental_prompts: [
      {
        prompt_id: 'amh_1',
        title: 'Intellectual Rigor',
        word_limit: 175,
        prompt_text: 'Respond to a quote or share how you have engaged with a complex idea in your community.',
      },
    ],
  },
  {
    id: 'uni-williams',
    name: 'Williams College',
    country: 'USA',
    meets_100_pct_need: true,
    is_need_blind_intl: true,
    ed_ea_deadline: '2026-11-15',
    rd_deadline: '2027-01-08',
    min_kcse_grade: 'A-',
    avg_sat: 1480,
    acceptance_rate: 8.5,
    website_url: 'https://williams.edu',
    supplemental_prompts: [
      {
        prompt_id: 'wil_1',
        title: 'Tutorial System',
        word_limit: 300,
        prompt_text: 'At Williams, students engage in Oxford-style tutorials. Tell us an idea you look forward to debating in that setting.',
      },
    ],
  },
];

export interface FlaggedAgency {
  id: string;
  entity_name: string;
  entity_type: 'illegal_agency' | 'unaccredited_university';
  location_city: string;
  warning_reason: string;
  cue_notice_date: string;
}

export const MOCK_FLAGGED_AGENCIES: FlaggedAgency[] = [
  {
    id: 'cue-1',
    entity_name: 'Globwise Consultancy Ltd',
    entity_type: 'illegal_agency',
    location_city: 'Eldoret',
    warning_reason: 'Charged students KSh 150k for free Canadian/US visa processing forms. Flagged by DCI & CUE in Jan 2026.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-2',
    entity_name: 'Allure Education Consultants',
    entity_type: 'illegal_agency',
    location_city: 'Eldoret',
    warning_reason: 'Unlicensed agency promising guaranteed US/Schengen work-study visas.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-3',
    entity_name: 'Gatron Consulting Limited',
    entity_type: 'illegal_agency',
    location_city: 'Nairobi - Ronald Ngala St',
    warning_reason: 'Extorting KCSE leavers for Common App fee waivers which are 100% free by policy.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-4',
    entity_name: 'Blitz Education Consultants Ltd',
    entity_type: 'illegal_agency',
    location_city: 'Nairobi - Ronald Ngala St',
    warning_reason: 'Operates without CUE accreditation; directs applicants to unaccredited degree mills.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-5',
    entity_name: 'Askoni Kenya Study Abroad',
    entity_type: 'illegal_agency',
    location_city: 'Nairobi - Eastleigh',
    warning_reason: 'Demanding upfront cash deposits for scholarship matching and falsified transcripts.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-6',
    entity_name: 'Beacon Education Agency',
    entity_type: 'illegal_agency',
    location_city: 'Nairobi - Safina Plaza',
    warning_reason: 'Flagged in January 2026 Ministry of Education nationwide crackdown on unregistered hubs.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-7',
    entity_name: 'American University of London',
    entity_type: 'unaccredited_university',
    location_city: 'Online / Unaccredited',
    warning_reason: 'Bogus degree mill not recognized by US Department of Education or CUE.',
    cue_notice_date: 'January 2026',
  },
  {
    id: 'cue-8',
    entity_name: 'Atlantic International University (AIU)',
    entity_type: 'unaccredited_university',
    location_city: 'Online / Hawaii',
    warning_reason: 'Disclaimed by UNESCO and Kenyan CUE; degrees ineligible for employment verification.',
    cue_notice_date: 'January 2026',
  },
];

export const SAMPLE_ESSAY_KENYAN_DRAFT = `Since childhood in Machakos County, I have always loved science and technology. My dream has always been to study at Massachusetts Institute of Technology because it is the most prestigious university in the world. I scored an A plain of 82 points in KCSE, where I was the school captain and also the chairman of the Science Club. If given this golden opportunity, I will study diligently, uphold moral standards, and return to Kenya to build innovative renewable energy grids for our community, thereby wiping away tears of poverty and ignorance.`;
