import { NextRequest } from 'next/server';
import { POST as handleUssd } from '../app/api/at/ussd/route';

process.env.NEXT_PUBLIC_DEMO_MODE = 'true';

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

function makeFormRequest(params: Record<string, string>) {
  const body = new URLSearchParams(params).toString();
  return new NextRequest('http://localhost:3000/api/at/ussd', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
}

async function testProgression() {
  console.log('\n--- Testing USSD Guide Progression & Numbered Options ---\n');
  const phone = '+254712345678';

  // 1. Step progression from 1 to 12
  console.log('1. Stepping from Step 1 through Step 12:');
  let currentText = '1*1'; // Open Step 1
  for (let step = 1; step <= 12; step++) {
    const req = makeFormRequest({ phoneNumber: phone, text: currentText });
    const resText = await (await handleUssd(req)).text();
    assert(resText.startsWith('CON '), `Step ${step} returns CON`);
    assert(resText.length <= 182, `Step ${step} <= 182 chars (actual: ${resText.length})`);
    assert(resText.includes(`Step ${step}/12`), `Displays Step ${step}/12`);

    if (step < 12) {
      assert(resText.includes(`1. Next (Step ${step + 1})`), `Has prompt for Step ${step + 1}`);
      currentText += '*1'; // Advance
    } else {
      assert(resText.includes('1. Finish & SMS Guide'), 'Step 12 has Finish prompt');
    }
  }

  // 2. Final advancement from Step 12 -> Finish
  console.log('\n2. Finishing on Step 12:');
  {
    const req = makeFormRequest({ phoneNumber: phone, text: currentText + '*1' });
    const resText = await (await handleUssd(req)).text();
    assert(resText.startsWith('END '), 'Completing guide returns END');
    assert(resText.includes('completed the 12-step admissions roadmap'), 'Shows completion message');
  }

  // 3. Back navigation from Step 3 -> Step 2
  console.log('\n3. Back navigation from Step 3:');
  {
    const req = makeFormRequest({ phoneNumber: phone, text: '1*1*1*1*0' });
    const resText = await (await handleUssd(req)).text();
    assert(resText.includes('Step 2/12'), 'Pressing 0 on Step 3 returns to Step 2');
  }

  // 4. Branch 3: Colleges for me numbered 1 to 4
  console.log('\n4. Branch 3: Colleges for me:');
  {
    const req = makeFormRequest({ phoneNumber: phone, text: '3*1' }); // Computer Science
    const resText = await (await handleUssd(req)).text();
    assert(resText.startsWith('CON '), 'Colleges list returns CON');
    assert(resText.length <= 182, `Colleges list <= 182 chars (${resText.length})`);
    assert(resText.includes('1. MIT'), 'Option 1 is MIT');
    assert(resText.includes('2. Harvard'), 'Option 2 is Harvard');
    assert(resText.includes('3. Amherst'), 'Option 3 is Amherst');
    assert(resText.includes('4. SMS me the list'), 'Option 4 is SMS me the list');

    // Option 1: MIT details
    const mitReq = makeFormRequest({ phoneNumber: phone, text: '3*1*1' });
    const mitText = await (await handleUssd(mitReq)).text();
    assert(mitText.includes('MIT (Need-Blind)'), 'Option 1 shows MIT details');
    assert(mitText.length <= 182, `MIT detail <= 182 chars (${mitText.length})`);

    // Option 4: SMS send
    const smsReq = makeFormRequest({ phoneNumber: phone, text: '3*1*4' });
    const smsText = await (await handleUssd(smsReq)).text();
    assert(smsText.startsWith('END '), 'Option 4 returns END');
    assert(smsText.includes('List sent via SMS'), 'Option 4 sends SMS');
  }

  // 5. Branch 4: Financial Aid numbered 1 to 4
  console.log('\n5. Branch 4: Financial Aid:');
  {
    const req = makeFormRequest({ phoneNumber: phone, text: '4*1' }); // Full Aid
    const resText = await (await handleUssd(req)).text();
    assert(resText.includes('1. Harvard Aid Initiative'), 'Option 1 is Harvard Aid');
    assert(resText.includes('2. MIT Full Need Grant'), 'Option 2 is MIT Full Need');
    assert(resText.includes('3. Mastercard Foundation'), 'Option 3 is Mastercard');
    assert(resText.includes('4. SMS me details'), 'Option 4 is SMS me details');

    // Option 2: MIT grant details
    const mitReq = makeFormRequest({ phoneNumber: phone, text: '4*1*2' });
    const mitText = await (await handleUssd(mitReq)).text();
    assert(mitText.includes('MIT Full Need Grant'), 'Option 2 shows MIT grant details');

    // Option 4: SMS send
    const smsReq = makeFormRequest({ phoneNumber: phone, text: '4*1*4' });
    const smsText = await (await handleUssd(smsReq)).text();
    assert(smsText.startsWith('END '), 'Option 4 returns END');
    assert(smsText.includes('Programs list sent'), 'Option 4 sends SMS');
  }

  // 6. Branch 6: Deadlines numbered 1 to 4
  console.log('\n6. Branch 6: Deadlines:');
  {
    const req = makeFormRequest({ phoneNumber: phone, text: '6' });
    const resText = await (await handleUssd(req)).text();
    assert(resText.includes('1. Nov 1: Early Action'), 'Option 1 is Nov 1');
    assert(resText.includes('2. Nov 15: EA2'), 'Option 2 is Nov 15');
    assert(resText.includes('3. Jan 1: Regular Decision'), 'Option 3 is Jan 1');
    assert(resText.includes('4. SMS me deadlines'), 'Option 4 is SMS');

    // Option 1: Nov 1 details
    const d1Req = makeFormRequest({ phoneNumber: phone, text: '6*1' });
    const d1Text = await (await handleUssd(d1Req)).text();
    assert(d1Text.includes('Nov 1 Early Action'), 'Option 1 shows Nov 1 details');

    // Option 4: SMS send
    const smsReq = makeFormRequest({ phoneNumber: phone, text: '6*4' });
    const smsText = await (await handleUssd(smsReq)).text();
    assert(smsText.startsWith('END '), 'Option 4 returns END');
    assert(smsText.includes('Deadlines sent to your SMS'), 'Option 4 sends SMS');
  }

  console.log(`\n=== USSD Test Complete: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) process.exit(1);
}

testProgression().catch((err) => {
  console.error(err);
  process.exit(1);
});
