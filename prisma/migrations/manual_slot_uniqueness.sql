-- P-10: Partial Unique Indexes for Slot Exclusivity
--
-- Standard Prisma @@unique constraints apply to ALL rows including cancelled
-- sessions, which would block legitimate re-booking of a previously cancelled
-- slot. PostgreSQL partial indexes (WHERE clause) solve this cleanly.
--
-- These indexes guarantee that no two ACTIVE (non-cancelled) sessions share
-- the same instructor+time or vehicle+time. Cancelled sessions are excluded,
-- allowing slots to be re-booked after a cancellation.
--
-- On conflict: Prisma raises P2002 which is caught in createBookingTransactionAction
-- and returned to the user as a clean "Slot conflict" error message.

-- Drop existing indexes if re-running this script
DROP INDEX IF EXISTS unique_active_instructor_slot;
DROP INDEX IF EXISTS unique_active_vehicle_slot;

-- Partial unique index: one active session per instructor per time slot
CREATE UNIQUE INDEX unique_active_instructor_slot
  ON sessions ("instructorId", "scheduledAt")
  WHERE status != 'CANCELLED';

-- Partial unique index: one active session per vehicle per time slot
CREATE UNIQUE INDEX unique_active_vehicle_slot
  ON sessions ("vehicleId", "scheduledAt")
  WHERE status != 'CANCELLED';
