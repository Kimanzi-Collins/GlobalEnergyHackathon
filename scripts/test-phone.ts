import { normalizeKenyanPhone, formatKenyanPhoneNational, formatKenyanPhoneDisplay } from '../lib/phone';

interface TestCase {
  input: any;
  expected: string | null;
  desc: string;
}

const tests: TestCase[] = [
  // Valid Kenyan Mobile Formats
  { input: '0712345678', expected: '+254712345678', desc: 'Standard 07 local format' },
  { input: '0112345678', expected: '+254112345678', desc: 'Standard 01 local format (Airtel/Safaricom 01xx)' },
  { input: '+254712345678', expected: '+254712345678', desc: 'Standard +2547 international format' },
  { input: '+254112345678', expected: '+254112345678', desc: 'Standard +2541 international format' },
  { input: '254712345678', expected: '+254712345678', desc: '2547 without leading plus' },
  { input: '254112345678', expected: '+254112345678', desc: '2541 without leading plus' },
  { input: '712345678', expected: '+254712345678', desc: '9 digits starting with 7' },
  { input: '112345678', expected: '+254112345678', desc: '9 digits starting with 1' },
  { input: '00254712345678', expected: '+254712345678', desc: 'International dialing 00254' },
  { input: '+254 712 345 678', expected: '+254712345678', desc: 'Formatted with spaces' },
  { input: '0712-345-678', expected: '+254712345678', desc: 'Formatted with hyphens' },
  { input: '(0712) 345678', expected: '+254712345678', desc: 'Formatted with parentheses' },
  { input: '  0712345678  ', expected: '+254712345678', desc: 'Leading and trailing spaces' },

  // Landlines (must be rejected)
  { input: '0201234567', expected: null, desc: 'Nairobi landline 020' },
  { input: '+254201234567', expected: null, desc: 'Nairobi landline +25420' },
  { input: '0411234567', expected: null, desc: 'Mombasa landline 041' },
  { input: '0511234567', expected: null, desc: 'Nakuru landline 051' },
  { input: '0571234567', expected: null, desc: 'Kisumu landline 057' },

  // Non-Kenyan international numbers
  { input: '+14155552671', expected: null, desc: 'US number' },
  { input: '+447123456789', expected: null, desc: 'UK number' },
  { input: '+255712345678', expected: null, desc: 'Tanzania number (+255)' },
  { input: '+256712345678', expected: null, desc: 'Uganda number (+256)' },

  // Invalid lengths and junk
  { input: '071234567', expected: null, desc: 'Too short (8 digits after 0)' },
  { input: '07123456789', expected: null, desc: 'Too long (10 digits after 0)' },
  { input: '', expected: null, desc: 'Empty string' },
  { input: '   ', expected: null, desc: 'Whitespace only' },
  { input: 'abcdefg', expected: null, desc: 'Alphabetic string' },
  { input: '071234567a', expected: null, desc: 'Alphanumeric string' },
  { input: null, expected: null, desc: 'Null input' },
  { input: undefined, expected: null, desc: 'Undefined input' },
];

let failed = 0;
for (const t of tests) {
  const result = normalizeKenyanPhone(t.input);
  if (result !== t.expected) {
    console.error(`❌ FAILED: ${t.desc}. Input: ${JSON.stringify(t.input)}, Expected: ${t.expected}, Got: ${result}`);
    failed++;
  } else {
    console.log(`✅ PASSED: ${t.desc} -> ${result}`);
  }
}

// Test formatting helpers
const nat = formatKenyanPhoneNational('+254712345678');
if (nat !== '0712345678') {
  console.error(`❌ formatKenyanPhoneNational failed: got ${nat}`);
  failed++;
} else {
  console.log(`✅ PASSED: formatKenyanPhoneNational: ${nat}`);
}

const disp = formatKenyanPhoneDisplay('0712345678');
if (disp !== '+254 712 345 678') {
  console.error(`❌ formatKenyanPhoneDisplay failed: got ${disp}`);
  failed++;
} else {
  console.log(`✅ PASSED: formatKenyanPhoneDisplay: ${disp}`);
}

if (failed > 0) {
  console.error(`\n${failed} tests failed!`);
  process.exit(1);
} else {
  console.log(`\nAll ${tests.length} phone normalization tests passed successfully!`);
}
