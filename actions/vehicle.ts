'use server';

import { prisma } from '@/lib/prisma';
import { VehicleTier, VehicleStatus, Transmission } from '@prisma/client';

export interface GetVehiclesOptions {
  tier?: string;
  status?: string;
}

/**
 * Fetch vehicles dynamically from database (Prisma ORM)
 * Supports live filtering by Tier and Status
 */
export async function getVehiclesAction(options?: GetVehiclesOptions) {
  try {
    const { tier, status } = options || {};
    const where: any = {};

    if (tier && tier !== 'all') {
      where.tier = tier as VehicleTier;
    }

    if (status && status !== 'all') {
      where.status = status as VehicleStatus;
    }

    let vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { ratePerSession: 'asc' }],
    });

    // Auto-seed default vehicles if database table is empty
    if (vehicles.length === 0 && (!tier || tier === 'all') && (!status || status === 'all')) {
      console.log('🚗 Database vehicles table is empty. Running initial vehicle seed...');
      await seedDefaultVehicles();
      vehicles = await prisma.vehicle.findMany({
        orderBy: [{ tier: 'asc' }, { ratePerSession: 'asc' }],
      });
    }

    return { success: true, data: vehicles };
  } catch (error) {
    console.error('getVehiclesAction Error:', error);
    return { success: false, error: 'Failed to fetch vehicles from database', data: [] };
  }
}

/**
 * Default vehicles seed helper
 */
async function seedDefaultVehicles() {
  const defaults = [
    {
      name: 'WagonR',
      modelYear: 2024,
      plateNumber: 'NY-DS-1001',
      tier: VehicleTier.TIER_A_COMPACT,
      transmission: Transmission.MANUAL,
      ratePerSession: 600,
      description: 'High visibility and easy maneuverability. Perfect for beginners.',
      imageUrl: '/images/fleet_wagonr_1785513709373.jpg',
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
      imageUrl: '/images/fleet_polo_1785513723345.jpg',
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
      imageUrl: '/images/fleet_wagonr_1785513709373.jpg',
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
      imageUrl: '/images/fleet_polo_1785513723345.jpg',
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
      imageUrl: '/images/fleet_verna_1785513736403.jpg',
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
      imageUrl: '/images/fleet_fronx_1785513750378.jpg',
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
      imageUrl: '/images/fleet_fronx_1785513750378.jpg',
      hasDualControl: true,
      hasAirConditioning: true,
      hasSmartAssist: true,
      status: VehicleStatus.AVAILABLE,
    },
  ];

  await Promise.all(
    defaults.map((v) =>
      prisma.vehicle.upsert({
        where: { plateNumber: v.plateNumber },
        update: v,
        create: v,
      })
    )
  );
}
