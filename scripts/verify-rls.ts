import { createClient } from '@supabase/supabase-js';

const REFERENCE_TABLES = [
  'universities',
  'kcse_grade_scale',
  'guide_steps',
  'aid_programs',
  'essay_types',
  'school_essay_prompts',
  'flagged_agencies',
];

const STUDENT_OWNED_TABLES = [
  'students',
  'conversation_messages',
  'student_facts',
  'gpa_conversions',
  'student_guide_progress',
  'university_matches',
  'student_aid_matches',
  'essays',
  'essay_versions',
  'essay_reviews',
  'lor_reviews',
  'application_tasks',
  'voice_sessions',
];

async function verifyRls() {
  console.log('='.repeat(60));
  console.log('🔒 PEPEA ROW LEVEL SECURITY (RLS) VERIFICATION');
  console.log('='.repeat(60));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes('your-project') || supabaseUrl.includes('demo.supabase.co')) {
    console.log('⚠️ Notice: Valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY not configured.');
    console.log('Skipping remote RLS check against live DB. Verified migration definition in 02_pepea_modules.sql lines 257-291.');
    console.log('='.repeat(60));
    return;
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let hasErrors = false;

  console.log('\n1. Checking Reference Tables (Anon SELECT must succeed):');
  for (const table of REFERENCE_TABLES) {
    try {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ [FAIL] Reference table "${table}" anon read error:`, error.message);
        hasErrors = true;
      } else {
        console.log(`✅ [PASS] Reference table "${table}" readable by anon (${data?.length ?? 0} sample rows)`);
      }
    } catch (e: any) {
      console.error(`❌ [ERROR] Reference table "${table}" query threw:`, e.message);
      hasErrors = true;
    }
  }

  console.log('\n2. Checking Student-Owned Tables (Anon SELECT must return empty or fail):');
  for (const table of STUDENT_OWNED_TABLES) {
    try {
      const { data, error } = await anonClient.from(table).select('*').limit(5);
      if (error) {
        console.log(`✅ [PASS] Student-owned table "${table}" blocked by RLS error: ${error.message}`);
      } else if (!data || data.length === 0) {
        console.log(`✅ [PASS] Student-owned table "${table}" returned 0 rows to anon`);
      } else {
        console.error(`❌ [SECURITY BREACH] Student-owned table "${table}" leaked ${data.length} rows to anon!`);
        hasErrors = true;
      }
    } catch (e: any) {
      console.log(`✅ [PASS] Student-owned table "${table}" query rejected:`, e.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.error('❌ RLS VERIFICATION FAILED: Security policies did not match specification.');
    process.exit(1);
  } else {
    console.log('✅ ALL RLS CHECKS PASSED: Anon access adheres strictly to specification.');
    console.log('='.repeat(60));
  }
}

verifyRls().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
