import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        package: true,
        instructor: true,
        vehicle: true,
        student: true,
        sessions: {
          orderBy: { scheduledAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Row-level access check
    if (booking.studentId !== session.sub && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const firstSession = booking.sessions[0];
    const scheduledStr = firstSession
      ? `${new Date(firstSession.scheduledAt).toLocaleDateString()} at ${new Date(firstSession.scheduledAt).toLocaleTimeString()}`
      : 'Pending Schedule';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt #${booking.id.slice(-8)} | DriveSuccess Academy</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #060913; color: #f8fafc; margin: 0; padding: 40px; }
            .card { max-width: 650px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1e293b; }
            .logo { font-size: 26px; font-weight: 800; color: #fbbf24; text-decoration: none; }
            .badge { background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; display: inline-block; margin-top: 12px; }
            .details { margin: 28px 0; background-color: #020617; border-radius: 14px; padding: 24px; border: 1px solid #1e293b; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px border-slate-900; }
            .label { color: #94a3b8; }
            .value { font-weight: 700; color: #f8fafc; }
            .price { color: #fbbf24; font-size: 20px; font-weight: 800; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; line-height: 1.6; }
            .btn { display: inline-block; background-color: #fbbf24; color: #020617; font-weight: 800; padding: 12px 24px; border-radius: 12px; text-decoration: none; margin-top: 20px; cursor: pointer; border: none; }
            @media print {
              body { background-color: #fff; color: #000; padding: 0; }
              .card { border: none; shadow: none; color: #000; background: #fff; }
              .details { background: #f8fafc; border: 1px solid #e2e8f0; }
              .label { color: #64748b; }
              .value { color: #0f172a; }
              .btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <a href="https://drivesuccess-next.vercel.app" class="logo">Vahathi DriveSuccess Academy</a>
              <h2 style="color: #f8fafc; margin-top: 16px; font-size: 20px;">Official Training Booking Receipt</h2>
              <span class="badge">Payment Confirmed (${booking.paymentStatus})</span>
            </div>

            <div class="details">
              <div class="row">
                <span class="label">Receipt ID:</span>
                <span class="value">${booking.id}</span>
              </div>
              <div class="row">
                <span class="label">Student Name:</span>
                <span class="value">${booking.student.name}</span>
              </div>
              <div class="row">
                <span class="label">Student Phone:</span>
                <span class="value">${booking.student.phone || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Training Program:</span>
                <span class="value">${booking.package.name} (${booking.package.sessionsCount} Sessions)</span>
              </div>
              <div class="row">
                <span class="label">Assigned Instructor:</span>
                <span class="value">${booking.instructor?.name || 'Senior Driving Instructor'}</span>
              </div>
              <div class="row">
                <span class="label">Assigned Vehicle:</span>
                <span class="value">${booking.vehicle?.name || 'Dual-Control SUV'}</span>
              </div>
              <div class="row">
                <span class="label">First Scheduled Session:</span>
                <span class="value">${scheduledStr}</span>
              </div>
              <div class="row" style="margin-top: 10px; border-top: 1px solid #334155; padding-top: 14px;">
                <span class="label" style="font-size: 16px; font-weight: 700;">Total Paid:</span>
                <span class="price">₹${booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <button onclick="window.print()" class="btn">🖨️ Print / Save as PDF</button>
            </div>

            <div class="footer">
              This is an official computer-generated receipt for Vahathi Motor Driving School.<br/>
              Support: support@drivesuccess.edu | Helpline: +91 7829780778
            </div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
