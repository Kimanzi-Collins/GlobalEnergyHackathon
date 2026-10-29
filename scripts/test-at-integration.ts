import { NextRequest } from 'next/server';
import { POST as handleUssd } from '../app/api/at/ussd/route';
import { POST as handleSms } from '../app/api/at/sms/route';
import { POST as handleSmsDelivery } from '../app/api/at/sms/delivery/route';
import { POST as handleVoiceProcess } from '../app/api/at/voice/process-interview/route';
import { GET as handleHealth } from '../app/api/health/route';
import { smsTemplates } from '../lib/sms-templates';

process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
process.env.AT_WEBHOOK_SECRET = 'pepea_test_secret_123';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: any) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`, detail || '');
    failed++;
  }
}

function makeFormRequest(url: string, params: Record<string, string>, secret?: string) {
  const fullUrl = secret ? `${url}?secret=${secret}` : url;
  const body = new URLSearchParams(params).toString();
  return new NextRequest(fullUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });
}

async function runTests() {
  console.log('\n=== Starting Africa\'s Talking Section 5.4 Test Suite ===\n');

  // ----------------------------------------------------
  // 1. BE-AT-03: SMS Templates Length Invariants (<= 160 chars)
  // ----------------------------------------------------
  console.log('--- 1. Testing SMS Templates (<= 160 chars) ---');
  {
    const gpaMsg = smsTemplates.gpaResult({ grade: 'A', gpa: 4.0, topSchool: 'Harvard / MIT' });
    assert(gpaMsg.length <= 160, `GPA SMS <= 160 chars (actual: ${gpaMsg.length})`);

    const dlMsg = smsTemplates.nextDeadline({ school: 'MIT', type: 'Early Action', date: 'Nov 1', daysLeft: 3 });
    assert(dlMsg.length <= 160, `Deadline SMS <= 160 chars (actual: ${dlMsg.length})`);

    const stepMsg = smsTemplates.guideStep({ stepNumber: 1, stepTitle: 'Explore Colleges & Testing Policy', action: 'Build list of 10 colleges on Common App' });
    assert(stepMsg.length <= 160, `Guide step SMS <= 160 chars (actual: ${stepMsg.length})`);

    const essayMsg = smsTemplates.essayScore({ essayType: 'Personal Statement', score: 88, verdict: 'Strong Admit' });
    assert(essayMsg.length <= 160, `Essay score SMS <= 160 chars (actual: ${essayMsg.length})`);

    const interviewMsg = smsTemplates.mockInterviewScore({ score: 92, topTip: 'Mention MIT D-Lab' });
    assert(interviewMsg.length <= 160, `Interview score SMS <= 160 chars (actual: ${interviewMsg.length})`);
  }

  // ----------------------------------------------------
  // 2. BE-AT-03: Inbound SMS & Delivery Webhook
  // ----------------------------------------------------
  console.log('\n--- 2. Testing SMS Delivery Webhook & Auth ---');
  {
    // Unauthorized without secret
    const unauthReq = makeFormRequest('http://localhost:3000/api/at/sms/delivery', { id: 'MSG_123', status: 'Success' });
    const unauthRes = await handleSmsDelivery(unauthReq);
    assert(unauthRes.status === 401, 'Rejects SMS delivery report without secret (401)');

    // Authorized with secret
    const authReq = makeFormRequest('http://localhost:3000/api/at/sms/delivery', { id: 'MSG_123', status: 'Success', phoneNumber: '+254712345678' }, 'pepea_test_secret_123');
    const authRes = await handleSmsDelivery(authReq);
    assert(authRes.status === 200, 'Accepts SMS delivery report with valid secret (200)');
    const body = await authRes.json();
    assert(body.received === true, 'Returns received: true');
  }

  // ----------------------------------------------------
  // 3. Open Relay Prevention & Rate Limiting on /api/at/sms
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Open Relay Prevention on /api/at/sms ---');
  {
    // Direct send without auth is rejected
    const unauthSend = makeFormRequest('http://localhost:3000/api/at/sms', { phoneNumber: '+254712345678', message: 'Spam attack' });
    const res = await handleSms(unauthSend);
    assert(res.status === 401, 'Direct SMS sending without auth is BLOCKED (401)');
  }

  // ----------------------------------------------------
  // 4. BE-AT-02: USSD Numeric Menu Tree
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Numeric USSD Tree Invariants ---');
  {
    const phone = '+254712345678';

    // Root Menu
    const rootReq = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '' });
    const rootRes = await handleUssd(rootReq);
    const rootText = await rootRes.text();
    assert(rootText.startsWith('CON '), 'Root menu returns CON');
    assert(rootText.length <= 182, `Root screen <= 182 chars (actual: ${rootText.length})`);
    assert(rootText.includes('1. Apply guide'), 'Root contains Apply guide');
    assert(rootText.includes('2. KCSE to US GPA'), 'Root contains KCSE to US GPA');
    assert(rootText.includes('8. Verify agency'), 'Root contains Verify agency');

    // Branch 1: Guide Page 1
    const g1Req = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '1' });
    const g1Text = await (await handleUssd(g1Req)).text();
    assert(g1Text.startsWith('CON '), 'Guide page 1 returns CON');
    assert(g1Text.length <= 182, `Guide page 1 <= 182 chars (actual: ${g1Text.length})`);
    assert(g1Text.includes('8. Next'), 'Contains 8. Next');

    // Branch 1: Guide Page 2 (1*8)
    const g2Req = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '1*8' });
    const g2Text = await (await handleUssd(g2Req)).text();
    assert(g2Text.length <= 182, `Guide page 2 <= 182 chars (actual: ${g2Text.length})`);

    // Branch 2: KCSE to GPA Page 1
    const gpa1Req = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '2' });
    const gpa1Text = await (await handleUssd(gpa1Req)).text();
    assert(gpa1Text.startsWith('CON '), 'GPA menu returns CON');
    assert(gpa1Text.length <= 182, `GPA menu <= 182 chars (actual: ${gpa1Text.length})`);

    // Branch 2: Select Grade A- (2*2) -> END
    const gpaResReq = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '2*2' });
    const gpaResText = await (await handleUssd(gpaResReq)).text();
    assert(gpaResText.startsWith('END '), 'GPA conversion resolves with END');
    assert(gpaResText.length <= 182, `GPA result <= 182 chars (actual: ${gpaResText.length})`);
    assert(gpaResText.includes('3.85 US GPA'), 'Calculates 3.85 GPA for A-');

    // Branch 8: CUE Radar Page 1
    const cueReq = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '8' });
    const cueText = await (await handleUssd(cueReq)).text();
    assert(cueText.startsWith('CON '), 'CUE radar returns CON');
    assert(cueText.length <= 182, `CUE radar <= 182 chars (actual: ${cueText.length})`);
    assert(cueText.includes('8. Next'), 'CUE radar has pagination');

    // Navigation: Back '0'
    const backReq = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '1*0' });
    const backText = await (await handleUssd(backReq)).text();
    assert(backText.includes('Karibu Pepea'), 'Navigating 1*0 returns to Root');

    // Navigation: Home '00'
    const homeReq = makeFormRequest('http://localhost:3000/api/at/ussd', { phoneNumber: phone, text: '1*8*00' });
    const homeText = await (await handleUssd(homeReq)).text();
    assert(homeText.includes('Karibu Pepea'), 'Navigating 00 returns to Root Home');
  }

  // ----------------------------------------------------
  // 5. BE-AT-06: Voice Mock Interview
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Voice Mock Interview (BE-AT-06) ---');
  {
    const req = makeFormRequest('http://localhost:3000/api/at/voice/process-interview', {
      callerNumber: '+254712345678',
      recordingUrl: 'https://cdn.pepea.app/interview/audio123.mp3',
      sessionId: 'VOICE_SESSION_999',
    });
    const res = await handleVoiceProcess(req);
    const xml = await res.text();
    assert(res.status === 200, 'Voice process callback returns 200');
    assert(xml.includes('<Say'), 'Returns VoiceXML <Say> element');
    assert(xml.includes('score is'), 'Announces interview score');
  }

  // ----------------------------------------------------
  // 6. BE-AT-07: Health Check /api/health
  // ----------------------------------------------------
  console.log('\n--- 6. Testing System Health Check /api/health (BE-AT-07) ---');
  {
    const res = await handleHealth();
    assert(res.status === 200, 'GET /api/health returns 200');
    const health = await res.json();
    assert(health.status === 'ok', 'Overall status is ok');
    assert(Boolean(health.services.database), 'Database service reported');
    assert(Boolean(health.services.gemini), 'Gemini service reported');
    assert(Boolean(health.services.africasTalking), 'Africa\'s Talking service reported');
  }

  console.log(`\n=== Section 5.4 Test Run Complete: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
