/**
 * End-to-end integration test runner for Pepea P1 & P2 API routes:
 * 1. GET /api/guide & POST /api/guide/progress
 * 2. GET /api/essays/catalog
 * 3. GET /api/essays & GET /api/essays/[id]
 * 4. POST /api/lor/review
 * 5. POST /api/advisor
 * 6. POST /api/aid
 * 7. POST /api/chat
 * 8. GET /api/cue
 */

import { NextRequest } from 'next/server';
import { GET as getGuide } from '../app/api/guide/route';
import { POST as postGuideProgress } from '../app/api/guide/progress/route';
import { GET as getCatalog } from '../app/api/essays/catalog/route';
import { GET as getEssays } from '../app/api/essays/route';
import { GET as getEssayDetail } from '../app/api/essays/[id]/route';
import { POST as postLorReview } from '../app/api/lor/review/route';
import { POST as postAdvisor } from '../app/api/advisor/route';
import { POST as postAid } from '../app/api/aid/route';
import { POST as postChat } from '../app/api/chat/route';
import { GET as getCue } from '../app/api/cue/route';
import { createEssay, getOrCreateStudent, insertEssayVersion } from '../lib/db';

const TEST_PHONE_1 = '+254712345678';
const TEST_PHONE_2 = '0722000000'; // Normalizes to +254722000000
const INVALID_PHONE = '0201234567'; // Landline -> Invalid

function createReq(url: string, method: string = 'GET', body?: any): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`, details || '');
    failed++;
  }
}

async function runTests() {
  console.log('\n=== Starting Pepea P1 & P2 API Route Verification ===\n');

  // ==========================================
  // 1. BE-API-03: Guide & Guide Progress
  // ==========================================
  console.log('--- Testing BE-API-03: /api/guide & /api/guide/progress ---');
  {
    // GET /api/guide without phone
    const res1 = await getGuide(createReq('/api/guide'));
    assert(res1.status === 200, 'GET /api/guide returns 200');
    const data1 = await res1.json();
    assert(Array.isArray(data1.steps), 'Guide contains steps array');
    assert(data1.steps.length === 12, 'Guide has all 12 steps');
    assert(data1.steps[0].order === 1, 'First step has order 1');
    assert(data1.steps[0].status === 'todo', 'Default status is todo');

    const testStepId = data1.steps[0].id;

    // POST /api/guide/progress with invalid phone
    const resBadPhone = await postGuideProgress(
      createReq('/api/guide/progress', 'POST', {
        phoneNumber: INVALID_PHONE,
        stepId: testStepId,
        status: 'done',
      })
    );
    assert(resBadPhone.status === 400, 'POST /api/guide/progress rejects invalid phone with 400');

    // POST /api/guide/progress valid
    const resProgress = await postGuideProgress(
      createReq('/api/guide/progress', 'POST', {
        phoneNumber: TEST_PHONE_1,
        stepId: testStepId,
        status: 'done',
      })
    );
    assert(resProgress.status === 200, 'POST /api/guide/progress returns 200');
    const dataProg = await resProgress.json();
    assert(dataProg.success === true && dataProg.status === 'done', 'Progress saved as done');

    // GET /api/guide with phone shows completed step
    const resWithPhone = await getGuide(createReq(`/api/guide?phoneNumber=${TEST_PHONE_1}`));
    assert(resWithPhone.status === 200, 'GET /api/guide with phone returns 200');
    const dataWithPhone = await resWithPhone.json();
    const updatedStep = dataWithPhone.steps.find((s: any) => s.id === testStepId);
    assert(updatedStep?.status === 'done', 'Guide step status updated to done for student');
    assert(dataWithPhone.completed >= 1, 'Completed count incremented');
  }

  // ==========================================
  // 2. BE-API-04: Essays Catalog
  // ==========================================
  console.log('\n--- Testing BE-API-04: /api/essays/catalog ---');
  {
    // GET /api/essays/catalog
    const res = await getCatalog(createReq('/api/essays/catalog'));
    assert(res.status === 200, 'GET /api/essays/catalog returns 200');
    const catalog = await res.json();
    assert(Array.isArray(catalog.types) && catalog.types.length >= 9, 'Catalog contains all essay types');
    assert(Array.isArray(catalog.schools), 'Catalog contains schools array');
    assert(catalog.schools.length > 0, 'Catalog has schools with prompts');
    assert(Array.isArray(catalog.schools[0].prompts), 'Each school has prompts array');

    // GET /api/essays/catalog?type=personal_statement
    const resType = await getCatalog(createReq('/api/essays/catalog?type=personal_statement'));
    const catalogType = await resType.json();
    assert(
      catalogType.types.length === 1 && catalogType.types[0].code === 'personal_statement',
      'Filters catalog types by ?type='
    );
  }

  // ==========================================
  // 3. BE-API-06: Student Essays & Detail
  // ==========================================
  console.log('\n--- Testing BE-API-06: /api/essays & /api/essays/[id] ---');
  {
    // GET /api/essays missing phoneNumber
    const resMissingPhone = await getEssays(createReq('/api/essays'));
    assert(resMissingPhone.status === 400, 'GET /api/essays without phone returns 400');

    // GET /api/essays for new phone returns []
    const resEmpty = await getEssays(createReq(`/api/essays?phoneNumber=${TEST_PHONE_2}`));
    assert(resEmpty.status === 200, 'GET /api/essays for new phone returns 200');
    const emptyList = await resEmpty.json();
    assert(Array.isArray(emptyList), 'Returns array of essays');

    // Create an essay for TEST_PHONE_1 and check detail
    const student1 = await getOrCreateStudent(TEST_PHONE_1);
    const studentId = student1.id;

    const createdEssay = await createEssay({
      studentId,
      essayType: 'personal_statement',
      title: 'My Solar Project in Machakos',
      status: 'drafting',
    });

    await insertEssayVersion({
      essayId: createdEssay.id,
      versionNo: 1,
      content: 'When KPLC power went off at 2am in Machakos...',
      wordCount: 85,
    });

    // List essays
    const resList = await getEssays(createReq(`/api/essays?phoneNumber=${TEST_PHONE_1}`));
    const list = await resList.json();
    assert(list.length >= 1, 'GET /api/essays returns student essays');
    assert(list[0].id === createdEssay.id, 'Returned essay matches created ID');

    // Detail for student
    const resDetail = await getEssayDetail(
      createReq(`/api/essays/${createdEssay.id}?phoneNumber=${TEST_PHONE_1}`),
      { params: { id: createdEssay.id } }
    );
    assert(resDetail.status === 200, 'GET /api/essays/[id] returns 200 for owner');
    const detail = await resDetail.json();
    assert(detail.essay.id === createdEssay.id, 'Detail contains essay object');
    assert(detail.versions.length >= 1, 'Detail contains versions history');

    // Privacy check: student 2 cannot view student 1's essay
    const resPrivacy = await getEssayDetail(
      createReq(`/api/essays/${createdEssay.id}?phoneNumber=${TEST_PHONE_2}`),
      { params: { id: createdEssay.id } }
    );
    assert(
      resPrivacy.status === 404,
      'Privacy enforcement: Student B cannot view Student A essay (returns 404 NOT_FOUND)'
    );
  }

  // ==========================================
  // 4. BE-API-07: LOR Review
  // ==========================================
  console.log('\n--- Testing BE-API-07: /api/lor/review ---');
  {
    // Too short draft rejected
    const resShort = await postLorReview(
      createReq('/api/lor/review', 'POST', {
        phoneNumber: TEST_PHONE_1,
        recommenderRole: 'teacher',
        draft: 'Too short draft.',
      })
    );
    assert(resShort.status === 400, 'Rejects short LOR draft (<20 chars) with 400');

    // Valid draft review
    const resReview = await postLorReview(
      createReq('/api/lor/review', 'POST', {
        phoneNumber: TEST_PHONE_1,
        recommenderRole: 'teacher',
        recommenderName: 'Mr. Peter Otieno',
        subjectTaught: 'Physics',
        draft:
          'I am pleased to recommend Kelvin for admission. He ranked #1 in Physics in our national school of 340 students and led the Science Congress solar battery project during power outages.',
        channel: 'web',
      })
    );

    assert(resReview.status === 200, 'POST /api/lor/review returns 200');
    const lorData = await resReview.json();
    assert(Boolean(lorData.id), 'LOR review returns generated ID');
    assert(typeof lorData.review.overallScore === 'number', 'LOR review contains overallScore');
    assert(Boolean(lorData.review.verdict), 'LOR review contains verdict');
    assert(Array.isArray(lorData.review.gaps), 'LOR review contains gaps list');
    assert(Array.isArray(lorData.review.kenyaContextToAdd), 'LOR review contains kenyaContextToAdd');
  }

  // ==========================================
  // 5. BE-API-08: University Advisor
  // ==========================================
  console.log('\n--- Testing BE-API-08: /api/advisor ---');
  {
    const res = await postAdvisor(
      createReq('/api/advisor', 'POST', {
        phoneNumber: TEST_PHONE_1,
        question: 'Which colleges give full need-based aid for international students intending to study Computer Science?',
        channel: 'web',
      })
    );

    assert(res.status === 200, 'POST /api/advisor returns 200');
    const advData = await res.json();
    assert(Array.isArray(advData.matches), 'Advisor returns matches array');
    assert(advData.matches.length > 0, 'Advisor returns candidate schools');
    assert(
      advData.matches[0].tier === 'reach' ||
        advData.matches[0].tier === 'target' ||
        advData.matches[0].tier === 'likely',
      'Advisor match contains reach/target/likely tier'
    );
    assert(typeof advData.matches[0].fitScore === 'number', 'Advisor match contains fitScore');
    assert(Boolean(advData.disclaimer), 'Advisor contains official disclaimer');
    assert(Boolean(advData.answer), 'Advisor contains grounded explanation answer');
  }

  // ==========================================
  // 6. BE-API-09: Financial Aid Scout
  // ==========================================
  console.log('\n--- Testing BE-API-09: /api/aid ---');
  {
    const res = await postAid(
      createReq('/api/aid', 'POST', {
        phoneNumber: TEST_PHONE_1,
        question: 'How can I get application fee waivers for Common App and CSS Profile?',
        channel: 'web',
      })
    );

    assert(res.status === 200, 'POST /api/aid returns 200');
    const aidData = await res.json();
    assert(Array.isArray(aidData.matches), 'Aid scout returns matches array');
    assert(aidData.matches.length > 0, 'Aid scout matches eligible programs');
    assert(typeof aidData.matches[0].matchScore === 'number', 'Aid match contains matchScore');
    assert(Array.isArray(aidData.matches[0].reasons), 'Aid match contains reasons');
    assert(Boolean(aidData.disclaimer), 'Aid scout contains disclaimer');
    assert(Boolean(aidData.answer), 'Aid scout contains answer');
  }

  // ==========================================
  // 7. BE-API-10: Multi-Channel Chat Router
  // ==========================================
  console.log('\n--- Testing BE-API-10: /api/chat ---');
  {
    // Test Intent: CUE agency scam inquiry
    const resCue = await postChat(
      createReq('/api/chat', 'POST', {
        phoneNumber: TEST_PHONE_1,
        message: 'Is Global Education Pathways in Westlands a legitimate agency?',
        channel: 'web',
      })
    );
    assert(resCue.status === 200, 'POST /api/chat returns 200');
    const cueData = await resCue.json();
    assert(cueData.module === 'cue', 'Classifies scam/agency message into "cue" module');
    assert(Boolean(cueData.reply), 'Chat returns assistant reply');
    assert(Array.isArray(cueData.quickReplies), 'Chat returns quickReplies');

    // Test Intent: GPA inquiry
    const resGpa = await postChat(
      createReq('/api/chat', 'POST', {
        phoneNumber: TEST_PHONE_1,
        message: 'I scored 78 points A- in KCSE, what is my US GPA?',
        channel: 'whatsapp',
      })
    );
    const gpaData = await resGpa.json();
    assert(gpaData.module === 'gpa', 'Classifies GPA inquiry into "gpa" module');
    assert(gpaData.reply.length <= 1000, 'WhatsApp reply formatted within length limit');

    // Test Intent: Aid inquiry
    const resAidChat = await postChat(
      createReq('/api/chat', 'POST', {
        phoneNumber: TEST_PHONE_1,
        message: 'Does Amherst College offer full ride scholarships for international applicants?',
        channel: 'web',
      })
    );
    const aidChatData = await resAidChat.json();
    assert(aidChatData.module === 'aid', 'Classifies aid question into "aid" module');
  }

  // ==========================================
  // 8. BE-API-11: CUE Radar
  // ==========================================
  console.log('\n--- Testing BE-API-11: /api/cue ---');
  {
    // Full listing
    const resAll = await getCue(createReq('/api/cue'));
    assert(resAll.status === 200, 'GET /api/cue returns 200');
    const allData = await resAll.json();
    assert(Array.isArray(allData.matches), 'CUE returns matches array');
    assert(allData.totalFound >= 8, 'CUE returns 8+ blacklisted entities from database');
    assert(Boolean(allData.advisory), 'CUE response contains official advisory');

    // Search query matching a city or entity
    const resSearch = await getCue(createReq('/api/cue?q=Eldoret'));
    assert(resSearch.status === 200, 'GET /api/cue?q=Eldoret returns 200');
    const searchData = await resSearch.json();
    assert(searchData.query === 'Eldoret', 'Echoes query string');
    assert(searchData.matches.length >= 1, 'Finds flagged agency in Eldoret');
    assert(
      searchData.matches.some((m: any) => m.locationCity.toLowerCase().includes('eldoret')),
      'Matched agency is located in Eldoret'
    );
  }

  console.log(`\n=== Verification Complete: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
