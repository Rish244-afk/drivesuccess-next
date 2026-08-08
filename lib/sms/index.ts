import crypto from 'crypto';
import { SmsProvider } from './types';
import { Msg91SmsProvider } from './msg91';
import { MockSmsProvider } from './mock';

export * from './types';
export * from './msg91';
export * from './mock';

/**
 * Generate cryptographically secure 6-digit OTP using CSPRNG
 */
export function generateOtp(): string {
  return Math.floor(100000 + crypto.randomInt(900000)).toString();
}

/**
 * Provider Factory: Returns the configured SmsProvider instance
 */
export function getSmsProvider(): SmsProvider {
  // Explicit mock setting for unit tests or local development without credentials
  if (process.env.ALLOW_MOCK_SMS === 'true' || (process.env.NODE_ENV === 'test' && !process.env.MSG91_AUTH_KEY)) {
    return new MockSmsProvider();
  }

  return new Msg91SmsProvider();
}
