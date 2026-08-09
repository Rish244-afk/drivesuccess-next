import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getAdminSession } from '@/actions/admin';
import { Role } from '@prisma/client';
import { get } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
    }

    // 1. Authenticate Requester (Student session or Admin session)
    let studentSession = null;
    const studentCookie = request.cookies.get('auth_token')?.value;
    if (studentCookie) {
      const { validateSessionToken } = await import('@/lib/auth');
      studentSession = await validateSessionToken(studentCookie);
    } else {
      studentSession = await getServerSession();
    }

    let adminSession = null;
    const adminCookie = request.cookies.get('admin_auth_token')?.value;
    if (adminCookie) {
      const { verifySessionToken } = await import('@/lib/auth');
      const verified = await verifySessionToken(adminCookie);
      if (verified && verified.role === Role.ADMIN) {
        adminSession = verified;
      }
    } else {
      adminSession = await getAdminSession();
    }

    const activeSession = studentSession || adminSession;
    if (!activeSession || !activeSession.sub) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 2. Fetch StudentDocument from Database
    const document = await prisma.studentDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || !document.fileUrl) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // 3. Authorize Access
    const isOwner = activeSession.sub === document.studentId;
    const isAdmin =
      activeSession.role === Role.ADMIN ||
      adminSession?.role === Role.ADMIN ||
      studentSession?.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to access this document.' },
        { status: 403 }
      );
    }

    // 4. Handle Legacy Base64 Data URLs (Read-Only Compatibility)
    if (document.fileUrl.startsWith('data:')) {
      const match = document.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': 'inline',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          },
        });
      }
    }

    // 5. Retrieve & Stream Private Vercel Blob File
    const blobResult = await get(document.fileUrl, { access: 'private' });

    if (!blobResult || blobResult.statusCode !== 200) {
      return NextResponse.json(
        { error: 'Document file not found in storage.' },
        { status: 404 }
      );
    }

    return new NextResponse(blobResult.stream, {
      status: 200,
      headers: {
        'Content-Type': blobResult.blob.contentType || 'application/octet-stream',
        'Content-Disposition': blobResult.blob.contentDisposition || 'inline',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
