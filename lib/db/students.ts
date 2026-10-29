import { supabaseAdmin } from '@/lib/at-supabase';
import type { Msisdn, StudentProfile, UpsertStudentRequest } from '@/lib/types';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// In-memory store for demo mode
const demoStudents = new Map<string, StudentProfile>();

/**
 * Converts a raw database row from the `students` table to a typed StudentProfile.
 */
export function toStudentProfile(row: any): StudentProfile {
  let intendedMajors: string[] = [];
  if (Array.isArray(row.intended_majors)) {
    intendedMajors = row.intended_majors;
  } else if (typeof row.intended_major === 'string' && row.intended_major.trim()) {
    intendedMajors = [row.intended_major.trim()];
  }

  let activities = [];
  if (Array.isArray(row.activities)) {
    activities = row.activities;
  }

  let englishTest = undefined;
  if (row.english_test && typeof row.english_test === 'object' && row.english_test.type) {
    englishTest = {
      type: String(row.english_test.type),
      score: Number(row.english_test.score || 0),
    };
  }

  return {
    id: row.id,
    phoneNumber: row.phone_number,
    fullName: row.full_name || '',
    county: row.county || undefined,
    schoolName: row.school_name || undefined,
    schoolType: row.school_type || undefined,
    kcseYear: row.kcse_year != null ? Number(row.kcse_year) : undefined,
    kcseGrade: row.kcse_grade || undefined,
    kcsePoints: row.kcse_points != null ? Number(row.kcse_points) : undefined,
    kcseSubjectGrades: row.kcse_subject_grades || undefined,
    gpaEquivalent: row.gpa_equivalent != null ? Number(row.gpa_equivalent) : undefined,
    satScore: row.sat_score != null ? Number(row.sat_score) : undefined,
    actScore: row.act_score != null ? Number(row.act_score) : undefined,
    englishTest,
    intendedMajors,
    needsFullAid: row.needs_full_aid !== false,
    familyIncomeBand: row.family_income_band || 'unknown',
    maxFamilyContributionUsd:
      row.max_family_contribution_usd != null ? Number(row.max_family_contribution_usd) : undefined,
    activities,
    preferredChannel: row.preferred_channel || 'ussd',
    preferredLanguage: row.preferred_language === 'sw' ? 'sw' : 'en',
    activeModule: row.active_module || undefined,
    consentGivenAt: row.consent_given_at || undefined,
  };
}

/**
 * Fetches a student profile by normalized phone number.
 */
export async function getStudentByPhone(phoneNumber: Msisdn): Promise<StudentProfile | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) {
      if (isDemoMode) {
        return demoStudents.get(phoneNumber) || null;
      }
      throw new Error(`[DB:getStudentByPhone] Supabase query failed: ${error.message}`);
    }

    if (!data) {
      if (isDemoMode && demoStudents.has(phoneNumber)) {
        return demoStudents.get(phoneNumber)!;
      }
      return null;
    }

    return toStudentProfile(data);
  } catch (err) {
    if (isDemoMode) {
      return demoStudents.get(phoneNumber) || null;
    }
    throw err;
  }
}

/**
 * Gets an existing student profile by phone or creates a new one with a default placeholder name.
 */
export async function getOrCreateStudent(
  phoneNumber: Msisdn,
  defaultName: string = 'KCSE Applicant'
): Promise<StudentProfile> {
  const existing = await getStudentByPhone(phoneNumber);
  if (existing) return existing;

  const result = await upsertStudent({
    phoneNumber,
    fullName: defaultName,
  });
  return result.student;
}

/**
 * Fetches a student profile by ID.
 */
export async function getStudentById(id: string): Promise<StudentProfile | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (isDemoMode) {
        for (const s of Array.from(demoStudents.values())) {
          if (s.id === id) return s;
        }
        return null;
      }
      throw new Error(`[DB:getStudentById] Supabase query failed: ${error.message}`);
    }

    if (!data) {
      if (isDemoMode) {
        for (const s of Array.from(demoStudents.values())) {
          if (s.id === id) return s;
        }
      }
      return null;
    }

    return toStudentProfile(data);
  } catch (err) {
    if (isDemoMode) {
      for (const s of Array.from(demoStudents.values())) {
        if (s.id === id) return s;
      }
      return null;
    }
    throw err;
  }
}

/**
 * Upserts a student profile.
 *
 * CRITICAL REQUIREMENT:
 * Never overwrite existing non-null profile fields with defaults.
 * If the student exists and has a fullName, do not overwrite it unless a non-empty
 * name is explicitly provided in the payload.
 */
export async function upsertStudent(
  req: UpsertStudentRequest
): Promise<{ student: StudentProfile; created: boolean }> {
  const existing = await getStudentByPhone(req.phoneNumber);

  if (existing) {
    // Student exists: prepare selective update
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };

    // Only update full_name if non-empty string provided
    if (typeof req.fullName === 'string' && req.fullName.trim().length > 0) {
      updatePayload.full_name = req.fullName.trim();
    }
    if (req.county !== undefined) updatePayload.county = req.county;
    if (req.schoolName !== undefined) updatePayload.school_name = req.schoolName;
    if (req.schoolType !== undefined) updatePayload.school_type = req.schoolType;
    if (req.kcseYear !== undefined) updatePayload.kcse_year = req.kcseYear;
    if (req.kcseGrade !== undefined) updatePayload.kcse_grade = req.kcseGrade;
    if (req.kcsePoints !== undefined) updatePayload.kcse_points = req.kcsePoints;
    if (req.kcseSubjectGrades !== undefined) updatePayload.kcse_subject_grades = req.kcseSubjectGrades;
    if (req.gpaEquivalent !== undefined) updatePayload.gpa_equivalent = req.gpaEquivalent;
    if (req.satScore !== undefined) updatePayload.sat_score = req.satScore;
    if (req.actScore !== undefined) updatePayload.act_score = req.actScore;
    if (req.englishTest !== undefined) updatePayload.english_test = req.englishTest;
    if (req.intendedMajors !== undefined) updatePayload.intended_majors = req.intendedMajors;
    if (req.needsFullAid !== undefined) updatePayload.needs_full_aid = req.needsFullAid;
    if (req.familyIncomeBand !== undefined) updatePayload.family_income_band = req.familyIncomeBand;
    if (req.maxFamilyContributionUsd !== undefined)
      updatePayload.max_family_contribution_usd = req.maxFamilyContributionUsd;
    if (req.activities !== undefined) updatePayload.activities = req.activities;
    if (req.preferredChannel !== undefined) updatePayload.preferred_channel = req.preferredChannel;
    if (req.preferredLanguage !== undefined) updatePayload.preferred_language = req.preferredLanguage;
    if (req.activeModule !== undefined) updatePayload.active_module = req.activeModule;
    if (req.consentGivenAt !== undefined) updatePayload.consent_given_at = req.consentGivenAt;

    try {
      const { data, error } = await supabaseAdmin
        .from('students')
        .update(updatePayload)
        .eq('phone_number', req.phoneNumber)
        .select('*')
        .single();

      if (error) {
        if (isDemoMode) {
          const merged: StudentProfile = {
            ...existing,
            fullName: updatePayload.full_name ?? existing.fullName,
            county: updatePayload.county !== undefined ? updatePayload.county : existing.county,
            schoolName: updatePayload.school_name !== undefined ? updatePayload.school_name : existing.schoolName,
            schoolType: updatePayload.school_type !== undefined ? updatePayload.school_type : existing.schoolType,
            kcseYear: updatePayload.kcse_year !== undefined ? updatePayload.kcse_year : existing.kcseYear,
            kcseGrade: updatePayload.kcse_grade !== undefined ? updatePayload.kcse_grade : existing.kcseGrade,
            kcsePoints: updatePayload.kcse_points !== undefined ? updatePayload.kcse_points : existing.kcsePoints,
            kcseSubjectGrades:
              updatePayload.kcse_subject_grades !== undefined
                ? updatePayload.kcse_subject_grades
                : existing.kcseSubjectGrades,
            gpaEquivalent:
              updatePayload.gpa_equivalent !== undefined ? updatePayload.gpa_equivalent : existing.gpaEquivalent,
            satScore: updatePayload.sat_score !== undefined ? updatePayload.sat_score : existing.satScore,
            actScore: updatePayload.act_score !== undefined ? updatePayload.act_score : existing.actScore,
            englishTest: updatePayload.english_test !== undefined ? updatePayload.english_test : existing.englishTest,
            intendedMajors:
              updatePayload.intended_majors !== undefined ? updatePayload.intended_majors : existing.intendedMajors,
            needsFullAid:
              updatePayload.needs_full_aid !== undefined ? updatePayload.needs_full_aid : existing.needsFullAid,
            familyIncomeBand:
              updatePayload.family_income_band !== undefined
                ? updatePayload.family_income_band
                : existing.familyIncomeBand,
            maxFamilyContributionUsd:
              updatePayload.max_family_contribution_usd !== undefined
                ? updatePayload.max_family_contribution_usd
                : existing.maxFamilyContributionUsd,
            activities: updatePayload.activities !== undefined ? updatePayload.activities : existing.activities,
            preferredChannel:
              updatePayload.preferred_channel !== undefined
                ? updatePayload.preferred_channel
                : existing.preferredChannel,
            preferredLanguage:
              updatePayload.preferred_language !== undefined
                ? updatePayload.preferred_language
                : existing.preferredLanguage,
            activeModule:
              updatePayload.active_module !== undefined ? updatePayload.active_module : existing.activeModule,
            consentGivenAt:
              updatePayload.consent_given_at !== undefined ? updatePayload.consent_given_at : existing.consentGivenAt,
          };
          demoStudents.set(req.phoneNumber, merged);
          return { student: merged, created: false };
        }
        throw new Error(`[DB:upsertStudent] Update failed: ${error.message}`);
      }

      const updated = toStudentProfile(data);
      if (isDemoMode) demoStudents.set(req.phoneNumber, updated);
      return { student: updated, created: false };
    } catch (err) {
      if (isDemoMode) {
        const merged: StudentProfile = {
          ...existing,
          fullName: updatePayload.full_name ?? existing.fullName,
          county: updatePayload.county !== undefined ? updatePayload.county : existing.county,
          intendedMajors:
            updatePayload.intended_majors !== undefined ? updatePayload.intended_majors : existing.intendedMajors,
          kcseGrade: updatePayload.kcse_grade !== undefined ? updatePayload.kcse_grade : existing.kcseGrade,
          gpaEquivalent:
            updatePayload.gpa_equivalent !== undefined ? updatePayload.gpa_equivalent : existing.gpaEquivalent,
        };
        demoStudents.set(req.phoneNumber, merged);
        return { student: merged, created: false };
      }
      throw err;
    }
  }

  // Student does not exist: create new row
  const insertPayload: Record<string, any> = {
    phone_number: req.phoneNumber,
    full_name: req.fullName?.trim() || 'Student',
    county: req.county,
    school_name: req.schoolName,
    school_type: req.schoolType,
    kcse_year: req.kcseYear,
    kcse_grade: req.kcseGrade,
    kcse_points: req.kcsePoints,
    kcse_subject_grades: req.kcseSubjectGrades || {},
    gpa_equivalent: req.gpaEquivalent,
    sat_score: req.satScore,
    act_score: req.actScore,
    english_test: req.englishTest,
    intended_majors: req.intendedMajors || [],
    needs_full_aid: req.needsFullAid !== undefined ? req.needsFullAid : true,
    family_income_band: req.familyIncomeBand || 'unknown',
    max_family_contribution_usd: req.maxFamilyContributionUsd,
    activities: req.activities || [],
    preferred_channel: req.preferredChannel || 'ussd',
    preferred_language: req.preferredLanguage || 'en',
    active_module: req.activeModule,
    consent_given_at: req.consentGivenAt,
    last_seen_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      if (isDemoMode) {
        const newStudent: StudentProfile = {
          id: `demo-student-${Date.now()}`,
          phoneNumber: req.phoneNumber,
          fullName: insertPayload.full_name,
          county: req.county,
          schoolName: req.schoolName,
          schoolType: req.schoolType,
          kcseYear: req.kcseYear,
          kcseGrade: req.kcseGrade,
          kcsePoints: req.kcsePoints,
          kcseSubjectGrades: req.kcseSubjectGrades,
          gpaEquivalent: req.gpaEquivalent,
          satScore: req.satScore,
          actScore: req.actScore,
          englishTest: req.englishTest,
          intendedMajors: req.intendedMajors || [],
          needsFullAid: insertPayload.needs_full_aid,
          familyIncomeBand: insertPayload.family_income_band,
          maxFamilyContributionUsd: req.maxFamilyContributionUsd,
          activities: req.activities || [],
          preferredChannel: insertPayload.preferred_channel,
          preferredLanguage: insertPayload.preferred_language,
          activeModule: req.activeModule,
          consentGivenAt: req.consentGivenAt,
        };
        demoStudents.set(req.phoneNumber, newStudent);
        return { student: newStudent, created: true };
      }
      throw new Error(`[DB:upsertStudent] Insert failed: ${error.message}`);
    }

    const createdStudent = toStudentProfile(data);
    if (isDemoMode) demoStudents.set(req.phoneNumber, createdStudent);
    return { student: createdStudent, created: true };
  } catch (err) {
    if (isDemoMode) {
      const newStudent: StudentProfile = {
        id: `demo-student-${Date.now()}`,
        phoneNumber: req.phoneNumber,
        fullName: insertPayload.full_name,
        county: req.county,
        intendedMajors: req.intendedMajors || [],
        needsFullAid: insertPayload.needs_full_aid,
        familyIncomeBand: insertPayload.family_income_band,
        activities: [],
        preferredChannel: 'ussd',
        preferredLanguage: 'en',
      };
      demoStudents.set(req.phoneNumber, newStudent);
      return { student: newStudent, created: true };
    }
    throw err;
  }
}

/**
 * Updates a student's KCSE grade and indicative GPA equivalent.
 */
export async function updateStudentGpa(
  phoneNumber: Msisdn,
  kcseGrade: string,
  gpaEquivalent: number
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('students')
      .update({
        kcse_grade: kcseGrade,
        gpa_equivalent: gpaEquivalent,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber);

    if (error) {
      if (!isDemoMode) {
        throw new Error(`[DB:updateStudentGpa] Update failed: ${error.message}`);
      }
    }

    if (isDemoMode && demoStudents.has(phoneNumber)) {
      const existing = demoStudents.get(phoneNumber)!;
      demoStudents.set(phoneNumber, {
        ...existing,
        kcseGrade,
        gpaEquivalent,
      });
    }
  } catch (err) {
    if (!isDemoMode) throw err;
  }
}

/**
 * Deletes all data associated with a student for Kenya Data Protection Act compliance (BE-DB-07).
 * Removes student profile, messages, facts, conversions, guide progress, essays, reviews, etc.
 */
export async function deleteStudentData(
  studentIdOrPhone: string
): Promise<{ success: boolean; studentId: string }> {
  let studentId = studentIdOrPhone;

  // If input is phone number, look up student ID
  if (studentIdOrPhone.startsWith('+') || /^\d+$/.test(studentIdOrPhone)) {
    const student = await getStudentByPhone(studentIdOrPhone);
    if (!student) {
      return { success: true, studentId: studentIdOrPhone };
    }
    studentId = student.id;
  }

  try {
    // Delete student-owned records across tables
    await Promise.allSettled([
      supabaseAdmin.from('conversation_messages').delete().eq('student_id', studentId),
      supabaseAdmin.from('student_facts').delete().eq('student_id', studentId),
      supabaseAdmin.from('gpa_conversions').delete().eq('student_id', studentId),
      supabaseAdmin.from('student_guide_progress').delete().eq('student_id', studentId),
      supabaseAdmin.from('university_matches').delete().eq('student_id', studentId),
      supabaseAdmin.from('student_aid_matches').delete().eq('student_id', studentId),
      supabaseAdmin.from('lor_reviews').delete().eq('student_id', studentId),
      supabaseAdmin.from('essay_reviews').delete().eq('student_id', studentId),
      supabaseAdmin.from('voice_sessions').delete().eq('student_id', studentId),
      supabaseAdmin.from('application_tasks').delete().eq('student_id', studentId),
      supabaseAdmin.from('essays').delete().eq('student_id', studentId),
    ]);

    const { error } = await supabaseAdmin.from('students').delete().eq('id', studentId);
    if (error && !isDemoMode) {
      throw new Error(`[DB:deleteStudentData] Deletion failed: ${error.message}`);
    }

    if (isDemoMode) {
      for (const [phone, student] of Array.from(demoStudents.entries())) {
        if (student.id === studentId || phone === studentIdOrPhone) {
          demoStudents.delete(phone);
        }
      }
    }

    return { success: true, studentId };
  } catch (err) {
    if (!isDemoMode) throw err;
    return { success: true, studentId };
  }
}
