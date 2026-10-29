import { supabaseAdmin } from '@/lib/at-supabase';
import type { Channel, ModuleKey } from '@/lib/types';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// In-memory demo messages store
const demoMessages: Array<{
  id: string;
  studentId: string;
  channel: Channel;
  module?: ModuleKey;
  role: 'student' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}> = [];

/**
 * Logs a student or assistant message to `conversation_messages`.
 */
export async function logConversationMessage(params: {
  studentId: string;
  channel: Channel;
  module?: ModuleKey;
  role: 'student' | 'assistant' | 'system';
  content: string;
  providerMessageId?: string;
}): Promise<void> {
  const record = {
    student_id: params.studentId,
    channel: params.channel,
    module: params.module || null,
    role: params.role,
    content: params.content,
    provider_message_id: params.providerMessageId || null,
  };

  try {
    const { error } = await supabaseAdmin.from('conversation_messages').insert(record);

    if (error) {
      if (isDemoMode) {
        demoMessages.push({
          id: `demo-msg-${Date.now()}`,
          studentId: params.studentId,
          channel: params.channel,
          module: params.module,
          role: params.role,
          content: params.content,
          createdAt: new Date().toISOString(),
        });
        return;
      }
      console.warn(`[DB:logConversationMessage] Failed: ${error.message}`);
    }
  } catch (err) {
    if (isDemoMode) {
      demoMessages.push({
        id: `demo-msg-${Date.now()}`,
        studentId: params.studentId,
        channel: params.channel,
        module: params.module,
        role: params.role,
        content: params.content,
        createdAt: new Date().toISOString(),
      });
      return;
    }
    console.warn('[DB:logConversationMessage] Error caught:', err);
  }
}

/**
 * Fetches recent conversation messages for a student.
 */
export async function getRecentConversationMessages(
  studentId: string,
  limit: number = 10
): Promise<Array<{ role: 'student' | 'assistant'; content: string; channel: Channel; module?: ModuleKey }>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .select('role, content, channel, module')
      .eq('student_id', studentId)
      .in('role', ['student', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isDemoMode) {
        return demoMessages
          .filter((m) => m.studentId === studentId && (m.role === 'student' || m.role === 'assistant'))
          .slice(-limit)
          .map((m) => ({
            role: m.role as 'student' | 'assistant',
            content: m.content,
            channel: m.channel,
            module: m.module,
          }));
      }
      return [];
    }

    if (!data) return [];

    // Return in chronological order
    return data
      .reverse()
      .map((row) => ({
        role: row.role as 'student' | 'assistant',
        content: row.content,
        channel: row.channel as Channel,
        module: (row.module as ModuleKey) || undefined,
      }));
  } catch {
    return [];
  }
}
