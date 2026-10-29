import { getDbClient } from './client';
import type { LorReviewResult } from '../types';

export interface SaveLorReviewParams {
  studentId: string;
  universityId?: string;
  recommenderRole: 'teacher' | 'counselor' | 'other';
  recommenderName?: string;
  subjectTaught?: string;
  draftContent: string;
  submittedBy?: 'student' | 'recommender';
  review: LorReviewResult;
  channel?: 'web' | 'whatsapp';
  promptVersion?: string;
}

export function mapLorReviewRow(row: any): {
  id: string;
  studentId: string;
  universityId?: string;
  recommenderRole: string;
  recommenderName?: string;
  subjectTaught?: string;
  draftContent: string;
  submittedBy: string;
  review: LorReviewResult;
  channel: string;
  promptVersion?: string;
  createdAt: string;
} {
  const feedback = row.feedback || {};
  return {
    id: row.id,
    studentId: row.student_id,
    universityId: row.university_id ?? undefined,
    recommenderRole: row.recommender_role,
    recommenderName: row.recommender_name ?? undefined,
    subjectTaught: row.subject_taught ?? undefined,
    draftContent: row.draft_content,
    submittedBy: row.submitted_by || 'student',
    review: {
      overallScore: row.overall_score,
      rubricScores: row.rubric_scores || { specificity: 0, context: 0, endorsement: 0, tone: 0 },
      verdict: row.verdict || 'Needs Specifics',
      strengths: feedback.strengths || [],
      gaps: feedback.gaps || [],
      kenyaContextToAdd: feedback.kenya_context_to_add || feedback.kenyaContextToAdd || [],
      rewrites: feedback.rewrites || [],
    },
    channel: row.channel || 'web',
    promptVersion: row.prompt_version ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Saves an Admissions Officer / mentor review of a letter of recommendation.
 */
export async function saveLorReview(params: SaveLorReviewParams): Promise<any> {
  const db = getDbClient();

  const insertPayload = {
    student_id: params.studentId,
    university_id: params.universityId ?? null,
    recommender_role: params.recommenderRole,
    recommender_name: params.recommenderName ?? null,
    subject_taught: params.subjectTaught ?? null,
    draft_content: params.draftContent,
    submitted_by: params.submittedBy || 'student',
    overall_score: params.review.overallScore,
    rubric_scores: params.review.rubricScores,
    verdict: params.review.verdict,
    feedback: {
      strengths: params.review.strengths,
      gaps: params.review.gaps,
      kenya_context_to_add: params.review.kenyaContextToAdd,
      rewrites: params.review.rewrites,
    },
    channel: params.channel || 'web',
    prompt_version: params.promptVersion || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('lor_reviews')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`[DB Error: saveLorReview] ${error.message}`);
  }

  return mapLorReviewRow(data);
}

/**
 * Retrieves all recommendation letter reviews for a student.
 */
export async function getLorReviewsByStudent(studentId: string): Promise<any[]> {
  const db = getDbClient();

  const { data, error } = await db
    .from('lor_reviews')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`[DB Error: getLorReviewsByStudent] ${error.message}`);
  }

  return (data || []).map(mapLorReviewRow);
}
