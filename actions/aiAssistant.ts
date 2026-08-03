'use server';

import { checkAvailabilityTool, createBookingTool, getFAQAnswerTool, getUserBookingStatusTool } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export interface AIMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCall?: {
    name: string;
    args: any;
    result: any;
  };
  cardData?: any;
}

/**
 * DriveAI Assistant Production Action Handler
 */
export async function processAIChatAction(userMessage: string, history: AIMessage[] = []) {
  try {
    const text = userMessage.toLowerCase().trim();

    // 1. Payment Status Query
    if (text.includes('payment') || text.includes('confirmed') || text.includes('status') || text.includes('went through') || text.includes('booking status')) {
      const statusRes = await getUserBookingStatusTool();
      if (statusRes.hasBooking) {
        return {
          success: true,
          message: `Your booking for **${statusRes.packageName}** is currently marked **${statusRes.paymentStatus}** (Booking Status: **${statusRes.bookingStatus}**). Your assigned instructor is **${statusRes.instructorName}** with dual-control **${statusRes.vehicleName}**.`,
          cardData: {
            type: 'BOOKING_STATUS',
            bookingId: statusRes.bookingId,
            packageName: statusRes.packageName,
            amount: statusRes.amount,
            paymentStatus: statusRes.paymentStatus,
            bookingStatus: statusRes.bookingStatus,
            instructorName: statusRes.instructorName,
            vehicleName: statusRes.vehicleName,
          },
        };
      } else {
        return {
          success: true,
          message: statusRes.message || "I couldn't find an active booking under your account. Would you like me to check open slots for you?",
        };
      }
    }

    // 2. Package Pricing Inquiry
    if (text.includes('price') || text.includes('cost') || text.includes('how much') || text.includes('fee') || text.includes('package')) {
      const packages = await prisma.package.findMany({ orderBy: { price: 'asc' } });
      if (packages.length > 0) {
        const pkgList = packages
          .map((p) => `• **${p.name}**: ₹${p.price.toLocaleString()} (${p.sessionsCount} sessions)`)
          .join('\n');
        return {
          success: true,
          message: `Here are our accredited driver training program fees:\n\n${pkgList}\n\nAll packages include dual-control vehicle training, RTO mock test prep, and instructor guidance!`,
        };
      }
    }

    // 3. Create Booking Intent
    if (text.includes('book') && (text.includes('create') || text.includes('confirm') || text.includes('pay') || text.includes('saturday') || text.includes('tomorrow') || text.includes('slot'))) {
      const dateStr = text.includes('saturday')
        ? getNextSaturdayDate()
        : new Date().toISOString().split('T')[0];

      const packageType = (text.includes('2') || text.includes('bike') || text.includes('wheeler'))
        ? 'LICENSE_2W'
        : 'LICENSE_4W';

      const bookingRes = await createBookingTool({
        date: dateStr,
        timeSlot: '10:00 AM',
      });

      if (bookingRes.success) {
        return {
          success: true,
          message: `I have reserved your training session for **${bookingRes.packageName}** on **${bookingRes.date}** at **${bookingRes.timeSlot}**! You can complete your deposit below:`,
          cardData: {
            type: 'BOOKING_CREATED',
            bookingId: bookingRes.bookingId,
            packageName: bookingRes.packageName,
            amount: bookingRes.amount,
            date: bookingRes.date,
            timeSlot: bookingRes.timeSlot,
            instructorName: bookingRes.instructorName,
            vehicleName: bookingRes.vehicleName,
            paymentUrl: bookingRes.paymentUrl,
          },
        };
      }
    }

    // 4. Check Availability Intent
    if (text.includes('slot') || text.includes('availab') || text.includes('saturday') || text.includes('time') || text.includes('book')) {
      const dateStr = text.includes('saturday')
        ? getNextSaturdayDate()
        : new Date().toISOString().split('T')[0];

      const packageType = (text.includes('2') || text.includes('bike'))
        ? 'LICENSE_2W'
        : 'LICENSE_4W';

      const availRes = await checkAvailabilityTool({
        date: dateStr,
        packageType,
      });

      if (availRes.success) {
        return {
          success: true,
          message: `We have open slots for **${availRes.package?.name}** on **${dateStr}** with **${availRes.instructor?.name}** (${availRes.vehicle?.name}):`,
          cardData: {
            type: 'SLOTS_AVAILABLE',
            date: dateStr,
            packageName: availRes.package?.name,
            price: availRes.package?.price,
            instructorName: availRes.instructor?.name,
            rating: availRes.instructor?.rating,
            vehicleName: availRes.vehicle?.name,
            availableSlots: availRes.availableSlots,
          },
        };
      }
    }

    // 5. FAQ Knowledge Base & Fallback Escalation
    const faqRes = await getFAQAnswerTool({ query: userMessage });

    return {
      success: true,
      message: faqRes.answer,
    };
  } catch (error) {
    console.error('processAIChatAction Error:', error);
    return {
      success: false,
      message: "I'm not fully sure on that one — let me connect you with our support team directly at +91 7829780778 or support@drivesuccess.edu for immediate help!",
    };
  }
}

function getNextSaturdayDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
