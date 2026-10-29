import { supabaseAdmin } from '@/lib/at-supabase';
import type { StudentFact } from '@/lib/types';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const demoFacts = new Map<string, StudentFact[]>();

export async function getStudentFacts(studentId: string): Promise<StudentFact[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_facts')
      .select('fact_key, fact_value, source, confidence')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) {
      if (isDemoMode) {
        return demoFacts.get(studentId) || [];
      }
      return [];
    }

    if (!data || data.length === 0) {
      if (isDemoMode) {
        return demoFacts.get(studentId) || [];
      }
      return [];
    }

    return data.map((row) => ({
      key: row.fact_key,
      value: row.fact_value,
      source: row.source || 'student_said',
      confidence: row.confidence != null ? Number(row.confidence) : 1.0,
    }));
  } catch {
    if (isDemoMode) {
      return demoFacts.get(studentId) || [];
    }
    return [];
  }
}

export async function upsertStudentFact(studentId: string, fact: StudentFact): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('student_facts')
      .upsert(
        {
          student_id: studentId,
          fact_key: fact.key,
          fact_value: fact.value,
          source: fact.source || 'student_said',
          confidence: fact.confidence ?? 1.0,
        },
        { onConflict: 'student_id,fact_key' }
      );

    if (error && !isDemoMode) {
      throw new Error(`[DB:upsertStudentFact] Upsert failed: ${error.message}`);
    }

    if (isDemoMode) {
      const existing = demoFacts.get(studentId) || [];
      const updated = existing.filter((f) => f.key !== fact.key);
      updated.push(fact);
      demoFacts.set(studentId, updated);
    }
  } catch (err) {
    if (!isDemoMode) throw err;
  }
}

export async function deleteStudentFact(studentId: string, factKey: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('student_facts')
      .delete()
      .eq('student_id', studentId)
      .eq('fact_key', factKey);

    if (error && !isDemoMode) {
      throw new Error(`[DB:deleteStudentFact] Delete failed: ${error.message}`);
    }

    if (isDemoMode) {
      const existing = demoFacts.get(studentId) || [];
      demoFacts.set(
        studentId,
        existing.filter((f) => f.key !== factKey)
      );
    }
  } catch (err) {
    if (!isDemoMode) throw err;
  }
}
