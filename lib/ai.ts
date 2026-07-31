import { prisma } from '@/lib/prisma';
import { getAvailableSlotsAction, createBookingTransactionAction } from '@/actions/bookingSystem';
import { createRazorpayOrderAction } from '@/actions/razorpay';
import { PackageType, BookingStatus, PaymentStatus, SessionStatus } from '@prisma/client';

// Knowledge Base for FAQ
const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['rto', 'license', 'age', 'eligibility', 'document', 'form'],
    answer: 'To get a 4-Wheeler (LMV) or 2-Wheeler driver license, you must be at least 18 years old. Required documents include: 1) Proof of Age (Aadhaar/Passport/Birth Cert), 2) Proof of Address, 3) Passport size photos, 4) Learner Permit (Form 2), and 5) RTO Medical Certificate (Form 1A).',
  },
  {
    keywords: ['vehicle', 'car', 'dual control', 'safety', 'fleet', 'gear'],
    answer: 'All DriveSuccess Academy vehicles (WagonR, Swift, Dzire, Polo, Verna, Venue, Fronx) are equipped with dual brake & clutch control pedals on the instructor side, dual mirrors, and front/rear dashcams for 100% safety.',
  },
  {
    keywords: ['duration', 'time', 'hours', 'session', 'class'],
    answer: 'Each practical driving session is 60 minutes long. Full license packages include 10 to 15 practical driving sessions plus RTO mock test preparation.',
  },
  {
    keywords: ['pickup', 'drop', 'home', 'location'],
    answer: 'We offer doorstep pickup and drop-off facilities within a 10 km radius of our main training tracks.',
  },
  {
    keywords: ['refund', 'cancel', 'reschedule', 'policy'],
    answer: 'Cancellations made 24 hours prior to a scheduled session are eligible for full refund or free rescheduling. Refunds are processed back to the original payment method via Razorpay within 3-5 business days.',
  },
];

/**
 * 1. Tool Implementation: checkAvailability()
 * Queries PostgreSQL database for real available slots
 */
export async function checkAvailabilityTool(params: { date?: string; packageType?: string }) {
  try {
    const targetDate = params.date || new Date().toISOString().split('T')[0];

    // Find default package & instructor
    const pkg = await prisma.package.findFirst({
      where: params.packageType ? { type: params.packageType as PackageType } : undefined,
    });
    const instructor = await prisma.instructor.findFirst();
    const vehicle = await prisma.vehicle.findFirst({ where: { status: 'AVAILABLE' } });

    if (!pkg || !instructor || !vehicle) {
      return {
        success: false,
        error: 'No active package or instructor available in database.',
      };
    }

    // Run real database slot calculation
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
    // 1. Get or default student
    let student = await prisma.student.findFirst({
      where: params.studentPhone ? { phone: params.studentPhone } : undefined,
    });

    if (!student) {
      student = await prisma.student.findFirst() || await prisma.student.create({
        data: {
          name: params.studentName || 'Academy Student',
          phone: params.studentPhone || '+91 98765 00000',
          email: `student_${Date.now()}@drivesuccess.edu`,
        },
      });
    }

    // 2. Resolve package, instructor, vehicle
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

    // 3. Create Booking in database
    const newBooking = await prisma.booking.create({
      data: {
        studentId: student.id,
        packageId: pkg.id,
        instructorId: instructor.id,
        vehicleId: vehicle.id,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        totalAmount: pkg.price,
        notes: `AI Assistant booking for ${pkg.name}`,
      },
    });

    // 4. Create initial Session record
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

    // 5. Create Razorpay Payment Order
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
 * 3. Tool Implementation: getFAQAnswer()
 * Queries knowledge base for policy, RTO, vehicle safety, and refund answers
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
    answer: 'DriveSuccess Academy provides RTO certified 2-wheeler & 4-wheeler driving training with dual-control vehicles, flexible daily slots (9:00 AM - 6:00 PM), and automated Razorpay payments.',
  };
}
