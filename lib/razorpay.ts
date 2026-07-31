import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance safely with real test key ID
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TKD8CsgNA9sbYW';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'DriveSuccessDemoSecretKey998822';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'DriveSuccessWebhookSecret778899';

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET };

/**
 * Verify Razorpay Signature (HMAC SHA256) for Checkout Callback
 * Strict Backend Verification - NO Frontend-Only Trust
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('verifyRazorpaySignature Error:', error);
    return false;
  }
}

/**
 * Verify Razorpay Webhook Signature (HMAC SHA256)
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('verifyWebhookSignature Error:', error);
    return false;
  }
}
