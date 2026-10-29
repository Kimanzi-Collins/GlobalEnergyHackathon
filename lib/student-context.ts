import { getStudentByPhone, getStudentFacts, getRecentConversationMessages, getNextDeadline } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';
import type { Msisdn, StudentContext } from '@/lib/types';

/**
 * Builds the comprehensive StudentContext required by Gemini prompts.
 *
 * Fetches the student's profile, stored facts, the 10 most recent conversation messages,
 * and the next upcoming application deadline.
 */
export async function buildStudentContext(phone: Msisdn): Promise<StudentContext | null> {
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) return null;

  const profile = await getStudentByPhone(normalized);
  if (!profile) return null;

  const [facts, recentMessages, nextDeadline] = await Promise.all([
    getStudentFacts(profile.id),
    getRecentConversationMessages(profile.id, 10),
    getNextDeadline(profile.id),
  ]);

  return {
    profile,
    facts,
    recentMessages: recentMessages || [],
    nextDeadline,
  };
}
