'use server';

import { checkAvailabilityTool, getFAQAnswerTool, getUserBookingStatusTool } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export interface AIOption {
  label: string;
  value: string;
}

export interface AIPackageCard {
  id: string;
  name: string;
  price: number;
  sessionsCount: number;
  description?: string;
  badge?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  options?: AIOption[];
  packageCards?: AIPackageCard[];
  toolCall?: {
    name: string;
    args: any;
    result: any;
  };
  cardData?: any;
}

/**
 * DriveAI Assistant — Sales Concierge / Discovery / FAQ / Booking Guidance
 *
 * ARCHITECTURAL BOUNDARY (per spec §1–§4):
 *   DriveAI is a concierge layer ONLY.
 *   It must NEVER:
 *     • Create bookings
 *     • Create Razorpay orders
 *     • Verify payment signatures
 *     • Mark bookings as PAID / CONFIRMED
 *     • Lock time slots
 *     • Process refunds
 *     • Collect payment credentials, OTPs, or card details
 *
 *   When the user is ready to book, DriveAI returns a BOOKING_HANDOFF card
 *   containing the packageId. The client navigates to /book?package=<id>.
 *   The existing BookingWizard is the single authoritative booking engine.
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
        message: "Hi there! Welcome to DriveSuccess Academy. I'm your DriveAI Assistant — how can I help you today?",
        options: [
          { label: '📦 Browse Packages', value: 'Show packages' },
          { label: '📅 Check Open Slots', value: 'Check available slots' },
          { label: '📜 RTO License Docs', value: 'What documents do I need' },
          { label: '💳 Check My Booking', value: 'Check my booking status' },
        ],
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

    // 3. PACKAGE SELECTION VIA MINI CARD BUTTON OR TEXT
    if (text.startsWith('select ') || (lastBotMessage.includes('matching options') && (text.includes('training') || text.includes('license') || text.includes('creta') || text.includes('combo')))) {
      console.log(`[DriveAI Router] Route: PACKAGE_SELECTION | Query: "${userMessage}"`);
      const searchStr = text.replace(/^select\s+/i, '').trim();

      const dbPackages = await prisma.package.findMany({ orderBy: { price: 'asc' } });
      const matchedPackage =
        dbPackages.find((p) => p.name.toLowerCase().includes(searchStr)) ||
        dbPackages.find((p) => searchStr.includes(p.slug)) ||
        dbPackages[0];

      return {
        success: true,
        // Improved wording per spec §22: shows name, price, sessions clearly
        message: `Great choice! 🎉\n\n${matchedPackage.name}\n₹${matchedPackage.price.toLocaleString()} • ${matchedPackage.sessionsCount} sessions\n\nReady to book this package?`,
        options: [
          // Value 'Yes proceed' triggers the BOOKING_HANDOFF route below
          { label: '✓ Continue to Booking', value: 'Yes proceed' },
          { label: '× Choose Another Package', value: 'Show packages' },
        ],
        // PACKAGE_SELECTED cardData carries packageId safely — no sensitive data
        cardData: {
          type: 'PACKAGE_SELECTED',
          packageId: matchedPackage.id,
          packageName: matchedPackage.name,
          price: matchedPackage.price,
        },
      };
    }

    // 4. SAFE BOOKING HANDOFF — replaces the old createBookingTool call
    //
    // WHAT THIS USED TO DO (P-17 / old architecture):
    //   createBookingTool() → createBookingTransactionAction() → createRazorpayOrderAction()
    //   This locked a slot, created a Razorpay order, and launched checkout inside chat.
    //   That violated the single-booking-engine principle.
    //
    // WHAT THIS NOW DOES:
    //   Reads the last PACKAGE_SELECTED cardData from conversation history.
    //   Returns a BOOKING_HANDOFF card with packageId.
    //   The client navigates to /book?package=<packageId>.
    //   The BookingWizard performs authoritative slot selection, booking creation,
    //   and payment — DriveAI has no further involvement.
    const isBookingConfirmation =
      (text === 'yes proceed' || text === 'yes' || text === 'proceed' || text.includes('sure') || text.includes('confirm') || text.includes('book it') || text.includes('go ahead')) &&
      (lastBotMessage.includes('Ready to book') || lastBotMessage.includes('Shall I proceed') || lastBotMessage.includes('booking reservation'));

    if (isBookingConfirmation) {
      console.log(`[DriveAI Router] Route: BOOKING_HANDOFF | Query: "${userMessage}"`);

      // Find the most recently selected package from conversation history.
      // We only read the packageId (a DB UUID) — no sensitive data is accessed.
      const lastPkgCard = [...history]
        .reverse()
        .find((m) => m.cardData?.type === 'PACKAGE_SELECTED');

      const packageId = lastPkgCard?.cardData?.packageId as string | undefined;
      const packageName = lastPkgCard?.cardData?.packageName as string | undefined;
      const price = lastPkgCard?.cardData?.price as number | undefined;

      if (!packageId) {
        // Edge case: user said "yes" without having selected a package first
        return {
          success: true,
          message: "I couldn't find a selected package. Please browse and select a package first.",
          options: [
            { label: '📦 Browse Packages', value: 'Show packages' },
          ],
        };
      }

      return {
        success: true,
        message: `Perfect! 🎉\n\nI'll take you to the booking page where you can choose your instructor, vehicle, date, and an available time slot.\n\nThe booking wizard will confirm your package and guide you through secure payment.`,
        // BOOKING_HANDOFF card is rendered by the widget and triggers navigation to /book
        cardData: {
          type: 'BOOKING_HANDOFF',
          packageId,
          packageName: packageName || 'Selected Package',
          price,
        },
      };
    }

    // 5. GUIDED STEP 1: INITIAL BOOKING / PACKAGE INQUIRY
    const isGeneralBookingOrPackageInquiry =
      text === 'can i book a session' ||
      text === 'book a session' ||
      text === 'show packages' ||
      text === 'packages' ||
      text === 'browse packages' ||
      (text.includes('book') && !text.includes('saturday') && !text.includes('4w') && !text.includes('2w') && !text.includes('hatchback') && !text.includes('10 day'));

    if (isGeneralBookingOrPackageInquiry) {
      console.log(`[DriveAI Router] Route: GUIDED_STEP_1 | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'Are you looking for 2-wheeler or 4-wheeler training?',
        options: [
          { label: '🏍️ 2-Wheeler', value: '2W' },
          { label: '🚗 4-Wheeler', value: '4W' },
        ],
      };
    }

    // 6. GUIDED STEP 2: CATEGORY SELECTION (2W vs 4W)
    if (lastBotMessage.includes('2-wheeler or 4-wheeler') || text === '2w' || text === '4w') {
      if (text === '2w' || text.includes('2-wheeler') || text.includes('bike') || text.includes('scooter')) {
        console.log(`[DriveAI Router] Route: GUIDED_STEP_2W | Query: "${userMessage}"`);
        const packages2W = await prisma.package.findMany({
          where: {
            OR: [
              { type: 'LICENSE_2W' },
              { type: 'COMBO' },
              { name: { contains: '2-Wheeler', mode: 'insensitive' } },
              { name: { contains: 'Combo', mode: 'insensitive' } },
            ],
          },
          take: 3,
          orderBy: { price: 'asc' },
        });

        console.log(`[DriveAI Router] Found ${packages2W.length} 2-Wheeler/Combo packages in DB.`);

        const packageCards: AIPackageCard[] = packages2W.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          sessionsCount: p.sessionsCount,
          description: p.description,
          badge: p.badge || undefined,
        }));

        return {
          success: true,
          message: 'Here are our 2-Wheeler & Dual Combo Licensing options:',
          packageCards,
        };
      } else {
        console.log(`[DriveAI Router] Route: GUIDED_STEP_4W_TIER | Query: "${userMessage}"`);
        return {
          success: true,
          message: 'Which vehicle tier would you prefer?',
          options: [
            { label: '🚗 Standard Hatchback', value: 'Standard Hatchback' },
            { label: '🚘 Honda City Sedan', value: 'Honda City Sedan' },
            { label: '🚙 Hyundai Creta SUV', value: 'Hyundai Creta SUV' },
          ],
        };
      }
    }

    // 7. GUIDED STEP 3: 4W VEHICLE TIER SELECTION (Hatchback / Sedan / Creta SUV)
    if (lastBotMessage.includes('Which vehicle tier') || text.includes('hatchback') || text.includes('sedan') || text.includes('creta')) {
      console.log(`[DriveAI Router] Route: GUIDED_STEP_4W_DURATION | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'Got it! Do you want just the 10-day training course, 15-day master course, or a 2W+4W Combo License?',
        options: [
          { label: '⏱️ 10 Days Training', value: '10 Days' },
          { label: '📅 15 Days Master', value: '15 Days' },
          { label: '📜 2+4 Combo License', value: 'Combo License' },
        ],
      };
    }

    // 8. GUIDED STEP 4 / SHORTCUT MATCHING: NARROWED MINI PACKAGE CARDS (Max 3-4 items)
    const isShortcutOrDurationResponse =
      lastBotMessage.includes('10-day training course') ||
      text.includes('10 days') ||
      text.includes('15 days') ||
      text.includes('combo license') ||
      (text.includes('10 day') && text.includes('4w'));

    if (isShortcutOrDurationResponse) {
      console.log(`[DriveAI Router] Route: SHORT_PACKAGE_CARDS | Query: "${userMessage}"`);

      let categoryFilter = 'ANY';
      if (text.includes('hatchback') || text.includes('wagonr') || text.includes('swift')) categoryFilter = 'HATCHBACK';
      if (text.includes('sedan') || text.includes('honda') || text.includes('city') || text.includes('verna')) categoryFilter = 'HONDACITY';
      if (text.includes('suv') || text.includes('creta') || text.includes('venue')) categoryFilter = 'CRETA';

      const matchingPackages = await prisma.package.findMany({
        where: categoryFilter !== 'ANY' ? { targetVehicleCategory: categoryFilter } : { type: 'LICENSE_4W' },
        take: 3,
        orderBy: { price: 'asc' },
      });

      console.log(`[DriveAI Router] Found ${matchingPackages.length} matching packages in DB for filter "${categoryFilter}".`);

      const packageCards: AIPackageCard[] = matchingPackages.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        sessionsCount: p.sessionsCount,
        description: p.description,
        badge: p.badge || undefined,
      }));

      return {
        success: true,
        message: 'Here are your matching training options:',
        packageCards,
      };
    }

    // 9. GENERAL PRICING INQUIRY
    if (text.includes('price') || text.includes('cost') || text.includes('how much') || text.includes('fee')) {
      console.log(`[DriveAI Router] Route: GENERAL_PRICING | Query: "${userMessage}"`);
      return {
        success: true,
        message: 'Are you looking for 2-wheeler or 4-wheeler training?',
        options: [
          { label: '🏍️ 2-Wheeler', value: '2W' },
          { label: '🚗 4-Wheeler', value: '4W' },
        ],
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
        options: [
          { label: '📦 Browse Packages', value: 'Show packages' },
          { label: '📅 Check Open Slots', value: 'Check available slots' },
        ],
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
        options: [
          { label: '📦 Select Course Package', value: 'Show packages' },
        ],
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
          message: statusRes.message || "I couldn't find an active booking under your current session. Would you like to browse our packages?",
          options: [
            { label: '📅 Check Open Slots', value: 'Check available slots' },
            { label: '📦 Browse Packages', value: 'Show packages' },
          ],
        };
      }
    }

    // 13. CHECK AVAILABILITY INTENT
    //
    // IMPORTANT (spec §9): DriveAI shows live availability for REFERENCE ONLY.
    // The booking wizard remains the authoritative availability system.
    // We never tell the user "your slot at X:XX is confirmed" from here.
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
        const slots = availRes.availableSlots || [];
        if (slots.length > 0) {
          return {
            success: true,
            // Careful wording: "reference" not "confirmed available"
            message: `Here are reference slot times for **${availRes.package?.name}** on **${dateStr}** (shown for planning purposes). The booking wizard confirms live availability:`,
            cardData: {
              type: 'SLOTS_AVAILABLE',
              date: dateStr,
              packageName: availRes.package?.name,
              price: availRes.package?.price,
              instructorName: availRes.instructor?.name,
              rating: availRes.instructor?.rating,
              vehicleName: availRes.vehicle?.name,
              availableSlots: slots,
            },
          };
        } else {
          return {
            success: true,
            message: `Looks like slots for **${availRes.package?.name}** on **${dateStr}** may be fully booked. Check the booking wizard for live availability and alternative dates.`,
            options: [
              { label: '📦 Browse Packages', value: 'Show packages' },
            ],
          };
        }
      }
    }

    // 14. GENERAL FAQ KNOWLEDGE BASE FALLBACK
    console.log(`[DriveAI Router] Route: GENERAL_FAQ | Query: "${userMessage}"`);
    const faqRes = await getFAQAnswerTool({ query: userMessage });

    return {
      success: true,
      message: faqRes.answer,
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
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
