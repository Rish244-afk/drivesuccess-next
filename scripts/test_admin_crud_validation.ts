import {
  createPackageSchema,
  createVehicleSchema,
  createInstructorSchema,
  bookingAssignmentSchema,
  cancelBookingSchema,
  updateDocumentStatusSchema,
  entityIdSchema,
} from '../lib/security';
import { PackageType, VehicleTier, Transmission, VehicleStatus, BookingStatus } from '@prisma/client';

function runAdminValidationTests() {
  console.log('====================================================');
  console.log('   ADMIN CRUD STRICT ZOD VALIDATION TEST SUITE');
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

  // ---------------------------------------------------------------------------
  // TEST 1: Valid package payload -> accepted
  // ---------------------------------------------------------------------------
  const validPackage = {
    name: 'Comprehensive 4W Driver License Course',
    type: PackageType.LICENSE_4W,
    description: 'Complete hands-on practical driving instruction.',
    price: '7500',
    sessionsCount: '15',
    badge: 'Popular Choice',
  };
  const pkgRes1 = createPackageSchema.safeParse(validPackage);
  assert(
    pkgRes1.success === true && pkgRes1.data.price === 7500 && pkgRes1.data.sessionsCount === 15,
    'Valid package payload accepted and numbers coerced'
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Package with isPopular: true -> REJECTED (Strict Schema)
  // ---------------------------------------------------------------------------
  const injectionPackage1 = {
    ...validPackage,
    isPopular: true,
  };
  const pkgRes2 = createPackageSchema.safeParse(injectionPackage1);
  assert(
    pkgRes2.success === false,
    'Package payload with isPopular: true is strictly REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Package with role: 'ADMIN' -> REJECTED (Mass Assignment Injection)
  // ---------------------------------------------------------------------------
  const injectionPackage2 = {
    ...validPackage,
    role: 'ADMIN',
  };
  const pkgRes3 = createPackageSchema.safeParse(injectionPackage2);
  assert(
    pkgRes3.success === false,
    'Package payload with injected role: ADMIN is strictly REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Package with invalid type -> REJECTED
  // ---------------------------------------------------------------------------
  const invalidTypePkg = {
    ...validPackage,
    type: 'NON_EXISTENT_TYPE',
  };
  const pkgRes4 = createPackageSchema.safeParse(invalidTypePkg);
  assert(
    pkgRes4.success === false,
    'Package payload with invalid PackageType enum is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 5: Package with invalid / negative / NaN price -> REJECTED
  // ---------------------------------------------------------------------------
  const invalidPricePkg = {
    ...validPackage,
    price: '-500',
  };
  const pkgRes5 = createPackageSchema.safeParse(invalidPricePkg);
  const nanPricePkg = createPackageSchema.safeParse({ ...validPackage, price: 'not-a-number' });
  assert(
    pkgRes5.success === false && nanPricePkg.success === false,
    'Package payload with negative or non-numeric price is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Vehicle with invalid tier enum -> REJECTED
  // ---------------------------------------------------------------------------
  const invalidVehicleEnum = {
    name: 'Swift Dzire',
    modelYear: '2023',
    plateNumber: 'KA01AB1234',
    tier: 'SUPER_CAR',
    transmission: Transmission.MANUAL,
    ratePerSession: '500',
    description: 'Compact training car',
  };
  const vehRes1 = createVehicleSchema.safeParse(invalidVehicleEnum);
  assert(
    vehRes1.success === false,
    'Vehicle payload with invalid tier enum is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Vehicle with malformed numeric fields -> REJECTED
  // ---------------------------------------------------------------------------
  const malformedVehicleNumbers = {
    name: 'Swift Dzire',
    modelYear: '1850', // Too old (<1990)
    plateNumber: 'KA01AB1234',
    tier: VehicleTier.TIER_A_COMPACT,
    transmission: Transmission.MANUAL,
    ratePerSession: 'abc',
    description: 'Compact training car',
  };
  const vehRes2 = createVehicleSchema.safeParse(malformedVehicleNumbers);
  assert(
    vehRes2.success === false,
    'Vehicle payload with invalid modelYear (<1990) or non-numeric rate is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Instructor with invalid email -> REJECTED
  // ---------------------------------------------------------------------------
  const invalidEmailInstructor = {
    name: 'Rajesh Kumar',
    email: 'not-an-email',
    phone: '9876543210',
    experienceYears: '8',
    rating: '4.8',
    specialties: 'Parallel Parking, Night Driving',
  };
  const instRes1 = createInstructorSchema.safeParse(invalidEmailInstructor);
  assert(
    instRes1.success === false,
    'Instructor payload with invalid email address format is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 9: Instructor with invalid rating (>5.0) -> REJECTED
  // ---------------------------------------------------------------------------
  const invalidRatingInstructor = {
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '9876543210',
    experienceYears: '8',
    rating: '9.9', // Exceeds 5.0
    specialties: 'Parallel Parking',
  };
  const instRes2 = createInstructorSchema.safeParse(invalidRatingInstructor);
  assert(
    instRes2.success === false,
    'Instructor payload with rating > 5.0 is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 10: Booking assignment with valid instructorId/vehicleId/status -> ACCEPTED
  // ---------------------------------------------------------------------------
  const validAssignment = {
    bookingId: 'booking_12345',
    instructorId: 'inst_67890',
    vehicleId: 'veh_54321',
    status: BookingStatus.CONFIRMED,
  };
  const assignRes1 = bookingAssignmentSchema.safeParse(validAssignment);
  assert(
    assignRes1.success === true,
    'Valid booking assignment payload is ACCEPTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 11: Booking assignment containing paymentStatus: 'PAID' -> STRICTLY REJECTED
  // ---------------------------------------------------------------------------
  const maliciousPaymentAssignment = {
    bookingId: 'booking_12345',
    instructorId: 'inst_67890',
    paymentStatus: 'PAID', // Malicious attempt to mark booking paid
  };
  const assignRes2 = bookingAssignmentSchema.safeParse(maliciousPaymentAssignment);
  assert(
    assignRes2.success === false,
    'Booking assignment containing paymentStatus: PAID is STRICTLY REJECTED by schema'
  );

  // ---------------------------------------------------------------------------
  // TEST 12: Booking assignment containing arbitrary field such as role: 'ADMIN' -> REJECTED
  // ---------------------------------------------------------------------------
  const arbitraryFieldAssignment = {
    bookingId: 'booking_12345',
    role: 'ADMIN',
  };
  const assignRes3 = bookingAssignmentSchema.safeParse(arbitraryFieldAssignment);
  assert(
    assignRes3.success === false,
    'Booking assignment containing arbitrary field role: ADMIN is STRICTLY REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 13: Cancellation reason > 500 characters -> REJECTED
  // ---------------------------------------------------------------------------
  const oversizedCancel = {
    bookingId: 'booking_12345',
    cancelReason: 'A'.repeat(501),
  };
  const cancelRes = cancelBookingSchema.safeParse(oversizedCancel);
  assert(
    cancelRes.success === false,
    'Cancellation with reason > 500 characters is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 14: Invalid document status -> REJECTED
  // ---------------------------------------------------------------------------
  const invalidDocStatus = {
    documentId: 'doc_12345',
    status: 'SUPER_VERIFIED',
  };
  const docRes1 = updateDocumentStatusSchema.safeParse(invalidDocStatus);
  assert(
    docRes1.success === false,
    'Document status with unknown value is REJECTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 15: Valid document status -> ACCEPTED
  // ---------------------------------------------------------------------------
  const validDocStatus = {
    documentId: 'doc_12345',
    status: 'APPROVED',
  };
  const docRes2 = updateDocumentStatusSchema.safeParse(validDocStatus);
  assert(
    docRes2.success === true,
    'Document status with APPROVED is ACCEPTED'
  );

  // ---------------------------------------------------------------------------
  // TEST 16: Invalid / empty entity ID -> REJECTED
  // ---------------------------------------------------------------------------
  const emptyIdRes = entityIdSchema.safeParse('   ');
  const validIdRes = entityIdSchema.parse('package_123');
  assert(
    emptyIdRes.success === false && validIdRes === 'package_123',
    'Empty or whitespace-only entity ID is REJECTED while valid ID is ACCEPTED'
  );

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAdminValidationTests();
