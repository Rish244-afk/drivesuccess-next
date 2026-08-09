'use server';

import { runDriveAIEngine } from '@/lib/ai/engine';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { getServerSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

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
 * DriveAI Assistant Server Action Endpoint
 * Delegates input processing to the server-side DriveAI Engine.
 */
export async function processAIChatAction(userMessage: string, history: AIMessage[] = []) {
  try {
    // ── GATE 1: Authentication ────────────────────────────────────────────────
    // Must happen before any DB query, rate-limit consumption, or AI call.
    const session = await getServerSession();
    if (!session || !session.sub) {
      return {
        success: false,
        message: 'Please log in to use the AI assistant.',
        options: [
          { label: 'Log In', value: 'login' },
          { label: 'Sign Up', value: 'signup' },
        ],
      };
    }

    // ── GATE 2: Per-User Rate Limiting (20 req / 5 min) ──────────────────────
    // Keyed on the stable server-side identifier — never on client-supplied data.
    const rateCheck = await checkRateLimit(`ai_chat_${session.sub}`, {
      limit: 20,
      windowMs: 5 * 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: 'You have sent too many messages. Please wait a moment before trying again.',
      };
    }

    const text = userMessage.toLowerCase().trim();

    // 1. Handshake Trigger: Package Selection via Card Button ("Select <Package Name>")
    if (text.startsWith('select ')) {
      const searchStr = text.replace(/^select\s+/i, '').trim();
      const dbPackages = await prisma.package.findMany({ orderBy: { price: 'asc' } });
      const matchedPackage =
        dbPackages.find((p) => p.name.toLowerCase().includes(searchStr)) ||
        dbPackages.find((p) => searchStr.includes(p.slug)) ||
        dbPackages[0];

      if (matchedPackage) {
        return {
          success: true,
          message: `Great choice! 🎉\n\n**${matchedPackage.name}**\n₹${matchedPackage.price.toLocaleString()} • ${matchedPackage.sessionsCount} sessions\n\nReady to proceed to slot selection?`,
          options: [
            { label: '✓ Continue to Booking', value: 'Yes proceed' },
            { label: '× Choose Another Package', value: 'Show packages' },
          ],
          cardData: {
            type: 'PACKAGE_SELECTED',
            packageId: matchedPackage.id,
            packageName: matchedPackage.name,
            price: matchedPackage.price,
          },
        };
      }
    }

    // 2. Handshake Trigger: Safe Booking Handoff Confirmation ("yes proceed")
    const lastBotMessage = history.filter((m) => m.role === 'assistant').pop()?.content || '';
    const isBookingConfirmation =
      (text === 'yes proceed' || text === 'yes' || text === 'proceed' || text.includes('confirm booking')) &&
      (lastBotMessage.includes('Ready to proceed') || lastBotMessage.includes('Ready to book'));

    if (isBookingConfirmation) {
      const lastPkgCard = [...history].reverse().find((m) => m.cardData?.type === 'PACKAGE_SELECTED');
      const packageId = lastPkgCard?.cardData?.packageId as string | undefined;
      const packageName = lastPkgCard?.cardData?.packageName as string | undefined;
      const price = lastPkgCard?.cardData?.price as number | undefined;

      if (!packageId) {
        return {
          success: true,
          message: "I couldn't find a selected package. Please browse and select a package first.",
          options: [{ label: '📦 Browse Packages', value: 'Show packages' }],
        };
      }

      return {
        success: true,
        message: `Perfect! 🎉\n\nI'm opening the booking wizard where you can choose your instructor, vehicle, date, and available time slot.\n\nThe booking wizard will confirm your package and guide you through secure checkout.`,
        cardData: {
          type: 'BOOKING_HANDOFF',
          packageId,
          packageName: packageName || 'Selected Package',
          price,
        },
      };
    }

    // 3. Delegate to DriveAI Conversational Engine
    const reqHeaders = headers();
    const ipAddress = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || '127.0.0.1';

    const engineResult = await runDriveAIEngine({
      userMessage,
      history,
      ipAddress,
    });

    return {
      success: engineResult.success,
      message: engineResult.text,
      options: engineResult.options,
      packageCards: engineResult.packageCards,
      cardData: engineResult.cardData,
    };
  } catch (error) {
    console.error('processAIChatAction Error:', error);
    return {
      success: true,
      message: "I'm having trouble accessing that right now. Please try again in a moment or contact our support team at +91 7829780778.",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
    };
  }
}
