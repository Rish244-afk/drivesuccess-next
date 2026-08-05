'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createRazorpayOrderAction,
  verifyPaymentSignatureAction,
  markPaymentFailedAction,
} from '@/actions/razorpay';

export interface RazorpayCheckoutCallbacks {
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  /** Fired immediately when Razorpay handler fires, BEFORE the backend
   *  verification round-trip. Use this to show "Verifying payment…" UI. */
  onVerifying?: () => void;
  onDismiss?: () => void;
  onPaymentFailed?: (error: string) => void;
}

export function useRazorpayCheckout() {
  const router = useRouter();

  // Dynamically load the Razorpay Checkout v1 script once on mount.
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const launchRazorpayCheckout = async (
    bookingId: string,
    callbacks?: RazorpayCheckoutCallbacks
  ) => {
    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION — show loading spinner and clear previous errors only.
    //
    // ROOT CAUSE OF BUG (now fixed):
    //   The previous version called `callbacks?.onSuccess?.('')` here as part
    //   of "resetting UI state". This immediately fired setPaymentStatus('PAID')
    //   in the wizard, rendering the "Payment Successful!" screen before any
    //   payment had been attempted or verified.
    //
    // Rule: onSuccess MUST ONLY be called after backend verification succeeds.
    // ─────────────────────────────────────────────────────────────────────────
    callbacks?.onLoading?.(true);
    callbacks?.onError?.('');
    // onSuccess is intentionally NOT called here.

    // Step 1 — Create a Razorpay order on the backend.
    const orderRes = await createRazorpayOrderAction(bookingId);
    callbacks?.onLoading?.(false);

    if (!orderRes.success) {
      callbacks?.onError?.(orderRes.error || 'Failed to initialize payment gateway.');
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RACE CONDITION GUARD: `handlerFired` boolean.
    //
    // On certain mobile browsers and some Razorpay SDK versions, ondismiss fires
    // AFTER the success handler, racing with it. If we allow ondismiss to run
    // after the handler, it would mark a successfully paid booking as FAILED.
    //
    // Fix: Set handlerFired = true the instant the success handler is entered.
    // ondismiss checks this flag and silently returns if already true.
    // ─────────────────────────────────────────────────────────────────────────
    let handlerFired = false;

    // Guard against Razorpay script being blocked (ad-blockers, slow CDN load).
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      callbacks?.onError?.(
        'Payment gateway script failed to load. Please disable any ad-blockers and refresh the page.'
      );
      return;
    }

    const options: any = {
      key: orderRes.keyId,
      amount: orderRes.amount,
      currency: orderRes.currency,
      name: 'DriveSuccess Academy',
      description: `Payment for ${orderRes.packageName}`,
      order_id: orderRes.orderId,
      prefill: {
        name: orderRes.studentName,
        email: orderRes.studentEmail,
        contact: orderRes.studentPhone,
      },
      theme: { color: '#2563EB' },

      // ───────────────────────────────────────────────────────────────────────
      // SUCCESS HANDLER
      //
      // Called by the Razorpay SDK only after the user completes the payment
      // step inside the Razorpay modal (card details submitted, OTP verified).
      //
      // Production flow enforced here:
      //  1. handlerFired = true  → blocks any spurious ondismiss from overriding.
      //  2. onVerifying()        → wizard shows "Verifying Payment…" spinner.
      //                           The user sees a waiting screen, NOT success.
      //  3. Backend HMAC SHA256 signature verification (cryptographic check).
      //  4. Backend updates booking: status → CONFIRMED, paymentStatus → PAID.
      //  5. ONLY if backend returns { success: true } → onSuccess() is called.
      //  6. Wizard transitions to PAID → "Payment Successful!" appears.
      //  7. 2-second delay → navigate to /booking/[id]/confirmation.
      //
      // "Payment Successful!" can ONLY appear after steps 3 & 4 succeed.
      // ───────────────────────────────────────────────────────────────────────
      handler: async function (response: any) {
        // Block any spurious ondismiss race immediately.
        handlerFired = true;

        // Show VERIFYING state — the user sees a spinner while we check with
        // the backend. They do NOT see success yet.
        callbacks?.onVerifying?.();

        const verifyRes = await verifyPaymentSignatureAction({
          bookingId,
          razorpayOrderId:   response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });

        if (!verifyRes.success) {
          callbacks?.onError?.(
            verifyRes.error ||
              'Payment signature verification failed. Your card has NOT been charged. Please contact support.'
          );
          return;
        }

        // ✅ Backend has cryptographically verified the payment and confirmed
        // the booking. ONLY NOW is it safe to show "Payment Successful".
        callbacks?.onSuccess?.('Payment verified & Booking status set to CONFIRMED!');

        // 2-second window for the user to see the success screen, then navigate.
        setTimeout(() => {
          router.push(`/booking/${bookingId}/confirmation`);
        }, 2000);
      },

      modal: {
        // ───────────────────────────────────────────────────────────────────
        // DISMISS HANDLER
        // Only mark as FAILED when the user genuinely closed without paying.
        // If handlerFired is true, the success handler already ran — ignore.
        // ───────────────────────────────────────────────────────────────────
        ondismiss: async function () {
          if (handlerFired) {
            console.info(
              '[Razorpay] ondismiss fired after successful payment handler — ignoring (SDK quirk).'
            );
            return;
          }
          console.warn('[Razorpay] Modal dismissed by user without completing payment.');
          await markPaymentFailedAction(
            bookingId,
            'User closed the Razorpay checkout modal without completing payment.'
          );
          callbacks?.onDismiss?.();
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);

    // ─────────────────────────────────────────────────────────────────────────
    // PAYMENT FAILED EVENT
    // Fires when a payment attempt is rejected by the bank before the modal
    // closes. handlerFired remains false — this is not a success.
    // ─────────────────────────────────────────────────────────────────────────
    rzp.on('payment.failed', async function (response: any) {
      console.error('[Razorpay] payment.failed event:', response.error);
      await markPaymentFailedAction(
        bookingId,
        response.error?.description || 'Payment declined by bank.'
      );
      callbacks?.onPaymentFailed?.(
        response.error?.description || 'Transaction declined by your bank. Please try another card.'
      );
    });

    rzp.open();
  };

  return { launchRazorpayCheckout };
}
