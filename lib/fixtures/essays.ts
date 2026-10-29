import type { EssayCatalogResponse, EssayTypeCode, RubricItem } from '@/lib/types';

/**
 * Typed fixture of the essay catalogue (types x schools) for the landing page and for
 * building UI before BE-API-04 ships. Mirrors supabase/seed_02_modules.sql.
 * Prompts are unverified until BE-DB-05 is done, so every row carries dataVerifiedAt: null.
 */
export const ESSAY_CATALOG: EssayCatalogResponse = {
  types: [
    {
      code: 'personal_statement',
      label: 'Personal Statement',
      scope: 'common',
      defaultWordLimit: 650,
      rubric: [
        { key: 'specificity', label: 'Specific moments', max: 25 },
        { key: 'voice', label: 'Authentic voice', max: 25 },
        { key: 'reflection', label: 'Reflection', max: 25 },
        { key: 'clarity_for_us_reader', label: 'Clear to a US reader', max: 25 },
      ],
    },
    {
      code: 'why_us',
      label: 'Why this school',
      scope: 'school_specific',
      defaultWordLimit: 250,
      rubric: [
        { key: 'specificity', label: 'Named courses and people', max: 30 },
        { key: 'fit', label: 'Fit with your goals', max: 30 },
        { key: 'voice', label: 'Authentic voice', max: 20 },
        { key: 'reflection', label: 'Reflection', max: 20 },
      ],
    },
    {
      code: 'community',
      label: 'Community',
      scope: 'school_specific',
      defaultWordLimit: 250,
      rubric: [
        { key: 'specificity', label: 'What you actually did', max: 30 },
        { key: 'impact', label: 'Impact, with scale', max: 30 },
        { key: 'voice', label: 'Authentic voice', max: 20 },
        { key: 'reflection', label: 'Reflection', max: 20 },
      ],
    },
    {
      code: 'scholarship_essay',
      label: 'Scholarship',
      scope: 'scholarship',
      defaultWordLimit: 500,
      rubric: [
        { key: 'need_and_merit', label: 'Need and merit', max: 30 },
        { key: 'plan', label: 'A concrete plan', max: 30 },
        { key: 'voice', label: 'Authentic voice', max: 20 },
        { key: 'return', label: 'Commitment to Kenya', max: 20 },
      ],
    },
  ],
  schools: [
    {
      university: { id: 'uni-mit', name: 'MIT', edEaDeadline: '2026-11-01', rdDeadline: '2027-01-05' },
      prompts: [
        {
          id: 'mit_community',
          universityId: 'uni-mit',
          essayType: 'community',
          promptKey: 'mit_community',
          title: 'Community impact',
          promptText:
            "MIT brings people with diverse backgrounds together to collaborate and tackle the world's biggest challenges. How have you contributed to your community?",
          wordLimit: 200,
          isRequired: true,
          admissionCycle: '2026-27',
          dataVerifiedAt: null,
        },
      ],
    },
    {
      university: { id: 'uni-williams', name: 'Williams', edEaDeadline: '2026-11-15', rdDeadline: '2027-01-08' },
      prompts: [
        {
          id: 'wil_tutorial',
          universityId: 'uni-williams',
          essayType: 'why_us',
          promptKey: 'wil_tutorial',
          title: 'Tutorial education',
          promptText:
            'At Williams, students engage in tutorials where two students meet weekly with a professor. Tell us about an idea you look forward to debating in that setting.',
          wordLimit: 300,
          isRequired: true,
          admissionCycle: '2026-27',
          dataVerifiedAt: null,
        },
      ],
    },
    {
      university: { id: 'uni-amherst', name: 'Amherst', edEaDeadline: '2026-11-01', rdDeadline: '2027-01-03' },
      prompts: [
        {
          id: 'amh_intellectual_rigor',
          universityId: 'uni-amherst',
          essayType: 'community',
          promptKey: 'amh_intellectual_rigor',
          title: 'Intellectual rigor',
          promptText:
            'Respond to a quote or share how you have engaged with a complex or controversial idea in your community or classroom.',
          wordLimit: 175,
          isRequired: true,
          admissionCycle: '2026-27',
          dataVerifiedAt: null,
        },
      ],
    },
  ],
};

/** Sample rubric scores for the landing-page review preview (illustrative, not a real review). */
export const SAMPLE_SCORES: Partial<Record<EssayTypeCode, Record<string, number>>> = {
  personal_statement: { specificity: 21, voice: 19, reflection: 17, clarity_for_us_reader: 22 },
  why_us: { specificity: 26, fit: 22, voice: 16, reflection: 15 },
  community: { specificity: 24, impact: 21, voice: 15, reflection: 14 },
  scholarship_essay: { need_and_merit: 24, plan: 22, voice: 16, return: 17 },
};

export function totalOf(rubric: RubricItem[], scores: Record<string, number>): number {
  const max = rubric.reduce((s, r) => s + r.max, 0);
  const got = rubric.reduce((s, r) => s + (scores[r.key] ?? 0), 0);
  return Math.round((got / max) * 100);
}
