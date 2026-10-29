/**
 * Shared types and API contracts for Pepea.
 *
 * Backend (Geoffrey, Esther) implements these routes; frontend (Collins, Sandra) consumes them.
 * If a shape needs to change, change it HERE first and note it in AGENTS.md section 7.
 * DB rows are snake_case (Supabase); API payloads are camelCase.
 */

// ------------------------------------------------------------------
// Primitives
// ------------------------------------------------------------------
export type Channel = 'ussd' | 'sms' | 'whatsapp' | 'web' | 'voice';
export type ModuleKey = 'guide' | 'gpa' | 'aid' | 'essay' | 'lor' | 'advisor' | 'context' | 'cue' | 'interview';

/** E.164 Kenyan MSISDN, e.g. +254712345678. Normalise every inbound number with normalizeKenyanPhone(). */
export type Msisdn = string;

/** Every API error uses this shape. */
export interface ApiError {
  error: string;
  code?: 'VALIDATION' | 'NOT_FOUND' | 'RATE_LIMITED' | 'UPSTREAM_AI' | 'UPSTREAM_AT' | 'UPSTREAM_DB' | 'INTERNAL';
  details?: Record<string, unknown>;
}

// ------------------------------------------------------------------
// Student Context module
// ------------------------------------------------------------------
export type IncomeBand = 'under_5k' | '5k_20k' | '20k_60k' | '60k_100k' | 'over_100k' | 'unknown';

export interface Activity {
  title: string;
  role?: string;
  years?: number;
  summary?: string;
}

export interface StudentProfile {
  id: string;
  phoneNumber: Msisdn;
  fullName: string;
  county?: string;
  schoolName?: string;
  schoolType?: 'national' | 'extra_county' | 'county' | 'sub_county' | 'private' | 'other';
  kcseYear?: number;
  kcseGrade?: string;
  kcsePoints?: number;
  kcseSubjectGrades?: Record<string, string>;
  gpaEquivalent?: number;
  satScore?: number;
  actScore?: number;
  englishTest?: { type: string; score: number };
  intendedMajors: string[];
  needsFullAid: boolean;
  familyIncomeBand: IncomeBand;
  maxFamilyContributionUsd?: number;
  activities: Activity[];
  preferredChannel: Channel;
  preferredLanguage: 'en' | 'sw';
  activeModule?: ModuleKey;
  consentGivenAt?: string;
}

export interface StudentFact {
  key: string;
  value: string;
  source: 'student_said' | 'ai_inferred' | 'form' | 'ussd';
  confidence: number;
}

/** What gets injected into every Gemini call. Built by buildStudentContext() on the server. */
export interface StudentContext {
  profile: StudentProfile;
  facts: StudentFact[];
  recentMessages: Array<{ role: 'student' | 'assistant'; content: string; channel: Channel; module?: ModuleKey }>;
  nextDeadline?: { universityName: string; date: string; daysLeft: number };
}

export interface UpsertStudentRequest extends Partial<Omit<StudentProfile, 'id' | 'phoneNumber'>> {
  phoneNumber: Msisdn;
}
export interface UpsertStudentResponse {
  student: StudentProfile;
  created: boolean;
}

// ------------------------------------------------------------------
// GPA Converter module
// ------------------------------------------------------------------
export interface KcseGradeBand {
  grade: string;
  pointsPerSubject: number;
  aggregateMin: number;
  aggregateMax: number;
  gpa40: number;
  ussdCode: number;
}

export interface GpaConvertRequest {
  phoneNumber?: Msisdn;
  /** Provide at least one of meanGrade, points or subjects. */
  meanGrade?: string;
  points?: number;
  subjects?: Record<string, string>;
  channel?: Channel;
}
export interface GpaConvertResponse {
  gpaUnweighted: number;
  scale: 4.0;
  meanGrade: string;
  method: string;
  explanation: string;
  /** Always true: the result is indicative, not an official evaluation. */
  indicative: true;
}

// ------------------------------------------------------------------
// Application Guide module
// ------------------------------------------------------------------
export type GuidePhase = 'prepare' | 'choose' | 'apply' | 'fund' | 'decide' | 'visa';
export type ProgressStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

export interface GuideStep {
  id: string;
  order: number;
  phase: GuidePhase;
  title: string;
  /** <= 160 chars: fits one SMS. */
  summary: string;
  bodyMd: string;
  estMinutes?: number;
  costUsd?: number | null;
  externalUrl?: string;
  ussdCode?: number;
  dataVerifiedAt?: string | null;
}
export interface GuideResponse {
  steps: Array<GuideStep & { status: ProgressStatus }>;
  completed: number;
  total: number;
}
export interface GuideProgressRequest {
  phoneNumber: Msisdn;
  stepId: string;
  status: ProgressStatus;
}

// ------------------------------------------------------------------
// University Advisory module
// ------------------------------------------------------------------
export type MatchTier = 'reach' | 'target' | 'likely';
export type AidOutlook = 'full_need' | 'partial' | 'merit_only' | 'unlikely';

export interface University {
  id: string;
  name: string;
  meets100PctNeed: boolean;
  isNeedBlindIntl: boolean;
  edEaDeadline: string;
  rdDeadline: string;
  applicationPlatform: 'common_app' | 'coalition' | 'questbridge' | 'own_portal';
  cssProfileRequired: boolean;
  testPolicy: 'required' | 'optional' | 'blind';
  strongMajors: string[];
  websiteUrl?: string;
  /** null means the data has not been verified against the school's own site. UI must show an "unverified" badge. */
  dataVerifiedAt: string | null;
}

export interface UniversityMatch {
  university: University;
  tier: MatchTier;
  fitScore: number;
  aidOutlook: AidOutlook;
  reasons: string[];
}
export interface AdvisorRequest {
  phoneNumber: Msisdn;
  /** Optional free-text question. Omit to just refresh matches. */
  question?: string;
  channel?: Channel;
}
export interface AdvisorResponse {
  matches: UniversityMatch[];
  answer?: string;
  disclaimer: string;
}

// ------------------------------------------------------------------
// Financial Aid module
// ------------------------------------------------------------------
export type AidProgramType = 'institutional_need' | 'institutional_merit' | 'external_scholarship' | 'fee_waiver' | 'pathway_program';

export interface AidProgram {
  id: string;
  name: string;
  programType: AidProgramType;
  provider: string;
  universityId?: string;
  coversFullCost: boolean;
  amountUsdMin?: number;
  amountUsdMax?: number;
  requiresCssProfile: boolean;
  deadline?: string;
  eligibilityMd?: string;
  howToApplyMd?: string;
  officialUrl?: string;
  dataVerifiedAt: string | null;
}
export interface AidMatch {
  program: AidProgram;
  matchScore: number;
  reasons: string[];
}
export interface AidScoutRequest {
  phoneNumber: Msisdn;
  question?: string;
  channel?: Channel;
}
export interface AidScoutResponse {
  matches: AidMatch[];
  answer?: string;
  disclaimer: string;
}

// ------------------------------------------------------------------
// Essay module: split by TYPE and by SCHOOL
// ------------------------------------------------------------------
export type EssayScope = 'common' | 'school_specific' | 'scholarship' | 'aid';
export type EssayTypeCode =
  | 'personal_statement'
  | 'why_us'
  | 'why_major'
  | 'community'
  | 'short_answer'
  | 'activities'
  | 'additional_info'
  | 'scholarship_essay'
  | 'financial_circumstances';

export interface RubricItem {
  key: string;
  label: string;
  max: number;
}
export interface EssayType {
  code: EssayTypeCode;
  label: string;
  scope: EssayScope;
  defaultWordLimit?: number;
  rubric: RubricItem[];
  guidanceMd?: string;
  ussdCode?: number;
}
export interface SchoolEssayPrompt {
  id: string;
  universityId: string;
  essayType: EssayTypeCode;
  promptKey: string;
  title: string;
  promptText: string;
  wordLimit?: number;
  isRequired: boolean;
  admissionCycle: string;
  dataVerifiedAt: string | null;
}

/** GET /api/essays/catalog?universityId= returns types plus per-school prompts, grouped for the picker UI. */
export interface EssayCatalogResponse {
  types: EssayType[];
  schools: Array<{ university: Pick<University, 'id' | 'name' | 'edEaDeadline' | 'rdDeadline'>; prompts: SchoolEssayPrompt[] }>;
}

export type EssayStatus = 'brainstorm' | 'drafting' | 'in_review' | 'final';
export interface Essay {
  id: string;
  essayType: EssayTypeCode;
  universityId?: string;
  schoolPromptId?: string;
  title?: string;
  status: EssayStatus;
  latestVersionNo: number;
  latestScore?: number;
}

export type AoPersona = 'ivy_committee_chair' | 'kensap_mentor';
export interface EssayReviewRequest {
  phoneNumber: Msisdn;
  essayType: EssayTypeCode;
  /** Required for school_specific essays. */
  schoolPromptId?: string;
  /** Existing essay to add a version to; omit to create one. */
  essayId?: string;
  draft: string;
  persona?: AoPersona;
  channel?: Channel;
}
export interface EssayReviewResult {
  overallScore: number;
  rubricScores: Record<string, number>;
  verdict: 'Strong Admit' | 'Borderline / Too Generic' | 'Rewrite Required';
  committeeSummary: string;
  clichesDetected: string[];
  lineEdits: Array<{ original: string; issue: string; suggestion: string }>;
  kenyanContextTips: string;
  rewriteExample: string;
}
export interface EssayReviewResponse {
  essayId: string;
  versionNo: number;
  wordCount: number;
  wordLimit?: number;
  review: EssayReviewResult;
}

// ------------------------------------------------------------------
// LOR Review module (text review; no voice call flow)
// ------------------------------------------------------------------
export interface LorReviewRequest {
  phoneNumber: Msisdn;
  universityId?: string;
  recommenderRole: 'teacher' | 'counselor' | 'other';
  recommenderName?: string;
  subjectTaught?: string;
  draft: string;
  submittedBy?: 'student' | 'recommender';
  channel?: 'web' | 'whatsapp';
}
export interface LorReviewResult {
  overallScore: number;
  rubricScores: { specificity: number; context: number; endorsement: number; tone: number };
  verdict: 'Strong' | 'Needs Specifics' | 'Generic';
  strengths: string[];
  gaps: string[];
  kenyaContextToAdd: string[];
  rewrites: Array<{ original: string; suggestion: string }>;
}
export interface LorReviewResponse {
  id: string;
  review: LorReviewResult;
}

// ------------------------------------------------------------------
// Chat (WhatsApp and web assistant)
// ------------------------------------------------------------------
export interface ChatRequest {
  phoneNumber: Msisdn;
  message: string;
  channel: 'whatsapp' | 'web';
  /** Force a module; omit to let the router decide. */
  module?: ModuleKey;
}
export interface ChatResponse {
  reply: string;
  module: ModuleKey;
  /** Suggested quick replies, max 3, each <= 20 chars (WhatsApp buttons). */
  quickReplies?: string[];
}

// ------------------------------------------------------------------
// USSD (numeric only)
// ------------------------------------------------------------------
/**
 * Africa's Talking POSTs form-encoded `sessionId, serviceCode, phoneNumber, networkCode, text`.
 * `text` is the '*'-joined history of digits the user entered. Reply with `CON ...` or `END ...`.
 * Rules: every prompt is answered with DIGITS ONLY, max 182 chars per screen, handler must answer < 3 s.
 */
export interface UssdWebhook {
  sessionId: string;
  serviceCode: string;
  phoneNumber: Msisdn;
  networkCode?: string;
  text: string;
}
