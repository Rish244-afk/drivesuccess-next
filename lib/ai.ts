import { prisma } from '@/lib/prisma';
import { getAvailableSlotsAction } from '@/actions/bookingSystem';
import { getServerSession } from '@/lib/auth';
import { PackageType } from '@prisma/client';

// Expanded Knowledge Base for FAQ & General Information
const FAQ_KNOWLEDGE_BASE = [
  {
    category: 'ABOUT',
    keywords: ['about', 'website', 'drivesuccess', 'school', 'academy', 'services', 'offer', 'what do you do', 'who are you'],
    answer: 'Vahathi Motor Driving School is an accredited ISO 9001:2026 driving school. We provide 2-Wheeler (Bike/Scooter) and 4-Wheeler (Compact/Sedan/SUV) practical driving courses, RTO mock test prep, dual-control safety vehicles, flexible daily slots (9:00 AM - 6:00 PM), and doorstep pickup.',
  },
  {
    category: 'DOCUMENTS',
    keywords: ['document', 'documents', 'need', 'paperwork', 'proof', 'age', 'rto', 'requirement', 'eligibility', 'form'],
    answer: 'To apply for a Driving License, you must be at least 18 years old. Required documents include: 1) Proof of Age (Aadhaar / Passport / Birth Certificate), 2) Proof of Address, 3) 4 Passport size photos, and 4) Form 1A Medical Certificate. Our team assists you with RTO slot booking and test track prep!',
  },
  {
    category: 'VEHICLES',
    keywords: ['vehicle', 'car', 'dual control', 'safety', 'fleet', 'pedal', 'model'],
    answer: 'Every learning vehicle in our fleet (WagonR, Swift, Dzire, Polo, Verna, Venue, Fronx) is equipped with instructor-side dual brake & clutch control pedals, dual side mirrors, and smart assist sensors for 100% driving safety.',
  },
  {
    category: 'PAYMENTS',
    keywords: ['payment', 'method', 'accept', 'upi', 'card', 'pay', 'razorpay', 'netbanking'],
    answer: 'We accept all major payment options including UPI (Google Pay, PhonePe, Paytm), Debit & Credit Cards, Netbanking, and EMI via our secure Razorpay gateway.',
  },
  {
    category: 'REFUNDS',
    keywords: ['refund', 'cancel', 'money back', 'dispute', 'complaint'],
    answer: 'Cancellations made at least 24 hours before a scheduled session are eligible for a full refund or free slot rescheduling. To initiate a refund or dispute, please contact our support desk directly at +91 7829780778 or email support@drivesuccess.edu with your Booking ID.',
  },
  {
    category: 'LOCATION',
    keywords: ['pickup', 'drop', 'doorstep', 'home', 'location', 'track', 'radius'],
    answer: 'We offer complimentary doorstep pickup and drop-off service within a 10 km radius of our primary training tracks.',
  },
  {
    category: 'DURATION',
    keywords: ['duration', 'time', 'hours', 'session', 'class', 'length'],
    answer: 'Each practical driving session is 60 minutes long. Full licensing packages range from 10 to 15 one-on-one practical driving sessions plus RTO test track preparation.',
  },
];

/**
 * 1. Tool Implementation: checkAvailability()
 *
 * Queries live slot availability from the authoritative booking engine.
 * Results are shown to the user for PLANNING PURPOSES ONLY — the booking
 * wizard performs the authoritative availability check before any slot is
 * reserved. DriveAI never claims a slot is definitively available.
 */
export async function checkAvailabilityTool(params: { date?: string; packageType?: string }) {
  try {
    const targetDate = params.date || new Date().toISOString().split('T')[0];

    const pkg = await prisma.package.findFirst({
      where: params.packageType ? { type: params.packageType as PackageType } : undefined,
    });
    const instructor = await prisma.instructor.findFirst();
    const vehicle = await prisma.vehicle.findFirst({ where: { status: 'AVAILABLE' } });

    if (!pkg || !instructor || !vehicle) {
      return {
        success: false,
        error: 'No active package or instructor available.',
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

    // No hardcoded fallback — an empty array means genuinely no open slots.
    // Per spec §9: DriveAI must not claim slot availability without live data.
    return {
      success: true,
      date: targetDate,
      package: { id: pkg.id, name: pkg.name, price: pkg.price, type: pkg.type },
      instructor: { id: instructor.id, name: instructor.name, rating: instructor.rating },
      vehicle: { id: vehicle.id, name: vehicle.name, transmission: vehicle.transmission },
      availableSlots: availableSlotTimes,
    };
  } catch (error) {
    console.error('checkAvailabilityTool Error:', error);
    return { success: false, error: 'Database availability query failed.' };
  }
}

/**
 * 2. Tool Implementation: getUserBookingStatus()
 *
 * Read-only: returns the authenticated user's most recent booking status.
 * Never modifies booking state.
 */
export async function getUserBookingStatusTool() {
  try {
    const session = await getServerSession();
    if (!session?.sub) {
      return {
        success: false,
        message: 'Please log into your Student Portal to view your live booking and payment status.',
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
        hasBooking: false,
        message: "You don't have any active bookings registered yet. Would you like me to check open slots for you?",
      };
    }

    return {
      success: true,
      hasBooking: true,
      bookingId: booking.id,
      packageName: booking.package.name,
      amount: booking.totalAmount,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      instructorName: booking.instructor?.name || 'Assigned Instructor',
      vehicleName: booking.vehicle?.name || 'Dual-Control Vehicle',
      sessionsCount: booking.sessions.length,
    };
  } catch (error) {
    console.error('getUserBookingStatusTool Error:', error);
    return { success: false, message: 'Failed to retrieve booking status.' };
  }
}

/**
 * 3. Tool Implementation: getFAQAnswer()
 */
export async function getFAQAnswerTool(params: { query: string }) {
  const queryLower = params.query.toLowerCase().trim();

  const matched = FAQ_KNOWLEDGE_BASE.find((faq) =>
    faq.keywords.some((kw) => queryLower.includes(kw))
  );

  if (matched) {
    return { success: true, isMatched: true, category: matched.category, answer: matched.answer };
  }

  // Default general information response instead of instant escalation
  return {
    success: true,
    isMatched: false,
    answer: 'Vahathi Motor Driving School offers accredited 2-wheeler and 4-wheeler practical driving courses with dual-control safety vehicles, flexible daily slots (9:00 AM - 6:00 PM), and RTO exam track prep. How can I assist you with packages or lesson slots?',
  };
}
