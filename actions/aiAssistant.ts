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
 * DriveAI Assistant LLM & Intent Router
 */
export async function processAIChatAction(userMessage: string, history: AIMessage[] = []) {
  try {
    const text = userMessage.toLowerCase().trim();

    // 1. GREETINGS / SMALL-TALK INTENT
    // Matches: "hii", "hello", "hey", "hi", "good morning", "good evening", "namaste", "what's up"
    const isGreeting =
      /^(hii+|hello|hey|hi|good\s+morning|good\s+evening|namaste|what'?s\s+up|yo)$/i.test(text) ||
      text.startsWith('hi ') ||
      text.startsWith('hello ') ||
      text.startsWith('hey ');

    if (isGreeting) {
      console.log(`[DriveAI Router] Route: GREETING | Query: "${userMessage}"`);
      return {
        success: true,
        message: "Hi there! Welcome to DriveSuccess Academy. I'm your DriveAI Assistant — I can help with course pricing, checking available lesson slots, or booking a training session. What would you like to know today?",
      };
    }

    // 2. EXPLICIT HUMAN ESCALATION INTENT (Only for refunds, disputes, human agent requests)
    const isEscalation =
      text.includes('refund') ||
      text.includes('dispute') ||
      text.includes('complaint') ||
      text.includes('speak to human') ||
      text.includes('talk to human') ||
      text.includes('call me') ||
      text.includes('human agent');

    if (isEscalation) {
      console.log(`[DriveAI Router] Route: HUMAN_ESCALATION | Query: "${userMessage}"`);
      return {
        success: true,
        message: "For refund requests, billing disputes, or direct human escalation, please contact our director support desk at +91 7829780778 or email support@drivesuccess.edu with your Booking ID.",
      };
    }

    // 3. ABOUT WEBSITE / SERVICES GENERAL INQUIRY INTENT
    // Matches: "what is this website about", "what do you about this website", "tell me about drivesuccess", "what services do you offer"
    const isAboutOrServices =
      text.includes('website') ||
      text.includes('about') ||
      text.includes('service') ||
      text.includes('what do you do') ||
      text.includes('who are you') ||
      text.includes('drivesuccess') ||
      text.includes('tell me');

    if (isAboutOrServices && !text.includes('price') && !text.includes('cost') && !text.includes('slot') && !text.includes('book') && !text.includes('document')) {
      console.log(`[DriveAI Router] Route: ABOUT_WEBSITE | Query: "${userMessage}"`);
      return {
        success: true,
        message: "DriveSuccess Academy is a premier ISO 9001:2026 certified driving school. We offer accredited 2-wheeler and 4-wheeler practical driving courses with dual-control safety vehicles, flexible daily slots (9:00 AM - 6:00 PM), doorstep pickup, and RTO exam track preparation!",
      };
    }

    // 4. REQUIRED DOCUMENTS INTENT
    // Matches: "what documents do i need", "paperwork", "requirements", "age limit", "rto documents"
    const isDocuments =
      text.includes('document') ||
      text.includes('paperwork') ||
      text.includes('proof') ||
      text.includes('requirement') ||
      (text.includes('need') && !text.includes('book') && !text.includes('slot'));

    if (isDocuments) {
      console.log(`[DriveAI Router] Route: REQUIRED_DOCUMENTS | Query: "${userMessage}"`);
      return {
        success: true,
        message: "To apply for a Driving License, you must be at least 18 years old. Required documents include: 1) Proof of Age (Aadhaar / Passport / Birth Certificate), 2) Proof of Address, 3) 4 Passport size photos, and 4) Form 1A Medical Certificate. Our team assists you with RTO slot booking and test track prep!",
      };
    }

    // 5. PACKAGE PRICING INQUIRY INTENT
    // Matches: "how much for a 2 wheeler license", "course pricing", "fees", "how much"
    const isPricing =
      text.includes('price') ||
      text.includes('cost') ||
      text.includes('how much') ||
      text.includes('fee') ||
      text.includes('rate') ||
      text.includes('package') ||
      text.includes('2 wheeler') ||
      text.includes('2w') ||
      text.includes('4w');

    if (isPricing && !text.includes('slot') && !text.includes('book saturday')) {
      console.log(`[DriveAI Router] Route: PACKAGE_PRICING | Query: "${userMessage}"`);
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

    // 6. USER PAYMENT / BOOKING STATUS INTENT
    const isPaymentStatus =
      text.includes('payment') ||
      text.includes('confirmed') ||
      text.includes('went through') ||
      text.includes('my booking') ||
      (text.includes('status') && !text.includes('rto'));

    if (isPaymentStatus) {
      console.log(`[DriveAI Router] Route: PAYMENT_STATUS | Query: "${userMessage}"`);
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
          message: statusRes.message || "I couldn't find an active booking under your current session. Would you like me to check open lesson slots for you?",
        };
      }
    }

    // 7. CREATE BOOKING INTENT
    if (text.includes('book') && (text.includes('create') || text.includes('confirm') || text.includes('pay') || text.includes('saturday') || text.includes('tomorrow') || text.includes('slot'))) {
      console.log(`[DriveAI Router] Route: CREATE_BOOKING | Query: "${userMessage}"`);
      const dateStr = text.includes('saturday')
        ? getNextSaturdayDate()
        : new Date().toISOString().split('T')[0];

      const packageType = (text.includes('2') || text.includes('bike'))
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

    // 8. CHECK AVAILABILITY INTENT
    if (text.includes('slot') || text.includes('availab') || text.includes('saturday') || text.includes('time') || text.includes('schedule')) {
      console.log(`[DriveAI Router] Route: CHECK_AVAILABILITY | Query: "${userMessage}"`);
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

    // 9. GENERAL FAQ KNOWLEDGE BASE FALLBACK (Never escalates to human unless explicitly out-of-scope)
    console.log(`[DriveAI Router] Route: GENERAL_FAQ | Query: "${userMessage}"`);
    const faqRes = await getFAQAnswerTool({ query: userMessage });

    return {
      success: true,
      message: faqRes.answer,
    };
  } catch (error) {
    console.error('processAIChatAction Error:', error);
    return {
      success: true,
      message: "DriveSuccess Academy offers 2-wheeler and 4-wheeler practical driving training with dual-control safety vehicles, flexible daily slots (9:00 AM - 6:00 PM), and RTO exam prep. How can I help you today?",
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
