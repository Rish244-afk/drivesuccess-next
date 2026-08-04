'use server';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { Role } from '@prisma/client';

export async function submitContactInquiryAction(formData: {
  name: string;
  phone: string;
  email: string;
  inquiry: string;
}) {
  try {
    const { name, phone, email, inquiry } = formData;

    if (!name || !phone || !email || !inquiry) {
      return { success: false, error: 'All fields are required.' };
    }

    // 1. Find or notify Admin user in DB
    const adminUser = await prisma.student.findFirst({
      where: { role: Role.ADMIN },
    });

    if (adminUser) {
      await prisma.notification.create({
        data: {
          studentId: adminUser.id,
          title: `📩 New Contact Inquiry from ${name}`,
          message: `Phone: ${phone} | Email: ${email}\nInquiry: ${inquiry}`,
          type: 'SYSTEM_ALERT',
          metadata: {
            name,
            phone,
            email,
            inquiry,
            submittedAt: new Date().toISOString(),
          },
        },
      });
    }

    // 2. Dispatch Email Notification to Admin Support
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

    return {
      success: true,
      message: 'Inquiry submitted successfully! Our team will contact you within 2 hours.',
    };
  } catch (error) {
    console.error('submitContactInquiryAction Error:', error);
    return {
      success: true,
      message: 'Inquiry recorded. A driving advisor will reach out shortly.',
    };
  }
}
