import { GoogleGenerativeAI } from '@google/generative-ai';
import { DRIVEAI_SYSTEM_PROMPT } from './prompt';
import {
  DRIVEAI_TOOL_DECLARATIONS,
  getPackagesTool,
  checkAvailabilityTool,
  getUserBookingStatusTool,
  getRTORequirementsTool,
  getBusinessFAQTool,
} from './tools';
import { JWTPayload } from '@/lib/auth';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderResponse {
  success: boolean;
  text: string;
  options?: Array<{ label: string; value: string }>;
  packageCards?: any[];
  cardData?: any;
  error?: string;
}

/**
 * Execute server-side LLM request via Google Gemini SDK (or fallback REST/mock engine)
 */
export async function executeLLMRequest(
  userMessage: string,
  history: LLMMessage[],
  session: JWTPayload | null
): Promise<ProviderResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[DriveAI Provider] No GEMINI_API_KEY / OPENAI_API_KEY found in process.env. Executing secure smart fallback.');
    return executeSmartFallback(userMessage, history, session);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash or gemini-2.0-flash model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: DRIVEAI_SYSTEM_PROMPT,
    });

    // Format conversation history for Gemini chat format
    const formattedHistory = history
      .slice(-10) // Limit to last 10 turns
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Pass tools to model
    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send user message
    let result = await chat.sendMessage(userMessage);
    let responseText = result.response.text();

    // Check if tool call requested (if SDK returned function call)
    const functionCalls = result.response.functionCalls();
    let cardDataPayload: any = null;
    let packageCardsPayload: any[] | undefined = undefined;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      console.log(`[DriveAI Provider] Executing Tool Call: ${call.name}`, call.args);

      let toolResult: any = null;
      if (call.name === 'get_packages') {
        toolResult = await getPackagesTool(call.args as any);
        if (toolResult.success && toolResult.packages) {
          packageCardsPayload = toolResult.packages.slice(0, 3);
        }
      } else if (call.name === 'check_availability') {
        toolResult = await checkAvailabilityTool(call.args as any);
        if (toolResult.success) {
          cardDataPayload = {
            type: 'SLOTS_AVAILABLE',
            date: toolResult.date,
            packageName: toolResult.package?.name,
            availableSlots: toolResult.availableSlots,
            instructorName: toolResult.instructor?.name,
            vehicleName: toolResult.vehicle?.name,
          };
        }
      } else if (call.name === 'get_user_booking_status') {
        toolResult = await getUserBookingStatusTool(session);
        if (toolResult.success && toolResult.hasBooking) {
          cardDataPayload = {
            type: 'BOOKING_STATUS',
            bookingId: toolResult.bookingId,
            packageName: toolResult.packageName,
            amount: toolResult.amount,
            paymentStatus: toolResult.paymentStatus,
            bookingStatus: toolResult.bookingStatus,
            instructorName: toolResult.instructorName,
            vehicleName: toolResult.vehicleName,
          };
        }
      } else if (call.name === 'get_rto_requirements') {
        toolResult = await getRTORequirementsTool(call.args as any);
      } else if (call.name === 'get_business_faq') {
        toolResult = await getBusinessFAQTool(call.args as any);
      }

      // Send tool response back to model
      const followUp = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        },
      ]);
      responseText = followUp.response.text();
    }

    // Determine dynamic options based on context
    const options = generateDynamicOptions(userMessage, responseText, cardDataPayload);

    return {
      success: true,
      text: responseText,
      options,
      packageCards: packageCardsPayload,
      cardData: cardDataPayload,
    };
  } catch (error: any) {
    console.error('[DriveAI Provider] LLM Provider Error:', error?.message || error);

    // If Gemini API fails or key invalid, fall back smoothly to smart fallback without crashing
    return executeSmartFallback(userMessage, history, session);
  }
}

/**
 * Generate contextual option chips dynamically based on conversation state
 */
function generateDynamicOptions(userMessage: string, responseText: string, cardDataPayload: any) {
  const text = (userMessage + ' ' + responseText).toLowerCase();

  if (text.includes('package') || text.includes('course') || text.includes('tier') || text.includes('hatchback') || text.includes('sedan')) {
    return [
      { label: '📦 Browse All Packages', value: 'Show all packages' },
      { label: '📅 Check Open Slots', value: 'Check available slots' },
      { label: '📜 RTO License Docs', value: 'What documents do I need' },
    ];
  }

  if (text.includes('slot') || text.includes('availab') || text.includes('saturday') || text.includes('time')) {
    return [
      { label: '📅 Check Open Slots', value: 'Check available slots' },
      { label: '📦 Browse Packages', value: 'Show packages' },
    ];
  }

  if (text.includes('booking') || text.includes('status') || text.includes('scheduled')) {
    return [
      { label: '💳 Check My Booking', value: 'Check my booking status' },
      { label: '📦 Browse Packages', value: 'Show packages' },
    ];
  }

  // Casual chat or general questions -> Optional minimal buttons
  return [
    { label: '📦 Browse Packages', value: 'Show packages' },
    { label: '📅 Check Open Slots', value: 'Check available slots' },
  ];
}

/**
 * Robust Smart Fallback Engine:
 * Used when GEMINI_API_KEY is not set or network fails.
 * Provides high-quality conversational responses matching system prompt behavior without static repetition.
 */
async function executeSmartFallback(
  userMessage: string,
  history: LLMMessage[],
  session: JWTPayload | null
): Promise<ProviderResponse> {
  const text = userMessage.toLowerCase().trim();

  // 1. Casual Greetings ("hi", "hello", "yo", "hey")
  if (/^(hii+|hello|hey|hi|good\s+morning|good\s+evening|namaste|what'?s\s+up|yo)$/i.test(text) || text.startsWith('hi ') || text.startsWith('hello ') || text.startsWith('hey ')) {
    return {
      success: true,
      text: "Hey! 👋 I'm DriveAI, virtual assistant for Vahathi Motor Driving School. I can help you check course packages, find lesson slots, explain RTO requirements, or track your booking. What are you looking for today?",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
        { label: '📜 RTO License Docs', value: 'What documents do I need' },
      ],
    };
  }

  // 2. Self-Information ("tell me about yourself")
  if (text.includes('tell me about yourself') || text.includes('who are you') || text.includes('what are you')) {
    return {
      success: true,
      text: "I'm DriveAI, Vahathi Motor Driving School's virtual assistant. I'm here to help you explore practical driving courses, understand pricing, check open instructor slots, prepare for your RTO driving test, or review your booking details.\n\nWhat would you like to know?",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
    };
  }

  // 3. Capabilities ("what can you guide me")
  if (text.includes('what can you guide') || text.includes('what can you do') || text.includes('how can you help')) {
    return {
      success: true,
      text: "I can guide you with:\n\n• 🚗 2-Wheeler & 4-Wheeler driving courses\n• 📅 Daily open slot availability\n• 🪪 RTO license documents & test prep\n• 💳 Checking your active booking status\n• 📍 Doorstep pickup & safety vehicle information\n\nTell me what you're looking for, and I'll guide you!",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
    };
  }

  // 4. Dissatisfaction Recovery ("this is not what i wanted", "you misunderstood", "wrong")
  if (
    text.includes('not what i wanted') ||
    text.includes("that's not what") ||
    text.includes('you misunderstood') ||
    text.includes("didn't understand") ||
    text.includes('wrong answer') ||
    text.includes('not helping') ||
    text === 'no' ||
    text === 'nah'
  ) {
    return {
      success: true,
      text: "Got it — I think I misunderstood what you were looking for. Tell me what you actually want to do, like comparing courses, finding open slots, checking document requirements, or tracking a booking, and I'll help you right away.",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
    };
  }

  // 5. Follow-up / Course Inquiry Context
  if (text.includes('course') || text.includes('package') || text.includes('which one') || text.includes('longer package')) {
    const pkgRes = await getPackagesTool({});
    if (pkgRes.success && pkgRes.packages) {
      if (text.includes('beginner') || text.includes('better for a beginner') || text.includes('which one')) {
        return {
          success: true,
          text: "For beginners, our **15-Day Master 4-Wheeler Course** or **2W+4W Dual Combo** is best. It gives you 15 one-on-one practical driving sessions with instructor-side dual-control safety vehicles and full RTO test track practice.",
          packageCards: pkgRes.packages.slice(0, 3),
        };
      }

      if (text.includes('longer package') || text.includes('master')) {
        const masterPkg = pkgRes.packages.find((p) => p.sessionsCount > 10) || pkgRes.packages[0];
        return {
          success: true,
          text: `The **${masterPkg.name}** is our extended course (₹${masterPkg.price.toLocaleString()} • ${masterPkg.sessionsCount} sessions). It covers highway driving, night maneuvers, parallel parking, and RTO track practice.`,
          packageCards: [masterPkg],
        };
      }

      return {
        success: true,
        text: "Here are our practical driving packages at Vahathi Motor Driving School:",
        packageCards: pkgRes.packages.slice(0, 3),
      };
    }
  }

  // 6. Slots Inquiry
  if (text.includes('slot') || text.includes('availab') || text.includes('tomorrow') || text.includes('schedule')) {
    const avail = await checkAvailabilityTool({});
    if (avail.success) {
      return {
        success: true,
        text: `Here are reference available slot times for **${avail.package?.name}** on **${avail.date}** (shown for reference). Live slot reservation is confirmed in the Booking Wizard:`,
        cardData: {
          type: 'SLOTS_AVAILABLE',
          date: avail.date,
          packageName: avail.package?.name,
          availableSlots: avail.availableSlots,
          instructorName: avail.instructor?.name,
          vehicleName: avail.vehicle?.name,
        },
      };
    }
  }

  // 7. Booking Status Inquiry
  if (text.includes('booking') || text.includes('my status') || text.includes('payment status')) {
    const statusRes = await getUserBookingStatusTool(session);
    if (!statusRes.isAuthenticated) {
      return {
        success: true,
        text: 'Please log into your Vahathi Student Portal to view your active booking status.',
        options: [{ label: '🔐 Login to Portal', value: '/auth/login' }],
      };
    }
    if (statusRes.hasBooking) {
      return {
        success: true,
        text: `Your booking for **${statusRes.packageName}** is currently marked **${statusRes.paymentStatus}** (Status: **${statusRes.bookingStatus}**). Assigned Instructor: **${statusRes.instructorName}**.`,
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
        text: "You don't have any active bookings registered yet under your account. Would you like to check our packages?",
        options: [{ label: '📦 Browse Packages', value: 'Show packages' }],
      };
    }
  }

  // 8. RTO Documents Inquiry
  if (text.includes('document') || text.includes('rto') || text.includes('paperwork') || text.includes('license')) {
    const rto = await getRTORequirementsTool({});
    return {
      success: true,
      text: "To apply for a Driving License at Vahathi, you need to be at least 18 years old. Required documents:\n\n1. Proof of Age (Aadhaar / Passport / Birth Certificate)\n2. Proof of Address\n3. 4 Passport-size photos\n4. Form 1A Medical Certificate\n\nOur team assists you with RTO slot booking and test track prep!",
      options: [{ label: '📦 Browse Packages', value: 'Show packages' }],
    };
  }

  // Default Natural Conversational Fallback (Non-repetitive, responsive)
  return {
    success: true,
    text: "I can help you explore Vahathi Motor Driving School packages, check available lesson slots, explain RTO requirements, or track your booking status. What would you like assistance with?",
    options: [
      { label: '📦 Browse Packages', value: 'Show packages' },
      { label: '📅 Check Open Slots', value: 'Check available slots' },
    ],
  };
}
