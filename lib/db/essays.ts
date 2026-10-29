import { supabaseAdmin } from '@/lib/at-supabase';
import type {
  Channel,
  Essay,
  EssayCatalogResponse,
  EssayReviewResult,
  EssayStatus,
  EssayType,
  EssayTypeCode,
  RubricItem,
  SchoolEssayPrompt,
  University,
} from '@/lib/types';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// In-memory store for demo mode
const demoEssays = new Map<string, Essay>();
const demoVersions = new Map<string, any[]>();

export const DEFAULT_ESSAY_TYPES: EssayType[] = [
  {
    code: 'personal_statement',
    label: 'Personal Statement (Common App)',
    scope: 'common',
    defaultWordLimit: 650,
    rubric: [
      { key: 'specificity', label: 'Specific moments, not summaries', max: 25 },
      { key: 'voice', label: 'Authentic voice vs Insha register', max: 25 },
      { key: 'reflection', label: 'Self-reflection and growth', max: 25 },
      { key: 'clarity_for_us_reader', label: 'Kenyan context made clear to a US reader', max: 25 },
    ],
    guidanceMd: 'One story, told through a small concrete moment. Explain KCSE, boarding school or county terms the reader will not know.',
    ussdCode: 1,
  },
  {
    code: 'why_us',
    label: 'Why This School',
    scope: 'school_specific',
    defaultWordLimit: 250,
    rubric: [
      { key: 'specificity', label: 'Named courses, labs, professors, programs', max: 30 },
      { key: 'fit', label: 'Fit between your goals and the school', max: 30 },
      { key: 'voice', label: 'Authentic voice', max: 20 },
      { key: 'reflection', label: 'Reflection', max: 20 },
    ],
    guidanceMd: 'Name real things: a course, a lab, a professor, a student group. Generic praise of prestige scores zero.',
    ussdCode: 2,
  },
  {
    code: 'why_major',
    label: 'Why This Major or Field',
    scope: 'school_specific',
    defaultWordLimit: 250,
    rubric: [
      { key: 'specificity', label: 'Concrete intellectual experiences', max: 30 },
      { key: 'depth', label: 'Depth of curiosity', max: 30 },
      { key: 'voice', label: 'Authentic voice', max: 20 },
      { key: 'fit', label: 'Link to school resources', max: 20 },
    ],
    guidanceMd: 'Show the moment the field became real for you, then what you want to do with it.',
    ussdCode: 3,
  },
  {
    code: 'community',
    label: 'Community or Contribution',
    scope: 'school_specific',
    defaultWordLimit: 250,
    rubric: [
      { key: 'specificity', label: 'What you actually did', max: 30 },
      { key: 'impact', label: 'Real impact, with scale', max: 30 },
      { key: 'voice', label: 'Authentic voice', max: 20 },
      { key: 'reflection', label: 'Reflection', max: 20 },
    ],
    guidanceMd: 'Describe one specific contribution and its result. Titles alone ("school captain") say nothing.',
    ussdCode: 4,
  },
  {
    code: 'short_answer',
    label: 'Short Answer or Quirky Prompt',
    scope: 'school_specific',
    defaultWordLimit: 100,
    rubric: [
      { key: 'personality', label: 'Personality and surprise', max: 40 },
      { key: 'specificity', label: 'Specific detail', max: 30 },
      { key: 'economy', label: 'Economy of words', max: 30 },
    ],
    guidanceMd: 'Short answers reward a vivid detail over a summary.',
    ussdCode: 5,
  },
  {
    code: 'activities',
    label: 'Activities List Descriptions',
    scope: 'common',
    defaultWordLimit: 50,
    rubric: [
      { key: 'impact', label: 'Verbs and measurable impact', max: 40 },
      { key: 'clarity', label: 'Clarity for a US reader', max: 40 },
      { key: 'economy', label: 'Economy', max: 20 },
    ],
    guidanceMd: 'Common App activity descriptions are tiny. Lead with the verb and the number.',
    ussdCode: 6,
  },
  {
    code: 'additional_info',
    label: 'Additional Information',
    scope: 'common',
    defaultWordLimit: 650,
    rubric: [
      { key: 'relevance', label: 'Genuinely needed context', max: 50 },
      { key: 'clarity', label: 'Clarity and brevity', max: 50 },
    ],
    guidanceMd: 'Use for context the rest of the application cannot carry, such as the KCSE grading curve or school resource limits.',
    ussdCode: 7,
  },
  {
    code: 'scholarship_essay',
    label: 'Scholarship Essay',
    scope: 'scholarship',
    defaultWordLimit: 500,
    rubric: [
      { key: 'need_and_merit', label: 'Need and merit made specific', max: 30 },
      { key: 'plan', label: 'Concrete plan for the funding', max: 30 },
      { key: 'voice', label: 'Authentic voice', max: 20 },
      { key: 'return', label: 'Commitment to Kenya or Africa', max: 20 },
    ],
    guidanceMd: 'Be specific about what the money unlocks. Avoid pity appeals; show agency.',
    ussdCode: 8,
  },
  {
    code: 'financial_circumstances',
    label: 'Financial Circumstances Statement',
    scope: 'aid',
    defaultWordLimit: 250,
    rubric: [
      { key: 'clarity', label: 'Clear, factual account', max: 50 },
      { key: 'documentation', label: 'Consistent with documents', max: 50 },
    ],
    guidanceMd: 'Plain and factual. State income sources and obligations; the aid office is not scoring prose.',
    ussdCode: 9,
  },
];

export const DEMO_SCHOOL_PROMPTS: (SchoolEssayPrompt & { universityName: string })[] = [
  {
    id: 'prompt-mit-why-major',
    universityId: 'uni-mit',
    universityName: 'Massachusetts Institute of Technology (MIT)',
    essayType: 'why_major',
    promptKey: 'mit_field_of_study',
    title: 'Field of Study',
    promptText: 'What field of study appeals to you the most right now, and why does it appeal to you at MIT?',
    wordLimit: 100,
    isRequired: true,
    admissionCycle: '2026-27',
    dataVerifiedAt: null,
  },
  {
    id: 'prompt-mit-community',
    universityId: 'uni-mit',
    universityName: 'Massachusetts Institute of Technology (MIT)',
    essayType: 'community',
    promptKey: 'mit_community',
    title: 'Community Impact',
    promptText: 'MIT brings people with diverse backgrounds together to collaborate and tackle the world\'s biggest challenges. How have you contributed to your community?',
    wordLimit: 200,
    isRequired: true,
    admissionCycle: '2026-27',
    dataVerifiedAt: null,
  },
  {
    id: 'prompt-mit-pleasure',
    universityId: 'uni-mit',
    universityName: 'Massachusetts Institute of Technology (MIT)',
    essayType: 'short_answer',
    promptKey: 'mit_pleasure',
    title: 'Something for Pure Pleasure',
    promptText: 'We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it.',
    wordLimit: 100,
    isRequired: true,
    admissionCycle: '2026-27',
    dataVerifiedAt: null,
  },
  {
    id: 'prompt-harv-life',
    universityId: 'uni-harvard',
    universityName: 'Harvard University',
    essayType: 'short_answer',
    promptKey: 'harv_life_experiences',
    title: 'Life Experiences',
    promptText: 'Harvard has long recognized the importance of educational opportunity for students from all backgrounds. How have your life experiences shaped who you are today?',
    wordLimit: 150,
    isRequired: true,
    admissionCycle: '2026-27',
    dataVerifiedAt: null,
  },
  {
    id: 'prompt-harv-intellectual',
    universityId: 'uni-harvard',
    universityName: 'Harvard University',
    essayType: 'why_major',
    promptKey: 'harv_intellectual',
    title: 'Intellectual Passion',
    promptText: 'Briefly describe an intellectual experience (a course, project, book, research) that has meant the most to you.',
    wordLimit: 150,
    isRequired: true,
    admissionCycle: '2026-27',
    dataVerifiedAt: null,
  },
];

export async function getEssayType(code: EssayTypeCode): Promise<EssayType | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essay_types')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) {
      const fallback = DEFAULT_ESSAY_TYPES.find((t) => t.code === code);
      if (fallback) return fallback;
      if (error && !isDemoMode) {
        throw new Error(`[DB:getEssayType] Query failed: ${error.message}`);
      }
      return null;
    }

    return {
      code: data.code,
      label: data.label,
      scope: data.scope,
      defaultWordLimit: data.default_word_limit != null ? Number(data.default_word_limit) : undefined,
      rubric: Array.isArray(data.rubric) ? data.rubric : [],
      guidanceMd: data.guidance_md || undefined,
      ussdCode: data.ussd_code != null ? Number(data.ussd_code) : undefined,
    };
  } catch (err) {
    const fallback = DEFAULT_ESSAY_TYPES.find((t) => t.code === code);
    if (fallback) return fallback;
    if (!isDemoMode) throw err;
    return null;
  }
}

export async function getSchoolPrompt(
  id: string
): Promise<(SchoolEssayPrompt & { universityName?: string }) | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('school_essay_prompts')
      .select('*, universities(name)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      const demoPrompt = DEMO_SCHOOL_PROMPTS.find((p) => p.id === id);
      if (demoPrompt) return demoPrompt;
      if (error && !isDemoMode) {
        throw new Error(`[DB:getSchoolPrompt] Query failed: ${error.message}`);
      }
      return null;
    }

    return {
      id: data.id,
      universityId: data.university_id,
      universityName: data.universities?.name || undefined,
      essayType: data.essay_type,
      promptKey: data.prompt_key,
      title: data.title,
      promptText: data.prompt_text,
      wordLimit: data.word_limit != null ? Number(data.word_limit) : undefined,
      isRequired: data.is_required !== false,
      admissionCycle: data.admission_cycle,
      dataVerifiedAt: data.data_verified_at,
    };
  } catch (err) {
    const demoPrompt = DEMO_SCHOOL_PROMPTS.find((p) => p.id === id);
    if (demoPrompt) return demoPrompt;
    if (!isDemoMode) throw err;
    return null;
  }
}

export async function getEssayById(id: string): Promise<Essay | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('essays')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (isDemoMode) return demoEssays.get(id) || null;
      throw new Error(`[DB:getEssayById] Query failed: ${error.message}`);
    }

    if (!data) {
      if (isDemoMode) return demoEssays.get(id) || null;
      return null;
    }

    return {
      id: data.id,
      essayType: data.essay_type,
      universityId: data.university_id || undefined,
      schoolPromptId: data.school_prompt_id || undefined,
      title: data.title || undefined,
      status: data.status,
      latestVersionNo: data.latest_version_no || 1,
      latestScore: data.latest_score != null ? Number(data.latest_score) : undefined,
    };
  } catch (err) {
    if (isDemoMode) return demoEssays.get(id) || null;
    throw err;
  }
}

export async function getEssayByStudentAndType(
  studentId: string,
  essayType: EssayTypeCode,
  schoolPromptId?: string
): Promise<Essay | null> {
  try {
    let query = supabaseAdmin
      .from('essays')
      .select('*')
      .eq('student_id', studentId)
      .eq('essay_type', essayType);

    if (schoolPromptId) {
      query = query.eq('school_prompt_id', schoolPromptId);
    } else {
      query = query.is('school_prompt_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error) {
      if (isDemoMode) {
        for (const e of Array.from(demoEssays.values())) {
          if (
            e.essayType === essayType &&
            (!schoolPromptId || e.schoolPromptId === schoolPromptId)
          ) {
            return e;
          }
        }
        return null;
      }
      throw new Error(`[DB:getEssayByStudentAndType] Query failed: ${error.message}`);
    }

    if (!data) {
      if (isDemoMode) {
        for (const e of Array.from(demoEssays.values())) {
          if (
            e.essayType === essayType &&
            (!schoolPromptId || e.schoolPromptId === schoolPromptId)
          ) {
            return e;
          }
        }
      }
      return null;
    }

    return {
      id: data.id,
      essayType: data.essay_type,
      universityId: data.university_id || undefined,
      schoolPromptId: data.school_prompt_id || undefined,
      title: data.title || undefined,
      status: data.status,
      latestVersionNo: data.latest_version_no || 1,
      latestScore: data.latest_score != null ? Number(data.latest_score) : undefined,
    };
  } catch (err) {
    if (isDemoMode) {
      for (const e of Array.from(demoEssays.values())) {
        if (
          e.essayType === essayType &&
          (!schoolPromptId || e.schoolPromptId === schoolPromptId)
        ) {
          return e;
        }
      }
      return null;
    }
    throw err;
  }
}

export async function createEssay(params: {
  studentId: string;
  essayType: EssayTypeCode;
  universityId?: string;
  schoolPromptId?: string;
  title?: string;
  status?: EssayStatus;
}): Promise<Essay> {
  const insertPayload = {
    student_id: params.studentId,
    essay_type: params.essayType,
    university_id: params.universityId || null,
    school_prompt_id: params.schoolPromptId || null,
    title: params.title || null,
    status: params.status || 'drafting',
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('essays')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      if (isDemoMode) {
        const id = `demo-essay-${Date.now()}`;
        const newEssay: Essay = {
          id,
          essayType: params.essayType,
          universityId: params.universityId,
          schoolPromptId: params.schoolPromptId,
          title: params.title,
          status: params.status || 'drafting',
          latestVersionNo: 0,
        };
        demoEssays.set(id, newEssay);
        return newEssay;
      }
      throw new Error(`[DB:createEssay] Insert failed: ${error.message}`);
    }

    const created: Essay = {
      id: data.id,
      essayType: data.essay_type,
      universityId: data.university_id || undefined,
      schoolPromptId: data.school_prompt_id || undefined,
      title: data.title || undefined,
      status: data.status,
      latestVersionNo: 0,
    };
    if (isDemoMode) demoEssays.set(created.id, created);
    return created;
  } catch (err) {
    if (isDemoMode) {
      const id = `demo-essay-${Date.now()}`;
      const newEssay: Essay = {
        id,
        essayType: params.essayType,
        universityId: params.universityId,
        schoolPromptId: params.schoolPromptId,
        title: params.title,
        status: params.status || 'drafting',
        latestVersionNo: 0,
      };
      demoEssays.set(id, newEssay);
      return newEssay;
    }
    throw err;
  }
}

export async function updateEssay(
  essayId: string,
  params: { latestVersionNo?: number; latestScore?: number; status?: EssayStatus }
): Promise<void> {
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (params.latestVersionNo !== undefined) updatePayload.latest_version_no = params.latestVersionNo;
  if (params.latestScore !== undefined) updatePayload.latest_score = params.latestScore;
  if (params.status !== undefined) updatePayload.status = params.status;

  try {
    const { error } = await supabaseAdmin
      .from('essays')
      .update(updatePayload)
      .eq('id', essayId);

    if (error && !isDemoMode) {
      throw new Error(`[DB:updateEssay] Update failed: ${error.message}`);
    }

    if (isDemoMode && demoEssays.has(essayId)) {
      const existing = demoEssays.get(essayId)!;
      demoEssays.set(essayId, {
        ...existing,
        latestVersionNo: params.latestVersionNo ?? existing.latestVersionNo,
        latestScore: params.latestScore ?? existing.latestScore,
        status: params.status ?? existing.status,
      });
    }
  } catch (err) {
    if (!isDemoMode) throw err;
  }
}

export async function insertEssayVersion(params: {
  essayId: string;
  versionNo: number;
  content: string;
  wordCount: number;
  channel?: Channel;
}): Promise<{ id: string; versionNo: number }> {
  const record = {
    essay_id: params.essayId,
    version_no: params.versionNo,
    content: params.content,
    word_count: params.wordCount,
    channel: params.channel || 'web',
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('essay_versions')
      .insert(record)
      .select('id, version_no')
      .single();

    if (error) {
      if (isDemoMode) {
        const id = `demo-ver-${Date.now()}`;
        const versions = demoVersions.get(params.essayId) || [];
        versions.push({ id, ...record });
        demoVersions.set(params.essayId, versions);
        return { id, versionNo: params.versionNo };
      }
      throw new Error(`[DB:insertEssayVersion] Insert failed: ${error.message}`);
    }

    return { id: data.id, versionNo: data.version_no };
  } catch (err) {
    if (isDemoMode) {
      const id = `demo-ver-${Date.now()}`;
      return { id, versionNo: params.versionNo };
    }
    throw err;
  }
}

export async function insertEssayReview(params: {
  essayId?: string;
  essayVersionId?: string;
  studentId: string;
  essayType: EssayTypeCode;
  schoolPromptId?: string;
  universityName?: string;
  promptText: string;
  promptVersion: string;
  aoPersona?: string;
  draftContent: string;
  overallScore: number;
  specificityScore?: number;
  voiceScore?: number;
  schoolFitScore?: number;
  aoVerdict: string;
  committeeSummary: string;
  lineByLineCritique?: any;
  kenyanContextTips?: string;
  rewriteExample?: string;
  channel?: Channel;
}): Promise<string> {
  const record = {
    essay_id: params.essayId || null,
    essay_version_id: params.essayVersionId || null,
    student_id: params.studentId,
    essay_type: params.essayType,
    school_prompt_id: params.schoolPromptId || null,
    university_name: params.universityName || null,
    prompt_text: params.promptText,
    prompt_version: params.promptVersion,
    ao_persona: params.aoPersona || 'ivy_committee_chair',
    draft_content: params.draftContent,
    overall_score: params.overallScore,
    specificity_score: params.specificityScore,
    voice_score: params.voiceScore,
    school_fit_score: params.schoolFitScore,
    ao_verdict: params.aoVerdict,
    committee_summary: params.committeeSummary,
    line_by_line_critique: params.lineByLineCritique || null,
    kenyan_context_tips: params.kenyanContextTips,
    rewrite_example: params.rewriteExample,
    channel: params.channel || 'web',
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('essay_reviews')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      if (!isDemoMode) {
        throw new Error(`[DB:insertEssayReview] Insert failed: ${error.message}`);
      }
      return `demo-rev-${Date.now()}`;
    }

    return data.id;
  } catch (err) {
    if (!isDemoMode) throw err;
    return `demo-rev-${Date.now()}`;
  }
}

/**
 * Retrieves the essay catalog containing essay types and school-specific prompts grouped by university.
 * Supports optional filtering by universityId and essayType code.
 */
export async function getEssayCatalog(
  universityId?: string,
  type?: string
): Promise<EssayCatalogResponse> {
  // 1. Fetch essay types
  let types: EssayType[] = [];
  try {
    let typeQuery = supabaseAdmin.from('essay_types').select('*');
    if (type) {
      typeQuery = typeQuery.eq('code', type);
    }
    const { data: typeRows, error: typeErr } = await typeQuery.order('code', { ascending: true });
    if (!typeErr && typeRows && typeRows.length > 0) {
      types = typeRows.map((r) => ({
        code: r.code,
        label: r.label,
        scope: r.scope,
        defaultWordLimit: r.default_word_limit != null ? Number(r.default_word_limit) : undefined,
        rubric: Array.isArray(r.rubric) ? r.rubric : [],
        guidanceMd: r.guidance_md || undefined,
        ussdCode: r.ussd_code != null ? Number(r.ussd_code) : undefined,
      }));
    } else {
      types = DEFAULT_ESSAY_TYPES.filter((t) => (!type || t.code === type));
    }
  } catch {
    types = DEFAULT_ESSAY_TYPES.filter((t) => (!type || t.code === type));
  }

  // 2. Fetch universities
  let universities: Array<Pick<University, 'id' | 'name' | 'edEaDeadline' | 'rdDeadline'>> = [];
  try {
    let uniQuery = supabaseAdmin
      .from('universities')
      .select('id, name, ed_ea_deadline, rd_deadline');
    if (universityId) {
      uniQuery = uniQuery.eq('id', universityId);
    }
    const { data: uniRows } = await uniQuery.order('name', { ascending: true });
    if (uniRows) {
      universities = uniRows.map((u) => ({
        id: u.id,
        name: u.name,
        edEaDeadline: u.ed_ea_deadline,
        rdDeadline: u.rd_deadline,
      }));
    }
  } catch {
    universities = [];
  }

  // 3. Fetch school prompts
  let prompts: SchoolEssayPrompt[] = [];
  try {
    let promptQuery = supabaseAdmin.from('school_essay_prompts').select('*');
    if (universityId) {
      promptQuery = promptQuery.eq('university_id', universityId);
    }
    if (type) {
      promptQuery = promptQuery.eq('essay_type', type);
    }
    const { data: promptRows } = await promptQuery.order('title', { ascending: true });
    if (promptRows && promptRows.length > 0) {
      prompts = promptRows.map((p) => ({
        id: p.id,
        universityId: p.university_id,
        essayType: p.essay_type as EssayTypeCode,
        promptKey: p.prompt_key,
        title: p.title,
        promptText: p.prompt_text,
        wordLimit: p.word_limit != null ? Number(p.word_limit) : undefined,
        isRequired: p.is_required !== false,
        admissionCycle: p.admission_cycle || '2026-27',
        dataVerifiedAt: p.data_verified_at ?? null,
      }));
    } else if (isDemoMode) {
      prompts = DEMO_SCHOOL_PROMPTS.filter((p) => {
        if (universityId && p.universityId !== universityId) return false;
        if (type && p.essayType !== type) return false;
        return true;
      });
    }
  } catch {
    if (isDemoMode) {
      prompts = DEMO_SCHOOL_PROMPTS.filter((p) => {
        if (universityId && p.universityId !== universityId) return false;
        if (type && p.essayType !== type) return false;
        return true;
      });
    }
  }

  // Group prompts by university
  const promptsByUni = new Map<string, SchoolEssayPrompt[]>();
  for (const p of prompts) {
    if (!promptsByUni.has(p.universityId)) {
      promptsByUni.set(p.universityId, []);
    }
    promptsByUni.get(p.universityId)!.push(p);
  }

  const schools: Array<{
    university: Pick<University, 'id' | 'name' | 'edEaDeadline' | 'rdDeadline'>;
    prompts: SchoolEssayPrompt[];
  }> = [];

  for (const uni of universities) {
    const uniPrompts = promptsByUni.get(uni.id) || [];
    // If universityId was requested specifically, always include it; otherwise only include if it has prompts
    if (universityId || uniPrompts.length > 0) {
      schools.push({
        university: uni,
        prompts: uniPrompts,
      });
    }
  }

  return {
    types,
    schools,
  };
}

/**
 * Retrieves a list of student's essays with their latest version number and score.
 */
export async function getStudentEssays(studentId: string): Promise<Essay[]> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('essays')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error || !rows) {
      if (isDemoMode) {
        return Array.from(demoEssays.values());
      }
      return [];
    }

    const essayIds = rows.map((r) => r.id);
    if (essayIds.length === 0) return [];

    // Query latest version numbers and scores
    const { data: versions } = await supabaseAdmin
      .from('essay_versions')
      .select('essay_id, version_no')
      .in('essay_id', essayIds)
      .order('version_no', { ascending: false });

    const { data: reviews } = await supabaseAdmin
      .from('essay_reviews')
      .select('essay_id, overall_score, created_at')
      .in('essay_id', essayIds)
      .order('created_at', { ascending: false });

    const latestVersionMap = new Map<string, number>();
    if (versions) {
      for (const v of versions) {
        if (!latestVersionMap.has(v.essay_id)) {
          latestVersionMap.set(v.essay_id, v.version_no);
        }
      }
    }

    const latestScoreMap = new Map<string, number>();
    if (reviews) {
      for (const r of reviews) {
        if (r.essay_id && !latestScoreMap.has(r.essay_id)) {
          latestScoreMap.set(r.essay_id, r.overall_score);
        }
      }
    }

    return rows.map((r) => ({
      id: r.id,
      essayType: r.essay_type as EssayTypeCode,
      universityId: r.university_id || undefined,
      schoolPromptId: r.school_prompt_id || undefined,
      title: r.title || undefined,
      status: (r.status as EssayStatus) || 'drafting',
      latestVersionNo: latestVersionMap.get(r.id) || r.latest_version_no || 1,
      latestScore: latestScoreMap.get(r.id) ?? (r.latest_score != null ? Number(r.latest_score) : undefined),
    }));
  } catch (err) {
    if (isDemoMode) {
      return Array.from(demoEssays.values());
    }
    throw err;
  }
}

/**
 * Retrieves essay detail, version history, and latest review.
 */
export async function getEssayWithHistory(
  essayId: string,
  studentId: string
): Promise<{
  essay: Essay;
  versions: Array<{
    id: string;
    versionNo: number;
    content: string;
    wordCount: number;
    channel: Channel;
    createdAt: string;
  }>;
  latestReview?: EssayReviewResult;
} | null> {
  const { data: essayRow, error: essayErr } = await supabaseAdmin
    .from('essays')
    .select('*')
    .eq('id', essayId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (essayErr || !essayRow) {
    if (isDemoMode && demoEssays.has(essayId)) {
      const essay = demoEssays.get(essayId)!;
      const versions = (demoVersions.get(essayId) || []).map((v) => ({
        id: v.id,
        versionNo: v.version_no,
        content: v.content,
        wordCount: v.word_count,
        channel: v.channel as Channel,
        createdAt: v.created_at || new Date().toISOString(),
      }));
      return { essay, versions };
    }
    return null;
  }

  // Fetch version history
  const { data: versionRows } = await supabaseAdmin
    .from('essay_versions')
    .select('*')
    .eq('essay_id', essayId)
    .order('version_no', { ascending: false });

  // Fetch latest review
  const { data: reviewRows } = await supabaseAdmin
    .from('essay_reviews')
    .select('*')
    .eq('essay_id', essayId)
    .order('created_at', { ascending: false })
    .limit(1);

  const versions = (versionRows || []).map((v) => ({
    id: v.id,
    versionNo: v.version_no,
    content: v.content,
    wordCount: v.word_count,
    channel: (v.channel as Channel) || 'web',
    createdAt: v.created_at,
  }));

  let latestReview: EssayReviewResult | undefined;
  if (reviewRows && reviewRows.length > 0) {
    const r = reviewRows[0];
    const critique = r.line_by_line_critique || {};
    latestReview = {
      overallScore: r.overall_score,
      rubricScores: critique.rubric_scores || {
        specificity: r.specificity_score || 0,
        voice: r.voice_score || 0,
        school_fit: r.school_fit_score || 0,
      },
      verdict: r.ao_verdict,
      committeeSummary: r.committee_summary,
      clichesDetected: critique.cliches_detected || [],
      lineEdits: critique.line_edits || [],
      kenyanContextTips: r.kenyan_context_tips,
      rewriteExample: r.rewrite_example,
    };
  }

  const latestVersionNo = versions.length > 0 ? versions[0].versionNo : essayRow.latest_version_no || 1;
  const latestScore = reviewRows && reviewRows.length > 0 ? reviewRows[0].overall_score : essayRow.latest_score;

  return {
    essay: {
      id: essayRow.id,
      essayType: essayRow.essay_type as EssayTypeCode,
      universityId: essayRow.university_id || undefined,
      schoolPromptId: essayRow.school_prompt_id || undefined,
      title: essayRow.title || undefined,
      status: (essayRow.status as EssayStatus) || 'drafting',
      latestVersionNo,
      latestScore: latestScore != null ? Number(latestScore) : undefined,
    },
    versions,
    latestReview,
  };
}
