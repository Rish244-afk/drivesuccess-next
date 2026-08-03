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
 * DriveAI Assistant Production Intent Router & Guided State Machine
 */
export async function processAIChatAction(userMessage: string, history: AIMessage[] = []) {
  try {
    const text = userMessage.toLowerCase().trim();
    const lastBotMessage = history.filter((m) => m.role === 'assistant').pop()?.content || '';

    // 1. GREETINGS / SMALL-TALK INTENT
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

    // 2. EXPLICIT HUMAN ESCALATION INTENT
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

    // 3. NUMBER SELECTION FROM SHORT NUMBERED LIST (e.g. Replying "1", "2", "3", "option 1")
    const isNumberSelection = /^(1|2|3|4|option\s*1|option\s*2|option\s*3|option\s*4|#1|#2|#3)$/i.test(text);

    if (isNumberSelection && lastBotMessage.includes('Reply with the number')) {
      console.log(`[DriveAI Router] Route: NUMBER_SELECTION | Choice: "${text}"`);
      const numMatch = text.match(/\d/);
      const selectedIndex = numMatch ? parseInt(numMatch[0], 10) - 1 : 0;

      // Extract matching package lines from previous bot message
      const lines = lastBotMessage.split('\n').filter((l) => /^\d+\.\s+/.test(l.trim()));

      if (lines[selectedIndex]) {
        const selectedLine = lines[selectedIndex];
        // Parse package name or find matching package in DB
        const dbPackages = await prisma.package.findMany({ orderBy: { price: 'asc' } });
        const matchedPackage = dbPackages.find((p) => selectedLine.toLowerCase().includes(p.name.toLowerCase().slice(0, 15))) || dbPackages[selectedIndex] || dbPackages[0];

        return {
          success: true,
          message: `Great choice — **${matchedPackage.name}** for **₹${matchedPackage.price.toLocaleString()}** (${matchedPackage.sessionsCount} sessions).\n\nShall I proceed to create your booking reservation now?`,
          cardData: {
            type: 'PACKAGE_SELECTED',
            packageId: matchedPackage.id,
            packageName: matchedPackage.name,
            price: matchedPackage.price,
          },
        };
      }
    }

    // 4. CONFIRMATION TO PROCEED TO BOOKING (e.g. "yes", "proceed", "sure", "book it")
    const isBookingConfirmation =
      (text === 'yes' || text === 'proceed' || text.includes('sure') || text.includes('confirm') || text.includes('book it') || text.includes('go ahead')) &&
      (lastBotMessage.includes('Shall I proceed') || lastBotMessage.includes('booking reservation'));

    if (isBookingConfirmation) {
      console.log(`[DriveAI Router] Route: BOOKING_CONFIRMATION | Query: "${userMessage}"`);
      const dateStr = getNextSaturdayDate();

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

    // 5. GUIDED CONVERSATION FLOW: VEHICLE CATEGORY (2W vs 4W)
    const isGeneralBookingOrPackageInquiry =
      text === 'can i book a session' ||
      text === 'book a session' ||
      text === 'show packages' ||
      text === 'packages' ||
      (text.includes('book') && !text.includes('saturday') && !text.includes('4w') && !text.includes('2w') && !text.includes('hatchback') && !text.includes('10 day'));

    if (isGeneralBookingOrPackageInquiry) {
      console.log(`[DriveAI Router] Route: GUIDED_STEP_1 | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'Are you looking for 2-wheeler or 4-wheeler training?',
      };
    }

    // 6. GUIDED STEP 2: CATEGORY RESPONSE (2W OR 4W)
    if (lastBotMessage.includes('2-wheeler or 4-wheeler')) {
      if (text.includes('2') || text.includes('two') || text.includes('bike') || text.includes('scooter')) {
        console.log(`[DriveAI Router] Route: GUIDED_STEP_2W | Query: "${userMessage}"`);
        const packages2W = await prisma.package.findMany({
          where: {
            OR: [
              { type: 'LICENSE_2W' },
              { name: { contains: '2 Wheeler', mode: 'insensitive' } },
            ],
          },
          take: 3,
          orderBy: { price: 'asc' },
        });

        const list = packages2W
          .map((p, idx) => `${idx + 1}. **${p.name}** — ${p.sessionsCount} Sessions — ₹${p.price.toLocaleString()}`)
          .join('\n');

        return {
          success: true,
          message: `Here are your matching 2-Wheeler options:\n\n${list}\n\nReply with the number (e.g. "1") to select.`,
        };
      } else {
        console.log(`[DriveAI Router] Route: GUIDED_STEP_4W_TIER | Query: "${userMessage}"`);
        return {
          success: true,
          message: 'Which vehicle tier would you prefer — Standard Hatchback (WagonR/Swift), Honda City Sedan, or Hyundai Creta SUV?',
        };
      }
    }

    // 7. GUIDED STEP 3: 4W VEHICLE TIER SELECTION
    if (lastBotMessage.includes('Standard Hatchback')) {
      console.log(`[DriveAI Router] Route: GUIDED_STEP_4W_DURATION | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'Got it! Do you want just the 10-day training course, or training plus your official license processing included?',
      };
    }

    // 8. GUIDED STEP 4 / SHORTCUT MATCHING: NARROWED SHORT NUMBERED LIST (Max 3-4 items)
    const isShortcutOrDurationResponse =
      lastBotMessage.includes('10-day training course') ||
      text.includes('hatchback') ||
      text.includes('sedan') ||
      text.includes('suv') ||
      text.includes('creta') ||
      (text.includes('10 day') && text.includes('4w'));

    if (isShortcutOrDurationResponse) {
      console.log(`[DriveAI Router] Route: SHORT_NUMBERED_LIST | Query: "${userMessage}"`);

      // Determine DB filters
      let categoryFilter = 'ANY';
      if (text.includes('hatchback') || text.includes('wagonr') || text.includes('swift')) categoryFilter = 'HATCHBACK';
      if (text.includes('sedan') || text.includes('honda') || text.includes('city') || text.includes('verna')) categoryFilter = 'HONDACITY';
      if (text.includes('suv') || text.includes('creta') || text.includes('venue')) categoryFilter = 'CRETA';

      const matchingPackages = await prisma.package.findMany({
        where: categoryFilter !== 'ANY' ? { targetVehicleCategory: categoryFilter } : { type: 'LICENSE_4W' },
        take: 3,
        orderBy: { price: 'asc' },
      });

      const list = matchingPackages
        .map((p, idx) => `${idx + 1}. **${p.name}** — ${p.sessionsCount} Sessions — ₹${p.price.toLocaleString()}`)
        .join('\n');

      return {
        success: true,
        message: `Here are your matching options:\n\n${list}\n\nReply with the number (e.g. "1") to select.`,
      };
    }

    // 9. GENERAL PRICING INQUIRY (Short guidance list)
    if (text.includes('price') || text.includes('cost') || text.includes('how much') || text.includes('fee')) {
      console.log(`[DriveAI Router] Route: GENERAL_PRICING | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'Are you looking for 2-wheeler or 4-wheeler training?',
      };
    }

    // 10. ABOUT WEBSITE / SERVICES GENERAL INQUIRY INTENT
    const isAboutOrServices =
      text.includes('website') ||
      text.includes('about') ||
      text.includes('service') ||
      text.includes('what do you do') ||
      text.includes('who are you') ||
      text.includes('drivesuccess') ||
      text.includes('tell me');

    if (isAboutOrServices) {
      console.log(`[DriveAI Router] Route: ABOUT_WEBSITE | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'DriveSuccess Academy is a premier ISO 9001:2026 certified driving school. We offer accredited 2-wheeler and 4-wheeler practical driving courses with dual-control safety vehicles, flexible daily slots (9:00 AM - 6:00 PM), doorstep pickup, and RTO exam track preparation!',
      };
    }

    // 11. REQUIRED DOCUMENTS INTENT
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
        message: 'To apply for a Driving License, you must be at least 18 years old. Required documents include: 1) Proof of Age (Aadhaar / Passport / Birth Certificate), 2) Proof of Address, 3) 4 Passport size photos, and 4) Form 1A Medical Certificate. Our team assists you with RTO slot booking and test track prep!',
      };
    }

    // 12. USER PAYMENT / BOOKING STATUS INTENT
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

    // 13. CHECK AVAILABILITY INTENT
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

    // 14. GENERAL FAQ KNOWLEDGE BASE FALLBACK
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
      message: 'DriveSuccess Academy offers 2-wheeler and 4-wheeler practical driving training with dual-control safety vehicles, flexible daily slots (9:00 AM - 6:00 PM), and RTO exam prep. How can I help you today?',
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
