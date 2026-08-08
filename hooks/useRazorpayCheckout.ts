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
    // ROOT CAUSE OF PREVIOUS BUG (now fixed):
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

    // ─────────────────────────────────────────────────────────────────────────
    // SAFETY-NET TIMEOUT (30 seconds)
    //
    // If the Razorpay SDK hangs, the popup is blocked by the browser, or none
    // of the SDK callbacks (handler / ondismiss / payment.failed) fire within
    // 30 seconds of the modal opening, we fire onDismiss as a fallback.
    //
    // This prevents the UI from being stuck on "Complete Payment" forever when
    // the SDK silently fails to initialise or the popup window is blocked.
    //
    // The timer is cleared the moment ANY callback fires (success, dismiss, or
    // payment.failed), so it only activates in genuine "stuck" scenarios.
    // ─────────────────────────────────────────────────────────────────────────
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const clearSafetyTimer = () => {
      if (safetyTimer !== null) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    };

    const fireSafetyFallback = () => {
      if (handlerFired) return; // success handler already ran — no-op
      console.warn(
        '[Razorpay] Safety-net timeout fired — no SDK callback received within 30 s. ' +
        'Possible causes: popup blocked, ad-blocker, slow network, SDK hang.'
      );
      handlerFired = true; // prevent any late-firing ondismiss from double-calling
      callbacks?.onDismiss?.();
    };

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
      name: 'Vahathi Motor Driving School',
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
      //  2. clearSafetyTimer()   → cancel the 30 s safety-net — not needed now.
      //  3. onVerifying()        → wizard shows "Verifying Payment…" spinner.
      //                           The user sees a waiting screen, NOT success.
      //  4. Backend HMAC SHA256 signature verification (cryptographic check).
      //  5. Backend updates booking: status → CONFIRMED, paymentStatus → PAID.
      //  6. ONLY if backend returns { success: true } → onSuccess() is called.
      //  7. Wizard transitions to PAID → "Payment Successful!" appears.
      //  8. 2-second delay → navigate to /booking/[id]/confirmation.
      //
      // "Payment Successful!" can ONLY appear after steps 4 & 5 succeed.
      // ───────────────────────────────────────────────────────────────────────
      handler: async function (response: any) {
        console.log(`[${new Date().toISOString()}] Razorpay callback received`);
        // Block any spurious ondismiss race immediately.
        handlerFired = true;

        // Disable the safety-net — the SDK has responded.
        clearSafetyTimer();

        // Show VERIFYING state — the user sees a spinner while we check with
        // the backend. They do NOT see success yet.
        console.log(`[${new Date().toISOString()}] onVerifying callback triggered`);
        callbacks?.onVerifying?.();

        console.log(`[${new Date().toISOString()}] Delaying backend verification by 800ms`);
        // Delay the backend call by 800ms to allow the Razorpay modal's close animation
        // to finish completely on mobile before the DOM is heavily updated by verification results.
        await new Promise((resolve) => setTimeout(resolve, 800));

        console.log(`[${new Date().toISOString()}] Starting backend verifyPaymentSignatureAction`);

        const verifyRes = await verifyPaymentSignatureAction({
          bookingId,
          razorpayOrderId:   response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });

        if (!verifyRes.success) {
          console.log(`[${new Date().toISOString()}] Verification failed`);
          callbacks?.onError?.(
            verifyRes.error ||
              'Payment signature verification failed. Your card has NOT been charged. Please contact support.'
          );
          return;
        }

        console.log(`[${new Date().toISOString()}] Backend verification SUCCESS`);

        // ✅ Backend has cryptographically verified the payment and confirmed
        // the booking. ONLY NOW is it safe to show "Payment Successful".
        console.log(`[${new Date().toISOString()}] Triggering onSuccess callback`);
        callbacks?.onSuccess?.('Payment verified & Booking status set to CONFIRMED!');

        // 2-second window for the user to see the success screen, then navigate.
        console.log(`[${new Date().toISOString()}] Starting 2-second timeout before router.push`);
        setTimeout(() => {
          console.log(`[${new Date().toISOString()}] Executing router.push to confirmation page`);
          router.push(`/booking/${bookingId}/confirmation`);
        }, 2000);
      },

      modal: {
        // ───────────────────────────────────────────────────────────────────
        // DISMISS HANDLER
        //
        // ROOT CAUSE FIX for Bug 1:
        //   Previously this was async with no try/catch. If markPaymentFailedAction
        //   threw (network error, auth expiry, server 500), the entire async function
        //   rejected, and callbacks?.onDismiss?.() was NEVER called. The wizard
        //   received no signal and stayed on "Complete Payment" forever.
        //
        // Fix: wrap in try/catch/finally. The finally block guarantees
        // callbacks?.onDismiss?.() fires even when the backend call fails.
        // The backend failure is non-blocking from the user's perspective —
        // the UI transitions to the failed state regardless, and the backend
        // will reconcile via Razorpay webhook if the dismiss wasn't recorded.
        // ───────────────────────────────────────────────────────────────────
        ondismiss: async function () {
          if (handlerFired) {
            console.info(
              '[Razorpay] ondismiss fired after successful payment handler — ignoring (SDK quirk).'
            );
            return;
          }

          // Disable the safety-net — the SDK has responded via ondismiss.
          clearSafetyTimer();
          handlerFired = true; // prevent safety timer double-fire

          console.warn('[Razorpay] Modal dismissed by user without completing payment.');

          try {
            await markPaymentFailedAction(
              bookingId,
              'User closed the Razorpay checkout modal without completing payment.'
            );
          } catch (err) {
            // Non-blocking: log the failure but do NOT let it prevent the UI
            // from transitioning. The booking remains in PENDING state in the DB
            // and will be reconciled by the Razorpay payment.failed webhook.
            console.error(
              '[Razorpay] markPaymentFailedAction threw during ondismiss — ' +
              'UI will still transition to FAILED state. DB reconciliation via webhook.',
              err
            );
          } finally {
            // ✅ GUARANTEED: this always runs, even if the try block throws.
            // The wizard receives the dismiss signal and transitions to FAILED.
            callbacks?.onDismiss?.();
          }
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);

    // ─────────────────────────────────────────────────────────────────────────
    // PAYMENT FAILED EVENT
    //
    // ROOT CAUSE FIX for Bug 1 (secondary path):
    //   Same pattern as ondismiss — the previous version awaited
    //   markPaymentFailedAction with no try/catch, so a backend failure would
    //   prevent callbacks?.onPaymentFailed?.() from firing.
    //
    // Fix: try/catch/finally with onPaymentFailed in the finally block.
    // ─────────────────────────────────────────────────────────────────────────
    rzp.on('payment.failed', async function (response: any) {
      // Disable the safety-net — the SDK has responded.
      clearSafetyTimer();
      handlerFired = true; // prevent safety timer double-fire

      const errorDescription =
        response.error?.description || 'Payment declined by bank.';

      console.error('[Razorpay] payment.failed event:', response.error);

      try {
        await markPaymentFailedAction(bookingId, errorDescription);
      } catch (err) {
        // Non-blocking: log but do not block UI transition.
        console.error(
          '[Razorpay] markPaymentFailedAction threw during payment.failed — ' +
          'UI will still transition to FAILED state. DB reconciliation via webhook.',
          err
        );
      } finally {
        // ✅ GUARANTEED: fires even when backend call throws.
        callbacks?.onPaymentFailed?.(
          response.error?.description ||
            'Transaction declined by your bank. Please try another card.'
        );
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // OPEN RAZORPAY MODAL
    //
    // Wrapped in try/catch to detect popup-blocked scenarios. If rzp.open()
    // throws synchronously (rare but possible with some browser security
    // policies), we fall back to onError immediately instead of relying on the
    // safety-net timer.
    //
    // The safety-net timer is armed HERE — after the modal is opened — so it
    // only starts counting if the modal actually launched but no callback fired.
    // ─────────────────────────────────────────────────────────────────────────
    try {
      rzp.open();

      // Arm safety-net AFTER open() succeeds (30 seconds).
      safetyTimer = setTimeout(fireSafetyFallback, 30_000);
    } catch (openErr) {
      console.error('[Razorpay] rzp.open() threw — popup may be blocked:', openErr);
      callbacks?.onError?.(
        'The payment popup was blocked by your browser. Please allow popups for this site and try again.'
      );
    }
  };

  return { launchRazorpayCheckout };
}
