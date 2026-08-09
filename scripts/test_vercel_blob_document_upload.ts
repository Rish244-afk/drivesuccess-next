import { POST as uploadDocumentHandler } from '../app/api/documents/upload/route';
import { GET as downloadDocumentHandler } from '../app/api/documents/download/route';
import { prisma } from '../lib/prisma';
import { signSessionToken } from '../lib/auth';
import { Role } from '@prisma/client';
import { NextRequest } from 'next/server';

const vercelBlob = require('@vercel/blob');

async function runVercelBlobStorageTests() {
  console.log('====================================================');
  console.log(' B-7: VERCEL BLOB PRIVATE DOCUMENT STORAGE TESTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, failureDetail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (failureDetail) console.error(`       Detail: ${failureDetail}`);
      process.exitCode = 1;
    }
  }

  // Spy & Mock Vercel Blob operations
  let lastPutOptions: any = null;
  let lastPutPathname: any = null;
  let lastGetOptions: any = null;
  let lastGetUrlOrPath: any = null;

  const originalPut = vercelBlob.put;
  const originalGet = vercelBlob.get;

  vercelBlob.put = async (pathname: string, body: any, options: any) => {
    lastPutPathname = pathname;
    lastPutOptions = options;
    return {
      url: `https://teststore.private.blob.vercel-storage.com/${pathname}`,
      pathname,
      contentType: options?.contentType || 'application/octet-stream',
      contentDisposition: 'inline',
    };
  };

  vercelBlob.get = async (urlOrPathname: string, options: any) => {
    lastGetUrlOrPath = urlOrPathname;
    lastGetOptions = options;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('MOCK_PRIVATE_BLOB_BINARY_STREAM_CONTENT'));
        controller.close();
      },
    });

    return {
      statusCode: 200,
      stream,
      blob: {
        url: urlOrPathname,
        contentType: 'image/jpeg',
        contentDisposition: 'inline',
        size: 38,
      },
    };
  };

  try {
    // -------------------------------------------------------------------------
    // Setup Test Students (Student A and Student B) & Admin
    // -------------------------------------------------------------------------
    const unique = Date.now().toString().slice(-6);

    const studentA = await prisma.student.create({
      data: {
        email: `blob_student_a_${unique}@example.com`,
        name: 'Student A Blob Tester',
        role: Role.STUDENT,
      },
    });

    const studentB = await prisma.student.create({
      data: {
        email: `blob_student_b_${unique}@example.com`,
        name: 'Student B Blob Tester',
        role: Role.STUDENT,
      },
    });

    const adminUser = await prisma.student.create({
      data: {
        email: `blob_admin_${unique}@example.com`,
        name: 'Admin Blob Reviewer',
        role: Role.ADMIN,
      },
    });

    const studentAToken = await signSessionToken({
      sub: studentA.id,
      email: studentA.email!,
      phone: '+919999999991',
      name: studentA.name,
      role: Role.STUDENT,
      ver: studentA.authVersion,
    });

    const studentBToken = await signSessionToken({
      sub: studentB.id,
      email: studentB.email!,
      phone: '+919999999992',
      name: studentB.name,
      role: Role.STUDENT,
      ver: studentB.authVersion,
    });

    const adminToken = await signSessionToken({
      sub: adminUser.id,
      email: adminUser.email!,
      phone: '+919999999993',
      name: adminUser.name,
      role: Role.ADMIN,
      ver: adminUser.authVersion,
    });

    // Helper to build NextRequest with Auth Cookie & FormData
    const makeUploadRequest = (
      token: string | null,
      file: File | null,
      type: string | null
    ): NextRequest => {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (type) formData.append('type', type);

      const headers: Record<string, string> = {};
      if (token) {
        headers['cookie'] = `auth_token=${token}`;
      }

      return new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        headers,
        body: formData,
      });
    };

    // JPEG test buffer with valid magic bytes FF D8 FF E0
    const validJpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    ]);

    // -------------------------------------------------------------------------
    // TEST 1, 2, 3, 4: Valid Upload -> Private Blob, Not Data URL, Not Base64 in DB
    // -------------------------------------------------------------------------
    const validFile = new File([validJpegBytes], 'gov_id.jpg', { type: 'image/jpeg' });
    const req1 = makeUploadRequest(studentAToken, validFile, 'government_id');

    const res1 = await uploadDocumentHandler(req1);
    const json1 = await res1.json();

    const storedDoc1 = await prisma.studentDocument.findFirst({
      where: { studentId: studentA.id, type: 'government_id' },
    });

    assert(
      res1.status === 200 && json1.success === true,
      'Test 1: Valid document upload succeeds with HTTP 200',
      `status: ${res1.status}, json: ${JSON.stringify(json1)}`
    );

    assert(
      storedDoc1 !== null && !storedDoc1.fileUrl?.startsWith('data:'),
      'Test 2: Stored fileUrl in PostgreSQL is NOT a data: URL',
      `stored fileUrl: ${storedDoc1?.fileUrl}`
    );

    assert(
      storedDoc1 !== null && !storedDoc1.fileUrl?.includes(';base64,'),
      'Test 3: Stored fileUrl does NOT contain Base64 encoded binary payload',
      `stored fileUrl: ${storedDoc1?.fileUrl}`
    );

    assert(
      lastPutOptions?.access === 'private' &&
        lastPutOptions?.contentType === 'image/jpeg' &&
        lastPutPathname?.startsWith(`documents/${studentA.id}/government_id-`),
      'Test 4: Vercel Blob put() was called with access: "private" and safe pathname',
      `access: ${lastPutOptions?.access}, pathname: ${lastPutPathname}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: File size > 5 MB rejected with 400
    // -------------------------------------------------------------------------
    const oversizedBlob = new Blob([new Uint8Array(5 * 1024 * 1024 + 100)], { type: 'image/jpeg' });
    const oversizedFile = new File([oversizedBlob], 'big.jpg', { type: 'image/jpeg' });
    const req5 = makeUploadRequest(studentAToken, oversizedFile, 'learner_license');
    const res5 = await uploadDocumentHandler(req5);

    assert(
      res5.status === 400,
      'Test 5: File size > 5 MB is strictly rejected with HTTP 400',
      `status: ${res5.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Invalid MIME type rejected with 400
    // -------------------------------------------------------------------------
    const textFile = new File(['plain text content'], 'doc.txt', { type: 'text/plain' });
    const req6 = makeUploadRequest(studentAToken, textFile, 'learner_license');
    const res6 = await uploadDocumentHandler(req6);

    assert(
      res6.status === 400,
      'Test 6: Disallowed MIME type (text/plain) is strictly rejected with HTTP 400',
      `status: ${res6.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Invalid Magic Bytes rejected with 400
    // -------------------------------------------------------------------------
    const fakeJpegFile = new File([new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])], 'fake.jpg', { type: 'image/jpeg' });
    const req7 = makeUploadRequest(studentAToken, fakeJpegFile, 'medical_certificate');
    const res7 = await uploadDocumentHandler(req7);

    assert(
      res7.status === 400,
      'Test 7: Mismatched / invalid binary magic bytes are rejected with HTTP 400',
      `status: ${res7.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Unauthenticated upload rejected with 401
    // -------------------------------------------------------------------------
    const req8 = makeUploadRequest(null, validFile, 'rto_form_20');
    const res8 = await uploadDocumentHandler(req8);

    assert(
      res8.status === 401,
      'Test 8: Unauthenticated upload request is rejected with HTTP 401',
      `status: ${res8.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Missing fields rejected with 400
    // -------------------------------------------------------------------------
    const req9 = makeUploadRequest(studentAToken, null, 'rto_form_20');
    const res9 = await uploadDocumentHandler(req9);

    assert(
      res9.status === 400,
      'Test 9: Upload missing required file is rejected with HTTP 400',
      `status: ${res9.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Owner Student Can Access/Download Own Document (HTTP 200 + Stream)
    // -------------------------------------------------------------------------
    const downloadUrl10 = `http://localhost:3000/api/documents/download?id=${storedDoc1?.id}`;
    const req10 = new NextRequest(downloadUrl10, {
      method: 'GET',
      headers: { cookie: `auth_token=${studentAToken}` },
    });

    const res10 = await downloadDocumentHandler(req10);

    assert(
      res10.status === 200 &&
        res10.headers.get('content-type') === 'image/jpeg' &&
        lastGetOptions?.access === 'private',
      'Test 10: Owner student can access/download own document (HTTP 200, streamed via get(..., { access: "private" }))',
      `status: ${res10.status}, headers: ${res10.headers.get('content-type')}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Other Student CANNOT Access Student A's Document (HTTP 403 Forbidden)
    // -------------------------------------------------------------------------
    const req11 = new NextRequest(downloadUrl10, {
      method: 'GET',
      headers: { cookie: `auth_token=${studentBToken}` },
    });

    const res11 = await downloadDocumentHandler(req11);

    assert(
      res11.status === 403,
      'Test 11: Different student (Student B) attempting to download Student A document is blocked with HTTP 403 Forbidden',
      `status: ${res11.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Admin CAN Access Student A's Document (HTTP 200)
    // -------------------------------------------------------------------------
    const req12 = new NextRequest(downloadUrl10, {
      method: 'GET',
      headers: { cookie: `admin_auth_token=${adminToken}` },
    });

    const res12 = await downloadDocumentHandler(req12);

    assert(
      res12.status === 200,
      'Test 12: Admin can access/download student document with HTTP 200',
      `status: ${res12.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 13: Unauthenticated Download Rejected with HTTP 401
    // -------------------------------------------------------------------------
    const req13 = new NextRequest(downloadUrl10, { method: 'GET' });
    const res13 = await downloadDocumentHandler(req13);

    assert(
      res13.status === 401,
      'Test 13: Unauthenticated download request is rejected with HTTP 401 Unauthorized',
      `status: ${res13.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 14: Non-Existent Document Returns HTTP 404
    // -------------------------------------------------------------------------
    const req14 = new NextRequest('http://localhost:3000/api/documents/download?id=non_existent_doc_id_99999', {
      method: 'GET',
      headers: { cookie: `admin_auth_token=${adminToken}` },
    });

    const res14 = await downloadDocumentHandler(req14);

    assert(
      res14.status === 404,
      'Test 14: Non-existent document ID returns HTTP 404 Not Found',
      `status: ${res14.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 15: Server-Side Retrieval vs Direct Client Redirect Verification
    // -------------------------------------------------------------------------
    // Ensure response is streaming binary body directly from Next.js server, not returning HTTP 302/307 redirect
    assert(
      res10.status === 200 && !res10.headers.get('location') && lastGetUrlOrPath === storedDoc1?.fileUrl,
      'Test 15: Server streams private Blob directly rather than issuing insecure client redirect to private URL',
      `status: ${res10.status}, location: ${res10.headers.get('location')}`
    );

    // -------------------------------------------------------------------------
    // TEST 16: Legacy Base64 Document Read-Only Compatibility
    // -------------------------------------------------------------------------
    const legacyBase64Payload = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const legacyDoc = await prisma.studentDocument.create({
      data: {
        studentId: studentA.id,
        type: 'medical_certificate',
        fileUrl: legacyBase64Payload,
        status: 'verified',
      },
    });

    const req16 = new NextRequest(`http://localhost:3000/api/documents/download?id=${legacyDoc.id}`, {
      method: 'GET',
      headers: { cookie: `auth_token=${studentAToken}` },
    });

    const res16 = await downloadDocumentHandler(req16);
    const bodyBytes16 = await res16.arrayBuffer();

    assert(
      res16.status === 200 &&
        res16.headers.get('content-type') === 'image/png' &&
        bodyBytes16.byteLength > 0,
      'Test 16: Legacy Base64 document is decoded and served securely without breaking existing records',
      `status: ${res16.status}, length: ${bodyBytes16.byteLength}`
    );

  } catch (error) {
    console.error('Test Suite Error:', error);
    process.exitCode = 1;
  } finally {
    vercelBlob.put = originalPut;
    vercelBlob.get = originalGet;
  }

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVercelBlobStorageTests();
