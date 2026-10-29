import { getDbClient } from './client';
import type {
  GuideStep,
  GuidePhase,
  ProgressStatus,
  GuideResponse,
} from '../types';

export function mapGuideStepRow(row: any): GuideStep {
  return {
    id: row.id,
    order: row.step_order,
    phase: row.phase as GuidePhase,
    title: row.title,
    summary: row.summary,
    bodyMd: row.body_md,
    estMinutes: row.est_minutes ?? undefined,
    costUsd: row.cost_usd != null ? Number(row.cost_usd) : null,
    externalUrl: row.external_url ?? undefined,
    ussdCode: row.ussd_code ?? undefined,
  };
}

/**
 * Retrieves all application guide steps ordered by step_order.
 */
export async function getGuideSteps(): Promise<GuideStep[]> {
  const db = getDbClient();
  const { data, error } = await db
    .from('guide_steps')
    .select('*')
    .order('step_order', { ascending: true });

  if (error) {
    throw new Error(`[DB Error: getGuideSteps] ${error.message}`);
  }

  return (data || []).map(mapGuideStepRow);
}

/**
 * Retrieves a map of stepId -> ProgressStatus for a given student.
 */
export async function getStudentGuideProgress(studentId: string): Promise<Record<string, ProgressStatus>> {
  const db = getDbClient();
  const { data, error } = await db
    .from('student_guide_progress')
    .select('step_id, status')
    .eq('student_id', studentId);

  if (error) {
    throw new Error(`[DB Error: getStudentGuideProgress] ${error.message}`);
  }

  const progressMap: Record<string, ProgressStatus> = {};
  if (data) {
    for (const row of data) {
      progressMap[row.step_id] = row.status as ProgressStatus;
    }
  }

  return progressMap;
}

/**
 * Retrieves all guide steps combined with a student's progress status.
 */
export async function getGuideWithProgress(studentId?: string): Promise<GuideResponse> {
  const steps = await getGuideSteps();
  const progress = studentId ? await getStudentGuideProgress(studentId) : {};

  const stepsWithStatus = steps.map((step) => ({
    ...step,
    status: (progress[step.id] || 'todo') as ProgressStatus,
  }));

  const completed = stepsWithStatus.filter((s) => s.status === 'done').length;

  return {
    steps: stepsWithStatus,
    completed,
    total: stepsWithStatus.length,
  };
}

/**
 * Idempotently updates or inserts the progress status of a guide step for a student.
 */
export async function updateGuideProgress(
  studentId: string,
  stepId: string,
  status: ProgressStatus
): Promise<void> {
  const db = getDbClient();

  const { error } = await db
    .from('student_guide_progress')
    .upsert(
      {
        student_id: studentId,
        step_id: stepId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,step_id' }
    );

  if (error) {
    throw new Error(`[DB Error: updateGuideProgress] ${error.message}`);
  }
}
