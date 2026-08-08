export interface SmsProvider {
  sendOtp(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; error?: string }>;
}
