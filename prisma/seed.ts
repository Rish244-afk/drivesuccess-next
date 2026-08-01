import {
  PrismaClient,
  PackageType,
  VehicleTier,
  Transmission,
  VehicleStatus,
  BookingStatus,
  PaymentStatus,
  SessionStatus,
  DayOfWeek,
  Role,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed script...');

  // Clear existing records in correct dependency order
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.student.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.package.deleteMany();

  console.log('🧹 Existing database records cleared.');

  // ==========================================
  // 1. SEED PACKAGES
  // ==========================================
  console.log('📦 Seeding Packages...');

  const packagesData = [
    {
      name: '2 Wheeler License',
      slug: '2-wheeler-license',
      type: PackageType.LICENSE_2W,
      description: 'Complete motorcycle and scooter training program covering balance, braking, and traffic sign compliance.',
      price: 3500,
      sessionsCount: 8,
      badge: 'Popular',
      isPopular: false,
    },
    {
      name: '4 Wheeler License',
      slug: '4-wheeler-license',
      type: PackageType.LICENSE_4W,
      description: 'Comprehensive foundational car training for first-time drivers with mock RTO exams and road tests.',
      price: 5000,
      sessionsCount: 10,
      badge: 'Best Seller',
      isPopular: true,
    },
    {
      name: 'Combo (2W + 4W)',
      slug: 'combo-2w-4w',
      type: PackageType.COMBO,
      description: 'Dual vehicle license package combining 2-wheeler scooter/bike and 4-wheeler car driver training.',
      price: 7500,
      sessionsCount: 16,
      badge: 'Best Value',
      isPopular: true,
    },
    {
      name: 'IDL Transfer',
      slug: 'idl-transfer',
      type: PackageType.IDL_TRANSFER,
      description: 'International Driving License conversion program for foreign license holders adapting to local laws.',
      price: 4500,
      sessionsCount: 6,
      badge: 'Specialty',
      isPopular: false,
    },
    {
      name: 'License Transfer',
      slug: 'license-transfer',
      type: PackageType.IDL_TRANSFER,
      description: 'Inter-state or regional license transfer bridge program with RTO documentation support.',
      price: 3200,
      sessionsCount: 5,
      badge: 'Bridge',
      isPopular: false,
    },
    {
      name: 'License Renewal',
      slug: 'license-renewal',
      type: PackageType.RENEWAL,
      description: 'Refresher training and paperwork assistance for renewing expired driver licenses quickly.',
      price: 4200,
      sessionsCount: 8,
      badge: 'Refresher',
      isPopular: false,
    },
    {
      name: 'Vehicle Registration',
      slug: 'vehicle-registration',
      type: PackageType.REGISTRATION,
      description: 'End-to-end guidance for new vehicle registration, RTO compliance, and road tax processing.',
      price: 3500,
      sessionsCount: 5,
      badge: 'RTO Support',
      isPopular: false,
    },
  ];

  const packages = await Promise.all(
    packagesData.map((pkg) => prisma.package.create({ data: pkg }))
  );
  console.log(`✅ ${packages.length} Packages seeded.`);

  // ==========================================
  // 2. SEED VEHICLES
  // ==========================================
  console.log('🚗 Seeding Vehicles...');

  const vehiclesData = [
    {
      name: 'WagonR',
      modelYear: 2024,
      plateNumber: 'NY-DS-1001',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 600,
      description: 'High visibility and easy maneuverability. Perfect for beginners.',
      imageUrl: '/images/wagonr.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: false,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Swift',
      modelYear: 2024,
      plateNumber: 'NY-DS-1002',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 620,
      description: 'Responsive handling and crisp steering for tight city driving.',
      imageUrl: '/images/swift.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: false,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Dzire',
      modelYear: 2024,
      plateNumber: 'NY-DS-1003',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 650,
      description: 'Comfortable compact sedan ideal for clutch and parking practice.',
      imageUrl: '/images/dzire.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: false,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Polo',
      modelYear: 2023,
      plateNumber: 'NY-DS-1004',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 650,
      description: 'German engineered hatchback with solid build and precise handling.',
      imageUrl: '/images/polo.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: false,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Verna',
      modelYear: 2024,
      plateNumber: 'NY-DS-1005',
      tier: VehicleTier.TIER_B_PREMIUM,
      transmission: Transmission.AUTOMATIC,
      ratePerSession: 800,
      description: 'Master sedan driving with rear camera, automatic transmission, and smooth acceleration.',
      imageUrl: '/images/verna.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: true,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Venue',
      modelYear: 2024,
      plateNumber: 'NY-DS-1006',
      tier: VehicleTier.SUV,
      transmission: Transmission.AUTOMATIC,
      ratePerSession: 820,
      description: 'Compact SUV providing elevated road visibility and hill-start assist.',
      imageUrl: '/images/venue.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: true,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Fronx',
      modelYear: 2024,
      plateNumber: 'NY-DS-1007',
      tier: VehicleTier.TIER_B_PREMIUM,
      transmission: Transmission.AUTOMATIC,
      ratePerSession: 850,
      description: 'Modern crossover with smart-assist sensors and dual AC.',
      imageUrl: '/images/fronx.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: true,
      status: VehicleStatus.AVAILABLE,
    },
  ];

  const vehicles = await Promise.all(
    vehiclesData.map((v) => prisma.vehicle.create({ data: v }))
  );
  console.log(`✅ ${vehicles.length} Vehicles seeded.`);

  // ==========================================
  // 3. SEED INSTRUCTORS (5 INSTRUCTORS)
  // ==========================================
  console.log('👨‍🏫 Seeding 5 Instructors...');

  const instructorsData = [
    {
      name: 'Mark Vance',
      email: 'mark.vance@drivesuccess.edu',
      phone: '+1 (555) 101-2001',
      bio: 'Senior instructor with 12+ years experience specializing in defensive driving and nervous beginner training.',
      experienceYears: 12,
      rating: 5.0,
      specialties: ['Defensive Driving', 'Parallel Parking', 'Beginners'],
      role: Role.INSTRUCTOR,
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@drivesuccess.edu',
      phone: '+1 (555) 101-2002',
      bio: 'Certified defensive driving specialist with a 99% first-attempt student pass rate.',
      experienceYears: 8,
      rating: 4.9,
      specialties: ['Night Driving', 'Mock Exams', 'Clutch Control'],
      role: Role.INSTRUCTOR,
    },
    {
      name: 'David Rodriguez',
      email: 'david.rodriguez@drivesuccess.edu',
      phone: '+1 (555) 101-2003',
      bio: 'Highway merging and high-speed safety expert with background in professional evasive driving.',
      experienceYears: 10,
      rating: 4.9,
      specialties: ['Highway Merging', 'Hazard Response', 'Automatic Sedans'],
      role: Role.INSTRUCTOR,
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@drivesuccess.edu',
      phone: '+1 (555) 101-2004',
      bio: 'Patient pedagogical instructor focusing on motorcycle licenses and compact vehicle maneuverability.',
      experienceYears: 7,
      rating: 4.8,
      specialties: ['2-Wheeler License', 'City Navigation', 'RTO Rules'],
      role: Role.INSTRUCTOR,
    },
    {
      name: 'Alex Mercer',
      email: 'alex.mercer@drivesuccess.edu',
      phone: '+1 (555) 101-2005',
      bio: 'Precision driving specialist focused on advanced SUV handling, reversing, and parallel parking.',
      experienceYears: 9,
      rating: 4.9,
      specialties: ['SUV Driving', 'Reverse Steering', 'Hill Start Assist'],
      role: Role.INSTRUCTOR,
    },
  ];

  const instructors = await Promise.all(
    instructorsData.map((inst) => prisma.instructor.create({ data: inst }))
  );
  console.log(`✅ ${instructors.length} Instructors seeded.`);

  // Create Availabilities for Instructors
  const days: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];

  for (const instructor of instructors) {
    for (const day of days) {
      await prisma.availability.create({
        data: {
          instructorId: instructor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isBooked: false,
        },
      });
    }
  }
  console.log('✅ Instructor Availabilities seeded.');

  // ==========================================
  // 4. SEED SAMPLE STUDENT & BOOKINGS
  // ==========================================
  console.log('🎓 Seeding Sample Student & Bookings...');

  const student = await prisma.student.create({
    data: {
      name: 'Alex Thompson',
      email: 'alex.thompson@example.com',
      phone: '+1 (555) 882-1000',
      address: '100 Academy Way',
      city: 'New York',
      state: 'NY',
      zipCode: '10027',
      role: Role.STUDENT,
    },
  });

  const fourWheelerPkg = packages.find((p) => p.type === PackageType.LICENSE_4W)!;
  const wagonR = vehicles.find((v) => v.name === 'WagonR')!;
  const markVance = instructors.find((i) => i.name === 'Mark Vance')!;
  const sarahJenkins = instructors.find((i) => i.name === 'Sarah Jenkins')!;

  const booking1 = await prisma.booking.create({
    data: {
      studentId: student.id,
      packageId: fourWheelerPkg.id,
      vehicleId: wagonR.id,
      instructorId: markVance.id,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      totalAmount: fourWheelerPkg.price,
      notes: 'Essential 4-wheeler driving package',
    },
  });

  // Create Sample Training Sessions
  await prisma.session.create({
    data: {
      bookingId: booking1.id,
      studentId: student.id,
      instructorId: markVance.id,
      vehicleId: wagonR.id,
      scheduledAt: new Date(Date.now() + 86400000 * 2),
      durationMins: 60,
      status: SessionStatus.SCHEDULED,
      location: 'Defensive Driving Track #1',
      notes: 'Parallel parking and vehicle orientation',
    },
  });

  await prisma.session.create({
    data: {
      bookingId: booking1.id,
      studentId: student.id,
      instructorId: sarahJenkins.id,
      vehicleId: wagonR.id,
      scheduledAt: new Date(Date.now() + 86400000 * 5),
      durationMins: 60,
      status: SessionStatus.SCHEDULED,
      location: 'Night Vision Practical Track',
      notes: 'Night driving and headlight management',
    },
  });

  console.log('✅ Student, Booking, and Sessions seeded.');

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
