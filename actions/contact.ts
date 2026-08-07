'use server';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createNotificationHelper } from '@/lib/notification';
import { checkRateLimit } from '@/lib/rateLimit';
import { Role, NotificationType } from '@prisma/client';
import { headers } from 'next/headers';
import { z } from 'zod';

const contactInquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100, 'Name must not exceed 100 characters.'),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 digits.').max(20, 'Phone number must not exceed 20 characters.'),
  email: z.string().trim().email('Invalid email address format.').max(100, 'Email must not exceed 100 characters.'),
  inquiry: z.string().trim().min(5, 'Inquiry must be at least 5 characters.').max(1000, 'Inquiry must not exceed 1000 characters.'),
  website: z.string().optional(),
});

function getClientIp(): string {
  try {
    const headerList = headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Header access fallback
  }
  return '127.0.0.1';
}

export async function submitContactInquiryAction(formData: {
  name: string;
  phone: string;
  email: string;
  inquiry: string;
  website?: string;
}) {
  try {
    // 1. Read input & Extract Client IP
    const clientIp = getClientIp();

    // 2. Honeypot check (Invisible bot trap)
    if (formData.website && formData.website.trim().length > 0) {
      // Silent success for automated spam bots (0 DB / 0 Email side effects)
      return {
        success: true,
        message: 'Inquiry submitted successfully! Our team will contact you within 2 hours.',
      };
    }

    // 3. Zod Input Schema & Length Validation
    const parsed = contactInquirySchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid input parameters.';
      return { success: false, error: firstError };
    }

    const { name, phone, email, inquiry } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // 4. Server-Side Rate Limiting (IP & Email Dual Bucket)
    const ipCheck = checkRateLimit(`contact_ip_${clientIp}`, { limit: 3, windowMs: 15 * 60 * 1000 });
    const emailCheck = checkRateLimit(`contact_email_${normalizedEmail}`, { limit: 3, windowMs: 15 * 60 * 1000 });

    if (!ipCheck.allowed || !emailCheck.allowed) {
      return {
        success: false,
        error: 'Too many contact inquiries. Please try again in 15 minutes.',
      };
    }

    // 5. Find Admin user in DB
    const adminUser = await prisma.student.findFirst({
      where: { role: Role.ADMIN },
    });

    if (adminUser) {
      await createNotificationHelper({
        studentId: adminUser.id,
        title: `📩 New Contact Inquiry from ${name}`,
        message: `Phone: ${phone} | Email: ${email}\nInquiry: ${inquiry}`,
        type: NotificationType.SYSTEM_ALERT,
        metadata: {
          name,
          phone,
          email,
          inquiry,
          submittedAt: new Date().toISOString(),
        },
      });
    }

    // 6. Dispatch Email Notification to Admin Support
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'support@drivesuccess.edu';
      await sendEmail({
        to: adminEmail,
        subject: `[Vahathi DriveSuccess] New Inquiry from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0b0f19; color: #f8fafc; border-radius: 10px;">
            <h2 style="color: #fbbf24;">New Customer Inquiry Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> <a href="tel:${phone}" style="color: #fbbf24;">${phone}</a></p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #fbbf24;">${email}</a></p>
            <hr style="border-color: #334155;" />
            <p><strong>Message / Inquiry:</strong></p>
            <blockquote style="background-color: #1e293b; padding: 15px; border-left: 4px solid #fbbf24; border-radius: 5px; color: #e2e8f0;">
              ${inquiry.replace(/\n/g, '<br />')}
            </blockquote>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
              Submitted via Vahathi Motor Driving School Contact Form.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('submitContactInquiryAction Email Error:', emailError);
    }

    return {
      success: true,
      message: 'Inquiry submitted successfully! Our team will contact you within 2 hours.',
    };
  } catch (error) {
    console.error('submitContactInquiryAction Error:', error);
    return {
      success: false,
      error: 'Failed to record inquiry. Please try again.',
    };
  }
}
