import { NextRequest } from 'next/server';
import { POST as handlePostStudent } from '../app/api/students/route';
import { GET as handleGetStudentMe } from '../app/api/students/me/route';
import { POST as handlePostGpa, GET as handleGetGpa } from '../app/api/gpa/route';
import { POST as handlePostEssayReview } from '../app/api/essays/review/route';
import { deleteStudentData } from '../lib/db';

process.env.NEXT_PUBLIC_DEMO_MODE = 'true';

let failed = 0;
let passed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`, details || '');
    failed++;
  }
}

async function runTests() {
  console.log('=== RUNNING TESTS FOR P0 API ROUTES ===\n');

  try {
    await deleteStudentData('+254712345678');
  } catch (err) {
    // Ignore if not present
  }

  // ==========================================
  // 1. BE-API-01: STUDENTS
  // ==========================================
  console.log('1. Testing BE-API-01: /api/students & /api/students/me');

  // Test 1.1: Reject invalid phone numbers
  {
    const req = new NextRequest('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '0201234567', // Landline Nairobi
        fullName: 'Test Landline',
      }),
    });
    const res = await handlePostStudent(req);
    const body = await res.json();
    assert(res.status === 400, 'Rejects landline phone with 400', body);
    assert(body.code === 'VALIDATION', 'Error code is VALIDATION', body);
  }

  // Test 1.2: Create new student with local 07xx phone format
  let createdPhone = '+254712345678';
  {
    const req = new NextRequest('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '0712345678',
        fullName: 'Faith Chebet',
        county: 'Bomet',
        schoolName: 'Moi Girls High School Eldoret',
        schoolType: 'national',
        kcseYear: 2025,
        intendedMajors: ['Computer Science', 'Data Science'],
        needsFullAid: true,
      }),
    });
    const res = await handlePostStudent(req);
    const body = await res.json();
    assert(res.status === 201, 'Creates student returning 201 Created', body);
    assert(body.created === true, 'created flag is true', body);
    assert(body.student.phoneNumber === createdPhone, 'phoneNumber normalized to E.164 +254712345678', body);
    assert(body.student.fullName === 'Faith Chebet', 'fullName is Faith Chebet', body);
    assert(body.student.intendedMajors.length === 2, 'intendedMajors populated', body);
  }

  // Test 1.3: CRITICAL REQUIREMENT - Do NOT overwrite existing non-null fields with defaults!
  {
    // Update student with ONLY kcseGrade - omit fullName, county, intendedMajors
    const req = new NextRequest('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '+254712345678',
        kcseGrade: 'A',
        kcsePoints: 82,
      }),
    });
    const res = await handlePostStudent(req);
    const body = await res.json();
    assert(res.status === 200, 'Updates existing student returning 200', body);
    assert(body.created === false, 'created flag is false', body);
    assert(body.student.fullName === 'Faith Chebet', 'CRITICAL: fullName was NOT overwritten by default', body);
    assert(body.student.county === 'Bomet', 'CRITICAL: county was NOT overwritten', body);
    assert(body.student.kcseGrade === 'A', 'kcseGrade updated to A', body);
    assert(body.student.kcsePoints === 82, 'kcsePoints updated to 82', body);
  }

  // Test 1.4: Update fullName when explicitly provided
  {
    const req = new NextRequest('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '254712345678',
        fullName: 'Faith Chebet Kiprono',
      }),
    });
    const res = await handlePostStudent(req);
    const body = await res.json();
    assert(body.student.fullName === 'Faith Chebet Kiprono', 'fullName updated when explicitly non-empty', body);
  }

  // Test 1.5: GET /api/students/me with query param
  {
    const req = new NextRequest('http://localhost:3000/api/students/me?phoneNumber=0712345678', {
      method: 'GET',
    });
    const res = await handleGetStudentMe(req);
    const body = await res.json();
    assert(res.status === 200, 'GET /api/students/me returns 200 for existing student', body);
    assert(body.student.fullName === 'Faith Chebet Kiprono', 'Returns correct student profile', body);
  }

  // Test 1.6: GET /api/students/me with Authorization Bearer header
  {
    const req = new NextRequest('http://localhost:3000/api/students/me', {
      method: 'GET',
      headers: {
        authorization: 'Bearer +254712345678',
      },
    });
    const res = await handleGetStudentMe(req);
    const body = await res.json();
    assert(res.status === 200, 'GET /api/students/me accepts Authorization Bearer header', body);
    assert(body.student.phoneNumber === '+254712345678', 'Profile matches Bearer phone', body);
  }

  // Test 1.7: GET /api/students/me 404 for unknown phone
  {
    const req = new NextRequest('http://localhost:3000/api/students/me?phoneNumber=0799999999', {
      method: 'GET',
    });
    const res = await handleGetStudentMe(req);
    const body = await res.json();
    assert(res.status === 404, 'GET /api/students/me returns 404 for non-existent student', body);
    assert(body.code === 'NOT_FOUND', 'Error code is NOT_FOUND', body);
  }

  // ==========================================
  // 2. BE-API-02: GPA CONVERTER
  // ==========================================
  console.log('\n2. Testing BE-API-02: /api/gpa (POST and GET)');

  // Test 2.1: GET /api/gpa returns full scale and metadata
  {
    const res = await handleGetGpa();
    const body = await res.json();
    assert(res.status === 200, 'GET /api/gpa returns 200', body);
    assert(Array.isArray(body.scale), 'scale is an array', body);
    assert(body.scale.length === 12, 'scale has 12 KCSE grade bands', body.scale?.length);
    assert(body.scaleMetadata?.indicative === true, 'scaleMetadata indicative is true', body);
    assert(body.scaleMetadata?.scale === 4.0, 'scaleMetadata scale is 4.0', body);
  }

  // Test 2.2: POST /api/gpa with meanGrade 'A'
  {
    const req = new NextRequest('http://localhost:3000/api/gpa', {
      method: 'POST',
      body: JSON.stringify({
        meanGrade: 'A',
      }),
    });
    const res = await handlePostGpa(req);
    const body = await res.json();
    assert(res.status === 200, 'POST /api/gpa with meanGrade A returns 200', body);
    assert(body.gpaUnweighted === 4.0, 'Grade A maps to 4.00 unweighted GPA', body);
    assert(body.scale === 4.0, 'scale is 4.0', body);
    assert(body.indicative === true, 'indicative is true', body);
    assert(typeof body.explanation === 'string' && body.explanation.includes('KCSE'), 'explanation explains KCSE', body);
  }

  // Test 2.3: POST /api/gpa with points (76 -> A- -> 3.85)
  {
    const req = new NextRequest('http://localhost:3000/api/gpa', {
      method: 'POST',
      body: JSON.stringify({
        points: 76,
        phoneNumber: '0712345678', // should update student
      }),
    });
    const res = await handlePostGpa(req);
    const body = await res.json();
    assert(res.status === 200, 'POST /api/gpa with points 76 returns 200', body);
    assert(body.meanGrade === 'A-', 'Points 76 maps to meanGrade A-', body);
    assert(body.gpaUnweighted === 3.85, 'Grade A- maps to 3.85 GPA', body);
    assert(body.indicative === true, 'indicative flag is true', body);

    // Verify student was updated in DB
    const meReq = new NextRequest('http://localhost:3000/api/students/me?phoneNumber=0712345678');
    const meRes = await handleGetStudentMe(meReq);
    const meBody = await meRes.json();
    assert(meBody.student.kcseGrade === 'A-', 'Student kcseGrade updated to A-', meBody);
    assert(meBody.student.gpaEquivalent === 3.85, 'Student gpaEquivalent updated to 3.85', meBody);
  }

  // Test 2.4: POST /api/gpa with subjects map
  {
    const req = new NextRequest('http://localhost:3000/api/gpa', {
      method: 'POST',
      body: JSON.stringify({
        subjects: {
          ENG: 'B+',
          KISW: 'A-',
          MATH: 'A',
          BIO: 'B+',
          CHEM: 'A-',
          PHY: 'A',
          GEO: 'A',
        },
      }),
    });
    const res = await handlePostGpa(req);
    const body = await res.json();
    assert(res.status === 200, 'POST /api/gpa with subjects returns 200', body);
    assert(body.gpaUnweighted >= 3.5, 'GPA calculated from subjects', body);
    assert(body.indicative === true, 'indicative flag is true', body);
  }

  // Test 2.5: POST /api/gpa error when no inputs provided
  {
    const req = new NextRequest('http://localhost:3000/api/gpa', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await handlePostGpa(req);
    const body = await res.json();
    assert(res.status === 400, 'POST /api/gpa returns 400 when no inputs provided', body);
    assert(body.code === 'VALIDATION', 'Error code is VALIDATION', body);
  }

  // ==========================================
  // 3. BE-API-05: ESSAY REVIEW
  // ==========================================
  console.log('\n3. Testing BE-API-05: /api/essays/review (POST)');

  // Test 3.1: Rejects missing schoolPromptId for school-specific essay type
  {
    const req = new NextRequest('http://localhost:3000/api/essays/review', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '0712345678',
        essayType: 'why_major', // school-specific
        draft: 'This is a test draft for my application essay that has sufficient word count to exceed fifteen words easily.',
      }),
    });
    const res = await handlePostEssayReview(req);
    const body = await res.json();
    assert(res.status === 400, 'Rejects school_specific type without schoolPromptId with 400', body);
    assert(body.code === 'VALIDATION', 'Error code is VALIDATION', body);
    assert(body.error.includes('schoolPromptId is required'), 'Error mentions missing schoolPromptId', body);
  }

  // Test 3.2: Rejects draft that is too short (< 15 words)
  {
    const req = new NextRequest('http://localhost:3000/api/essays/review', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '0712345678',
        essayType: 'personal_statement',
        draft: 'Too short draft.',
      }),
    });
    const res = await handlePostEssayReview(req);
    const body = await res.json();
    assert(res.status === 400, 'Rejects draft < 15 words with 400', body);
    assert(body.code === 'VALIDATION', 'Error code is VALIDATION', body);
    assert(body.error.includes('too short'), 'Error notes draft is too short', body);
  }

  // Test 3.3: Successfully reviews a Common App Personal Statement
  {
    const draftText = `
At 2:00 AM in our Machakos boarding school dormitory, the sudden KPLC blackout interrupted our entire mock examination revision week.
While others slept in frustration, I salvaged a discarded 12V motorcycle battery from the school agricultural workshop.
Using copper wire stripped from an old ceiling fan and four LED diodes from the physics cabinet, I rigged a makeshift emergency lantern.
For the next four hours, seven classmates huddled around that illuminated desk working through organic chemistry reaction mechanisms.
That night taught me that engineering is not merely an abstract academic discipline; it is an immediate responsibility to solve problems within resource constraints.
    `.trim();

    const req = new NextRequest('http://localhost:3000/api/essays/review', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '0712345678',
        essayType: 'personal_statement',
        draft: draftText,
        persona: 'ivy_committee_chair',
        channel: 'web',
      }),
    });
    const res = await handlePostEssayReview(req);
    const body = await res.json();
    assert(res.status === 200, 'Personal statement review succeeds with 200', body);
    assert(typeof body.essayId === 'string', 'Returns essayId', body.essayId);
    assert(body.versionNo === 1, 'Version number is 1', body.versionNo);
    assert(body.wordCount > 15, 'Calculates wordCount', body.wordCount);
    assert(body.wordLimit === 650, 'Returns wordLimit 650 for personal_statement', body.wordLimit);
    assert(typeof body.review.overallScore === 'number', 'Returns review with overallScore', body.review?.overallScore);
    assert(body.review.verdict === 'Strong Admit' || body.review.verdict === 'Borderline / Too Generic' || body.review.verdict === 'Rewrite Required', 'Valid verdict string', body.review?.verdict);
    assert(typeof body.review.committeeSummary === 'string', 'Returns committeeSummary', body.review?.committeeSummary);
    assert(typeof body.review.kenyanContextTips === 'string', 'Returns kenyanContextTips', body.review?.kenyanContextTips);
    assert(typeof body.review.rewriteExample === 'string', 'Returns rewriteExample', body.review?.rewriteExample);
  }

  // Test 3.4: Successfully reviews a school-specific essay with schoolPromptId and version increment
  {
    const draftText = `
When our rural water pump failed in Kitui during the dry season, the local borehole technicians struggled with pump impeller cavitation.
At MIT, I aspire to study mechanical engineering under the D-Lab and Tata Center for Technology and Design.
Working with Professor Amos Winter on low-cost micro-irrigation systems directly answers the agricultural hurdles my family faces every harvest season.
    `.trim();

    const req = new NextRequest('http://localhost:3000/api/essays/review', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: '0712345678',
        essayType: 'why_major',
        schoolPromptId: 'prompt-mit-why-major',
        draft: draftText,
        persona: 'kensap_mentor',
        channel: 'web',
      }),
    });
    const res = await handlePostEssayReview(req);
    const body = await res.json();
    assert(res.status === 200, 'School-specific why_major review succeeds with 200', body);
    assert(typeof body.essayId === 'string', 'Returns essayId', body.essayId);
    assert(body.versionNo === 1, 'Version number is 1', body.versionNo);
    assert(body.wordLimit === 100, 'Returns school prompt wordLimit 100', body.wordLimit);
    assert(body.review.overallScore >= 0 && body.review.overallScore <= 100, 'Score is 0-100', body.review?.overallScore);
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
