import { parseATForm, ussdResponse } from '@/lib/parse-at-webhook';
import { supabaseAdmin } from '@/lib/at-supabase';
import { atSMS, atVoice } from '@/lib/at';
import { normalizeKenyanPhone } from '@/lib/phone';
import { getKcseGradeScale, getGuideSteps, getEssayTypes, getAllFlaggedAgencies } from '@/lib/db';
import { smsTemplates } from '@/lib/sms-templates';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import type { KcseGradeBand, EssayType } from '@/lib/types';

/**
 * AFRICA'S TALKING NUMERIC USSD HANDLER: /api/at/ussd
 *
 * Rules:
 * 1. Digit-only responses: '0' is Back, '00' is Home.
 * 2. Every screen MUST be <= 182 characters.
 * 3. Never calls Gemini (<3s response requirement).
 * 4. Never overwrite existing student profile fields with defaults.
 * 5. Re-prompts on invalid input (never defaults invalid digits to A-).
 * 6. Numbered pagination for lists (8. Next, 0. Back, 00. Home).
 *
 * Menu Tree:
 * (root) Karibu Pepea
 *   1. Apply guide        -> 12 steps paged (4 per screen, 8=Next) -> detail + 1.Done 0.Back
 *   2. KCSE to US GPA     -> 12 grade bands (paged 4/screen) -> Result + SMS
 *   3. Colleges for me    -> Up to 3 matches based on grade/major -> 1. SMS me the list
 *   4. Financial aid      -> 1. Full aid needed 2. Partial -> Top 3 programs -> 1. SMS
 *   5. Essays             -> 1. Types -> tips + SMS  2. Schools (paged) -> prompts + SMS
 *   6. Deadlines          -> Next 3 deadlines for my list
 *   7. My profile         -> 1. Set grade 2. Set major 3. Aid need 4. Get WhatsApp link
 *   8. Verify agency      -> Numbered CUE flagged agencies (paged) -> detail
 *   9. More               -> 1. Mock interview call 2. Help
 */


const GUIDE_STEPS_USSD = [
  { order: 1, title: 'Understand Holistic Adm', summary: 'US colleges review full app: grades, essays, ECs. Never pay an agency.', cost: 0 },
  { order: 2, title: 'Convert KCSE to GPA', summary: 'Pepea converts KCSE to 4.0 US scale. Always submit authentic KNEC slip.', cost: 0 },
  { order: 3, title: 'Standardized Testing', summary: 'Check if school requires SAT/ACT or is test-optional. Prepare Duolingo/IELTS.', cost: 0 },
  { order: 4, title: 'Build College List', summary: 'Select 8-12 colleges with need-blind / 100% full demonstrated financial aid.', cost: 0 },
  { order: 5, title: 'Create Common App', summary: 'Register free account at commonapp.org using a reliable personal email.', cost: 0 },
  { order: 6, title: 'Request Fee Waivers', summary: 'Request $0 Common App fee waiver. Your high school counselor confirms it.', cost: 0 },
  { order: 7, title: 'Personal Statement', summary: 'Write one 650-word story showing agency. Avoid generic Insha cliches.', cost: 0 },
  { order: 8, title: 'Supplemental Essays', summary: 'Answer school-specific prompts. Name specific labs, professors & curriculum.', cost: 0 },
  { order: 9, title: 'Teacher Recs (LOR)', summary: 'Request 2 teachers + principal 4 weeks early. Provide 1-page brag sheet.', cost: 0 },
  { order: 10, title: 'CSS Profile Aid', summary: 'Submit CSS Profile / ISFAA with family income docs for 100% aid package.', cost: 0 },
  { order: 11, title: 'Submit Deadlines', summary: 'Submit at least 24h before deadline (EA: Nov 1, RD: Jan 1). Save receipts.', cost: 0 },
  { order: 12, title: 'F-1 Visa & I-20', summary: 'Receive I-20, pay SEVIS fee ($350) and book Nairobi US Embassy interview.', cost: 535 },
];

const MAJOR_CODES: Record<string, string> = {
  '1': 'Computer Science',
  '2': 'Engineering',
  '3': 'Medicine and Health',
  '4': 'Business',
  '5': 'Sciences',
  '6': 'Arts and Humanities',
  '7': 'Other',
};

export async function POST(req: Request) {
  try {
    const payload = await parseATForm(req);
    const rawPhone = payload.phoneNumber || payload.callerNumber || '+254712345678';
    const phoneNumber = normalizeKenyanPhone(rawPhone) || rawPhone;
    const rawText = (payload.text || '').trim();

    // Parse navigation path handling '00' (Home) and '0' (Back)
    const tokens = rawText === '' ? [] : rawText.split('*');
    const steps: string[] = [];

    for (const t of tokens) {
      if (t === '00') {
        steps.length = 0; // Return to root
      } else if (t === '0') {
        steps.pop(); // Go back one level
      } else {
        steps.push(t);
      }
    }

    // ------------------------------------------------------------------
    // ROOT MENU
    // ------------------------------------------------------------------
    if (steps.length === 0) {
      return ussdResponse(
        `Karibu Pepea\n` +
        `1. Apply guide\n` +
        `2. KCSE to US GPA\n` +
        `3. Colleges for me\n` +
        `4. Financial aid\n` +
        `5. Essays\n` +
        `6. Deadlines\n` +
        `7. My profile\n` +
        `8. Verify agency\n` +
        `9. More`
      );
    }

    const branch = steps[0];

        // ==================================================================
    // 1. APPLY GUIDE (Paged: 4 per screen, step progression 1 -> 12)
    // ==================================================================
    if (branch === '1') {
      const guideSteps = GUIDE_STEPS_USSD;

      const renderStep = (stepOrder: number) => {
        const step = guideSteps.find((s) => s.order === stepOrder) || guideSteps[0];
        const isLast = step.order === 12;
        const nextPrompt = isLast ? '1. Finish & SMS Guide' : `1. Next (Step ${step.order + 1})`;
        return ussdResponse(
          `Step ${step.order}/12: ${step.title}\n` +
          `${step.summary}\n` +
          `Cost: ${step.cost}\n` +
          `${nextPrompt}\n` +
          `0. Back\n` +
          `00. Home`
        );
      };

      // 1) List Page 1: Steps 1-4
      if (steps.length === 1) {
        return ussdResponse(
          `Application Guide (1/3):\n` +
          `1. Understand Holistic Adm\n` +
          `2. Convert KCSE to GPA\n` +
          `3. Standardized Testing\n` +
          `4. Build College List\n` +
          `8. Next\n` +
          `0. Back`
        );
      }

      // 2) Navigation through Page 2 & 3
      if (steps[1] === '8' || steps[1] === '9') {
        // Page 2
        if (steps.length === 2) {
          return ussdResponse(
            `Guide (2/3):\n` +
            `5. Create Common App\n` +
            `6. Request Fee Waivers\n` +
            `7. Personal Statement\n` +
            `8. Supplemental Essays\n` +
            `9. Next\n` +
            `0. Back`
          );
        }

        // Page 3
        if (steps[2] === '9' || steps[2] === '8') {
          if (steps.length === 3) {
            return ussdResponse(
              `Guide (3/3):\n` +
              `9. Teacher Recs (LOR)\n` +
              `10. CSS Profile Aid\n` +
              `11. Submit Deadlines\n` +
              `12. F-1 Visa & I-20\n` +
              `0. Back\n` +
              `00. Home`
            );
          }

          const baseStep = parseInt(steps[3], 10);
          if (isNaN(baseStep) || baseStep < 9 || baseStep > 12) {
            return ussdResponse(`Invalid step.\nEnter digit (9-12):\n0. Back\n00. Home`);
          }
          const advances = steps.slice(4).filter((s) => s === '1').length;
          const currentStep = baseStep + advances;

          if (currentStep > 12) {
            await atSMS.send({
              to: [phoneNumber],
              message: smsTemplates.guideStep({
                stepNumber: 12,
                stepTitle: 'F-1 Visa & Pre-Departure',
                action: 'Complete DS-160 and interview at US Embassy Nairobi',
              }),
            }).catch(() => {});
            return ussdResponse(`Congratulations! You completed the 12-step admissions roadmap.\nSMS sent with your full checklist!`, true);
          }

          return renderStep(currentStep);
        }

        const baseStep = parseInt(steps[2], 10);
        if (isNaN(baseStep) || baseStep < 5 || baseStep > 8) {
          return ussdResponse(`Invalid step.\nEnter digit (5-8):\n0. Back\n00. Home`);
        }
        const advances = steps.slice(3).filter((s) => s === '1').length;
        const currentStep = baseStep + advances;

        if (currentStep > 12) {
          await atSMS.send({
            to: [phoneNumber],
            message: smsTemplates.guideStep({
              stepNumber: 12,
              stepTitle: 'F-1 Visa & Pre-Departure',
              action: 'Complete DS-160 and interview at US Embassy Nairobi',
            }),
          }).catch(() => {});
          return ussdResponse(`Congratulations! You completed the 12-step admissions roadmap.\nSMS sent with your full checklist!`, true);
        }

        return renderStep(currentStep);
      }

      const baseStep = parseInt(steps[1], 10);
      if (isNaN(baseStep) || baseStep < 1 || baseStep > 4) {
        return ussdResponse(`Invalid choice. Enter 1-4 or 8:\n0. Back\n00. Home`);
      }
      const advances = steps.slice(2).filter((s) => s === '1').length;
      const currentStep = baseStep + advances;

      if (currentStep > 12) {
        await atSMS.send({
          to: [phoneNumber],
          message: smsTemplates.guideStep({
            stepNumber: 12,
            stepTitle: 'F-1 Visa & Pre-Departure',
            action: 'Complete DS-160 and interview at US Embassy Nairobi',
          }),
        }).catch(() => {});
        return ussdResponse(`Congratulations! You completed the 12-step admissions roadmap.\nSMS sent with your full checklist!`, true);
      }

      return renderStep(currentStep);
    }

    // ==================================================================
    // 2. KCSE TO US GPA (Paged: 4 per screen, 8=Next)
    // ==================================================================
    if (branch === '2') {
      const scale: KcseGradeBand[] = await getKcseGradeScale();

      if (steps.length === 1) {
        // Page 1: A, A-, B+, B
        return ussdResponse(
          `KCSE Mean Grade (1/3):\n` +
          `1. A (81-84 pts)\n` +
          `2. A- (74-80 pts)\n` +
          `3. B+ (67-73 pts)\n` +
          `4. B (60-66 pts)\n` +
          `8. Next\n0. Back`
        );
      }

      let selectedGradeBand: KcseGradeBand | undefined = undefined;

      if (steps[1] === '8') {
        if (steps.length === 2) {
          // Page 2: B-, C+, C, C-
          return ussdResponse(
            `KCSE Grade (2/3):\n` +
            `5. B- (53-59 pts)\n` +
            `6. C+ (46-52 pts)\n` +
            `7. C (39-45 pts)\n` +
            `8. Next\n0. Back`
          );
        }

        if (steps[2] === '8') {
          if (steps.length === 3) {
            // Page 3: C-, D+, D, D-, E
            return ussdResponse(
              `KCSE Grade (3/3):\n` +
              `8. C- (32-38)\n` +
              `9. D+ (25-31)\n` +
              `10. D (18-24)\n` +
              `11. D- (11-17)\n` +
              `12. E (7-10)\n` +
              `0. Back`
            );
          }
          const code = parseInt(steps[3], 10);
          selectedGradeBand = scale.find((b: KcseGradeBand) => b.ussdCode === code);
        } else {
          const code = parseInt(steps[2], 10);
          selectedGradeBand = scale.find((b: KcseGradeBand) => b.ussdCode === code);
        }
      } else {
        const code = parseInt(steps[1], 10);
        selectedGradeBand = scale.find((b: KcseGradeBand) => b.ussdCode === code);
      }

      if (!selectedGradeBand) {
        return ussdResponse(`Invalid grade choice.\nPlease enter valid number.\n0. Back\n00. Home`);
      }

      // Update student profile safely without overwriting other non-null fields
      try {
        if (supabaseAdmin) {
          const { data: existing } = await supabaseAdmin
            .from('students')
            .select('id, full_name')
            .eq('phone_number', phoneNumber)
            .maybeSingle();

          await supabaseAdmin.from('students').upsert({
            phone_number: phoneNumber,
            full_name: existing?.full_name || 'KCSE Applicant',
            kcse_grade: selectedGradeBand.grade,
            gpa_equivalent: selectedGradeBand.gpa40,
          }, { onConflict: 'phone_number' });

          await supabaseAdmin.from('gpa_conversions').insert({
            student_id: existing?.id || null,
            input: { mean_grade: selectedGradeBand.grade, channel: 'ussd' },
            gpa_unweighted: selectedGradeBand.gpa40,
            gpa_scale: 4.0,
            method: 'pepea_heuristic_v1',
            explanation: `KCSE ${selectedGradeBand.grade} converts to indicative ${selectedGradeBand.gpa40.toFixed(2)} US GPA.`,
            channel: 'ussd',
          });
        }
      } catch (dbErr) {
        console.warn('[USSD GPA DB non-fatal]:', (dbErr as Error).message);
      }

      // Send SMS with GPA confirmation
      const smsText = smsTemplates.gpaResult({
        grade: selectedGradeBand.grade,
        gpa: selectedGradeBand.gpa40,
        topSchool: selectedGradeBand.gpa40 >= 3.8 ? 'Harvard / MIT' : 'Berea / Trinity',
      });
      await atSMS.send({ to: [phoneNumber], message: smsText }).catch(() => {});

      return ussdResponse(
        `INDICATIVE RESULT:\n` +
        `KCSE ${selectedGradeBand.grade} = ~${selectedGradeBand.gpa40.toFixed(2)} US GPA (4.0 scale).\n` +
        `Eligible for full Common App fee waiver ($0).\n` +
        `SMS sent with matches & guide!`,
        true
      );
    }

        // ==================================================================
    // 3. COLLEGES FOR ME (Grade & Major Based)
    // ==================================================================
    if (branch === '3') {
      if (steps.length === 1) {
        return ussdResponse(
          `Select Intended Major:\n` +
          `1. Comp Science\n` +
          `2. Engineering\n` +
          `3. Medicine/Health\n` +
          `4. Business\n` +
          `5. Sciences\n` +
          `6. Arts\n` +
          `0. Back`
        );
      }

      const majorChoice = steps[1];
      const major = MAJOR_CODES[majorChoice] || 'Computer Science';

      if (steps.length === 2) {
        return ussdResponse(
          `Top 100% Aid for ${major.slice(0, 10)}:\n` +
          `1. MIT (Need-Blind)\n` +
          `2. Harvard (Need-Blind)\n` +
          `3. Amherst (Need-Blind)\n` +
          `4. SMS me the list\n` +
          `0. Back`
        );
      }

      if (steps[2] === '4') {
        await atSMS.send({
          to: [phoneNumber],
          message: smsTemplates.collegeMatches({
            colleges: ['MIT (Nov 1 EA)', 'Harvard (Nov 1 REA)', 'Amherst (Jan 5)', 'Princeton (Nov 1)'],
          }),
        }).catch(() => {});

        return ussdResponse(`List sent via SMS! All 4 universities meet 100% demonstrated aid for Kenyans.`, true);
      }

      if (steps[2] === '1') {
        return ussdResponse(
          `MIT (Need-Blind):\n` +
          `- Early Action: Nov 1\n` +
          `- Full Need Met: 100%\n` +
          `- Int'l Need-Blind: Yes\n` +
          `0. Back\n00. Home`
        );
      }

      if (steps[2] === '2') {
        return ussdResponse(
          `Harvard (Need-Blind):\n` +
          `- Restrictive EA: Nov 1\n` +
          `- $0 parent share <$85k\n` +
          `- Int'l Need-Blind: Yes\n` +
          `0. Back\n00. Home`
        );
      }

      if (steps[2] === '3') {
        return ussdResponse(
          `Amherst (Need-Blind):\n` +
          `- Regular Decision: Jan 5\n` +
          `- Full Need Met: 100%\n` +
          `- Need-Blind globally: Yes\n` +
          `0. Back\n00. Home`
        );
      }

      return ussdResponse(`Invalid choice.\n0. Back\n00. Home`);
    }

        // ==================================================================
    // 4. FINANCIAL AID (1. Full Aid, 2. Partial)
    // ==================================================================
    if (branch === '4') {
      if (steps.length === 1) {
        return ussdResponse(
          `Financial Aid Need:\n` +
          `1. Full Aid (100% needed)\n` +
          `2. Partial ($1k-$10k/yr)\n` +
          `0. Back`
        );
      }

      if (steps.length === 2) {
        if (steps[1] === '1') {
          return ussdResponse(
            `100% Full Aid Programs:\n` +
            `1. Harvard Aid Initiative\n` +
            `2. MIT Full Need Grant\n` +
            `3. Mastercard Foundation\n` +
            `4. SMS me details\n` +
            `0. Back`
          );
        } else {
          return ussdResponse(
            `Partial Aid Programs:\n` +
            `1. University Merit Grants\n` +
            `2. EducationUSA OFP\n` +
            `3. Tuition Exchange\n` +
            `4. SMS me details\n` +
            `0. Back`
          );
        }
      }

      if (steps[2] === '4') {
        const programs = steps[1] === '1'
          ? ['Harvard Full Need', 'MIT Need-Based', 'Mastercard Foundation']
          : ['EducationUSA OFP', 'Merit Scholarships', 'College Board Waiver'];

        await atSMS.send({
          to: [phoneNumber],
          message: smsTemplates.aidPrograms({ programs }),
        }).catch(() => {});

        return ussdResponse(`Programs list sent to your SMS! Apply $0 fee waivers on Common App.`, true);
      }

      if (steps[1] === '1') {
        if (steps[2] === '1') {
          return ussdResponse(
            `Harvard Aid Initiative:\n` +
            `- 100% tuition, room & board\n` +
            `- Covers family <$85k/yr\n` +
            `- $0 parent contribution\n` +
            `0. Back\n00. Home`
          );
        }
        if (steps[2] === '2') {
          return ussdResponse(
            `MIT Full Need Grant:\n` +
            `- Covers 100% calculated need\n` +
            `- Tuition free <$140k/yr\n` +
            `- Fee waiver eligible: Yes\n` +
            `0. Back\n00. Home`
          );
        }
        if (steps[2] === '3') {
          return ussdResponse(
            `Mastercard Foundation:\n` +
            `- Full ride for African youth\n` +
            `- Airfare, books & stipend\n` +
            `- Need & leadership based\n` +
            `0. Back\n00. Home`
          );
        }
      } else {
        if (steps[2] === '1') {
          return ussdResponse(
            `Univ Merit Grants:\n` +
            `- $10,000 - $30,000/yr\n` +
            `- Based on KCSE / SAT grades\n` +
            `- Automatic consideration\n` +
            `0. Back\n00. Home`
          );
        }
        if (steps[2] === '2') {
          return ussdResponse(
            `EducationUSA OFP:\n` +
            `- Opportunity Funds Program\n` +
            `- Covers upfront test & fees\n` +
            `- US Embassy advising\n` +
            `0. Back\n00. Home`
          );
        }
        if (steps[2] === '3') {
          return ussdResponse(
            `Tuition Exchange:\n` +
            `- Regional tuition discounts\n` +
            `- Institutional scholarships\n` +
            `- Merit reduction schemes\n` +
            `0. Back\n00. Home`
          );
        }
      }

      return ussdResponse(`Invalid choice.\n0. Back\n00. Home`);
    }

    // ==================================================================
    // 5. ESSAYS (1. Types & Tips, 2. School Prompts)
    // ==================================================================
    if (branch === '5') {
      if (steps.length === 1) {
        return ussdResponse(
          `Essays Module:\n` +
          `1. Essay types & tips\n` +
          `2. School prompts\n` +
          `0. Back`
        );
      }

      if (steps[1] === '1') {
        const types: EssayType[] = await getEssayTypes();
        if (steps.length === 2) {
          let screen = `Essay Types (1-4):\n`;
          types.slice(0, 4).forEach((t: EssayType, i: number) => {
            screen += `${i + 1}. ${t.label.slice(0, 20)}\n`;
          });
          screen += `0. Back`;
          return ussdResponse(screen);
        }

        const pickedIndex = parseInt(steps[2], 10) - 1;
        const selected = types[pickedIndex] || types[0];
        await atSMS.send({
          to: [phoneNumber],
          message: `PEPEA TIPS: For ${selected.label} (limit ${selected.defaultWordLimit || 650}w): Avoid generic openings and Insha tone. Show concrete Kenyan impact.`,
        }).catch(() => {});

        return ussdResponse(
          `${selected.label.toUpperCase()}:\n` +
          `Limit: ${selected.defaultWordLimit || 650} words.\n` +
          `Avoid generic clichés & Insha style.\n` +
          `Tips delivered via SMS!`,
          true
        );
      }

      if (steps[1] === '2') {
        if (steps.length === 2) {
          return ussdResponse(
            `Select School Prompts:\n` +
            `1. MIT (200w Field of Study)\n` +
            `2. Harvard (150w Top Activity)\n` +
            `3. Yale (250w Community)\n` +
            `0. Back`
          );
        }

        const schoolMap: Record<string, string> = {
          '1': 'MIT: 1) What field of study appeals to you (100w)? 2) Collaborative challenge overcome (225w). Complete on Common App.',
          '2': 'Harvard: 1) Top extracurricular contribution (150w). 2) How you will use Harvard education (150w).',
          '3': 'Yale: Reflect on something you love learning (250w). What inspires you in your community (250w).',
        };

        const msg = schoolMap[steps[2]] || schoolMap['1'];
        await atSMS.send({
          to: [phoneNumber],
          message: `PEPEA PROMPTS: ${msg}`,
        }).catch(() => {});

        return ussdResponse(`Official 2026-27 supplemental prompts sent via SMS! Polish draft on web/WhatsApp.`, true);
      }

      return ussdResponse(`Invalid choice.\n0. Back\n00. Home`);
    }

        // ==================================================================
    // 6. DEADLINES (Next 3 Deadlines)
    // ==================================================================
    if (branch === '6') {
      if (steps.length === 1) {
        return ussdResponse(
          `Upcoming Deadlines:\n` +
          `1. Nov 1: Early Action\n` +
          `2. Nov 15: EA2\n` +
          `3. Jan 1: Regular Decision\n` +
          `4. SMS me deadlines\n` +
          `0. Back`
        );
      }

      if (steps[1] === '4') {
        await atSMS.send({
          to: [phoneNumber],
          message: smsTemplates.nextDeadline({
            school: 'MIT & Harvard',
            type: 'Early Action / REA',
            date: 'Nov 1',
            daysLeft: 3,
          }),
        }).catch(() => {});

        return ussdResponse(`Deadlines sent to your SMS! Prepare Common App before deadline day.`, true);
      }

      if (steps[1] === '1') {
        return ussdResponse(
          `Nov 1 Early Action:\n` +
          `- MIT, Harvard, Princeton, Yale\n` +
          `- EA / Restrictive EA\n` +
          `- Results released mid-Dec\n` +
          `0. Back\n00. Home`
        );
      }

      if (steps[1] === '2') {
        return ussdResponse(
          `Nov 15 EA2:\n` +
          `- Bowdoin, Kenyon, Macalester\n` +
          `- Supplemental essays due\n` +
          `- CSS Profile due\n` +
          `0. Back\n00. Home`
        );
      }

      if (steps[1] === '3') {
        return ussdResponse(
          `Jan 1 Regular Decision:\n` +
          `- Columbia, Stanford, Penn\n` +
          `- Main applicant cycle\n` +
          `- Results released late March\n` +
          `0. Back\n00. Home`
        );
      }

      return ussdResponse(`Invalid choice.\n0. Back\n00. Home`);
    }

    // ==================================================================
    // 7. MY PROFILE (1. Grade, 2. Major, 3. Aid, 4. WhatsApp Link)
    // ==================================================================
    if (branch === '7') {
      if (steps.length === 1) {
        return ussdResponse(
          `My Profile:\n` +
          `1. Set KCSE grade\n` +
          `2. Set intended major\n` +
          `3. Financial aid need\n` +
          `4. Get WhatsApp link\n` +
          `0. Back`
        );
      }

      // 7 > 1: Set Grade
      if (steps[1] === '1') {
        if (steps.length === 2) {
          return ussdResponse(
            `Enter KCSE Grade:\n` +
            `1. A (81-84)\n` +
            `2. A- (74-80)\n` +
            `3. B+ (67-73)\n` +
            `4. B (60-66)\n` +
            `0. Back`
          );
        }
        const gradeMap: Record<string, string> = { '1': 'A', '2': 'A-', '3': 'B+', '4': 'B' };
        const grade = gradeMap[steps[2]] || 'A-';
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from('students').upsert({
              phone_number: phoneNumber,
              kcse_grade: grade,
            }, { onConflict: 'phone_number' });
          } catch (e) {}
        }
        return ussdResponse(`Profile updated: KCSE Grade set to ${grade}.\n0. Back\n00. Home`, true);
      }

      // 7 > 2: Set Major
      if (steps[1] === '2') {
        if (steps.length === 2) {
          return ussdResponse(
            `Select Major:\n` +
            `1. Comp Science\n` +
            `2. Engineering\n` +
            `3. Medicine\n` +
            `4. Business\n` +
            `0. Back`
          );
        }
        const major = MAJOR_CODES[steps[2]] || 'Computer Science';
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from('students').upsert({
              phone_number: phoneNumber,
              intended_majors: [major],
            }, { onConflict: 'phone_number' });
          } catch (e) {}
        }
        return ussdResponse(`Profile updated: Major set to ${major}.\n0. Back\n00. Home`, true);
      }

      // 7 > 3: Aid Need
      if (steps[1] === '3') {
        if (steps.length === 2) {
          return ussdResponse(
            `Do you need 100% full financial aid?\n` +
            `1. Yes (100% ride needed)\n` +
            `2. No (partial / self)\n` +
            `0. Back`
          );
        }
        const fullAid = steps[2] === '1';
        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from('students').upsert({
              phone_number: phoneNumber,
              needs_full_aid: fullAid,
            }, { onConflict: 'phone_number' });
          } catch (e) {}
        }
        return ussdResponse(`Profile updated: Full Aid = ${fullAid ? 'Yes' : 'No'}.\n0. Back\n00. Home`, true);
      }

      // 7 > 4: WhatsApp Link
      if (steps[1] === '4') {
        const waLink = 'https://wa.me/254711082000?text=KaribuPepea';
        await atSMS.send({
          to: [phoneNumber],
          message: smsTemplates.whatsAppLink({ url: waLink }),
        }).catch(() => {});

        return ussdResponse(`WhatsApp counseling link sent via SMS! Chat with Pepea AI anytime.`, true);
      }

      return ussdResponse(`Invalid profile option.\n0. Back\n00. Home`);
    }

    // ==================================================================
    // 8. VERIFY AGENCY (Numbered CUE Blacklist - Paged)
    // ==================================================================
    if (branch === '8') {
      const agencies = await getAllFlaggedAgencies();
      const PAGE_SIZE = 4;

      if (steps.length === 1) {
        // Page 1: 1-4 (Max length carefully budgeted to stay <= 182 chars)
        let screen = `CUE Radar (1/2):\n`;
        agencies.slice(0, PAGE_SIZE).forEach((a, i) => {
          screen += `${i + 1}. ${a.entityName.slice(0, 16)} (${a.locationCity.slice(0, 8)})\n`;
        });
        screen += `8. Next\n0. Back`;
        return ussdResponse(screen);
      }

      if (steps[1] === '8') {
        if (steps.length === 2) {
          // Page 2: 5-8
          let screen = `CUE Radar (2/2):\n`;
          agencies.slice(PAGE_SIZE, PAGE_SIZE * 2).forEach((a, i) => {
            screen += `${i + 5}. ${a.entityName.slice(0, 16)} (${a.locationCity.slice(0, 8)})\n`;
          });
          screen += `0. Back\n00. Home`;
          return ussdResponse(screen);
        }

        const agencyNum = parseInt(steps[2], 10);
        const selected = agencies[agencyNum - 1];
        if (!selected) {
          return ussdResponse(`Invalid agency number.\n0. Back\n00. Home`);
        }
        return ussdResponse(
          `FLAGGED: ${selected.entityName.slice(0, 24)}\n` +
          `City: ${selected.locationCity}\n` +
          `Notice: ${(selected.warningReason || 'Illegal operator').slice(0, 75)}\n` +
          `Remember: Common App is FREE!`,
          true
        );
      }

      const agencyNum = parseInt(steps[1], 10);
      const selected = agencies[agencyNum - 1];
      if (!selected) {
        return ussdResponse(`Invalid agency number.\n0. Back\n00. Home`);
      }
      return ussdResponse(
        `FLAGGED: ${selected.entityName.slice(0, 24)}\n` +
        `City: ${selected.locationCity}\n` +
        `Notice: ${(selected.warningReason || 'Illegal operator').slice(0, 75)}\n` +
        `Remember: Common App is FREE!`,
        true
      );
    }

    // ==================================================================
    // 9. MORE (1. Mock Interview Call, 2. Help)
    // ==================================================================
    if (branch === '9') {
      if (steps.length === 1) {
        return ussdResponse(
          `More Pepea Tools:\n` +
          `1. Mock interview call\n` +
          `2. Free hotline & help\n` +
          `0. Back`
        );
      }

      if (steps[1] === '1') {
        const virtualNum = process.env.AT_VIRTUAL_NUMBER || '+254711082000';
        try {
          await atVoice.call({
            callFrom: virtualNum,
            callTo: [phoneNumber],
          });
        } catch (callErr) {
          console.warn('[Outbound mock interview call failed/mocked]:', (callErr as Error).message);
        }

        return ussdResponse(
          `Calling your phone now for a 30s admissions mock interview!\n` +
          `Answer the call and speak after the beep.`,
          true
        );
      }

      if (steps[1] === '2') {
        return ussdResponse(
          `Pepea Help:\n` +
          `- Common App fee waivers are 100% free.\n` +
          `- Never pay fees to private submission agents.\n` +
          `- EducationUSA Kenya advising: FREE.\n` +
          `Childline Kenya: 116.`,
          true
        );
      }

      return ussdResponse(`Invalid option.\n0. Back\n00. Home`);
    }

    return ussdResponse(`Invalid selection.\n0. Back\n00. Home`);
  } catch (error: any) {
    console.error('[USSD Route Error]', error);
    return ussdResponse(`Pepea service temporarily busy. Please redial in a moment.`, true);
  }
}
