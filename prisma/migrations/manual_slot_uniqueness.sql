-- P-10: Partial Unique Indexes for Slot Exclusivity
--
-- Standard Prisma @@unique constraints apply to ALL rows including cancelled
-- sessions, which would block legitimate re-booking of a previously cancelled
-- slot. PostgreSQL partial indexes (WHERE clause) solve this cleanly.
--
-- PREDICATE DESIGN: Whitelist, not blacklist.
--
-- We enumerate only the states that actively HOLD a slot, rather than excluding
-- only CANCELLED. This is safer against future status additions:
--
--   SCHEDULED   → upcoming session, slot is reserved         ✅ blocks
--   IN_PROGRESS → session is happening right now             ✅ blocks
--   COMPLETED   → session finished, time is past             ❌ does not block
--   CANCELLED   → slot released                              ❌ does not block
--   NO_SHOW     → student absent, slot effectively unused    ❌ does not block
--
-- Any future status (e.g. EXPIRED, ON_HOLD) will NOT block slots by default,
-- requiring an explicit decision to add it to the whitelist. This is the
-- correct safe-default posture for a slot reservation system.
--
-- On conflict: Prisma raises P2002 which is caught in createBookingTransactionAction
-- and returned to the user as a clean "Slot conflict" error message.

-- Drop existing indexes before re-applying (idempotent)
DROP INDEX IF EXISTS unique_active_instructor_slot;
DROP INDEX IF EXISTS unique_active_vehicle_slot;

-- Partial unique index: one slot-reserving session per instructor per time slot
CREATE UNIQUE INDEX unique_active_instructor_slot
  ON sessions ("instructorId", "scheduledAt")
  WHERE status IN ('SCHEDULED', 'IN_PROGRESS');

-- Partial unique index: one slot-reserving session per vehicle per time slot
CREATE UNIQUE INDEX unique_active_vehicle_slot
  ON sessions ("vehicleId", "scheduledAt")
  WHERE status IN ('SCHEDULED', 'IN_PROGRESS');
