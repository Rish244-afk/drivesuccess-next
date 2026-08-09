import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { put } from '@vercel/blob';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB ceiling

const ALLOWED_DOCUMENT_TYPES = new Set([
  'government_id',
  'rto_form_20',
  'learner_license',
  'medical_certificate',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/**
 * Verify binary file signature (magic bytes) against expected MIME type.
 * Protects against disguised script/HTML/SVG uploads.
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === 'application/pdf') {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d
    );
  }

  if (mimeType === 'image/webp') {
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    let session = null;
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      const { validateSessionToken } = await import('@/lib/auth');
      session = await validateSessionToken(token);
    } else {
      session = await getServerSession();
    }

    if (!session || !session.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or document type' }, { status: 400 });
    }

    // 1. Strict Document Type Whitelist
    if (!ALLOWED_DOCUMENT_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 });
    }

    // 2. Strict Server-Side File Size Ceiling (Before Buffer Allocation)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit of 5MB.' },
        { status: 400 }
      );
    }

    // 3. Strict MIME Type Whitelist
    const mimeType = (file.type || '').toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WEBP, and PDF documents are permitted.' },
        { status: 400 }
      );
    }

    // 4. Binary Magic-Byte Inspection
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!verifyMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: 'File content does not match the stated file format.' },
        { status: 400 }
      );
    }

    // 5. Store File in Private Vercel Blob Storage
    const extension = MIME_TO_EXTENSION[mimeType] || 'bin';
    const pathname = `documents/${session.sub}/${type}-${Date.now()}.${extension}`;

    const blob = await put(pathname, buffer, {
      access: 'private',
      contentType: mimeType,
    });

    const fileUrl = blob.url;

    // 6. Save or update document record in the database
    const existingDoc = await prisma.studentDocument.findFirst({
      where: { studentId: session.sub, type },
    });

    if (existingDoc) {
      await prisma.studentDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl,
          status: 'submitted',
          uploadedAt: new Date(),
        },
      });
    } else {
      await prisma.studentDocument.create({
        data: {
          studentId: session.sub,
          type,
          fileUrl,
          status: 'submitted',
          uploadedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
