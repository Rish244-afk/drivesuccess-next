import {
  Role,
  PackageType,
  VehicleTier,
  Transmission,
  VehicleStatus,
  BookingStatus,
  PaymentStatus,
  SessionStatus,
  DayOfWeek,
  NotificationType,
} from '@prisma/client';

export type {
  Role,
  PackageType,
  VehicleTier,
  Transmission,
  VehicleStatus,
  BookingStatus,
  PaymentStatus,
  SessionStatus,
  DayOfWeek,
  NotificationType,
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface StudentProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  licenseNo: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageOffering {
  id: string;
  name: string;
  slug: string;
  type: PackageType;
  description: string;
  price: number;
  sessionsCount: number;
  badge: string | null;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleItem {
  id: string;
  name: string;
  modelYear: number;
  plateNumber: string;
  tier: VehicleTier;
  transmission: Transmission;
  ratePerSession: number;
  description: string;
  imageUrl: string | null;
  hasDualControl: boolean;
  hasAirConditioning: boolean;
  hasSmartAssist: boolean;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  bio: string | null;
  experienceYears: number;
  rating: number;
  specialties: string[];
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRecord {
  id: string;
  studentId: string;
  packageId: string;
  vehicleId: string | null;
  instructorId: string | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  notes: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  refundId: string | null;
  refundAmount: number | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  student?: StudentProfile;
  package?: PackageOffering;
  instructor?: InstructorProfile;
  vehicle?: VehicleItem;
}

export interface SessionRecord {
  id: string;
  bookingId: string;
  studentId: string;
  instructorId: string;
  vehicleId: string;
  scheduledAt: Date;
  durationMins: number;
  status: SessionStatus;
  location: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  instructor?: InstructorProfile;
  vehicle?: VehicleItem;
}
