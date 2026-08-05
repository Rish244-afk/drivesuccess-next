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
    // Reset UI state before starting.
    callbacks?.onLoading?.(true);
    callbacks?.onError?.('');
    callbacks?.onSuccess?.('');

    // Step 1 — Create a Razorpay order on the backend.
    const orderRes = await createRazorpayOrderAction(bookingId);
    callbacks?.onLoading?.(false);

    if (!orderRes.success) {
      callbacks?.onError?.(orderRes.error || 'Failed to initialize payment gateway.');
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RACE CONDITION FIX: `handlerFired` guard flag.
    //
    // Razorpay's ondismiss callback is triggered in two distinct situations:
    //   (a) The user intentionally closes the modal without paying — we should
    //       mark the booking as FAILED so the student can retry.
    //   (b) On certain mobile browsers / Razorpay SDK versions, ondismiss also
    //       fires AFTER a successful payment, racing with the success handler.
    //       In this case we must NOT mark the booking FAILED.
    //
    // Fix: `handlerFired` is set to true the moment the success handler is
    // entered. The ondismiss callback checks this flag before taking any action.
    // ─────────────────────────────────────────────────────────────────────────
    let handlerFired = false;

    // Guard against the script not being present (ad-blockers, slow CDN).
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
      theme: { color: '#F59E0B' },

      // ─────────────────────────────────────────────────────────────────────
      // SUCCESS HANDLER — called by Razorpay only after user completes payment.
      //
      // Correct flow enforced here:
      //  1. handlerFired = true  → prevents ondismiss from interfering.
      //  2. onLoading(true)      → spinner stays visible during verification.
      //  3. Backend verifies HMAC SHA256 signature cryptographically.
      //  4. Backend updates booking → status: CONFIRMED, paymentStatus: PAID.
      //  5. onLoading(false)     → spinner off.
      //  6. ONLY after backend success → onSuccess() → "Payment Successful" UI.
      //  7. 2-second display window → navigate to Booking Confirmed page.
      // ─────────────────────────────────────────────────────────────────────
      handler: async function (response: any) {
        // Prevent ondismiss race condition.
        handlerFired = true;

        // Keep the loading spinner visible for the entire verification round-trip.
        // The user will NOT see "Payment Successful" until this await resolves.
        callbacks?.onLoading?.(true);

        const verifyRes = await verifyPaymentSignatureAction({
          bookingId,
          razorpayOrderId:   response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });

        callbacks?.onLoading?.(false);

        if (!verifyRes.success) {
          // Backend rejected the signature or encountered a server error.
          // Do NOT show "Payment Successful" — surface the error clearly.
          callbacks?.onError?.(
            verifyRes.error ||
              'Payment signature verification failed. Your card has NOT been charged. Please contact support.'
          );
          return;
        }

        // ✅ Backend has verified and confirmed. NOW it is safe to show success.
        callbacks?.onSuccess?.('Payment verified & Booking status set to CONFIRMED!');

        // Give the user 2 seconds to see the "Payment Successful" screen, then
        // navigate to the fully-confirmed Booking page.
        setTimeout(() => {
          router.push(`/booking/${bookingId}/confirmation`);
        }, 2000);
      },

      modal: {
        // ─────────────────────────────────────────────────────────────────
        // DISMISS HANDLER
        //
        // Only mark the booking FAILED when the user genuinely closed the modal
        // without completing payment. If handlerFired is already true, the
        // success handler ran first — this dismiss is a Razorpay SDK quirk and
        // must be silently ignored.
        // ─────────────────────────────────────────────────────────────────
        ondismiss: async function () {
          if (handlerFired) {
            // Success handler already completed — this dismiss is a spurious
            // Razorpay event on some devices. Do not override PAID status.
            console.info(
              '[Razorpay] ondismiss fired after successful payment handler — ignoring.'
            );
            return;
          }

          // Genuine dismissal: user closed without paying.
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
    // Fires when a payment attempt is rejected by the bank/gateway before the
    // user even closes the modal. handlerFired remains false here.
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
