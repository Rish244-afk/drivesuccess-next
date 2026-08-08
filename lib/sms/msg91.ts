import { SmsProvider } from './types';

export class Msg91SmsProvider implements SmsProvider {
  private authKey: string;
  private templateId: string;

  constructor(authKey?: string, templateId?: string) {
    this.authKey = authKey || process.env.MSG91_AUTH_KEY || '';
    this.templateId = templateId || process.env.MSG91_TEMPLATE_ID || '';
  }

  async sendOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    if (!this.authKey || !this.templateId) {
      console.error('[SMS GATEWAY ERROR] MSG91 credentials (MSG91_AUTH_KEY / MSG91_TEMPLATE_ID) are not configured.');
      return { success: false, error: 'SMS gateway is not configured.' };
    }

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
        body: JSON.stringify({
          template_id: this.templateId,
          mobile: cleanPhone,
          otp: otp,
        }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.type === 'success') {
        return { success: true };
      }

      console.error('[SMS GATEWAY ERROR] MSG91 dispatch failed:', data?.message || response.statusText);
      return { success: false, error: 'SMS delivery failed.' };
    } catch (err: any) {
      console.error('[SMS GATEWAY ERROR] Network error connecting to MSG91:', err?.message || err);
      return { success: false, error: 'Network error connecting to SMS provider.' };
    }
  }
}
