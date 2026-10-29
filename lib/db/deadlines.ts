import { supabaseAdmin } from '@/lib/at-supabase';

export async function getNextDeadline(
  studentId: string
): Promise<{ universityName: string; date: string; daysLeft: number } | undefined> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('application_tasks')
      .select('due_date, task_title, universities(name)')
      .eq('student_id', studentId)
      .eq('is_completed', false)
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return undefined;
    }

    const dueDate = new Date(data.due_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const uniName = (data.universities as any)?.name || data.task_title || 'Upcoming Deadline';

    return {
      universityName: uniName,
      date: data.due_date,
      daysLeft,
    };
  } catch {
    return undefined;
  }
}
