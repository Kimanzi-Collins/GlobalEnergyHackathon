import { parseATForm, ussdResponse } from '@/lib/parse-at-webhook';
import { supabaseAdmin, atSMS, atVoice } from '@/lib/at-supabase';
import { MOCK_FLAGGED_AGENCIES } from '@/lib/mock-data';
import { USSD_SERVICE_CODE, USSD_SERVICE_CODE_BASE } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const payload = await parseATForm(req);
    const phoneNumber = payload.phoneNumber || payload.callerNumber || '+254712345678';
    const text = (payload.text || '').trim();
    const steps = text === '' ? [] : text.split('*');

    // 0. MAIN MENU
    if (steps.length === 0) {
      return ussdResponse(
        `Karibu Pepea (Abroad App Navigator)\n` +
        `1. KCSE to US GPA & 100% Aid Match\n` +
        `2. Deadlines & Checklist (Nov 1 EA!)\n` +
        `3. Live 60s Voice Mock Interview\n` +
        `4. Verify Agency (CUE 2026 Blacklist)`
      );
    }

    // BRANCH 1: KCSE TO US GPA & 100% AID MATCHER
    if (steps[0] === '1') {
      if (steps.length === 1) {
        return ussdResponse(
          `Step 1/2: Enter your KCSE Mean Grade:\n` +
          `1. A Plain (81-84 pts)\n` +
          `2. A- Minus (74-80 pts)\n` +
          `3. B+ Plus (67-73 pts)\n` +
          `4. B Plain or below`
        );
      }
      if (steps.length === 2) {
        return ussdResponse(
          `Step 2/2: Do you need 100% Full Financial Aid?\n` +
          `1. Yes (Need-Blind / Full Ride required)\n` +
          `2. Partial / Self-Funded`
        );
      }
      if (steps.length === 3) {
        const gradeMap: Record<string, { grade: string; gpa: number; schools: string }> = {
          '1': { grade: 'A', gpa: 4.0, schools: 'MIT, Harvard, Princeton, Amherst, Stanford' },
          '2': { grade: 'A-', gpa: 3.85, schools: 'Amherst, Williams, Dartmouth, Bowdoin' },
          '3': { grade: 'B+', gpa: 3.5, schools: 'Berea College, Skidmore, Trinity, Colby' },
          '4': { grade: 'B', gpa: 3.2, schools: 'Regional universities with merit scholarships' },
        };
        const picked = gradeMap[steps[1]] || gradeMap['2'];
        const needsFullAid = steps[2] === '1';

        try {
          await supabaseAdmin.from('students').upsert({
            phone_number: phoneNumber,
            full_name: 'KCSE Applicant',
            kcse_grade: picked.grade,
            gpa_equivalent: picked.gpa,
            needs_full_aid: needsFullAid,
          }, { onConflict: 'phone_number' });
        } catch (e) {
          console.warn('[Supabase local upsert bypassed]');
        }

        // Send detailed roadmap via AT SMS
        await atSMS.send({
          to: [phoneNumber],
          message: `PEPEA ROADMAP: KCSE ${picked.grade} converts to ~${picked.gpa} US GPA! Top 100%-Aid matches: ${picked.schools}. 1) Create account at commonapp.org 2) Request Common App & CSS Profile Fee Waivers (100% Free) 3) Dial ${USSD_SERVICE_CODE} any time for your deadline checklist.`,
        });

        return ussdResponse(
          `SUCCESS: KCSE ${picked.grade} = ${picked.gpa} US GPA.\n` +
          `Eligible for $0 Common App & CSS Fee Waivers.\n` +
          `Top 100% Aid matches: ${picked.schools.split(',').slice(0, 3).join(',')}.\n` +
          `Check your SMS for full 5-step application guide!`,
          true
        );
      }
    }

    // BRANCH 2: DEADLINES & CHECKLIST
    if (steps[0] === '2') {
      return ussdResponse(
        `URGENT COUNTDOWN: Nov 1 Early Action (72h Left!)\n` +
        `[x] Common App Account\n` +
        `[ ] Personal Statement (650w)\n` +
        `[ ] MIT/Amherst Supplements\n` +
        `[ ] CSS Profile Fee Waiver\n` +
        `[ ] Teacher Recs 1 & 2 (ask in person this week)\n` +
        `Dial ${USSD_SERVICE_CODE_BASE}*3# for a mock interview.`,
        true
      );
    }

    // BRANCH 3: 60-SECOND LIVE VOICE MOCK INTERVIEW
    if (steps[0] === '3') {
      const virtualNum = process.env.AT_VIRTUAL_NUMBER || '+254711082000';
      await atVoice.call({
        callFrom: virtualNum,
        callTo: [phoneNumber],
      });

      return ussdResponse(
        `Get ready! An Admissions Officer is calling ${phoneNumber} right now.\n` +
        `Answer the 30-second question aloud after the tone. Hang up to view your scorecard on the dashboard!`,
        true
      );
    }

    // BRANCH 4: CUE STUDY-ABROAD SCAM CHECKER
    if (steps[0] === '4') {
      if (steps.length === 1) {
        return ussdResponse(
          `Enter the name of the Study-Abroad Agency or College to verify against the CUE Jan 2026 Blacklist:`
        );
      }
      if (steps.length === 2) {
        const query = steps[1].toLowerCase().trim();
        const found = MOCK_FLAGGED_AGENCIES.find((a) =>
          a.entity_name.toLowerCase().includes(query) || a.location_city.toLowerCase().includes(query)
        );

        if (found) {
          return ussdResponse(
            `ALERT! "${found.entity_name}" (${found.location_city}) was FLAGGED AS ILLEGAL by CUE in ${found.cue_notice_date}!\n` +
            `Do NOT pay them any money. Common App forms are 100% FREE.`,
            true
          );
        }

        return ussdResponse(
          `CLEAR: No match for "${steps[1]}" on CUE's flagged agency list.\n` +
          `Always remember: EducationUSA advising and Common App fee waivers are 100% FREE.`,
          true
        );
      }
    }

    return ussdResponse(`Invalid selection. Please redial ${USSD_SERVICE_CODE}`, true);
  } catch (error: any) {
    console.error('[USSD Route Error]', error);
    return ussdResponse(`Pepea service temporarily busy. Please try again.`, true);
  }
}
