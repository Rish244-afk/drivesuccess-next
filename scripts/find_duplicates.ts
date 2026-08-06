/**
 * Duplicate Session Detector & Cleanup Script
 *
 * Run with:  npx ts-node --skip-project scripts/find_duplicates.ts
 * (from the project root — or run via tsx / ts-node as preferred)
 *
 * Logic:
 *   1. Find all (instructorId, scheduledAt) pairs with more than one non-cancelled session.
 *   2. Within each duplicate group, pick the winner:
 *        a. CONFIRMED / PAID booking → highest priority
 *        b. Earliest createdAt         → tiebreaker
 *   3. CANCEL the losers and flag them for manual refund review.
 *   4. Print a full report so the admin can review before the migration runs.
 *
 * DRY_RUN=true (default) — only prints, makes NO changes.
 * DRY_RUN=false           — commits cancellations to DB.
 */

import { PrismaClient, BookingStatus, SessionStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN !== 'false';

async function main() {
  console.log(`\n🔍 P-10 Duplicate Session Detector`);
  console.log(`   DRY_RUN = ${DRY_RUN} (set DRY_RUN=false to commit changes)\n`);

  // ── 1. Find all non-cancelled sessions ───────────────────────────────────
  const allSessions = await prisma.session.findMany({
    where: { status: { not: SessionStatus.CANCELLED } },
    include: {
      booking: {
        select: {
          id: true,
          studentId: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          razorpayPaymentId: true,
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // ── 2. Group by instructor + scheduledAt ─────────────────────────────────
  const byInstructorSlot = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    const key = `${s.instructorId}::${s.scheduledAt.toISOString()}`;
    if (!byInstructorSlot.has(key)) byInstructorSlot.set(key, []);
    byInstructorSlot.get(key)!.push(s);
  }

  // ── 3. Also group by vehicle + scheduledAt ────────────────────────────────
  const byVehicleSlot = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    const key = `${s.vehicleId}::${s.scheduledAt.toISOString()}`;
    if (!byVehicleSlot.has(key)) byVehicleSlot.set(key, []);
    byVehicleSlot.get(key)!.push(s);
  }

  // ── 4. Identify groups with duplicates ────────────────────────────────────
  const duplicateGroups: Array<{ key: string; type: 'instructor' | 'vehicle'; sessions: typeof allSessions }> = [];

  for (const [key, sessions] of byInstructorSlot.entries()) {
    if (sessions.length > 1) duplicateGroups.push({ key, type: 'instructor', sessions });
  }
  for (const [key, sessions] of byVehicleSlot.entries()) {
    if (sessions.length > 1) duplicateGroups.push({ key, type: 'vehicle', sessions });
  }

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate sessions found. Safe to run migration.\n');
    return;
  }

  console.log(`⚠️  Found ${duplicateGroups.length} duplicate group(s):\n`);

  const toCancel: Array<{ sessionId: string; bookingId: string; reason: string; needsRefund: boolean }> = [];

  for (const group of duplicateGroups) {
    console.log(`  ── ${group.type.toUpperCase()} conflict: ${group.key}`);

    // Rank: PAID/CONFIRMED first, then earliest createdAt
    const ranked = [...group.sessions].sort((a, b) => {
      const isPaidA = a.booking?.paymentStatus === PaymentStatus.PAID ? 0 : 1;
      const isPaidB = b.booking?.paymentStatus === PaymentStatus.PAID ? 0 : 1;
      if (isPaidA !== isPaidB) return isPaidA - isPaidB;
      return (a.booking?.createdAt?.getTime() ?? 0) - (b.booking?.createdAt?.getTime() ?? 0);
    });

    const winner = ranked[0];
    const losers = ranked.slice(1);

    console.log(`     WINNER  → session ${winner.id} | booking ${winner.booking?.id} | status: ${winner.booking?.paymentStatus}`);

    for (const loser of losers) {
      const needsRefund = loser.booking?.paymentStatus === PaymentStatus.PAID;
      console.log(`     CANCEL  → session ${loser.id} | booking ${loser.booking?.id} | status: ${loser.booking?.paymentStatus} ${needsRefund ? '⚠️  REFUND REQUIRED' : ''}`);
      if (loser.booking?.id) {
        toCancel.push({
          sessionId: loser.id,
          bookingId: loser.booking.id,
          reason: `P-10 duplicate slot cleanup. Winner booking: ${winner.booking?.id}`,
          needsRefund,
        });
      }
    }
    console.log('');
  }

  // ── 5. Commit if not dry run ───────────────────────────────────────────────
  if (DRY_RUN) {
    console.log(`🛑 DRY RUN — no changes made.`);
    console.log(`   Re-run with DRY_RUN=false to commit ${toCancel.length} cancellation(s).\n`);
    if (toCancel.some((c) => c.needsRefund)) {
      console.log(`⚠️  WARNING: ${toCancel.filter((c) => c.needsRefund).length} booking(s) marked PAID will require manual refund via Admin Portal before cancellation.\n`);
    }
    return;
  }

  // ── 6. Commit cancellations ────────────────────────────────────────────────
  console.log(`\n🔧 Committing cancellations...`);
  for (const item of toCancel) {
    await prisma.session.update({
      where: { id: item.sessionId },
      data: { status: SessionStatus.CANCELLED, notes: item.reason },
    });
    await prisma.booking.update({
      where: { id: item.bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: item.reason,
      },
    });
    console.log(`  ✅ Cancelled session ${item.sessionId} / booking ${item.bookingId}${item.needsRefund ? ' ⚠️  NEEDS REFUND' : ''}`);
  }

  console.log(`\n✅ Cleanup complete. You can now safely run: npx prisma migrate deploy\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
