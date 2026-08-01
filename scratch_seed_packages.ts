import { prisma } from './lib/prisma';
import { PackageType } from '@prisma/client';

async function main() {
  console.log('Upserting clean categorized packages...');

  const packagesData = [
    // --- HATCHBACK / STANDARD CARS ---
    {
      name: 'Standard Hatchback - 10 Days Training',
      slug: 'hatchback-10-days-training',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HATCHBACK',
      description: '10 days practical driving lessons on hatchback fleet (Swift/WagonR/Eon).',
      price: 5000,
      sessionsCount: 10,
      badge: 'Popular Entry',
    },
    {
      name: 'Standard Hatchback - 10 Days & 4W License',
      slug: 'hatchback-10-days-4w-license',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HATCHBACK',
      description: '10 days practical hatchback training + complete 4-wheeler RTO driver license.',
      price: 8000,
      sessionsCount: 10,
      badge: 'Best Value',
    },
    {
      name: 'Standard Hatchback - 10 Days & 2+4 Combo License',
      slug: 'hatchback-10-days-combo-license',
      type: PackageType.COMBO,
      targetVehicleCategory: 'HATCHBACK',
      description: '10 days hatchback training + dual 2-wheeler & 4-wheeler RTO driver license.',
      price: 10000,
      sessionsCount: 10,
    },
    {
      name: 'Standard Hatchback - 15 Days Extended Mastery',
      slug: 'hatchback-15-days-mastery',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HATCHBACK',
      description: '15 days extended practical driving course with city traffic and parking maneuvers.',
      price: 6500,
      sessionsCount: 15,
    },
    {
      name: 'Standard Hatchback - 15 Days & 4W License',
      slug: 'hatchback-15-days-4w-license',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HATCHBACK',
      description: '15 days hatchback training + official RTO 4-wheeler license.',
      price: 10000,
      sessionsCount: 15,
    },
    {
      name: 'Standard Hatchback - 15 Days & 2+4 Combo License',
      slug: 'hatchback-15-days-combo-license',
      type: PackageType.COMBO,
      targetVehicleCategory: 'HATCHBACK',
      description: '15 days master hatchback course + combined 2-wheeler & 4-wheeler RTO license.',
      price: 12000,
      sessionsCount: 15,
    },

    // --- HONDA CITY SEDAN ---
    {
      name: 'Honda City Sedan - 10 Days Training',
      slug: 'honda-city-10-days-training',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HONDACITY',
      description: '10 days practical sedan driving sessions on premium Honda City.',
      price: 6500,
      sessionsCount: 10,
    },
    {
      name: 'Honda City Sedan - 10 Days & 4W License',
      slug: 'honda-city-10-days-4w-license',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HONDACITY',
      description: '10 days Honda City sedan training + 4-wheeler RTO driver license.',
      price: 10000,
      sessionsCount: 10,
    },
    {
      name: 'Honda City Sedan - 10 Days & 2+4 Combo License',
      slug: 'honda-city-10-days-combo-license',
      type: PackageType.COMBO,
      targetVehicleCategory: 'HONDACITY',
      description: '10 days Honda City sedan training + combined 2W bike & 4W car RTO license.',
      price: 12000,
      sessionsCount: 10,
    },
    {
      name: 'Honda City Sedan - 15 Days Extended Training',
      slug: 'honda-city-15-days-training',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HONDACITY',
      description: '15 days comprehensive sedan driving mastery course on Honda City.',
      price: 8000,
      sessionsCount: 15,
    },
    {
      name: 'Honda City Sedan - 15 Days & 4W License',
      slug: 'honda-city-15-days-4w-license',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'HONDACITY',
      description: '15 days Honda City sedan training + official RTO 4-wheeler license.',
      price: 12000,
      sessionsCount: 15,
    },
    {
      name: 'Honda City Sedan - 15 Days & 2+4 Combo License',
      slug: 'honda-city-15-days-combo-license',
      type: PackageType.COMBO,
      targetVehicleCategory: 'HONDACITY',
      description: '15 days Honda City sedan master course + dual 2W & 4W RTO license.',
      price: 15000,
      sessionsCount: 15,
    },

    // --- HYUNDAI CRETA SUV ---
    {
      name: 'Hyundai Creta SUV - 10 Days Training',
      slug: 'creta-suv-10-days-training',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'CRETA',
      description: '10 days practical SUV driving sessions on modern Hyundai Creta with elevated road visibility.',
      price: 8000,
      sessionsCount: 10,
    },
    {
      name: 'Hyundai Creta SUV - 10 Days & 4W License',
      slug: 'creta-suv-10-days-4w-license',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'CRETA',
      description: '10 days Hyundai Creta SUV driving training + complete 4-wheeler RTO driver license.',
      price: 12000,
      sessionsCount: 10,
    },
    {
      name: 'Hyundai Creta SUV - 10 Days & 2+4 Combo License',
      slug: 'creta-suv-10-days-combo-license',
      type: PackageType.COMBO,
      targetVehicleCategory: 'CRETA',
      description: '10 days Hyundai Creta SUV training + combined 2-wheeler scooter/bike & 4-wheeler car license.',
      price: 15000,
      sessionsCount: 10,
      badge: 'Popular SUV Combo',
    },
    {
      name: 'Hyundai Creta SUV - 15 Days Training',
      slug: 'creta-suv-15-days-training',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'CRETA',
      description: '15 days comprehensive SUV driving mastery course on Hyundai Creta with reverse camera practice.',
      price: 12000,
      sessionsCount: 15,
    },
    {
      name: 'Hyundai Creta SUV - 15 Days & 4W License',
      slug: 'creta-suv-15-days-4w-license',
      type: PackageType.LICENSE_4W,
      targetVehicleCategory: 'CRETA',
      description: '15 days Hyundai Creta SUV training + official RTO 4-wheeler license.',
      price: 15000,
      sessionsCount: 15,
    },
    {
      name: 'Hyundai Creta SUV - 15 Days & 2+4 Combo License',
      slug: 'creta-suv-15-days-combo-license',
      type: PackageType.COMBO,
      targetVehicleCategory: 'CRETA',
      description: '15 days master Creta SUV driving course + dual 2W & 4W RTO driver license certification.',
      price: 18000,
      sessionsCount: 15,
      badge: 'VIP Master Course',
    },
  ];

  for (const p of packagesData) {
    await prisma.package.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log('Successfully upserted all packages with vehicle categories!');
}

main().catch(console.error);
