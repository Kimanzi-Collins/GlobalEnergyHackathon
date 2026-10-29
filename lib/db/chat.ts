import { getDbClient } from './client';
import type { Channel, ModuleKey } from '../types';

export interface SaveConversationMessageParams {
  studentId: string;
  channel: Channel;
  module?: ModuleKey;
  role: 'student' | 'assistant' | 'system';
  content: string;
  providerMessageId?: string;
}

export interface ConversationMessage {
  id: string;
  studentId: string;
  channel: Channel;
  module?: ModuleKey;
  role: 'student' | 'assistant' | 'system';
  content: string;
  providerMessageId?: string;
  createdAt: string;
}

export function mapMessageRow(row: any): ConversationMessage {
  return {
    id: row.id,
    studentId: row.student_id,
    channel: row.channel as Channel,
    module: (row.module as ModuleKey) ?? undefined,
    role: row.role as 'student' | 'assistant' | 'system',
    content: row.content,
    providerMessageId: row.provider_message_id ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Saves a conversation message in conversation_messages.
 * If providerMessageId is provided and already exists, it is ignored (idempotency).
 */
export async function saveConversationMessage(
  params: SaveConversationMessageParams
): Promise<ConversationMessage | null> {
  const db = getDbClient();

  const insertPayload = {
    student_id: params.studentId,
    channel: params.channel,
    module: params.module ?? null,
    role: params.role,
    content: params.content,
    provider_message_id: params.providerMessageId ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('conversation_messages')
    .insert(insertPayload)
    .select('*')
    .maybeSingle();

  if (error) {
    // If unique constraint on provider_message_id triggered, return existing row
    if (error.code === '23505' && params.providerMessageId) {
      const { data: existing } = await db
        .from('conversation_messages')
        .select('*')
        .eq('provider_message_id', params.providerMessageId)
        .maybeSingle();
      return existing ? mapMessageRow(existing) : null;
    }
    throw new Error(`[DB Error: saveConversationMessage] ${error.message}`);
  }

  return data ? mapMessageRow(data) : null;
}

/**
 * Retrieves recent conversation messages for a student, returned in chronological order (oldest to newest).
 */
export async function getRecentChatMessages(
  studentId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  const db = getDbClient();

  // Query latest messages descending, then reverse so context is chronological
  const { data, error } = await db
    .from('conversation_messages')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[DB Error: getRecentConversationMessages] ${error.message}`);
  }

  if (!data) return [];

  return data.reverse().map(mapMessageRow);
}
