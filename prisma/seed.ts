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
    {
      name: 'CAR',
      slug: 'car-standard',
      type: PackageType.LICENSE_4W,
      description: 'Learners & License;Training - Free;Theory Class - Free;Per-Day Driving: ₹300',
      price: 4000,
      sessionsCount: 10,
      badge: null,
      isPopular: false,
    },
    {
      name: 'CAR + MOTORCYCLE',
      slug: 'car-motorcycle-combo',
      type: PackageType.COMBO,
      description: 'Learners & License;Training - Free;Theory Class - Free;Per-Day Driving: ₹300 + ₹200',
      price: 5000,
      sessionsCount: 15,
      badge: 'MOST POPULAR',
      isPopular: true,
    },
    {
      name: 'MOTORCYCLE',
      slug: 'motorcycle-standard',
      type: PackageType.LICENSE_2W,
      description: 'Learners & License;Training - Free;Theory Class - Free;Per-Day Driving: ₹200',
      price: 3000,
      sessionsCount: 10,
      badge: null,
      isPopular: false,
    },
    {
      name: 'CAR FOR MOTORCYCLE LICENSE HOLDER',
      slug: 'car-for-motorcycle-holder',
      type: PackageType.LICENSE_4W,
      description: 'Learners & License;Training - Free;Theory Class - Free;Per-Day Driving: ₹300',
      price: 4500,
      sessionsCount: 10,
      badge: null,
      isPopular: false,
    },
    {
      name: 'MOTORCYCLE FOR CAR LICENSE HOLDER',
      slug: 'motorcycle-for-car-holder',
      type: PackageType.LICENSE_2W,
      description: 'Learners & License;Training - Free;Theory Class - Free;Per-Day Driving: ₹200',
      price: 3500,
      sessionsCount: 10,
      badge: null,
      isPopular: false,
    },
    {
      name: 'CAR License Holders',
      slug: 'car-license-holders',
      type: PackageType.LICENSE_4W,
      description: 'Training - Free;Theory Class - Free;Per-Day Driving: ₹300',
      price: 1500,
      sessionsCount: 8,
      badge: 'Training Only',
      isPopular: false,
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
