'use server';

import { checkAvailabilityTool, createBookingTool, getFAQAnswerTool } from '@/lib/ai';

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
 * AI Assistant Function Calling Orchestrator
 */
export async function processAIChatAction(userMessage: string, history: AIMessage[] = []) {
  try {
    const text = userMessage.toLowerCase().trim();

    // Intent 1: Create Booking
    if (text.includes('book') && (text.includes('create') || text.includes('confirm') || text.includes('pay') || text.includes('saturday') || text.includes('tomorrow') || text.includes('slot'))) {
      // Execute Tool: createBooking()
      const dateStr = text.includes('saturday')
        ? getNextSaturdayDate()
        : new Date().toISOString().split('T')[0];

      const packageType = text.includes('2') || text.includes('bike') || text.includes('wheeler') && text.includes('2')
        ? 'LICENSE_2W'
        : 'LICENSE_4W';

      const bookingRes = await createBookingTool({
        date: dateStr,
        timeSlot: '10:00 AM',
      });

      if (bookingRes.success) {
        return {
          success: true,
          message: `I have generated your booking record! Here are your session details and secure Razorpay payment link:`,
          toolCall: {
            name: 'createBooking',
            args: { date: dateStr, packageType },
            result: bookingRes,
          },
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

    // Intent 2: Check Availability
    if (text.includes('slot') || text.includes('availab') || text.includes('saturday') || text.includes('time') || text.includes('book')) {
      const dateStr = text.includes('saturday')
        ? getNextSaturdayDate()
        : new Date().toISOString().split('T')[0];

      const packageType = text.includes('2') || text.includes('bike')
        ? 'LICENSE_2W'
        : 'LICENSE_4W';

      // Execute Tool: checkAvailability()
      const availRes = await checkAvailabilityTool({
        date: dateStr,
        packageType,
      });

      if (availRes.success) {
        return {
          success: true,
          message: `I checked live database availability for **${availRes.package?.name}** on **${dateStr}**. Here are the available instructor slots:`,
          toolCall: {
            name: 'checkAvailability',
            args: { date: dateStr, packageType },
            result: availRes,
          },
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

    // Intent 3: FAQ Question
    const faqRes = await getFAQAnswerTool({ query: userMessage });

    return {
      success: true,
      message: faqRes.answer,
      toolCall: {
        name: 'getFAQAnswer',
        args: { query: userMessage },
        result: faqRes,
      },
    };
  } catch (error) {
    console.error('processAIChatAction Error:', error);
    return {
      success: false,
      message: 'I encountered an error connecting to the database. Please try again.',
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
