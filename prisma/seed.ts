import { PrismaClient, PackageType, VehicleTier, Transmission, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed script...');

  // 1. Clean existing records in reverse dependency order
  console.log('🧹 Existing database records cleared.');
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.package.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.student.deleteMany();

  // ==========================================
  // 1. SEED PACKAGES (EXACT REAL VAHATHI MOTOR DRIVING SCHOOL PRICING)
  // ==========================================
  console.log('📦 Seeding Packages from Vahathi Motor Driving School...');

  const packagesData = [
    // Standard Car Training (Honda City / Hatchbacks)
    {
      name: '10 Days Training (Standard Car)',
      slug: '10-days-training-standard',
      type: PackageType.LICENSE_4W,
      description: '10 days foundational practical car driving sessions (Honda City / Hatchback fleet).',
      price: 4500,
      sessionsCount: 10,
      badge: 'Popular',
      isPopular: true,
    },
    {
      name: '15 Days Training (Standard Car)',
      slug: '15-days-training-standard',
      type: PackageType.LICENSE_4W,
      description: '15 days extended practical driving course with city traffic and parking maneuvers.',
      price: 6500,
      sessionsCount: 15,
      badge: 'Extended',
      isPopular: false,
    },
    {
      name: '10 Days Training & 4W License',
      slug: '10-days-training-4w-license',
      type: PackageType.LICENSE_4W,
      description: '10 days practical car training combined with official RTO 4-Wheeler driver license assistance.',
      price: 7000,
      sessionsCount: 10,
      badge: 'Best Seller',
      isPopular: true,
    },
    {
      name: '15 Days Training & 4W License',
      slug: '15-days-training-4w-license',
      type: PackageType.LICENSE_4W,
      description: '15 days comprehensive driving course + official RTO 4-Wheeler driver license processing.',
      price: 9000,
      sessionsCount: 15,
      badge: 'Recommended',
      isPopular: true,
    },
    {
      name: '10 Days Training & 2+4 Combo License',
      slug: '10-days-training-2-4-combo-license',
      type: PackageType.COMBO,
      description: '10 days car training + dual RTO license processing for both 2-wheeler scooter/bike & 4-wheeler car.',
      price: 9000,
      sessionsCount: 10,
      badge: 'Best Value',
      isPopular: true,
    },
    {
      name: '15 Days Training & 2+4 Combo License',
      slug: '15-days-training-2-4-combo-license',
      type: PackageType.COMBO,
      description: '15 days master driving course + combined 2-wheeler & 4-wheeler RTO driver license.',
      price: 11000,
      sessionsCount: 15,
      badge: 'Complete Combo',
      isPopular: true,
    },

    // Hyundai Creta SUV Special Training
    {
      name: 'Hyundai Creta - 10 Days Training',
      slug: 'hyundai-creta-10-days-training',
      type: PackageType.LICENSE_4W,
      description: '10 days practical SUV driving sessions on modern Hyundai Creta with elevated road visibility.',
      price: 8000,
      sessionsCount: 10,
      badge: 'SUV Special',
      isPopular: false,
    },
    {
      name: 'Hyundai Creta - 15 Days Training',
      slug: 'hyundai-creta-15-days-training',
      type: PackageType.LICENSE_4W,
      description: '15 days comprehensive SUV driving mastery course on Hyundai Creta with reverse camera practice.',
      price: 12000,
      sessionsCount: 15,
      badge: 'SUV Master',
      isPopular: false,
    },
    {
      name: 'Hyundai Creta - 10 Days & 4W License',
      slug: 'hyundai-creta-10-days-4w-license',
      type: PackageType.LICENSE_4W,
      description: '10 days Hyundai Creta SUV driving training + complete 4-Wheeler RTO driver license processing.',
      price: 12000,
      sessionsCount: 10,
      badge: 'SUV License',
      isPopular: false,
    },
    {
      name: 'Hyundai Creta - 15 Days & 4W License',
      slug: 'hyundai-creta-15-days-4w-license',
      type: PackageType.LICENSE_4W,
      description: '15 days Hyundai Creta SUV training + official RTO 4-Wheeler license (Discounted Special Offer).',
      price: 15000,
      sessionsCount: 15,
      badge: 'Special Offer',
      isPopular: true,
    },
    {
      name: 'Hyundai Creta - 10 Days & 2+4 Combo License',
      slug: 'hyundai-creta-10-days-2-4-combo-license',
      type: PackageType.COMBO,
      description: '10 days Hyundai Creta SUV training + combined 2-wheeler scooter/bike & 4-wheeler car license.',
      price: 15000,
      sessionsCount: 10,
      badge: 'SUV Combo',
      isPopular: false,
    },
    {
      name: 'Hyundai Creta - 15 Days & 2+4 Combo License',
      slug: 'hyundai-creta-15-days-2-4-combo-license',
      type: PackageType.COMBO,
      description: '15 days Hyundai Creta SUV master course + dual 2W & 4W RTO driver license certification.',
      price: 18000,
      sessionsCount: 15,
      badge: 'Premium VIP',
      isPopular: true,
    },
  ];

  const packages = await Promise.all(
    packagesData.map((pkg) => prisma.package.create({ data: pkg }))
  );
  console.log(`✅ ${packages.length} Packages seeded.`);

  // ==========================================
  // 2. SEED VEHICLES (REAL SHOP FLEET: CRETA, HONDA CITY, HYUNDAI EON, SWIFT, WAGONR)
  // ==========================================
  console.log('🚗 Seeding Vehicles...');

  const vehiclesData = [
    {
      name: 'Hyundai Creta',
      modelYear: 2024,
      plateNumber: 'KA-05-DS-7001',
      tier: VehicleTier.SUV,
      transmission: Transmission.MANUAL,
      ratePerSession: 800,
      description: 'Premium SUV with elevated road visibility, dual controls, and hill assist. Featured at Vahathi Motor Driving School.',
      imageUrl: '/images/creta.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: true,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Honda City',
      modelYear: 2024,
      plateNumber: 'KA-05-DS-7002',
      tier: VehicleTier.TIER_B_PREMIUM,
      transmission: Transmission.MANUAL,
      ratePerSession: 700,
      description: 'Comfortable mid-size sedan with dual controls, ideal for clutch control and parallel parking.',
      imageUrl: '/images/hondacity.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: true,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Hyundai Eon',
      modelYear: 2023,
      plateNumber: 'KA-05-DS-7003',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 450,
      description: 'Compact hatchback for easy maneuverability and confidence building for beginner drivers.',
      imageUrl: '/images/eon.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: false,
      status: VehicleStatus.AVAILABLE,
    },
    {
      name: 'Swift',
      modelYear: 2024,
      plateNumber: 'KA-05-DS-7004',
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
      name: 'WagonR',
      modelYear: 2024,
      plateNumber: 'KA-05-DS-7005',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 600,
      description: 'High visibility tall-boy design with dual controls.',
      imageUrl: '/images/wagonr.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: false,
      status: VehicleStatus.AVAILABLE,
    },
  ];

  const vehicles = await Promise.all(
    vehiclesData.map((v) => prisma.vehicle.create({ data: v }))
  );
  console.log(`✅ ${vehicles.length} Vehicles seeded.`);

  // ==========================================
  // 3. SEED INSTRUCTORS
  // ==========================================
  console.log('👨‍🏫 Seeding Instructors...');

  const instructorsData = [
    {
      name: 'Rajesh Kumar',
      phone: '+917829780778',
      email: 'rajesh@vahathidriving.com',
      experienceYears: 12,
      rating: 4.9,
      specialties: ['Dual-Control', 'Creta SUV Specialist', 'RTO Test Track'],
      avatarUrl: '/images/rajesh.jpg',
    },
    {
      name: 'Priya Sharma',
      phone: '+917829780779',
      email: 'priya@vahathidriving.com',
      experienceYears: 8,
      rating: 4.95,
      specialties: ['Beginner Confidence', 'Honda City Sedan', 'Traffic Practice'],
      avatarUrl: '/images/priya.jpg',
    },
  ];

  const instructors = await Promise.all(
    instructorsData.map((ins) => prisma.instructor.create({ data: ins }))
  );
  console.log(`✅ ${instructors.length} Instructors seeded.`);

  // ==========================================
  // 4. SEED SAMPLE ADMIN & DEMO USER
  // ==========================================
  console.log('🎓 Seeding Users & Sample Booking...');

  const sampleStudent = await prisma.student.create({
    data: {
      phone: '+919876543210',
      name: 'Aarav Patel',
      email: 'aarav@example.com',
      role: 'STUDENT',
      address: 'BTM 2nd Stage, Bengaluru, Karnataka 560076',
    },
  });

  const sampleBooking = await prisma.booking.create({
    data: {
      studentId: sampleStudent.id,
      packageId: packages[2].id, // 10 Days & 4W License
      vehicleId: vehicles[0].id, // Hyundai Creta
      instructorId: instructors[0].id,
      totalAmount: packages[2].price,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    },
  });

  console.log('🎉 Database seeding complete with real Vahathi Motor Driving School data!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
