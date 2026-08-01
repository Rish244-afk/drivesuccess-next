'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  User,
  Car,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import {
  getBookingInstructorsAction,
  getBookingVehiclesAction,
  getAvailableSlotsAction,
  createBookingTransactionAction,
} from '@/actions/bookingSystem';
import { getPackagesAction } from '@/actions/package';
import {
  createRazorpayOrderAction,
  verifyPaymentSignatureAction,
  markPaymentFailedAction,
} from '@/actions/razorpay';

interface WizardPackage {
  id: string;
  name: string;
  price: number;
  sessionsCount: number;
  description: string;
  badge?: string | null;
}

interface WizardInstructor {
  id: string;
  name: string;
  experienceYears: number;
  rating: number;
  specialties: string[];
}

interface WizardVehicle {
  id: string;
  name: string;
  tier: string;
  transmission: string;
  ratePerSession: number;
}

interface SlotItem {
  time: string;
  available: boolean;
  reason: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BookingWizard() {
  const router = useRouter();

  // Step 1 to 6
  const [step, setStep] = useState<number>(1);

  // Loaded database records
  const [packages, setPackages] = useState<WizardPackage[]>([]);
  const [instructors, setInstructors] = useState<WizardInstructor[]>([]);
  const [vehicles, setVehicles] = useState<WizardVehicle[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);

  // Selected state
  const [selectedPackage, setSelectedPackage] = useState<WizardPackage | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<WizardInstructor | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<WizardVehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Created Booking Record & Razorpay State
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'PAID' | 'FAILED'>('IDLE');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check current session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          setIsGuest(true);
        } else {
          setIsGuest(false);
          if (data.user.name) setStudentName(data.user.name);
          if (data.user.phone) setStudentPhone(data.user.phone);
          if (data.user.email) setStudentEmail(data.user.email);
        }
      })
      .catch(() => setIsGuest(true));
  }, []);

  // Dynamically Load Razorpay Checkout Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Load initial Packages, Instructors, and Vehicles from Database
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);

      const [pkgRes, instRes, vehRes] = await Promise.all([
        getPackagesAction(),
        getBookingInstructorsAction(),
        getBookingVehiclesAction(),
      ]);

      if (pkgRes.success && pkgRes.data) setPackages(pkgRes.data as WizardPackage[]);
      if (instRes.success && instRes.data) setInstructors(instRes.data as WizardInstructor[]);
      if (vehRes.success && vehRes.data) setVehicles(vehRes.data as WizardVehicle[]);

      setLoading(false);
    }

    loadInitialData();
  }, []);

  // Calculate live available slots whenever Instructor, Vehicle, or Date changes
  useEffect(() => {
    if (!selectedInstructor || !selectedDate) return;

    async function calculateLiveSlots() {
      setSlotsLoading(true);
      const res = await getAvailableSlotsAction({
        instructorId: selectedInstructor!.id,
        vehicleId: selectedVehicle?.id,
        dateStr: selectedDate,
      });

      if (res.success && res.data) {
        setSlots(res.data);
      }
      setSlotsLoading(false);
    }

    calculateLiveSlots();
  }, [selectedInstructor, selectedVehicle, selectedDate]);

  // Step A: Create Pending Booking Record in DB
  const handleCreatePendingBooking = async () => {
    if (!selectedPackage || !selectedInstructor || !selectedVehicle || !selectedDate || !selectedTimeSlot) {
      setError('Please complete all booking steps.');
      return;
    }

    if (isGuest && (!studentPhone || studentPhone.length < 10)) {
      setError('Please enter a valid 10-digit mobile phone number for your student account.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createBookingTransactionAction({
      packageId: selectedPackage.id,
      instructorId: selectedInstructor.id,
      vehicleId: selectedVehicle.id,
      dateStr: selectedDate,
      timeSlot: selectedTimeSlot,
      studentName,
      studentPhone,
      studentEmail,
      notes: notes,
    });

    if (!res.success || !res.booking) {
      setLoading(false);
      setError(res.error || 'Failed to create booking.');
      return;
    }

    setCreatedBookingId(res.booking.id);
    setPaymentStatus('PENDING');
    setStep(6); // Move to Razorpay Checkout step

    // Launch Razorpay Order & Checkout Modal immediately
    await launchRazorpayCheckout(res.booking.id);
  };

  // Step B: Create Razorpay Order & Trigger Checkout Modal
  const launchRazorpayCheckout = async (bookingId: string) => {
    setLoading(true);
    setError(null);

    const orderRes = await createRazorpayOrderAction(bookingId);
    setLoading(false);

    if (!orderRes.success) {
      setError(orderRes.error || 'Failed to initialize payment gateway.');
      return;
    }

    // Options for Razorpay Modal
    const options: any = {
      key: orderRes.keyId,
      amount: orderRes.amount,
      currency: orderRes.currency,
      name: 'DriveSuccess Academy',
      description: `Payment for ${orderRes.packageName}`,
      order_id: orderRes.orderId,
      prefill: {
        name: orderRes.studentName,
        email: orderRes.studentEmail,
        contact: orderRes.studentPhone,
      },
      theme: {
        color: '#F59E0B', // Amber
      },

      // Strict Backend Verification Callback
      handler: async function (response: any) {
        setLoading(true);
        setError(null);

        // Call Server Action for Cryptographic HMAC SHA256 Verification
        const verifyRes = await verifyPaymentSignatureAction({
          bookingId: bookingId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });

        setLoading(false);

        if (!verifyRes.success) {
          setPaymentStatus('FAILED');
          setError(verifyRes.error || 'Payment signature verification failed.');
          return;
        }

        setPaymentStatus('PAID');
        setSuccessMessage('Payment verified & Booking status set to CONFIRMED!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      },

      // Modal Dismiss / Failure Handler
      modal: {
        ondismiss: async function () {
          console.warn('Razorpay Checkout Modal Dismissed');
          await markPaymentFailedAction(bookingId, 'User closed checkout modal');
          setPaymentStatus('FAILED');
          setError('Payment process was cancelled or closed. You can retry payment below.');
        },
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response: any) {
        console.error('Razorpay Payment Failed Event:', response.error);
        await markPaymentFailedAction(bookingId, response.error?.description);
        setPaymentStatus('FAILED');
        setError(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } else {
      // Test fallback if SDK script blocked by adblocker
      console.warn('Razorpay script loading fallback simulation for test environment');
      simulateTestPaymentVerification(bookingId, orderRes.orderId || undefined);
    }
  };

  // Test Simulation Fallback
  const simulateTestPaymentVerification = async (bookingId: string, orderId?: string | null) => {
    setLoading(true);
    const mockPaymentId = `pay_sim_${Date.now()}`;
    const mockSig = `sig_sim_${Date.now()}`;

    // Verify Backend Action
    const verifyRes = await verifyPaymentSignatureAction({
      bookingId,
      razorpayOrderId: orderId || '',
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSig,
    });

    setLoading(false);

    if (verifyRes.success) {
      setPaymentStatus('PAID');
      setSuccessMessage('Payment verified & Booking status set to CONFIRMED!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-[#070B19] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
      
      {/* Slim Elegant Progress Line */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline text-xs uppercase tracking-widest text-slate-400 font-sans">
          <span className="font-serif text-lg text-slate-200 normal-case font-normal">
            Step <em className="italic text-amber-400 font-normal">{step}</em> of 6
          </span>
          <span className="text-amber-400 font-medium tracking-widest">
            {step === 1 && 'Select Driving Package'}
            {step === 2 && 'Select Certified Instructor'}
            {step === 3 && 'Select Training Vehicle'}
            {step === 4 && 'Select Date & Available Slot'}
            {step === 5 && 'Review Booking Summary'}
            {step === 6 && 'Complete Secure Payment'}
          </span>
        </div>
        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE PACKAGE */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-3">
              <Package className="w-6 h-6 text-amber-400" />
              <span>Select Driving Package</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Loaded live from database. Select your course package.</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-heading font-bold text-slate-100 text-base">{pkg.name}</h3>
                      <span className="font-heading font-extrabold text-lg text-amber-400">
                        ₹{pkg.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{pkg.description}</p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{pkg.sessionsCount} Practical Sessions</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              disabled={!selectedPackage}
              onClick={() => setStep(2)}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Next: Choose Instructor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE INSTRUCTOR */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-3">
              <User className="w-6 h-6 text-amber-400" />
              <span>Select Certified Instructor</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Choose a senior pedagogical instructor.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {instructors.map((inst) => {
              const isSelected = selectedInstructor?.id === inst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstructor(inst)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-slate-100 text-base">{inst.name}</h3>
                      <span className="text-[11px] text-slate-400">{inst.experienceYears} Years Exp</span>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      ★ {inst.rating}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {inst.specialties.map((spec) => (
                      <span key={spec} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedInstructor}
              onClick={() => setStep(3)}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Next: Choose Vehicle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE VEHICLE */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-3">
              <Car className="w-6 h-6 text-amber-400" />
              <span>Select Training Vehicle</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Dual-control certified fleet vehicles.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.map((veh) => {
              const isSelected = selectedVehicle?.id === veh.id;
              return (
                <div
                  key={veh.id}
                  onClick={() => setSelectedVehicle(veh)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-slate-100 text-base">{veh.name}</h3>
                      <span className="text-[11px] text-slate-400">{veh.transmission} Transmission</span>
                    </div>
                    <span className="font-heading font-bold text-amber-400 text-sm">
                      ₹{veh.ratePerSession}/sess
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{veh.tier.replace('_', ' ')}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedVehicle}
              onClick={() => setStep(4)}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Next: Select Date & Slots</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CALENDAR & AVAILABLE SLOTS */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-amber-400" />
              <span>Select Date & Calculated Available Slots</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live availability = Instructor Schedule minus Existing Bookings. Prevents double-booking automatically.
            </p>
          </div>

          <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Pick Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTimeSlot(null);
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl text-sm font-medium outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Available Time Slots for {selectedInstructor?.name}
            </label>

            {slotsLoading ? (
              <div className="text-center py-8 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                <p className="text-xs mt-2">Calculating available slots from database...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        !slot.available
                          ? 'bg-slate-950/50 border-slate-900 text-slate-600 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-amber-500/50'
                      }`}
                    >
                      <span>{slot.time}</span>
                      {!slot.available && <span className="block text-[9px] text-rose-500/80 no-underline mt-0.5">Booked</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedTimeSlot}
              onClick={() => setStep(5)}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Next: Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: BOOKING SUMMARY */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <span>Booking Summary</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Review details before creating pending booking and initializing Razorpay Checkout.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-bold">Booking Status</span>
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                PENDING
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Package:</span>
                <strong className="text-slate-100">{selectedPackage?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Instructor:</span>
                <strong className="text-slate-100">{selectedInstructor?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Vehicle:</span>
                <strong className="text-slate-100">{selectedVehicle?.name} ({selectedVehicle?.transmission})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date & Slot:</span>
                <strong className="text-amber-400">{selectedDate} at {selectedTimeSlot}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="text-slate-300 font-bold">Total Amount Payable:</span>
                <strong className="text-amber-400 font-extrabold text-lg">₹{selectedPackage?.price.toLocaleString()}</strong>
              </div>
            </div>

            {isGuest && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">
                    Student Account Details
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Instant Auto-Login Account
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. rahul@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3 py-2.5 rounded-xl text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instruction or request..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-3 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={loading}
              onClick={handleCreatePendingBooking}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-8 py-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Pending Booking & Pay via Razorpay</span>
                  <CreditCard className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: RAZORPAY CHECKOUT & RETRY */}
      {step === 6 && (
        <div className="space-y-6 text-center">
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-6">
            
            {paymentStatus === 'PAID' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-100">Payment Successful!</h3>
                <p className="text-xs text-slate-400">
                  Your payment was verified via HMAC SHA256 signature and booking status updated to <strong className="text-emerald-400">CONFIRMED</strong>.
                </p>
              </div>
            ) : paymentStatus === 'FAILED' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-100">Payment Failed or Cancelled</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your booking record (<code className="text-amber-400 font-mono">{createdBookingId}</code>) remains saved as <strong className="text-amber-400">PENDING</strong>. You can retry payment below without losing your slot.
                </p>
                <div className="pt-2 flex justify-center gap-4">
                  <button
                    disabled={loading}
                    onClick={() => createdBookingId && launchRazorpayCheckout(createdBookingId)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry Payment Now</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
                <h3 className="font-heading font-bold text-xl text-slate-100">Initializing Razorpay Checkout...</h3>
                <p className="text-xs text-slate-400">Please complete the payment modal.</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
