import { execSync } from 'child_process';
import {
  parseSlotToUTC,
  getISTDayRangeUTC,
  formatISTTime,
  formatISTDate,
  formatISTDateTime,
  getISTDateString,
  getFutureISTDateString,
} from '../lib/dateUtils';

async function runTimezoneTestSuite() {
  console.log('====================================================');
  console.log('   ASIA/KOLKATA (IST) TIMEZONE FIX VERIFICATION TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, failureDetail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (failureDetail) console.error(`       Detail: ${failureDetail}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: 10:00 AM IST conversion
  // ---------------------------------------------------------------------------
  const dt1 = parseSlotToUTC('2026-08-15', '10:00 AM');
  assert(
    dt1.toISOString() === '2026-08-15T04:30:00.000Z',
    '10:00 AM IST -> 2026-08-15T04:30:00.000Z',
    `Expected 2026-08-15T04:30:00.000Z, got ${dt1.toISOString()}`
  );

  // ---------------------------------------------------------------------------
  // TEST 2: 3:30 PM IST conversion
  // ---------------------------------------------------------------------------
  const dt2 = parseSlotToUTC('2026-08-15', '03:30 PM');
  assert(
    dt2.toISOString() === '2026-08-15T10:00:00.000Z',
    '03:30 PM IST -> 2026-08-15T10:00:00.000Z',
    `Expected 2026-08-15T10:00:00.000Z, got ${dt2.toISOString()}`
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Midnight 12:00 AM IST conversion
  // ---------------------------------------------------------------------------
  const dt3 = parseSlotToUTC('2026-08-15', '12:00 AM');
  assert(
    dt3.toISOString() === '2026-08-14T18:30:00.000Z',
    '12:00 AM IST -> 2026-08-14T18:30:00.000Z',
    `Expected 2026-08-14T18:30:00.000Z, got ${dt3.toISOString()}`
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Noon 12:00 PM IST conversion
  // ---------------------------------------------------------------------------
  const dt4 = parseSlotToUTC('2026-08-15', '12:00 PM');
  assert(
    dt4.toISOString() === '2026-08-15T06:30:00.000Z',
    '12:00 PM IST -> 2026-08-15T06:30:00.000Z',
    `Expected 2026-08-15T06:30:00.000Z, got ${dt4.toISOString()}`
  );

  // ---------------------------------------------------------------------------
  // TEST 5: 11:59 PM IST conversion
  // ---------------------------------------------------------------------------
  const dt5 = parseSlotToUTC('2026-08-15', '11:59 PM');
  assert(
    dt5.toISOString() === '2026-08-15T18:29:00.000Z',
    '11:59 PM IST -> 2026-08-15T18:29:00.000Z',
    `Expected 2026-08-15T18:29:00.000Z, got ${dt5.toISOString()}`
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Formatting DB UTC timestamp back to IST 12-hour time
  // ---------------------------------------------------------------------------
  const formattedTime = formatISTTime('2026-08-15T04:30:00.000Z');
  assert(
    formattedTime === '10:00 AM',
    'Formatting 2026-08-15T04:30:00.000Z -> "10:00 AM"',
    `Expected "10:00 AM", got "${formattedTime}"`
  );

  // ---------------------------------------------------------------------------
  // TEST 7: IST Day boundaries for 2026-08-15
  // ---------------------------------------------------------------------------
  const { startOfDay, endOfDay } = getISTDayRangeUTC('2026-08-15');
  assert(
    startOfDay.toISOString() === '2026-08-14T18:30:00.000Z' &&
      endOfDay.toISOString() === '2026-08-15T18:29:59.999Z',
    'IST Day Range for 2026-08-15 (2026-08-14T18:30:00.000Z to 2026-08-15T18:29:59.999Z)',
    `Got start: ${startOfDay.toISOString()}, end: ${endOfDay.toISOString()}`
  );

  // Verify that 2026-08-15T04:30:00.000Z falls inside the day range
  const testSessionDate = new Date('2026-08-15T04:30:00.000Z');
  assert(
    testSessionDate >= startOfDay && testSessionDate <= endOfDay,
    'Session 2026-08-15T04:30:00.000Z falls inside 2026-08-15 IST day range',
    'Session timestamp out of IST day boundary window'
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Malformed / Invalid Input Rejection
  // ---------------------------------------------------------------------------
  let rejectedCount = 0;
  const invalidInputs = [
    ['invalid-date', '10:00 AM'],
    ['2026-08-15', 'invalid-slot'],
    ['2026-08-15', '25:00 AM'],
    ['2026-08-15', '10:60 PM'],
    ['', '10:00 AM'],
  ];

  for (const [dStr, tSlot] of invalidInputs) {
    try {
      parseSlotToUTC(dStr, tSlot);
    } catch {
      rejectedCount++;
    }
  }
  assert(
    rejectedCount === invalidInputs.length,
    'Safely reject all malformed date/time inputs',
    `Expected ${invalidInputs.length} rejections, got ${rejectedCount}`
  );

  // ---------------------------------------------------------------------------
  // TEST 9: Multi-Process Timezone Independence (TZ=UTC, TZ=America/New_York, TZ=Europe/London, TZ=Asia/Kolkata)
  // ---------------------------------------------------------------------------
  const testTimezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];
  let tzPassCount = 0;

  for (const tz of testTimezones) {
    try {
      const codeSnippet = `
        const { parseSlotToUTC } = require('./lib/dateUtils');
        const res = parseSlotToUTC('2026-08-15', '10:00 AM').toISOString();
        if (res !== '2026-08-15T04:30:00.000Z') {
          console.error('MISMATCH in ' + process.env.TZ + ': ' + res);
          process.exit(1);
        }
        console.log('OK');
      `;

      const output = execSync(`npx tsx -e "${codeSnippet.replace(/\n/g, ' ')}"`, {
        env: { ...process.env, TZ: tz },
        encoding: 'utf-8',
      });

      if (output.trim().includes('OK')) {
        tzPassCount++;
      }
    } catch (err: any) {
      console.error(`Process TZ=${tz} test error:`, err.message);
    }
  }

  assert(
    tzPassCount === testTimezones.length,
    `Server timezone independence across process environments (${testTimezones.join(', ')})`,
    `Expected ${testTimezones.length} process TZ passes, got ${tzPassCount}`
  );

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTimezoneTestSuite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
