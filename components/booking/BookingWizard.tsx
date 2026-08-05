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
import { sendOtpAction, verifyOtpAction, loginWithVerifiedPhoneAction } from '@/actions/auth';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@/lib/firebase';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';

interface WizardPackage {
  id: string;
  name: string;
  price: number;
  sessionsCount: number;
  description: string;
  targetVehicleCategory?: string | null;
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

  // Category Tab filter for Step 1
  const [packageCategoryTab, setPackageCategoryTab] = useState<'ALL' | 'CRETA' | 'HONDACITY' | 'HATCHBACK'>('ALL');

  // Selected state
  const [selectedPackage, setSelectedPackage] = useState<WizardPackage | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<WizardInstructor | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<WizardVehicle | null>(null);

  // Smart vehicle auto-selection when a package is selected
  const handleSelectPackage = (pkg: WizardPackage, availableVehicles: WizardVehicle[]) => {
    setSelectedPackage(pkg);

    const cat = pkg.targetVehicleCategory || '';
    const nameLower = pkg.name.toLowerCase();

    if (cat === 'CRETA' || nameLower.includes('creta')) {
      const cretaVeh = availableVehicles.find((v) => v.name.toLowerCase().includes('creta'));
      if (cretaVeh) setSelectedVehicle(cretaVeh);
    } else if (cat === 'HONDACITY' || nameLower.includes('honda city')) {
      const hondaVeh = availableVehicles.find((v) => v.name.toLowerCase().includes('honda city'));
      if (hondaVeh) setSelectedVehicle(hondaVeh);
    } else if (cat === 'HATCHBACK' || nameLower.includes('hatchback')) {
      const hatchbackVeh = availableVehicles.find(
        (v) => !v.name.toLowerCase().includes('creta') && !v.name.toLowerCase().includes('honda city')
      );
      if (hatchbackVeh) setSelectedVehicle(hatchbackVeh);
    }
  };
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [initialPhone, setInitialPhone] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Inline Student Auth Portal State for Step 5
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupWizardRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    if ((window as any).wizardRecaptchaVerifier) {
      return (window as any).wizardRecaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, 'wizard-recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
    (window as any).wizardRecaptchaVerifier = verifier;
    return verifier;
  };

  const refreshSessionData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setIsGuest(false);
        setStudentName(data.user.name || '');
        setStudentPhone(data.user.phone || '');
        setInitialPhone(data.user.phone || '');
        setStudentEmail(data.user.email || '');
      } else {
        setIsGuest(true);
        setStudentName('');
        setStudentPhone('');
        setStudentEmail('');
      }
    } catch (err) {
      setIsGuest(true);
      setStudentName('');
      setStudentPhone('');
      setInitialPhone('');
      setStudentEmail('');
    }
  };

  const handleSendWizardOtp = async () => {
    if (!authPhone || authPhone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const formattedPhone = authPhone.startsWith('+') ? authPhone : `+91${authPhone.replace(/[^\d]/g, '')}`;

    try {
      // CAPTCHA-protected Firebase Phone SMS Auth
      const appVerifier = setupWizardRecaptcha();
      if (appVerifier) {
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setAuthMessage(`OTP sent successfully via SMS to ${formattedPhone}. Valid for 5 minutes.`);
        setAuthStep('OTP');
        setAuthLoading(false);
        return;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase SMS Auth fallback triggered:', firebaseErr);
    }

    // Fallback OTP action
    const res = await sendOtpAction(authPhone);
    setAuthLoading(false);

    if (!res.success) {
      setAuthError(res.error || 'Failed to send OTP.');
      return;
    }

    setAuthMessage(res.message || 'OTP sent successfully.');
    setAuthStep('OTP');
  };

  const handleVerifyWizardOtp = async () => {
    if (!authOtp || authOtp.length !== 6) {
      setAuthError('Please enter 6-digit OTP code.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    const formattedPhone = authPhone.startsWith('+') ? authPhone : `+91${authPhone.replace(/[^\d]/g, '')}`;

    if (confirmationResult) {
      try {
        await confirmationResult.confirm(authOtp);
        const loginRes = await loginWithVerifiedPhoneAction(formattedPhone);
        if (loginRes.success) {
          setAuthMessage('Phone authenticated successfully!');
          await refreshSessionData();
          setAuthLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Firebase verification failed, trying server verification...');
      }
    }

    const res = await verifyOtpAction(formattedPhone, authOtp);

    if (!res.success) {
      setAuthLoading(false);
      setAuthError(res.error || 'OTP verification failed.');
      return;
    }

    setAuthMessage('Phone authenticated successfully!');
    await refreshSessionData();
    setAuthLoading(false);
  };

  // Created Booking Record & Razorpay State
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'VERIFYING' | 'PAID' | 'FAILED'>('IDLE');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check current session
  useEffect(() => {
    refreshSessionData();
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

  const { launchRazorpayCheckout: launchHook } = useRazorpayCheckout();

  // Step A: Create Pending Booking Record in DB
  const handleCreatePendingBooking = async () => {
    if (!selectedPackage || !selectedInstructor || !selectedVehicle || !selectedDate || !selectedTimeSlot) {
      setError('Please complete all booking steps.');
      return;
    }

    if (!studentPhone || studentPhone.length < 10) {
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
    await launchHook(bookingId, {
      onLoading: (isLoading) => {
        setLoading(isLoading);
        // When loading starts AFTER the checkout modal closes (i.e., backend
        // verification is running), show the VERIFYING screen so the user
        // knows we are checking with the server — not a premature success.
        if (isLoading && paymentStatus === 'PENDING') {
          setPaymentStatus('VERIFYING');
        }
      },
      onError: (err) => {
        setPaymentStatus('FAILED');
        setError(err);
      },
      onSuccess: (msg) => {
        // Backend has confirmed. NOW set PAID — triggers the success screen.
        setPaymentStatus('PAID');
        setSuccessMessage(msg);
      },
      onDismiss: () => {
        setPaymentStatus('FAILED');
        setError('Payment process was cancelled or closed. You can retry payment below.');
      },
      onPaymentFailed: (err) => {
        setPaymentStatus('FAILED');
        setError(`Payment failed: ${err}`);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-hover space-y-8">
      
      {/* Slim Elegant Progress Line */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline text-xs uppercase tracking-widest text-slate-400 font-sans">
          <span className="font-serif text-lg text-slate-700 normal-case font-normal">
            Step <em className="italic text-blue-600 font-normal">{step}</em> of 6
          </span>
          <span className="text-blue-600 font-medium tracking-widest">
            {step === 1 && 'Select Driving Package'}
            {step === 2 && 'Select Certified Instructor'}
            {step === 3 && 'Select Training Vehicle'}
            {step === 4 && 'Select Date & Available Slot'}
            {step === 5 && 'Review Booking Summary'}
            {step === 6 && 'Complete Secure Payment'}
          </span>
        </div>
        <div className="h-1 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-400 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-400 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE PACKAGE */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <span>Select Driving Package</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Loaded live from database. Select your course package.</p>
          </div>

          {/* Vehicle Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            {[
              { id: 'ALL', label: 'All Packages' },
              { id: 'CRETA', label: 'Hyundai Creta SUV' },
              { id: 'HONDACITY', label: 'Honda City Sedan' },
              { id: 'HATCHBACK', label: 'Standard Hatchback' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPackageCategoryTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  packageCategoryTab === tab.id
                    ? 'bg-blue-600 text-slate-950 shadow-md shadow-blue-600/15'
                    : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages
                .filter((pkg) => {
                  if (packageCategoryTab === 'ALL') return true;
                  const cat = pkg.targetVehicleCategory || '';
                  const nameLower = pkg.name.toLowerCase();
                  if (packageCategoryTab === 'CRETA') return cat === 'CRETA' || nameLower.includes('creta');
                  if (packageCategoryTab === 'HONDACITY') return cat === 'HONDACITY' || nameLower.includes('honda city');
                  if (packageCategoryTab === 'HATCHBACK') return cat === 'HATCHBACK' || nameLower.includes('hatchback');
                  return true;
                })
                .map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg, vehicles)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-600/10'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-heading font-bold text-slate-900 text-base">{pkg.name}</h3>
                        <span className="font-heading font-extrabold text-lg text-blue-600">
                          ₹{pkg.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{pkg.description}</p>
                      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{pkg.sessionsCount} Practical Sessions</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
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
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
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
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
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
                      ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-600/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 text-base">{inst.name}</h3>
                      <span className="text-[11px] text-slate-400">{inst.experienceYears} Years Exp</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      ★ {inst.rating}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {inst.specialties.map((spec) => (
                      <span key={spec} className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
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
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedInstructor}
              onClick={() => setStep(3)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
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
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <Car className="w-6 h-6 text-blue-600" />
              <span>Select Training Vehicle</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Dual-control certified fleet vehicles.</p>
          </div>

          {/* Package Vehicle Lock Notice */}
          {selectedPackage && (
            <div className="p-4 bg-blue-50 border border-blue-300 text-blue-500 rounded-2xl text-xs flex items-center justify-between">
              <span>
                <strong>Selected Package:</strong> {selectedPackage.name}
              </span>
              <span className="text-[10px] bg-blue-600 text-slate-950 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {selectedPackage.targetVehicleCategory || 'Vehicle Auto-Matched'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.map((veh) => {
              const isSelected = selectedVehicle?.id === veh.id;
              const cat = selectedPackage?.targetVehicleCategory || '';
              const pkgName = selectedPackage?.name.toLowerCase() || '';
              const vehName = veh.name.toLowerCase();

              let isAllowed = true;
              if (cat === 'CRETA' || pkgName.includes('creta')) {
                isAllowed = vehName.includes('creta');
              } else if (cat === 'HONDACITY' || pkgName.includes('honda city')) {
                isAllowed = vehName.includes('honda city');
              } else if (cat === 'HATCHBACK' || pkgName.includes('hatchback')) {
                isAllowed = !vehName.includes('creta') && !vehName.includes('honda city');
              }

              return (
                <div
                  key={veh.id}
                  onClick={() => {
                    if (isAllowed) setSelectedVehicle(veh);
                  }}
                  className={`p-5 rounded-2xl border transition-all ${
                    !isAllowed
                      ? 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-600/10 cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 text-base">{veh.name}</h3>
                      <span className="text-[11px] text-slate-400">{veh.transmission} Transmission</span>
                    </div>
                    <span className="font-heading font-bold text-blue-600 text-sm">
                      ₹{veh.ratePerSession}/sess
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{veh.tier.replace('_', ' ')}</span>
                    {!isAllowed ? (
                      <span className="text-[10px] text-rose-400 font-medium">Not for selected package</span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-blue-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Selected
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedVehicle}
              onClick={() => setStep(4)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
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
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Select Date & Calculated Available Slots</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live availability = Instructor Schedule minus Existing Bookings. Prevents double-booking automatically.
            </p>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
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
              className="w-full bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-xl text-sm font-medium outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Available Time Slots for {selectedInstructor?.name}
            </label>

            {slotsLoading ? (
              <div className="text-center py-8 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
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
                          ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-blue-600 border-blue-600 text-slate-950 shadow-lg shadow-blue-600/15'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
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
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedTimeSlot}
              onClick={() => setStep(5)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
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
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <span>Booking Summary</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Review details before creating pending booking and initializing Razorpay Checkout.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <span className="text-xs text-slate-400 uppercase font-bold">Booking Status</span>
              <span className="bg-blue-50 border border-blue-300 text-blue-600 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                PENDING
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Package:</span>
                <strong className="text-slate-900">{selectedPackage?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Instructor:</span>
                <strong className="text-slate-900">{selectedInstructor?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Vehicle:</span>
                <strong className="text-slate-900">{selectedVehicle?.name} ({selectedVehicle?.transmission})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date & Slot:</span>
                <strong className="text-blue-600">{selectedDate} at {selectedTimeSlot}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="text-slate-600 font-bold">Total Amount Payable:</span>
                <strong className="text-blue-600 font-extrabold text-lg">₹{selectedPackage?.price.toLocaleString()}</strong>
              </div>
            </div>

            {isGuest ? (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-blue-600 tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Student Authentication Required</span>
                  </h4>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-300 uppercase font-extrabold">
                    Real OTP / Google Verification
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Please log in with your Mobile Phone OTP or Google Account to verify your student identity before proceeding to payment.
                </p>

                {/* Inline Auth Errors / Messages */}
                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}
                {authMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{authMessage}</span>
                  </div>
                )}

                {/* Invisible reCAPTCHA container for bot protection */}
                <div id="wizard-recaptcha-container"></div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                  {/* Phone OTP Section */}
                  {authStep === 'PHONE' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Enter Mobile Phone Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="Enter 10-digit mobile number"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-4 py-2.5 rounded-xl outline-none text-xs"
                        />
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={handleSendWizardOtp}
                          className="bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 shrink-0"
                        >
                          {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send OTP</span>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Enter 6-Digit OTP Code
                        </label>
                        <button
                          type="button"
                          onClick={() => setAuthStep('PHONE')}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Change Phone
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="••••••"
                          value={authOtp}
                          onChange={(e) => setAuthOtp(e.target.value.replace(/[^\d]/g, ''))}
                          className="flex-1 bg-white border border-slate-200 focus:border-blue-500 text-slate-900 text-center tracking-widest text-base font-bold py-2.5 rounded-xl outline-none"
                        />
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={handleVerifyWizardOtp}
                          className="bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 shrink-0"
                        >
                          {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Authenticate</span>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-[1px] bg-slate-100 flex-1" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">OR</span>
                    <div className="h-[1px] bg-slate-100 flex-1" />
                  </div>

                  {/* Google Sign In Button */}
                  <GoogleAuthProvider>
                    <GoogleSignInButton 
                      mode="popup"
                      onSuccess={async () => {
                        await refreshSessionData();
                      }}
                    />
                  </GoogleAuthProvider>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verified Student Account (Database Record)</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase font-extrabold">
                    Authenticated
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Student Name *</span>
                    {studentName ? (
                      <strong className="text-slate-900">{studentName}</strong>
                    ) : (
                      <input
                        type="text"
                        placeholder="Complete Full Name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Mobile Phone *</span>
                    {initialPhone ? (
                      <strong className="text-blue-600">{studentPhone}</strong>
                    ) : (
                      <input
                        type="tel"
                        placeholder="Add a contact number to continue"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value.replace(/[^\d+]/g, ''))}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Email Address</span>
                    {studentEmail ? (
                      <strong className="text-slate-900">{studentEmail}</strong>
                    ) : (
                      <input
                        type="email"
                        placeholder="Add Email (Optional)"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instruction or request..."
                rows={2}
                className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={loading || isGuest}
              onClick={handleCreatePendingBooking}
              className="bg-blue-600 hover:bg-blue-500 text-slate-950 font-extrabold px-8 py-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-600/15 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isGuest ? (
                <>
                  <span>Please Log In / Verify Phone to Pay 🔒</span>
                </>
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
          <div className="p-8 bg-white border border-slate-200 rounded-3xl space-y-6">

            {/* ── VERIFYING: Backend signature check in progress ───────── */}
            {paymentStatus === 'VERIFYING' && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900">Verifying Payment…</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Confirming your payment with our server via HMAC SHA256 signature verification.
                  <strong className="block mt-1 text-slate-600">Please do not close this page.</strong>
                </p>
              </div>
            )}

            {/* ── PAID: Backend confirmed ─────────────────────────────── */}
            {paymentStatus === 'PAID' && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-400 border border-emerald-300 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900">Payment Successful!</h3>
                <p className="text-xs text-slate-400">
                  Your payment was verified via HMAC SHA256 signature. Booking status updated to{' '}
                  <strong className="text-emerald-400">CONFIRMED</strong>.
                </p>
                <p className="text-[10px] text-slate-400">Redirecting to your Booking Confirmed page…</p>
              </div>
            )}

            {/* ── FAILED: Payment failed or dismissed ─────────────────── */}
            {paymentStatus === 'FAILED' && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-400 border border-rose-300 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900">Payment Failed or Cancelled</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your booking record (<code className="text-blue-600 font-mono">{createdBookingId}</code>) remains saved as{' '}
                  <strong className="text-blue-600">PENDING</strong>. You can retry payment below without losing your slot.
                </p>
                <div className="pt-2 flex justify-center gap-4">
                  <button
                    disabled={loading}
                    onClick={() => createdBookingId && launchRazorpayCheckout(createdBookingId)}
                    className="bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/15"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry Payment Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── DEFAULT: Initializing / waiting for Razorpay modal ─── */}
            {(paymentStatus === 'IDLE' || paymentStatus === 'PENDING') && !loading && (
              <div className="space-y-4">
                <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                <h3 className="font-heading font-bold text-xl text-slate-900">Initializing Razorpay Checkout…</h3>
                <p className="text-xs text-slate-400">Please complete the payment in the popup window.</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
