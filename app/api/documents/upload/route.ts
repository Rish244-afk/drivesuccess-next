import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or document type' }, { status: 400 });
    }

    // Convert file to base64 Data URL or blob URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Save or update document record in the database
    const existingDoc = await prisma.studentDocument.findFirst({
      where: { studentId: session.sub, type },
    });

    if (existingDoc) {
      await prisma.studentDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl: dataUrl,
          status: 'submitted',
          uploadedAt: new Date(),
        },
      });
    } else {
      await prisma.studentDocument.create({
        data: {
          studentId: session.sub,
          type,
          fileUrl: dataUrl,
          status: 'submitted',
          uploadedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
