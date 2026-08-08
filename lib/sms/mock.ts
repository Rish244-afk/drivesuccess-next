import { SmsProvider } from './types';

export class MockSmsProvider implements SmsProvider {
  async sendOtp(phone: string, _otp: string): Promise<{ success: boolean; error?: string }> {
    // Mask phone number for logging and never log the plaintext OTP value
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const maskedPhone = cleanPhone.replace(/(\+\d{2}\d{4})\d{4}(\d{2})/, '$1****$2');
    console.log(`[MOCK SMS GATEWAY] Mock OTP delivery simulated for ${maskedPhone}.`);
    return { success: true };
  }
}
