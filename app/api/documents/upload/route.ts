import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
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

    // Upload to Vercel Blob
    const blob = await put(`documents/${session.sub}/${type}-${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // Save or update document record in the database
    const existingDoc = await prisma.studentDocument.findFirst({
      where: { studentId: session.sub, type },
    });

    if (existingDoc) {
      await prisma.studentDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl: blob.url,
          status: 'submitted',
          uploadedAt: new Date(),
        },
      });
    } else {
      await prisma.studentDocument.create({
        data: {
          studentId: session.sub,
          type,
          fileUrl: blob.url,
          status: 'submitted',
          uploadedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
