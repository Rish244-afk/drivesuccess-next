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

export async function sendBookingConfirmationEmail({
  studentEmail,
  studentName,
  bookingId,
  packageName,
  totalAmount,
  razorpayPaymentId,
}: BookingEmailParams) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const subject = `🚗 Booking Confirmed! DriveSuccess Academy - #${bookingId.slice(-8)}`;

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
              <a href="https://drivesuccess.edu" class="logo">DriveSuccess Academy</a>
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

            <p style="font-size: 13px; color: #94a3b8; text-align: center;">You can view your session schedules, instructor info, and RTO documents on your student dashboard anytime.</p>

            <div class="footer">
              © 2026 DriveSuccess Academy. All rights reserved.<br/>
              Support: support@drivesuccess.edu | +1 (555) 019-2834
            </div>
          </div>
        </body>
      </html>
    `;

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DriveSuccess Academy <onboarding@resend.dev>',
          to: [studentEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('Resend API HTTP Error:', errText);
      } else {
        const resData = await response.json();
        console.log('✅ Resend Confirmation Email Sent:', resData);
      }
      return { success: true };
    } else {
      console.log(`[SIMULATION] Resend Confirmation Email dispatched to ${studentEmail} for Booking #${bookingId}`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('sendBookingConfirmationEmail Error:', error);
    return { success: false, error: 'Email dispatch failed.' };
  }
}
