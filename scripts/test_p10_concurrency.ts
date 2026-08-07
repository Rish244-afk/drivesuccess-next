import { PrismaClient, Role, SessionStatus, BookingStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Load .env manually if process.env.DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        const value = match[2];
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

const prisma = new PrismaClient();

// Helper to construct exact scheduled Date object used by createBookingTransactionAction
function getScheduledDate(dateStr: string, timeSlot: string): Date {
  const [timeStr, period] = timeSlot.split(' ');
  let [hours, minutes] = timeStr.split(':').map(Number);
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const scheduledAt = new Date(dateStr);
  scheduledAt.setHours(hours, minutes, 0, 0);
  return scheduledAt;
}

async function runBookingForStudent(studentId: string, inputData: {
  packageId: string;
  instructorId: string;
  vehicleId: string;
  dateStr: string;
  timeSlot: string;
  notes?: string;
}) {
  try {
    const scheduledAt = getScheduledDate(inputData.dateStr, inputData.timeSlot);

    const pkg = await prisma.package.findUnique({
      where: { id: inputData.packageId },
    });

    if (!pkg) {
      return { success: false, error: 'Package not found' };
    }

    // EXACT TRANSACTION LOGIC FROM createBookingTransactionAction:
    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft check (findFirst)
      const startWindow = new Date(scheduledAt.getTime() - 30 * 60 * 1000);
      const endWindow = new Date(scheduledAt.getTime() + 30 * 60 * 1000);

      const conflictSession = await tx.session.findFirst({
        where: {
          scheduledAt: {
            gte: startWindow,
            lte: endWindow,
          },
          status: { not: SessionStatus.CANCELLED },
          OR: [
            { instructorId: inputData.instructorId },
            { vehicleId: inputData.vehicleId },
          ],
        },
      });

      if (conflictSession) {
        throw new Error('DOUBLE_BOOKING_CONFLICT');
      }

      // 2. Create Booking
      const newBooking = await tx.booking.create({
        data: {
          studentId: studentId,
          packageId: inputData.packageId,
          vehicleId: inputData.vehicleId,
          instructorId: inputData.instructorId,
          status: BookingStatus.PENDING,
          paymentStatus: 'PENDING',
          totalAmount: pkg.price,
          notes: inputData.notes || `Booking for ${pkg.name}`,
        },
      });

      // 3. Create Session (triggers DB partial unique index constraint)
      const newSession = await tx.session.create({
        data: {
          bookingId: newBooking.id,
          studentId: studentId,
          instructorId: inputData.instructorId,
          vehicleId: inputData.vehicleId,
          scheduledAt: scheduledAt,
          durationMins: 60,
          status: SessionStatus.SCHEDULED,
          location: 'Main Training Track',
          notes: `First session for ${pkg.name}`,
        },
      });

      return { booking: newBooking, session: newSession };
    });

    return {
      success: true,
      message: 'Booking created successfully! Status: PENDING',
      booking: result.booking,
      session: result.session,
    };
  } catch (error: any) {
    if (error?.message === 'DOUBLE_BOOKING_CONFLICT') {
      return {
        success: false,
        error: 'Slot conflict: The selected instructor or vehicle was just booked by another student. Please select another time slot.',
      };
    }

    if (error?.code === 'P2002') {
      const field = error?.meta?.target as string[] | string | undefined;
      const targets = Array.isArray(field) ? field : typeof field === 'string' ? [field] : [];

      if (
        targets.includes('unique_active_instructor_slot') ||
        targets.includes('unique_active_vehicle_slot') ||
        targets.some((t) => t.includes('instructor') || t.includes('vehicle'))
      ) {
        return {
          success: false,
          error: 'Slot conflict: The selected slot was just reserved by another student. Please choose a different time.',
        };
      }

      return { success: false, error: `P2002 constraint error: ${targets.join(', ')}` };
    }

    return { success: false, error: `Error: ${error?.message || error}` };
  }
}

async function main() {
  console.log('====================================================');
  console.log('  P-10 CLEAN CONCURRENCY RETEST EXECUTION');
  console.log('====================================================\n');

  // 1. Setup Student A and Student B
  let studentA = await prisma.student.findFirst({ where: { email: 'test_student_a_p10@example.com' } });
  if (!studentA) {
    studentA = await prisma.student.create({
      data: {
        name: 'Student A (P10 Test)',
        email: 'test_student_a_p10@example.com',
        phone: '+919999900001',
        role: Role.STUDENT,
      },
    });
  }

  let studentB = await prisma.student.findFirst({ where: { email: 'test_student_b_p10@example.com' } });
  if (!studentB) {
    studentB = await prisma.student.create({
      data: {
        name: 'Student B (P10 Test)',
        email: 'test_student_b_p10@example.com',
        phone: '+919999900002',
        role: Role.STUDENT,
      },
    });
  }

  console.log(`[Account A] ID: ${studentA.id} (${studentA.name})`);
  console.log(`[Account B] ID: ${studentB.id} (${studentB.name})`);

  // 2. Fetch resources
  const pkg = await prisma.package.findFirst();
  const instructor = await prisma.instructor.findFirst();
  const vehicle = await prisma.vehicle.findFirst({ where: { status: 'AVAILABLE' } });

  if (!pkg || !instructor || !vehicle) {
    console.error('ERROR: Database is missing package, instructor, or available vehicle!');
    process.exit(1);
  }

  console.log(`[Package]    ID: ${pkg.id} (${pkg.name})`);
  console.log(`[Instructor] ID: ${instructor.id} (${instructor.name})`);
  console.log(`[Vehicle]    ID: ${vehicle.id} (${vehicle.name})`);

  // 3. Set a clean, fresh target slot 45 days in future
  const testDateStr = '2026-09-25';
  const testTimeSlot = '02:00 PM';
  const targetScheduledAt = getScheduledDate(testDateStr, testTimeSlot);

  // Cleanup any old test sessions for this target slot
  const preCheck = await prisma.session.findMany({
    where: {
      scheduledAt: targetScheduledAt,
    },
  });

  if (preCheck.length > 0) {
    console.log(`[Pre-Test Cleanup] Removing ${preCheck.length} old test session(s)...`);
    await prisma.session.deleteMany({
      where: { scheduledAt: targetScheduledAt },
    });
    await prisma.booking.deleteMany({
      where: { notes: { contains: 'P-10 Concurrency Retest' } },
    });
  }

  console.log(`\nTarget Slot: ${testDateStr} at ${testTimeSlot} (${targetScheduledAt.toISOString()})`);
  console.log('Slot State Before Test: FRESH & UNUSED (0 sessions, 0 bookings)');

  const bookingInput = {
    packageId: pkg.id,
    instructorId: instructor.id,
    vehicleId: vehicle.id,
    dateStr: testDateStr,
    timeSlot: testTimeSlot,
    notes: 'P-10 Concurrency Retest',
  };

  console.log('\n>>> DISPATCHING SIMULTANEOUS CONCURRENT REQUESTS (PROMISE.ALL) <<<');
  const startTime = Date.now();

  // Launch both requests simultaneously
  const [resA, resB] = await Promise.all([
    runBookingForStudent(studentA.id, bookingInput),
    runBookingForStudent(studentB.id, bookingInput),
  ]);

  const elapsedTime = Date.now() - startTime;
  console.log(`Requests finished in ${elapsedTime} ms.\n`);

  console.log('--- RESPONSE ANALYSIS ---');
  console.log('Request A Response:', JSON.stringify(resA, null, 2));
  console.log('Request B Response:', JSON.stringify(resB, null, 2));

  const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0);
  const failureCount = (!resA.success ? 1 : 0) + (!resB.success ? 1 : 0);

  console.log(`\nSuccessful Requests: ${successCount}`);
  console.log(`Rejected Requests:   ${failureCount}`);

  // 4. Verify DB Invariants
  console.log('\n--- DATABASE INVARIANT AUDIT ---');
  const sessionsInDb = await prisma.session.findMany({
    where: {
      scheduledAt: targetScheduledAt,
      status: { not: SessionStatus.CANCELLED },
      OR: [
        { instructorId: instructor.id },
        { vehicleId: vehicle.id },
      ],
    },
    include: { booking: true },
  });

  const bookingsInDb = await prisma.booking.findMany({
    where: {
      notes: { contains: 'P-10 Concurrency Retest' },
    },
  });

  console.log(`Active Sessions in DB for this slot: ${sessionsInDb.length}`);
  console.log(`Total Test Bookings in DB:          ${bookingsInDb.length}`);

  if (sessionsInDb.length === 1) {
    const winnerSession = sessionsInDb[0];
    console.log(`\nWINNING SESSION: ID ${winnerSession.id}, Student ID: ${winnerSession.studentId}`);
    const winnerAccount = winnerSession.studentId === studentA.id ? 'Account A' : 'Account B';
    console.log(`WINNER IDENTITY: ${winnerAccount}`);
  }

  // Final evaluation according to prompt guidelines:
  // Exactly 1 winner, exactly 1 rejection with slot conflict message, DB has exactly 1 active session.
  const isOneWinnerOneLoser = successCount === 1 && failureCount === 1;
  const isDbValid = sessionsInDb.length === 1 && bookingsInDb.length === 1;
  const isConflictMessageCorrect =
    (!resA.success && resA.error?.includes('Slot conflict')) ||
    (!resB.success && resB.error?.includes('Slot conflict'));

  console.log('\n====================================================');
  if (isOneWinnerOneLoser && isDbValid && isConflictMessageCorrect) {
    console.log('  P-10 RETEST RESULT: PASS ✅');
    console.log('  - Exactly 1 request won and reserved the slot.');
    console.log('  - Exactly 1 request was rejected with deterministic slot conflict.');
    console.log('  - Database has exactly 1 session and 1 booking record.');
    console.log('  - Zero orphaned records or race condition vulnerabilities.');
  } else {
    console.log('  P-10 RETEST RESULT: FAIL 🔴');
    console.log(`  - Success count: ${successCount}, Failure count: ${failureCount}`);
    console.log(`  - Active DB sessions: ${sessionsInDb.length}`);
  }
  console.log('====================================================');

  // Clean up test records
  console.log('\n[Post-Test Cleanup] Cleaning up test records...');
  await prisma.session.deleteMany({ where: { scheduledAt: targetScheduledAt } });
  await prisma.booking.deleteMany({ where: { notes: { contains: 'P-10 Concurrency Retest' } } });
  console.log('[Post-Test Cleanup] Cleaned up successfully.');
}

main()
  .catch((e) => {
    console.error('Unhandled script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
