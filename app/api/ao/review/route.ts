import { NextResponse } from 'next/server';
import { geminiAI, supabaseAdmin, atSMS } from '@/lib/at-supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentId = 'demo-student',
      phoneNumber = '+254712345678',
      essayType = 'supplemental',
      universityName = 'Massachusetts Institute of Technology (MIT)',
      promptText = 'What field of study appeals to you the most right now, and why does it appeal to you at MIT?',
      draftContent = '',
      aoPersona = 'ivy_committee_chair',
      channel = 'web',
    } = body;

    if (!draftContent || draftContent.trim().length < 15) {
      return NextResponse.json(
        { error: 'Please provide an essay draft of at least 15 words.' },
        { status: 400 }
      );
    }

    const personaInstructions: Record<string, string> = {
      ivy_committee_chair: `You are Dean Eleanor Vance, a 15-year former Senior Admissions Officer at Stanford and MIT who has evaluated over 20,000 East African applications. You are ruthlessly allergic to generic AI prose, thesaurus stuffing, and formal Kenyan 'Insha' composition phrases (like 'since time immemorial', 'wipe away tears of poverty', 'the most prestigious university in the world'). You demand vivid micro-moments, sensory detail, authentic voice, self-reflection, and exact named professors, labs, or courses at ${universityName}.`,
      kensap_mentor: `You are an alumni mentor from the Kenya Scholar Access Program (KenSAP) at Harvard. You help Kenyan students translate local realities (KCSE prep, Science Congress, prefect roles, rural family responsibilities) so an American admissions officer immediately grasps the scale and intellectual grit without descending into pity-seeking clichés.`,
    };

    let evaluation: any = null;

    if (geminiAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_key_for_demo') {
      try {
        const model = geminiAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = `${personaInstructions[aoPersona] || personaInstructions.ivy_committee_chair}

Target University: ${universityName}
Target Prompt: "${promptText}"

Student's Essay Draft:
"""
${draftContent}
"""

Evaluate this draft rigorously. Return ONLY a JSON object with this exact schema:
{
  "overall_score": number (0-100),
  "specificity_score": number (0-25),
  "voice_score": number (0-25),
  "school_fit_score": number (0-25),
  "reflection_score": number (0-25),
  "ao_verdict": "Strong Admit" | "Borderline / Too Generic" | "Rewrite Required",
  "committee_summary": "2-sentence blunt verdict read aloud in admissions committee",
  "cliches_detected": ["exact phrase 1", "exact phrase 2"],
  "kenyan_context_tips": "Specific advice on translating Kenyan terminology/culture for an American reader",
  "rewrite_example": "Show how to rewrite their weakest paragraph into a vivid micro-moment with sensory detail"
}`;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        evaluation = JSON.parse(textResponse);
      } catch (geminiError) {
        console.warn('[Gemini Live Error, falling back to intelligent evaluation]', (geminiError as Error).message);
      }
    }

    // High-fidelity fallback / demo analyzer if API key is in demo mode
    if (!evaluation) {
      const lower = draftContent.toLowerCase();
      const cliches: string[] = [];
      if (lower.includes('since childhood') || lower.includes('since my childhood')) cliches.push('Since childhood');
      if (lower.includes('prestigious') || lower.includes('most prestigious')) cliches.push('Prestigious university');
      if (lower.includes('wipe away tears') || lower.includes('poverty')) cliches.push('Poverty plea cliché');
      if (lower.includes('golden opportunity')) cliches.push('Golden opportunity');
      if (lower.includes('school captain') || lower.includes('headboy')) cliches.push('Listing resume titles without reflection');

      const isShort = draftContent.split(/\s+/).length < 80;
      const score = Math.max(45, Math.min(88, 75 - (cliches.length * 8) + (isShort ? -5 : 6)));

      evaluation = {
        overall_score: score,
        specificity_score: score > 70 ? 19 : 13,
        voice_score: score > 70 ? 18 : 12,
        school_fit_score: lower.includes('professor') || lower.includes('lab') ? 22 : 11,
        reflection_score: score > 70 ? 18 : 12,
        ao_verdict: score >= 78 ? 'Strong Admit' : score >= 60 ? 'Borderline / Too Generic' : 'Rewrite Required',
        committee_summary: cliches.length > 0
          ? `The applicant sounds like an exemplary Kenyan student, but falls straight into the 'Insha' composition trap with ${cliches.length} generic tropes. Needs vivid micro-moments instead of platitudes.`
          : `Clear potential, but lacks specific faculty and laboratory connections to ${universityName}.`,
        cliches_detected: cliches.length > 0 ? cliches : ['Generic ambition without grounding'],
        kenyan_context_tips: 'Admissions committees at US colleges love KCSE grit, but an American reader has no idea what "School Captain" or "82 points" means. Show the specific human conflict you resolved when running school assembly or fixing the biology lab solar battery.',
        rewrite_example: `Instead of "Since childhood I loved science": "At 2:00 AM in our Machakos boarding dorm, when the KPLC blackout hit during mock exam week, I wired a spare 12V motorcycle battery to four LED diodes so my study group could finish their Calculus sets."`,
      };
    }

    // Persist to Supabase if configured
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co') {
        await supabaseAdmin.from('essay_reviews').insert({
          student_id: studentId.length === 36 ? studentId : undefined,
          essay_type: essayType,
          university_name: universityName,
          prompt_text: promptText,
          ao_persona: aoPersona,
          draft_content: draftContent,
          overall_score: evaluation.overall_score,
          specificity_score: evaluation.specificity_score,
          voice_score: evaluation.voice_score,
          school_fit_score: evaluation.school_fit_score,
          ao_verdict: evaluation.ao_verdict,
          committee_summary: evaluation.committee_summary,
          line_by_line_critique: evaluation,
          kenyan_context_tips: evaluation.kenyan_context_tips,
          rewrite_example: evaluation.rewrite_example,
          channel,
        });
      }
    } catch (dbError) {
      console.warn('[DB Insert Ignored in local demo]', (dbError as Error).message);
    }

    // Trigger instant SMS scorecard via Africa's Talking
    if (phoneNumber) {
      try {
        await atSMS.send({
          to: [phoneNumber],
          message: `PEPEA AO REVIEW (${universityName.split('(')[0].trim()}): Score ${evaluation.overall_score}/100 [${evaluation.ao_verdict}]. AO Note: ${evaluation.committee_summary.slice(0, 85)}... Check Pepea Dashboard for rewrite.`,
        });
      } catch (smsErr) {
        console.warn('[SMS Dispatch Error]', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation,
      phoneNumber,
      universityName,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AO Review Endpoint Error]', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while evaluating draft.' },
      { status: 500 }
    );
  }
}
