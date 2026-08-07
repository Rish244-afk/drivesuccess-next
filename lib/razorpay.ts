import Razorpay from 'razorpay';
import crypto from 'crypto';

// Strict Environment Variables - NO HARDCODED SECRETS IN SOURCE CODE
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables are missing!');
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID || 'missing_key_id',
  key_secret: RAZORPAY_KEY_SECRET || 'missing_key_secret',
});

export { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET };

/**
 * Verify Razorpay Signature (HMAC SHA256) for Checkout Callback
 * Strict Backend Verification - NO Hardcoded Fallbacks
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
    if (!RAZORPAY_KEY_SECRET || !orderId || !paymentId || !signature) {
      return false;
    }

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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || !rawBody || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('verifyWebhookSignature Error:', error);
    return false;
  }
}
