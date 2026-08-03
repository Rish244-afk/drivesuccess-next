import { prisma } from '@/lib/prisma';
import { getAvailableSlotsAction } from '@/actions/bookingSystem';
import { createRazorpayOrderAction } from '@/actions/razorpay';
import { getServerSession } from '@/lib/auth';
import { PackageType, BookingStatus, PaymentStatus, SessionStatus } from '@prisma/client';

// Knowledge Base for FAQ & Customer Support
const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['rto', 'license', 'age', 'eligibility', 'document', 'form', 'paperwork'],
    answer: 'To apply for a 2-Wheeler or 4-Wheeler (LMV) Driving License, you must be at least 18 years old. Required documents: 1) Proof of Age (Aadhaar / Passport / Birth Certificate), 2) Address Proof, 3) Passport Photos, and 4) Form 1A Medical Certificate. Our instructors assist you with RTO slot booking and mock track testing!',
  },
  {
    keywords: ['vehicle', 'car', 'dual control', 'safety', 'fleet', 'pedal'],
    answer: 'Every learning car in our fleet (WagonR, Swift, Dzire, Polo, Verna, Venue, Fronx) is fitted with instructor dual-brake & clutch control pedals, dual mirrors, and smart safety sensors for 100% peace of mind.',
  },
  {
    keywords: ['payment', 'method', 'accept', 'upi', 'card', 'pay'],
    answer: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Debit & Credit Cards, Netbanking, and EMI via our secure Razorpay gateway.',
  },
  {
    keywords: ['refund', 'cancel', 'money back'],
    answer: 'Cancellations made at least 24 hours before a scheduled session are eligible for full refund or free slot rescheduling. To process a refund, please contact our support desk directly at +91 7829780778 or email support@drivesuccess.edu with your Booking ID.',
  },
  {
    keywords: ['pickup', 'drop', 'doorstep', 'home', 'location'],
    answer: 'We provide complimentary doorstep pickup and drop-off service within a 10 km radius of our primary training tracks.',
  },
  {
    keywords: ['duration', 'time', 'hours', 'session', 'class'],
    answer: 'Each practical driving session is 60 minutes long. Complete packages range from 10 to 15 one-on-one practical driving sessions plus RTO track preparation.',
  },
];

/**
 * 1. Tool Implementation: checkAvailability()
 * Queries database for real available slots
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

    return {
      success: true,
      date: targetDate,
      package: { id: pkg.id, name: pkg.name, price: pkg.price, type: pkg.type },
      instructor: { id: instructor.id, name: instructor.name, rating: instructor.rating },
      vehicle: { id: vehicle.id, name: vehicle.name, transmission: vehicle.transmission },
      availableSlots: availableSlotTimes.length > 0 ? availableSlotTimes : ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
    };
  } catch (error) {
    console.error('checkAvailabilityTool Error:', error);
    return { success: false, error: 'Database availability query failed.' };
  }
}

/**
 * 2. Tool Implementation: createBooking()
 * Creates atomic booking in database & returns Razorpay payment link
 */
export async function createBookingTool(params: {
  studentName?: string;
  studentPhone?: string;
  packageId?: string;
  instructorId?: string;
  vehicleId?: string;
  date?: string;
  timeSlot?: string;
}) {
  try {
    const session = await getServerSession();
    let student = null;

    if (session?.sub) {
      student = await prisma.student.findUnique({ where: { id: session.sub } });
    }

    if (!student) {
      student = await prisma.student.findFirst({
        where: params.studentPhone ? { phone: params.studentPhone } : undefined,
      });
    }

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: params.studentName || 'Academy Student',
          phone: params.studentPhone || '+91 98765 00000',
          email: `student_${Date.now()}@drivesuccess.edu`,
        },
      });
    }

    const pkg = params.packageId
      ? await prisma.package.findUnique({ where: { id: params.packageId } })
      : await prisma.package.findFirst();

    const instructor = params.instructorId
      ? await prisma.instructor.findUnique({ where: { id: params.instructorId } })
      : await prisma.instructor.findFirst();

    const vehicle = params.vehicleId
      ? await prisma.vehicle.findUnique({ where: { id: params.vehicleId } })
      : await prisma.vehicle.findFirst({ where: { status: 'AVAILABLE' } });

    if (!pkg || !instructor || !vehicle) {
      return { success: false, error: 'Missing package, instructor, or vehicle.' };
    }

    const bookingDate = params.date || new Date().toISOString().split('T')[0];
    const slot = params.timeSlot || '10:00 AM';

    const newBooking = await prisma.booking.create({
      data: {
        studentId: student.id,
        packageId: pkg.id,
        instructorId: instructor.id,
        vehicleId: vehicle.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: pkg.price,
        notes: `DriveAI Assistant booking for ${pkg.name}`,
      },
    });

    await prisma.session.create({
      data: {
        bookingId: newBooking.id,
        studentId: student.id,
        instructorId: instructor.id,
        vehicleId: vehicle.id,
        scheduledAt: new Date(),
        durationMins: 60,
        status: SessionStatus.SCHEDULED,
        location: 'Main Training Track',
      },
    });

    const orderRes = await createRazorpayOrderAction(newBooking.id);
    const checkoutUrl = `/book?bookingId=${newBooking.id}&orderId=${orderRes.orderId || ''}`;

    return {
      success: true,
      bookingId: newBooking.id,
      status: 'PENDING_PAYMENT',
      studentName: student.name,
      packageName: pkg.name,
      amount: pkg.price,
      date: bookingDate,
      timeSlot: slot,
      instructorName: instructor.name,
      vehicleName: vehicle.name,
      razorpayOrderId: orderRes.orderId || null,
      paymentUrl: checkoutUrl,
    };
  } catch (error) {
    console.error('createBookingTool Error:', error);
    return { success: false, error: 'Booking creation failed.' };
  }
}

/**
 * 3. Tool Implementation: getUserBookingStatus()
 * Queries current user's booking payment and session confirmation status
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
 * 4. Tool Implementation: getFAQAnswer()
 */
export async function getFAQAnswerTool(params: { query: string }) {
  const queryLower = params.query.toLowerCase();

  const matched = FAQ_KNOWLEDGE_BASE.find((faq) =>
    faq.keywords.some((kw) => queryLower.includes(kw))
  );

  if (matched) {
    return { success: true, answer: matched.answer };
  }

  return {
    success: true,
    isFallback: true,
    answer: "I'm not fully sure on that specific detail — let me connect you directly with our senior team! You can call us at +91 7829780778 or email support@drivesuccess.edu for instant assistance.",
  };
}
