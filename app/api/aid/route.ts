import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import {
  getAidPrograms,
  getOrCreateStudent,
  logConversationMessage,
  saveStudentAidMatches,
} from '@/lib/db';
import { callGemini } from '@/lib/gemini';
import { normalizeKenyanPhone } from '@/lib/phone';
import { rateLimit } from '@/lib/rate-limit';
import { buildStudentContext } from '@/lib/student-context';
import type {
  AidMatch,
  AidProgram,
  AidScoutRequest,
  AidScoutResponse,
} from '@/lib/types';

const AidScoutRequestSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber is required'),
  question: z.string().optional(),
  channel: z.enum(['ussd', 'sms', 'whatsapp', 'web', 'voice']).optional(),
});

function rankAidProgram(
  program: AidProgram,
  student: {
    needsFullAid: boolean;
    familyIncomeBand: string;
    maxFamilyContributionUsd?: number;
  }
): { matchScore: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50;

  if (program.coversFullCost) {
    score += student.needsFullAid ? 30 : 20;
    reasons.push('Covers full cost of attendance (tuition, room, board, and health insurance).');
  }

  if (program.programType === 'fee_waiver') {
    score += 25;
    reasons.push('Eliminates application fees ($75–$90 savings per university application).');
  } else if (program.programType === 'pathway_program') {
    score += 20;
    reasons.push('Provides cohort mentorship, test prep assistance, and direct application support in Kenya.');
  } else if (program.programType === 'institutional_need') {
    score += 25;
    reasons.push('Need-based university grant determined by demonstrated family financial need.');
  }

  if (program.requiresCssProfile) {
    reasons.push('Requires CSS Profile and verified family financial documentation.');
  } else {
    score += 5;
    reasons.push('No CSS Profile requirement simplifies submission.');
  }

  if (student.familyIncomeBand === 'under_5k' || student.familyIncomeBand === '5k_20k') {
    score += 10;
    reasons.push('Prioritized for low- and lower-middle-income Kenyan households.');
  }

  const matchScore = Math.max(45, Math.min(99, score));
  return { matchScore, reasons };
}

/**
 * POST /api/aid
 * Accepts AidScoutRequest ({ phoneNumber, question?, channel? })
 * Matches eligible financial aid programs, fee waivers, and scholarships for the student,
 * stores results in student_aid_matches, and generates grounded Gemini financial strategy.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON in request body', 400, 'VALIDATION');
    }

    const parseResult = AidScoutRequestSchema.safeParse(body);
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
        'Rate limit exceeded. Maximum 20 AI aid scout requests per hour per phone number.',
        429,
        'RATE_LIMITED',
        { resetInMs: rl.resetInMs }
      );
    }

    // 3. Ensure Student Profile & Context
    const student = await getOrCreateStudent(normalizedPhone);
    const studentContext = await buildStudentContext(normalizedPhone);

    // 4. Query Aid Programs from DB
    const eligiblePrograms = await getAidPrograms({
      needsFullAid: student.needsFullAid,
      incomeBand: student.familyIncomeBand,
    });

    if (eligiblePrograms.length === 0) {
      return apiSuccess<AidScoutResponse>({
        matches: [],
        answer: 'No specific aid programs found matching your current search criteria in the verified database.',
        disclaimer:
          'Financial aid terms are verified against official institutional sources. Award decisions are determined exclusively by the respective university or program.',
      });
    }

    // 5. Rank and Score Programs
    const matches: AidMatch[] = eligiblePrograms.map((program) => {
      const evaluation = rankAidProgram(program, {
        needsFullAid: student.needsFullAid,
        familyIncomeBand: student.familyIncomeBand,
        maxFamilyContributionUsd: student.maxFamilyContributionUsd,
      });

      return {
        program,
        matchScore: evaluation.matchScore,
        reasons: evaluation.reasons,
      };
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);

    // 6. Save Matches in student_aid_matches
    await saveStudentAidMatches(
      student.id,
      matches.map((m) => ({
        programId: m.program.id,
        matchScore: m.matchScore,
        reasons: m.reasons,
      }))
    );

    // 7. Inject ONLY verified aid programs into verifiedData for Gemini
    const verifiedDataLines = matches.map(
      (m, idx) =>
        `${idx + 1}. Program: ${m.program.name} (${m.program.provider})\n` +
        `   Type: ${m.program.programType}, Match Score: ${m.matchScore}/100\n` +
        `   Covers Full Cost: ${m.program.coversFullCost ? 'Yes' : 'No'}, Requires CSS Profile: ${m.program.requiresCssProfile ? 'Yes' : 'No'}\n` +
        `   Deadline: ${m.program.deadline || 'Varies by university admission cycle'}\n` +
        `   Eligibility: ${m.program.eligibilityMd || 'Kenyan undergraduate applicants'}\n` +
        `   Official Link: ${m.program.officialUrl || 'Official admissions portal'}\n` +
        `   Data Verified: ${m.program.dataVerifiedAt || 'UNVERIFIED - verify on official website'}`
    );

    const verifiedData = [
      'STRICT VERIFIED AID PROGRAMS (You must ONLY mention aid programs and fee waivers from this exact list):',
      ...verifiedDataLines,
    ].join('\n\n');

    const userInput = question
      ? `Student Question: "${question}"\nPlease evaluate which aid options from the verified list best meet my situation.`
      : 'Please summarize the top financial aid programs and fee waivers I qualify for, explain what documents I need to gather in Kenya, and give my single immediate next step.';

    // 8. Call Gemini with module: 'aid'
    let explanation: string | undefined;
    try {
      const aiResponse = await callGemini({
        module: 'aid',
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
      console.warn('[API:POST /api/aid] Gemini call warning:', aiErr?.message);
      explanation = `You have ${matches.length} eligible aid programs. Prioritize the Common App fee waiver and institutional need-based grants. Gather your family KRA PIN certificates and bank statements for the CSS Profile.`;
    }

    // 9. Log Conversation Messages
    await logConversationMessage({
      studentId: student.id,
      channel,
      module: 'aid',
      role: 'student',
      content: question || 'Requested financial aid scout recommendations.',
    });

    if (explanation) {
      await logConversationMessage({
        studentId: student.id,
        channel,
        module: 'aid',
        role: 'assistant',
        content: explanation,
      });
    }

    const response: AidScoutResponse = {
      matches,
      answer: explanation,
      disclaimer:
        'Financial aid opportunities and fee waiver terms are verified against official institutional guidelines. Award decisions and fee waiver approvals are determined exclusively by the respective university or program.',
    };

    return apiSuccess(response);
  } catch (err: any) {
    console.error('[API:POST /api/aid] Error:', err);
    return apiError(
      err?.message || 'Failed to scout financial aid programs',
      500,
      'INTERNAL'
    );
  }
}
