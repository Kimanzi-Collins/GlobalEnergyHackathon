/**
 * SMS templates for Pepea.
 * HARD RULE: Every template MUST render to <= 160 characters to fit in exactly one SMS segment.
 */

export interface GpaSmsParams {
  grade: string;
  gpa: number;
  topSchool: string;
}

export interface DeadlineSmsParams {
  school: string;
  type: string;
  date: string;
  daysLeft: number;
}

export interface GuideStepSmsParams {
  stepNumber: number;
  stepTitle: string;
  action: string;
}

export interface EssayScoreSmsParams {
  essayType: string;
  score: number;
  verdict: string;
}

export const smsTemplates = {
  /**
   * Format: "PEPEA: KCSE {grade} = ~{gpa} US GPA. Top 100% aid match: {school}. Dial *384*73732# for full steps & waivers."
   * Length test: ~110 chars.
   */
  gpaResult: ({ grade, gpa, topSchool }: GpaSmsParams): string => {
    const text = `PEPEA: KCSE ${grade} = ~${gpa.toFixed(2)} US GPA. Top 100% aid match: ${topSchool}. Dial *384*73732# for free guide & waivers.`;
    return truncateTo160(text);
  },

  /**
   * Format: "PEPEA DEADLINE: {school} {type} due {date} ({daysLeft}d left). Dial *384*73732# to track."
   * Length test: ~95 chars.
   */
  nextDeadline: ({ school, type, date, daysLeft }: DeadlineSmsParams): string => {
    const text = `PEPEA DEADLINE: ${school} ${type} due ${date} (${daysLeft}d left). Complete CSS waiver & Common App now. Dial *384*73732#.`;
    return truncateTo160(text);
  },

  /**
   * Format: "PEPEA STEP {N}: {title}. Action: {action}. Reply HELP or dial *384*73732#."
   */
  guideStep: ({ stepNumber, stepTitle, action }: GuideStepSmsParams): string => {
    const text = `PEPEA STEP ${stepNumber}: ${stepTitle}. Action: ${action}. Dial *384*73732# for next steps.`;
    return truncateTo160(text);
  },

  /**
   * Format: "PEPEA AO: {type} scored {score}/100 ({verdict}). Check dashboard for line edits & Kenya context tips."
   */
  essayScore: ({ essayType, score, verdict }: EssayScoreSmsParams): string => {
    const text = `PEPEA REVIEW: ${essayType} scored ${score}/100 (${verdict}). Open dashboard for line edits & Kenya context tips.`;
    return truncateTo160(text);
  },

  /**
   * Format for interview score delivered to phone
   */
  mockInterviewScore: ({ score, topTip }: { score: number; topTip: string }): string => {
    const text = `PEPEA INTERVIEW: Score ${score}/100! Tip: ${topTip}. Practice again: dial *384*73732# > 9 > 1.`;
    return truncateTo160(text);
  },

  /**
   * Format for College match list
   */
  collegeMatches: ({ colleges }: { colleges: string[] }): string => {
    const text = `PEPEA MATCHES: 100% need aid schools: ${colleges.slice(0, 4).join(', ')}. Submit Common App fee waiver. Dial *384*73732#.`;
    return truncateTo160(text);
  },

  /**
   * Format for Financial Aid list
   */
  aidPrograms: ({ programs }: { programs: string[] }): string => {
    const text = `PEPEA AID: Top matches: ${programs.slice(0, 3).join(', ')}. All verified for Kenya. Apply free at commonapp.org.`;
    return truncateTo160(text);
  },

  /**
   * WhatsApp Link
   */
  whatsAppLink: ({ url }: { url: string }): string => {
    const text = `Karibu Pepea WhatsApp Assistant: ${url} Chat with our AI counselor 24/7 for essay reviews & advice.`;
    return truncateTo160(text);
  },
};

function truncateTo160(text: string): string {
  if (text.length <= 160) return text;
  return text.slice(0, 157) + '...';
}
