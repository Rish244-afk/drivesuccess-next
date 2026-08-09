import { prisma } from '@/lib/prisma';
import { getAvailableSlotsAction } from '@/actions/bookingSystem';
import { getServerSession, JWTPayload } from '@/lib/auth';
import { PackageType } from '@prisma/client';
import { getISTDateString } from '@/lib/dateUtils';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data: any;
  error?: string;
}

/**
 * 1. Tool: get_packages
 * Fetches course packages from DB with optional category/type filtering.
 */
export async function getPackagesTool(params: { category?: string; type?: string }) {
  try {
    const whereClause: any = {};
    if (params.type) {
      whereClause.type = params.type as PackageType;
    }
    if (params.category && params.category !== 'ANY') {
      whereClause.targetVehicleCategory = params.category;
    }

    const packages = await prisma.package.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { price: 'asc' },
    });

    return {
      success: true,
      count: packages.length,
      packages: packages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        targetVehicleCategory: p.targetVehicleCategory,
        price: p.price,
        sessionsCount: p.sessionsCount,
        description: p.description,
        badge: p.badge,
      })),
    };
  } catch (error) {
    console.error('[DriveAI Tool] getPackagesTool Error:', error);
    return { success: false, error: 'Failed to fetch packages from database.' };
  }
}

/**
 * 2. Tool: check_availability
 * Queries slot reference availability from DB for a given date and package type.
 */
export async function checkAvailabilityTool(params: { date?: string; packageType?: string }) {
  try {
    const targetDate = params.date || getISTDateString();

    const pkg = await prisma.package.findFirst({
      where: params.packageType ? { type: params.packageType as PackageType } : undefined,
    });
    const instructor = await prisma.instructor.findFirst();
    const vehicle = await prisma.vehicle.findFirst({ where: { status: 'AVAILABLE' } });

    if (!pkg || !instructor || !vehicle) {
      return {
        success: false,
        error: 'No active training package or instructor available in database.',
      };
    }

    const slotsRes = await getAvailableSlotsAction({
      dateStr: targetDate,
      instructorId: instructor.id,
      vehicleId: vehicle.id,
    });

    const availableSlotTimes = (slotsRes.data || [])
      .filter((s: any) => s.available)
      .map((s: any) => s.time);

    return {
      success: true,
      date: targetDate,
      package: { id: pkg.id, name: pkg.name, price: pkg.price, type: pkg.type },
      instructor: { id: instructor.id, name: instructor.name, rating: instructor.rating },
      vehicle: { id: vehicle.id, name: vehicle.name, transmission: vehicle.transmission },
      availableSlots: availableSlotTimes,
      note: 'Shown for reference/planning purposes. Authoritative slot locking occurs in the Booking Wizard during checkout.',
    };
  } catch (error) {
    console.error('[DriveAI Tool] checkAvailabilityTool Error:', error);
    return { success: false, error: 'Database availability query failed.' };
  }
}

/**
 * 3. Tool: get_user_booking_status
 * Derives current student identity strictly from the authenticated server session.
 */
export async function getUserBookingStatusTool(sessionOverride?: JWTPayload | null) {
  try {
    const session = sessionOverride !== undefined ? sessionOverride : await getServerSession();
    if (!session?.sub) {
      return {
        success: false,
        isAuthenticated: false,
        message: 'Student is not logged in. Please log in to view personal booking details.',
      };
    }

    const booking = await prisma.booking.findFirst({
      where: { studentId: session.sub },
      include: { package: true, instructor: true, vehicle: true, sessions: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!booking) {
      return {
        success: true,
        isAuthenticated: true,
        hasBooking: false,
        message: 'No active or historical bookings found for this account.',
      };
    }

    return {
      success: true,
      isAuthenticated: true,
      hasBooking: true,
      bookingId: booking.id,
      packageName: booking.package.name,
      amount: booking.totalAmount,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      instructorName: booking.instructor?.name || 'Assigned Instructor',
      vehicleName: booking.vehicle?.name || 'Dual-Control Safety Vehicle',
      sessionsCount: booking.sessions.length,
      createdAt: booking.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('[DriveAI Tool] getUserBookingStatusTool Error:', error);
    return { success: false, error: 'Failed to retrieve authenticated booking status.' };
  }
}

/**
 * 4. Tool: get_rto_requirements
 * Returns verified RTO license documentation and test track guidance.
 */
export async function getRTORequirementsTool(params: { topic?: string }) {
  return {
    success: true,
    eligibilityAge: 18,
    requiredDocuments: [
      'Proof of Age (Aadhaar Card / Passport / Birth Certificate)',
      'Proof of Address (Aadhaar / Voter ID / Utility Bill)',
      '4 Passport-size photographs',
      'Form 1A Medical Certificate (for learners & license applicants)',
    ],
    rtoSupport: 'Vahathi Motor Driving School assists students with online RTO slot booking, document verification, Form 1A medical assistance, and mock RTO test track practice.',
  };
}

/**
 * 5. Tool: get_business_faq
 * Returns verified information about school policies, fleet specs, doorstep pickup, and refund rules.
 */
export async function getBusinessFAQTool(params: { category?: string }) {
  const category = (params.category || 'all').toLowerCase();

  const businessInfo = {
    schoolName: 'Vahathi Motor Driving School',
    accreditation: 'ISO 9001:2026 Certified',
    operatingHours: 'Flexible daily slots from 9:00 AM to 6:00 PM',
    doorstepPickup: 'Complimentary doorstep pickup & drop-off service within a 10 km radius of primary training tracks.',
    safetyVehicles: 'All training vehicles (WagonR, Swift, Dzire, Polo, Verna, Venue, Fronx) feature instructor-side dual brake & clutch control pedals, dual mirrors, and smart assist sensors.',
    cancellationPolicy: 'Cancellations made at least 24 hours prior to a scheduled session are eligible for a full refund or free slot rescheduling.',
    refundEscalation: 'For direct refund inquiries or payment disputes, contact our support desk at +91 7829780778 or email support@drivesuccess.edu.',
  };

  return {
    success: true,
    category,
    info: businessInfo,
  };
}

/**
 * Declarations for LLM Tool Call Definition
 */
export const DRIVEAI_TOOL_DECLARATIONS = [
  {
    name: 'get_packages',
    description: 'Fetch Vahathi driving course packages from database. Use when user asks about available courses, 2W/4W options, pricing, or specific vehicle tiers (Hatchback, Sedan, Creta SUV).',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Vehicle tier filter: CRETA, HONDACITY, HATCHBACK, or ANY' },
        type: { type: 'string', description: 'Package type filter: LICENSE_2W, LICENSE_4W, COMBO, etc.' },
      },
    },
  },
  {
    name: 'check_availability',
    description: 'Check reference slot availability for a date and course type. Use when user asks about slot availability, weekend slots, or daily schedules.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Target date string in YYYY-MM-DD format.' },
        packageType: { type: 'string', description: 'LICENSE_2W or LICENSE_4W' },
      },
    },
  },
  {
    name: 'get_user_booking_status',
    description: "Retrieve the authenticated user's current booking status. Automatically uses the authenticated student session.",
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_rto_requirements',
    description: 'Fetch required documents, age eligibility, and RTO test track guidance.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'documents, eligibility, or track_prep' },
      },
    },
  },
  {
    name: 'get_business_faq',
    description: 'Fetch Vahathi Motor Driving School operating hours, doorstep pickup radius, vehicle dual-control specs, and refund/cancellation policies.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'hours, vehicles, pickup, cancellation, or general' },
      },
    },
  },
];
