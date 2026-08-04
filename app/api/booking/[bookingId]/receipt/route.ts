import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    
    const margin = 50;
    let cursorY = height - margin;

    // Helper for writing text
    const drawText = (text: string, x: number, y: number, f = font, size = 12, color = rgb(0.1, 0.1, 0.1)) => {
      page.drawText(text, { x, y, size, font: f, color });
    };

    // Header
    drawText('DRIVESUCCESS ACADEMY', margin, cursorY, boldFont, 24, rgb(0.96, 0.62, 0.04)); // Amber color
    cursorY -= 30;
    drawText('Official Booking Receipt', margin, cursorY, boldFont, 16);
    cursorY -= 40;

    // Receipt details
    drawText(`Receipt Date: ${new Date().toLocaleDateString()}`, margin, cursorY, font, 10);
    drawText(`Booking ID: ${booking.id}`, width - margin - 250, cursorY, font, 10);
    cursorY -= 40;

    // Divider
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: width - margin, y: cursorY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    cursorY -= 30;

    // Student Info
    drawText('Student Information:', margin, cursorY, boldFont, 14);
    cursorY -= 25;
    drawText(`Name: ${booking.student.name}`, margin, cursorY);
    cursorY -= 20;
    drawText(`Phone: ${booking.student.phone}`, margin, cursorY);
    cursorY -= 40;

    // Package & Instructor Info
    drawText('Booking Details:', margin, cursorY, boldFont, 14);
    cursorY -= 25;
    drawText(`Package: ${booking.package.name} (${booking.package.sessionsCount} Sessions)`, margin, cursorY);
    cursorY -= 20;
    drawText(`Instructor: ${booking.instructor?.name || 'Pending Assignment'}`, margin, cursorY);
    cursorY -= 20;
    drawText(`Vehicle: ${booking.vehicle?.name || 'Standard Vehicle'}`, margin, cursorY);
    cursorY -= 20;

    const firstSession = booking.sessions[0];
    const scheduledStr = firstSession 
      ? `${firstSession.scheduledAt.toLocaleDateString()} at ${firstSession.scheduledAt.toLocaleTimeString()}`
      : 'Pending Schedule';
    drawText(`First Session: ${scheduledStr}`, margin, cursorY);
    cursorY -= 40;

    // Payment Info
    drawText('Payment Summary:', margin, cursorY, boldFont, 14);
    cursorY -= 25;
    drawText(`Total Paid: INR ${booking.totalAmount.toLocaleString()}`, margin, cursorY, boldFont, 14, rgb(0.06, 0.72, 0.5)); // Emerald
    cursorY -= 20;
    drawText(`Status: ${booking.paymentStatus}`, margin, cursorY);
    cursorY -= 60;

    // Divider
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: width - margin, y: cursorY },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    cursorY -= 30;

    // Footer Note
    drawText('This is a computer-generated receipt.', margin, cursorY, font, 10, rgb(0.5, 0.5, 0.5));
    cursorY -= 15;
    drawText('For queries, contact support@drivesuccess.edu or +91 7829780778.', margin, cursorY, font, 10, rgb(0.5, 0.5, 0.5));

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt_${booking.id.slice(-8)}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
