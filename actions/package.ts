'use server';

import { prisma } from '@/lib/prisma';
import { PackageType } from '@prisma/client';

export interface GetPackagesOptions {
  category?: string;
  search?: string;
}

/**
 * Fetch packages dynamically from database (Prisma ORM)
 * Supports real-time filtering by category and search keyword query
 */
export async function getPackagesAction(options?: GetPackagesOptions) {
  try {
    const { category, search } = options || {};

    // Build Prisma query filters dynamically
    const where: any = {};

    if (category && category !== 'all') {
      where.type = category as PackageType;
    }

    if (search && search.trim() !== '') {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { badge: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Query live packages from database
    let packages = await prisma.package.findMany({
      where,
      orderBy: [{ isPopular: 'desc' }, { price: 'asc' }],
    });

    // Auto-seed packages if database is empty
    if (packages.length === 0 && (!category || category === 'all') && !search) {
      console.log('📦 Database packages table is empty. Running initial seed...');
      await seedDefaultPackages();
      packages = await prisma.package.findMany({
        orderBy: [{ isPopular: 'desc' }, { price: 'asc' }],
      });
    }

    return { success: true, data: packages };
  } catch (error) {
    console.error('getPackagesAction Error:', error);
    return { success: false, error: 'Failed to fetch packages from database', data: [] };
  }
}

/**
 * Seed helper if DB empty
 */
async function seedDefaultPackages() {
  const defaults = [
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

  await Promise.all(
    defaults.map((p) =>
      prisma.package.upsert({
        where: { slug: p.slug },
        update: p,
        create: p,
      })
    )
  );
}
