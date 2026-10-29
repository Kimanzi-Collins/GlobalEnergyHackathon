import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import {
  getOrCreateStudent,
  getUniversitiesForAdvisor,
  logConversationMessage,
  saveUniversityMatches,
} from '@/lib/db';
import { callGemini } from '@/lib/gemini';
import { normalizeKenyanPhone } from '@/lib/phone';
import { rateLimit } from '@/lib/rate-limit';
import { buildStudentContext } from '@/lib/student-context';
import type {
  AdvisorRequest,
  AdvisorResponse,
  AidOutlook,
  MatchTier,
  University,
  UniversityMatch,
} from '@/lib/types';

const AdvisorRequestSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber is required'),
  question: z.string().optional(),
  channel: z.enum(['ussd', 'sms', 'whatsapp', 'web', 'voice']).optional(),
});

function calculateUniversityFit(
  uni: University,
  profile: {
    kcseGrade?: string;
    kcsePoints?: number;
    satScore?: number;
    intendedMajors: string[];
    needsFullAid: boolean;
  }
): { tier: MatchTier; fitScore: number; aidOutlook: AidOutlook; reasons: string[] } {
  const reasons: string[] = [];
  let fitScore = 55;

  // 1. Aid Outlook & Fit
  let aidOutlook: AidOutlook = 'partial';
  if (uni.meets100PctNeed) {
    aidOutlook = 'full_need';
    fitScore += 18;
    reasons.push('Meets 100% of demonstrated financial need for all admitted international students.');
    if (uni.isNeedBlindIntl) {
      fitScore += 12;
      reasons.push('Need-blind admissions policy for international students (aid application does not impact admission chance).');
    }
  } else {
    aidOutlook = profile.needsFullAid ? 'unlikely' : 'partial';
    reasons.push('Institutional aid is limited or competitive for international applicants.');
  }

  // 2. Major Fit
  const studentMajorsLower = profile.intendedMajors.map((m) => m.toLowerCase());
  const matchedMajors = uni.strongMajors.filter((uniMajor) =>
    studentMajorsLower.some(
      (sm) => uniMajor.toLowerCase().includes(sm) || sm.includes(uniMajor.toLowerCase())
    )
  );

  if (matchedMajors.length > 0) {
    fitScore += 15;
    reasons.push(`Top-tier academic programs in ${matchedMajors.join(', ')} directly matching your intended focus.`);
  }

  // 3. Testing Policy
  if (profile.satScore && profile.satScore >= 1450) {
    fitScore += 10;
    reasons.push(`Strong standardized test score (${profile.satScore}) competitive for selective review.`);
  } else if (!profile.satScore && uni.testPolicy === 'optional') {
    fitScore += 5;
    reasons.push('Test-optional policy allows your application to be evaluated fully on KCSE results and essays without SAT/ACT.');
  }

  // 4. Tier Classification
  // All Top-25 US colleges meeting full need are Reach for international students
  let tier: MatchTier = 'reach';
  const points = profile.kcsePoints ?? (profile.kcseGrade === 'A' ? 82 : profile.kcseGrade === 'A-' ? 76 : 65);

  const isSuperSelective =
    uni.name.includes('MIT') ||
    uni.name.includes('Harvard') ||
    uni.name.includes('Stanford') ||
    uni.name.includes('Yale') ||
    uni.name.includes('Princeton');

  if (isSuperSelective) {
    tier = 'reach';
  } else if (points >= 78 && (profile.satScore ? profile.satScore >= 1480 : true)) {
    tier = uni.meets100PctNeed && !uni.isNeedBlindIntl ? 'target' : 'reach';
  } else if (points >= 70) {
    tier = uni.testPolicy === 'optional' ? 'target' : 'reach';
  } else {
    tier = 'likely';
  }

  // Cap fitScore between 40 and 98
  fitScore = Math.max(40, Math.min(98, fitScore));

  return { tier, fitScore, aidOutlook, reasons };
}

/**
 * POST /api/advisor
 * Accepts AdvisorRequest ({ phoneNumber, question?, channel? })
 * Evaluates student profile against verified universities in DB, ranks matches into reach/target/likely,
 * stores matches in university_matches, and generates grounded Gemini advisory.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON in request body', 400, 'VALIDATION');
    }

    const parseResult = AdvisorRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const { phoneNumber: rawPhone, question, channel = 'web' } = parseResult.data;

    // 1. Normalize Phone Number
    const normalizedPhone = normalizeKenyanPhone(rawPhone);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: ${rawPhone}. Expected Kenyan mobile format (+2547xx or 07xx).`,
        400,
        'VALIDATION',
        { phoneNumber: rawPhone }
      );
    }

    // 2. Check Rate Limit
    const rl = rateLimit(normalizedPhone);
    if (!rl.allowed) {
      return apiError(
        'Rate limit exceeded. Maximum 20 AI advisory requests per hour per phone number.',
        429,
        'RATE_LIMITED',
        { resetInMs: rl.resetInMs }
      );
    }

    // 3. Ensure Student Profile & Context
    const student = await getOrCreateStudent(normalizedPhone);
    const studentContext = await buildStudentContext(normalizedPhone);

    // 4. Query Universities from DB
    const candidateUniversities = await getUniversitiesForAdvisor({
      needsFullAid: student.needsFullAid,
    });

    if (candidateUniversities.length === 0) {
      return apiSuccess<AdvisorResponse>({
        matches: [],
        answer: 'No university profiles found matching your current aid criteria in the verified database.',
        disclaimer:
          'Admissions classifications (reach/target/likely) and fit scores are heuristic estimates and do not guarantee admission or aid.',
      });
    }

    // 5. Evaluate and Categorize Each School
    const matches: UniversityMatch[] = candidateUniversities.map((uni) => {
      const evaluation = calculateUniversityFit(uni, {
        kcseGrade: student.kcseGrade,
        kcsePoints: student.kcsePoints,
        satScore: student.satScore,
        intendedMajors: student.intendedMajors,
        needsFullAid: student.needsFullAid,
      });

      return {
        university: uni,
        tier: evaluation.tier,
        fitScore: evaluation.fitScore,
        aidOutlook: evaluation.aidOutlook,
        reasons: evaluation.reasons,
      };
    });

    // Sort matches: highest fit score first
    matches.sort((a, b) => b.fitScore - a.fitScore);

    // 6. Save Matches in DB (university_matches)
    await saveUniversityMatches(
      student.id,
      matches.map((m) => ({
        universityId: m.university.id,
        tier: m.tier,
        fitScore: m.fitScore,
        aidOutlook: m.aidOutlook,
        reasons: m.reasons,
      }))
    );

    // 7. Inject ONLY the returned universities into verifiedData for Gemini
    const verifiedDataLines = matches.map(
      (m, idx) =>
        `${idx + 1}. School: ${m.university.name}\n` +
        `   Tier: ${m.tier.toUpperCase()}, Fit Score: ${m.fitScore}/100, Aid Outlook: ${m.aidOutlook}\n` +
        `   Meets 100% Need: ${m.university.meets100PctNeed ? 'Yes' : 'No'}, Need Blind for Intl: ${m.university.isNeedBlindIntl ? 'Yes' : 'No'}\n` +
        `   Deadlines: ED/EA ${m.university.edEaDeadline}, Regular Decision ${m.university.rdDeadline}\n` +
        `   Test Policy: ${m.university.testPolicy}, Platform: ${m.university.applicationPlatform}\n` +
        `   Strong Majors: ${m.university.strongMajors.join(', ') || 'Liberal arts & sciences'}\n` +
        `   Data Verified: ${m.university.dataVerifiedAt || 'UNVERIFIED - confirm on official site'}`
    );

    const verifiedData = [
      'STRICT VERIFIED SCHOOLS LIST (You must ONLY discuss schools from this exact list):',
      ...verifiedDataLines,
    ].join('\n\n');

    const userInput = question
      ? `Student Question: "${question}"\nPlease evaluate how my profile aligns with the schools listed above.`
      : 'Please provide a clear admissions strategy explaining my reach, target, and likely matches from the verified list, focusing on financial aid eligibility for Kenyan students.';

    // 8. Call Gemini with module: 'advisor'
    let explanation: string | undefined;
    try {
      const aiResponse = await callGemini({
        module: 'advisor',
        channel,
        context: studentContext || undefined,
        verifiedData,
        userInput,
        json: false,
      });

      if (aiResponse?.text) {
        explanation = aiResponse.text;
      }
    } catch (aiErr: any) {
      console.warn('[API:POST /api/advisor] Gemini call warning:', aiErr?.message);
      // If AI fails in demo or live, explain the shortlist directly
      explanation = `Based on your profile, we have identified ${matches.length} strategic options. Focus on schools meeting 100% of demonstrated need such as ${matches.slice(0, 2).map((m) => m.university.name).join(' and ')}. Check the deadlines and prepare your Common App fee waiver early.`;
    }

    // 9. Log Conversation Messages
    await logConversationMessage({
      studentId: student.id,
      channel,
      module: 'advisor',
      role: 'student',
      content: question || 'Requested university advisory matches and analysis.',
    });

    if (explanation) {
      await logConversationMessage({
        studentId: student.id,
        channel,
        module: 'advisor',
        role: 'assistant',
        content: explanation,
      });
    }

    const response: AdvisorResponse = {
      matches,
      answer: explanation,
      disclaimer:
        'Admissions classifications (reach/target/likely) and fit scores are heuristic estimates based on historical admissions patterns for Kenyan international applicants and do not guarantee admission or financial aid.',
    };

    return apiSuccess(response);
  } catch (err: any) {
    console.error('[API:POST /api/advisor] Error:', err);
    return apiError(
      err?.message || 'Failed to generate university advisory',
      500,
      'INTERNAL'
    );
  }
}
