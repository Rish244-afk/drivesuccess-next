/**
 * Resend Email Service (Native Fetch Implementation)
 */

interface BookingEmailParams {
  studentEmail: string;
  studentName: string;
  bookingId: string;
  packageName: string;
  totalAmount: number;
  razorpayPaymentId?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vahathi Motor Driving School <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });
      return { success: response.ok };
    }
    console.log(`[SIMULATION] Email dispatched to ${to}: ${subject}`);
    return { success: true, simulated: true };
  } catch (error) {
    console.error('sendEmail Error:', error);
    return { success: false, error: 'Email dispatch failed.' };
  }
}

export async function sendBookingConfirmationEmail({
  studentEmail,
  studentName,
  bookingId,
  packageName,
  totalAmount,
  razorpayPaymentId,
}: BookingEmailParams) {
  try {
    const subject = `🚗 Booking Confirmed! Vahathi Motor Driving School - #${bookingId.slice(-8)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1e293b; }
            .logo { font-size: 24px; font-weight: 800; color: #ffb800; text-decoration: none; }
            .badge { background-color: rgba(255, 184, 0, 0.1); border: 1px solid rgba(255, 184, 0, 0.3); color: #ffb800; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; }
            .details { margin: 24px 0; background-color: #020617; border-radius: 12px; padding: 20px; border: 1px solid #1e293b; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .label { color: #94a3b8; }
            .value { font-weight: 700; color: #f8fafc; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <a href="https://drivesuccess.edu" class="logo">Vahathi Motor Driving School</a>
              <h2 style="color: #f8fafc; margin-top: 16px;">Booking Confirmation</h2>
              <span class="badge">Payment Received</span>
            </div>

            <p style="margin-top: 24px; font-size: 15px;">Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px;">Your payment of <strong>₹${totalAmount.toLocaleString()}</strong> for <strong>${packageName}</strong> was verified successfully. Your practical driving sessions are now confirmed!</p>

            <div class="details">
              <div class="row">
                <span class="label">Booking ID:</span>
                <span class="value">${bookingId}</span>
              </div>
              <div class="row">
                <span class="label">Package:</span>
                <span class="value">${packageName}</span>
              </div>
              <div class="row">
                <span class="label">Amount Paid:</span>
                <span class="value" style="color: #ffb800;">₹${totalAmount.toLocaleString()}</span>
              </div>
              ${
                razorpayPaymentId
                  ? `<div class="row"><span class="label">Payment ID:</span><span class="value">${razorpayPaymentId}</span></div>`
                  : ''
              }
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://drivesuccess.edu'}/booking/${bookingId}/confirmation" style="display: inline-block; background-color: #ffb800; color: #020617; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">View & Download PDF Receipt</a>
            </div>

            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">You can view your session schedules, instructor info, and RTO documents on your student dashboard anytime.</p>

            <div class="footer">
              © 2026 Vahathi Motor Driving School. All rights reserved.<br/>
              Support: support@drivesuccess.edu | +91 7829780778
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail({
      to: studentEmail,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('sendBookingConfirmationEmail Error:', error);
    return { success: false, error: 'Email dispatch failed.' };
  }
}

export async function sendBookingCancellationEmail({
  studentEmail,
  studentName,
  bookingId,
  packageName,
  isPaid,
}: {
  studentEmail: string;
  studentName: string;
  bookingId: string;
  packageName: string;
  isPaid: boolean;
}) {
  try {
    const subject = `⚠️ Booking Cancelled - Vahathi Motor Driving School #${bookingId.slice(-8)}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px;">
            <h2 style="color: #ef4444; text-align: center;">Booking Cancellation Notice</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8;">Your booking for <strong>${packageName}</strong> (ID: #${bookingId.slice(-8)}) has been cancelled.</p>
            <div style="margin: 20px 0; background-color: #020617; border-radius: 12px; padding: 16px; border: 1px solid #1e293b; text-align: center; color: #cbd5e1;">
              ${
                isPaid
                  ? '<strong>Payment Status:</strong> Paid. Your refund request has been submitted for admin review in accordance with our 24-hour cancellation policy.'
                  : '<strong>Payment Status:</strong> Unpaid. Held slot released.'
              }
            </div>
            <p style="font-size: 13px; color: #94a3b8; text-align: center;">If you have any questions, contact support at support@drivesuccess.edu or +91 7829780778.</p>
          </div>
        </body>
      </html>
    `;
    return await sendEmail({ to: studentEmail, subject, html: htmlContent });
  } catch (error) {
    console.error('sendBookingCancellationEmail Error:', error);
    return { success: false, error: 'Email failed' };
  }
}

export async function sendSessionRescheduledEmail({
  studentEmail,
  studentName,
  bookingId,
  packageName,
  newScheduledAt,
  instructorName,
}: {
  studentEmail: string;
  studentName: string;
  bookingId: string;
  packageName: string;
  newScheduledAt: string;
  instructorName: string;
}) {
  try {
    const subject = `📅 Session Rescheduled - Vahathi Motor Driving School`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px;">
            <h2 style="color: #3b82f6; text-align: center;">Session Rescheduled</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8;">Your training session for <strong>${packageName}</strong> has been successfully rescheduled.</p>
            <div style="margin: 20px 0; background-color: #020617; border-radius: 12px; padding: 16px; border: 1px solid #1e293b;">
              <p style="margin: 4px 0;"><strong>New Time:</strong> ${newScheduledAt}</p>
              <p style="margin: 4px 0;"><strong>Instructor:</strong> ${instructorName}</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://drivesuccess.edu'}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Student Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;
    return await sendEmail({ to: studentEmail, subject, html: htmlContent });
  } catch (error) {
    console.error('sendSessionRescheduledEmail Error:', error);
    return { success: false, error: 'Email failed' };
  }
}

export async function sendRefundProcessedEmail({
  studentEmail,
  studentName,
  bookingId,
  packageName,
  amount,
  refundId,
}: {
  studentEmail: string;
  studentName: string;
  bookingId: string;
  packageName: string;
  amount: number;
  refundId?: string;
}) {
  try {
    const subject = `💸 Refund Processed - Vahathi Motor Driving School`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px;">
            <h2 style="color: #10b981; text-align: center;">Refund Processed</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8;">A refund of <strong>₹${amount.toLocaleString()}</strong> for <strong>${packageName}</strong> (Booking #${bookingId.slice(-8)}) has been issued to your original payment method.</p>
            ${refundId ? `<p style="font-size: 12px; color: #64748b;">Razorpay Refund ID: ${refundId}</p>` : ''}
            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">Refunds typically reflect in your account within 5-7 business days depending on your bank.</p>
          </div>
        </body>
      </html>
    `;
    return await sendEmail({ to: studentEmail, subject, html: htmlContent });
  } catch (error) {
    console.error('sendRefundProcessedEmail Error:', error);
    return { success: false, error: 'Email failed' };
  }
}

export async function sendPaymentFailedEmail({
  studentEmail,
  studentName,
  bookingId,
  packageName,
}: {
  studentEmail: string;
  studentName: string;
  bookingId: string;
  packageName: string;
}) {
  try {
    const subject = `⚠️ Payment Attempt Unsuccessful - Vahathi Motor Driving School`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px;">
            <h2 style="color: #f59e0b; text-align: center;">Payment Attempt Failed</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8;">Your payment attempt for <strong>${packageName}</strong> could not be completed.</p>
            <p style="color: #94a3b8;">You can retry payment on your student dashboard within the 15-minute reservation window to secure your slot.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://drivesuccess.edu'}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Retry Payment on Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;
    return await sendEmail({ to: studentEmail, subject, html: htmlContent });
  } catch (error) {
    console.error('sendPaymentFailedEmail Error:', error);
    return { success: false, error: 'Email failed' };
  }
}

export async function sendBookingExpiredEmail({
  studentEmail,
  studentName,
  packageName,
}: {
  studentEmail: string;
  studentName: string;
  packageName: string;
}) {
  try {
    const subject = `⌛ Pending Reservation Expired - Vahathi Motor Driving School`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px;">
            <h2 style="color: #64748b; text-align: center;">Reservation Expired</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8;">Your 15-minute checkout window for <strong>${packageName}</strong> elapsed without payment. The reserved slot has been released.</p>
            <p style="color: #94a3b8;">You may start a new booking anytime to select a new slot.</p>
          </div>
        </body>
      </html>
    `;
    return await sendEmail({ to: studentEmail, subject, html: htmlContent });
  } catch (error) {
    console.error('sendBookingExpiredEmail Error:', error);
    return { success: false, error: 'Email failed' };
  }
}

export async function sendSessionReminderEmail({
  studentEmail,
  studentName,
  scheduledAt,
  instructorName,
  vehicleName,
}: {
  studentEmail: string;
  studentName: string;
  scheduledAt: string;
  instructorName: string;
  vehicleName: string;
}) {
  try {
    const subject = `🚗 Upcoming Session Reminder - Tomorrow at ${scheduledAt}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b192c; color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px;">
            <h2 style="color: #3b82f6; text-align: center;">Upcoming Driving Session</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p style="color: #94a3b8;">This is a reminder that your driving session is scheduled for tomorrow!</p>
            <div style="margin: 20px 0; background-color: #020617; border-radius: 12px; padding: 16px; border: 1px solid #1e293b;">
              <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${scheduledAt}</p>
              <p style="margin: 4px 0;"><strong>Instructor:</strong> ${instructorName}</p>
              <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
            </div>
            <p style="font-size: 13px; color: #94a3b8; text-align: center;">Please arrive 10 minutes prior to your start time. Drive safe!</p>
          </div>
        </body>
      </html>
    `;
    return await sendEmail({ to: studentEmail, subject, html: htmlContent });
  } catch (error) {
    console.error('sendSessionReminderEmail Error:', error);
    return { success: false, error: 'Email failed' };
  }
}
