/**
 * Normalizes Indian mobile phone numbers into canonical E.164 format: +91XXXXXXXXXX
 * Rejects invalid length, non-Indian mobile prefixes, and non-digit characters.
 */
export function normalizePhoneNumber(rawPhone: string): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const digits = rawPhone.replace(/\D/g, '');

  let national = '';
  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else {
    return null;
  }

  // Must be a valid 10-digit Indian mobile starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(national)) {
    return null;
  }

  return `+91${national}`;
}
