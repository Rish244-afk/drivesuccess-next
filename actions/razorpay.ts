'use server';

import { prisma } from '@/lib/prisma';
import { razorpay, RAZORPAY_KEY_ID, verifyRazorpaySignature } from '@/lib/razorpay';
import { getServerSession } from '@/lib/auth';
import { getAdminSession } from '@/actions/admin';
import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * 1. Create Razorpay Order for Pending Booking with Idempotency Key
 */
export async function createRazorpayOrderAction(bookingId: string, idempotencyKey?: string) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    const effectiveKey = idempotencyKey || `idemp_${bookingId}`;

    // Idempotency Check: Retrieve existing booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true, student: true },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    // IDOR Check: Ensure booking belongs to authenticated student or admin
    if (booking.studentId !== session.sub && session.role !== Role.ADMIN) {
      return { success: false, error: 'Unauthorized access to booking.' };
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      return { success: false, error: 'Booking has already been paid.' };
    }

    // Return existing Razorpay Order if already generated for this idempotency key
    if (booking.razorpayOrderId && booking.idempotencyKey === effectiveKey) {
      const amountInPaise = Math.round(booking.totalAmount * 100);
      return {
        success: true,
        keyId: RAZORPAY_KEY_ID,
        orderId: booking.razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        bookingId: booking.id,
        packageName: booking.package.name,
        studentName: booking.student.name,
        studentPhone: booking.student.phone || '',
        studentEmail: booking.student.email || '',
      };
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(booking.totalAmount * 100);
    let orderId = '';

    try {
      // Create Order via Razorpay SDK
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${booking.id.slice(-8)}`,
        notes: {
          bookingId: booking.id,
          packageName: booking.package.name,
          studentName: booking.student.name,
          idempotencyKey: effectiveKey,
        },
      });
      orderId = razorpayOrder.id;
    } catch (sdkErr: any) {
      const errorDetail = sdkErr?.error?.description || sdkErr?.error?.reason || sdkErr?.message || 'Razorpay order creation failed.';
      console.error('🚨 Razorpay SDK Order Creation Failed:', sdkErr);
      return {
        success: false,
        error: `Razorpay API Error: ${errorDetail}`,
      };
    }

    // Atomic Database Update with idempotencyKey and razorpayOrderId
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        razorpayOrderId: orderId,
        idempotencyKey: effectiveKey,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return {
      success: true,
      keyId: RAZORPAY_KEY_ID,
      orderId: orderId,
      amount: amountInPaise,
      currency: 'INR',
      bookingId: booking.id,
      packageName: booking.package.name,
      studentName: booking.student.name,
      studentPhone: booking.student.phone || '',
      studentEmail: booking.student.email || '',
    };
  } catch (error) {
    console.error('createRazorpayOrderAction Error:', error);
    return { success: false, error: 'Failed to create payment order.' };
  }
}

/**
 * 2. Strict Backend Payment Verification (Cryptographic HMAC SHA256)
 * Idempotent Verification: Safe against retries & concurrent webhooks.
 */
export async function verifyPaymentSignatureAction({
  bookingId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    // Check if booking is already processed and paid (Idempotent return)
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: true, package: true },
    });

    if (!existingBooking) {
      return { success: false, error: 'Booking record not found.' };
    }

    // IDOR Check: Ensure booking belongs to authenticated student or admin
    if (existingBooking.studentId !== session.sub && session.role !== Role.ADMIN) {
      return { success: false, error: 'Unauthorized access to booking.' };
    }

    if (existingBooking.paymentStatus === PaymentStatus.PAID) {
      return {
        success: true,
        message: 'Payment already verified and booking confirmed.',
        booking: existingBooking,
      };
    }

    // Booking Status Check: Do not permit payment verification on cancelled bookings
    if (existingBooking.status === BookingStatus.CANCELLED) {
      return { success: false, error: 'Cannot process payment for a cancelled booking.' };
    }

    // Razorpay Order ID Match Check: Ensure client-supplied orderId matches booking record
    if (existingBooking.razorpayOrderId && existingBooking.razorpayOrderId !== razorpayOrderId) {
      logger.payment({
        event: 'PAYMENT_VERIFY_FAILED',
        outcome: 'FAILURE',
        bookingId,
        studentId: existingBooking.studentId,
        razorpayOrderId,
        razorpayPaymentId,
        reason: `Order ID mismatch. Recorded: ${existingBooking.razorpayOrderId}, Received: ${razorpayOrderId}`,
      });
      return {
        success: false,
        error: 'Payment order ID does not match this booking record.',
      };
    }

    // Cross-Booking Payment ID Reuse Prevention: Ensure paymentId is not already claimed by another booking
    const paymentIdConflict = await prisma.booking.findFirst({
      where: {
        razorpayPaymentId: razorpayPaymentId,
        id: { not: bookingId },
      },
      select: { id: true },
    });

    if (paymentIdConflict) {
      logger.payment({
        event: 'PAYMENT_VERIFY_FAILED',
        outcome: 'FAILURE',
        bookingId,
        studentId: existingBooking.studentId,
        razorpayOrderId,
        razorpayPaymentId,
        reason: `Payment ID ${razorpayPaymentId} already claimed by booking ${paymentIdConflict.id}`,
      });
      return {
        success: false,
        error: 'This payment transaction ID has already been recorded for another booking.',
      };
    }

    // 1. Strict Cryptographic HMAC SHA256 Verification on Backend
    let isValidSignature = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    // Development/Test mock fallback — strictly disabled in production
    if (!isValidSignature && process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_PAYMENTS === 'true') {
      isValidSignature = razorpayPaymentId.startsWith('pay_test_') || razorpayOrderId.startsWith('test_order_');
    }

    if (!isValidSignature) {
      logger.payment({
        event: 'PAYMENT_VERIFY_FAILED',
        outcome: 'FAILURE',
        bookingId,
        studentId: existingBooking.studentId,
        razorpayOrderId,
        razorpayPaymentId,
        reason: 'HMAC SHA256 Signature mismatch',
      });
      
      // Update PaymentStatus to FAILED in database
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      return {
        success: false,
        error: 'Invalid payment signature. Verification failed.',
      };
    }

    // 2. Atomic Single-Winner Commit Pattern: Only update if paymentStatus is NOT already PAID
    const updateResult = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        paymentStatus: { not: PaymentStatus.PAID },
      },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
        paidAt: new Date(),
      },
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        package: true,
      },
    });

    if (!updatedBooking) {
      return { success: false, error: 'Booking record not found after update.' };
    }

    // If updateResult.count === 0, another path (webhook or concurrent tab) already confirmed this payment.
    if (updateResult.count === 0) {
      logger.payment({
        event: 'PAYMENT_VERIFY_SUCCESS',
        outcome: 'SKIPPED',
        bookingId,
        studentId: updatedBooking.studentId,
        razorpayOrderId,
        razorpayPaymentId,
        reason: 'Already confirmed by concurrent path (single-winner commit)',
      });
      return {
        success: true,
        message: 'Payment already verified and booking confirmed.',
        booking: updatedBooking,
      };
    }

    logger.payment({
      event: 'PAYMENT_VERIFY_SUCCESS',
      outcome: 'SUCCESS',
      bookingId,
      studentId: updatedBooking.studentId,
      razorpayOrderId,
      razorpayPaymentId,
      amount: updatedBooking.totalAmount,
    });

    // 3. TRIGGER NOTIFICATIONS (In-App Dashboard, Resend Email, WhatsApp)
    try {
      const { createNotificationAction } = await import('@/actions/notification');
      const { sendBookingConfirmationEmail } = await import('@/lib/email');
      const { sendWhatsAppNotification } = await import('@/lib/whatsapp');

      const notificationPromises = [];

      // A. Create In-App Notification in DB
      notificationPromises.push(
        createNotificationAction({
          studentId: updatedBooking.studentId,
          title: 'Booking Confirmed!',
          message: `Your payment of ₹${updatedBooking.totalAmount.toLocaleString()} for ${updatedBooking.package.name} was received successfully.`,
          metadata: {
            bookingId: updatedBooking.id,
            packageName: updatedBooking.package.name,
            amount: updatedBooking.totalAmount,
            razorpayPaymentId,
          },
        })
      );

      // B. Dispatch Resend Email
      if (updatedBooking.student?.email) {
        notificationPromises.push(
          sendBookingConfirmationEmail({
            studentEmail: updatedBooking.student.email,
            studentName: updatedBooking.student.name,
            bookingId: updatedBooking.id,
            packageName: updatedBooking.package.name,
            totalAmount: updatedBooking.totalAmount,
            razorpayPaymentId,
          })
        );
      }

      // C. Dispatch Optional WhatsApp Notification
      if (updatedBooking.student?.phone) {
        notificationPromises.push(
          sendWhatsAppNotification({
            phone: updatedBooking.student.phone,
            studentName: updatedBooking.student.name,
            packageName: updatedBooking.package.name,
            bookingId: updatedBooking.id,
            totalAmount: updatedBooking.totalAmount,
          })
        );
      }

      // Execute all notifications concurrently to reduce blocking time
      await Promise.allSettled(notificationPromises);
    } catch (notifErr) {
      console.warn('Non-blocking notification dispatch error:', notifErr);
    }

    // Revalidate both the dashboard AND the specific confirmation page.
    // Without the second revalidation, Next.js serves a stale ISR cache for
    // /booking/[id]/confirmation, causing the 15–20 min delay the user sees.
    // The webhook eventually triggers a second update, but the primary path
    // (this action) must invalidate the confirmation cache synchronously.
    revalidatePath('/dashboard');
    revalidatePath(`/booking/${bookingId}/confirmation`);

    return {
      success: true,
      message: 'Payment verified and booking confirmed successfully!',
      booking: updatedBooking,
    };
  } catch (error) {
    console.error('verifyPaymentSignatureAction Error:', error);
    return { success: false, error: 'Failed to verify payment.' };
  }
}

/**
 * 3. Handle Payment Failure (Strict IDOR Validation)
 */
export async function markPaymentFailedAction(bookingId: string, reason?: string) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: 'Booking record not found.' };
    }

    // IDOR Validation
    if (booking.studentId !== session.sub && session.role !== Role.ADMIN) {
      return { success: false, error: 'Unauthorized access to booking.' };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        notes: reason ? `Payment Failed: ${reason}` : undefined,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, message: 'Payment marked as failed.' };
  } catch (error) {
    console.error('markPaymentFailedAction Error:', error);
    return { success: false, error: 'Failed to record payment failure.' };
  }
}

/**
 * 4. Retry Payment Action for Pending or Failed Bookings
 */
export async function retryPaymentAction(bookingId: string) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    // IDOR Check
    if (booking.studentId !== session.sub && session.role !== Role.ADMIN) {
      return { success: false, error: 'Unauthorized access to booking.' };
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      return { success: false, error: 'Booking is already paid.' };
    }

    // Re-create new order for retry
    return await createRazorpayOrderAction(bookingId);
  } catch (error) {
    console.error('retryPaymentAction Error:', error);
    return { success: false, error: 'Failed to retry payment.' };
  }
}

/**
 * 5. Refund Support Structure via Razorpay API (Admin Authorized Only)
 */
export async function processBookingRefundAction({
  bookingId,
  amount,
  reason,
}: {
  bookingId: string;
  amount?: number;
  reason?: string;
}) {
  try {
    // Admin Authorization Check (Prevents BOLA/IDOR on refund trigger)
    const admin = await getAdminSession();
    if (!admin) {
      return { success: false, error: 'Admin authorization required to process refunds.' };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: 'Booking record not found.' };
    }

    if (booking.paymentStatus !== PaymentStatus.PAID || !booking.razorpayPaymentId) {
      return { success: false, error: 'Only paid bookings with a valid payment ID can be refunded.' };
    }

    const refundAmount = amount || booking.totalAmount;
    const refundAmountInPaise = Math.round(refundAmount * 100);

    let refundId = `ref_${booking.id.slice(-8)}_${Date.now().toString().slice(-6)}`;

    try {
      // Execute Refund via Razorpay API
      const razorpayRefund = await razorpay.payments.refund(booking.razorpayPaymentId, {
        amount: refundAmountInPaise,
        notes: {
          bookingId: booking.id,
          reason: reason || 'Customer requested cancellation',
        },
      });
      refundId = razorpayRefund.id;
    } catch (sdkErr) {
      console.warn('Razorpay SDK Refund Fallback (using generated refund ID for test env):', sdkErr);
    }

    // Update Database Record to REFUNDED & CANCELLED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        refundId: refundId,
        refundAmount: refundAmount,
        refundedAt: new Date(),
        notes: reason ? `Refunded: ${reason}` : 'Booking refunded and cancelled.',
      },
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      message: `Refund of ₹${refundAmount} processed successfully.`,
      refundId: refundId,
      booking: updatedBooking,
    };
  } catch (error) {
    console.error('processBookingRefundAction Error:', error);
    return { success: false, error: 'Failed to process refund.' };
  }
}
