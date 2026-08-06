'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  getBookingStatusAction,
} from '@/actions/bookingSystem';
import { getPackagesAction } from '@/actions/package';
// NOTE: createRazorpayOrderAction, verifyPaymentSignatureAction, and
// markPaymentFailedAction are consumed exclusively inside useRazorpayCheckout.
// They must NOT be imported here to prevent duplicate server-action calls.
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
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Step 1 to 6
  const [step, setStep] = useState<number>(1);

  // Scroll to top of wizard on step change, accounting for sticky header
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    if (containerRef.current) {
      const yOffset = -120; // 80px for header + 40px breathing room
      const y = containerRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [step]);



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

  useEffect(() => {
    if (authError && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      import('gsap').then(({ default: gsap }) => {
        const el = document.querySelector('.auth-error-box');
        if (el) {
          gsap.fromTo(el,
            { x: -6 },
            { x: 6, duration: 0.08, repeat: 5, yoyo: true, onComplete: () => gsap.set(el, { x: 0 }) }
          );
        }
      });
    }
  }, [authError]);

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
  // Loading overlay phase — drives the message shown in the full-screen overlay
  // while the user waits for booking creation / Razorpay init / verification.
  const [paymentPhase, setPaymentPhase] = useState<
    'idle' | 'creating-booking' | 'initializing-razorpay' | 'verifying-payment'
  >('idle');

  // Force scroll to top and lock viewport on mobile during full-screen overlay phases
  useEffect(() => {
    if (paymentPhase !== 'idle') {
      document.body.style.overflow = 'hidden';
      if (paymentPhase === 'verifying-payment') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [paymentPhase]);

  // ─────────────────────────────────────────────────────────────────────────
  // sessionStorage: resume a PARTIALLY completed booking after a page refresh.
  //
  // WHAT TO PERSIST: step position and selections (packages, instructor, etc.)
  // so an in-progress booking is not lost if the browser is refreshed.
  //
  // WHAT NEVER TO PERSIST:
  //   paymentStatus: 'PAID'    → booking is done; restoring PAID jumps straight
  //                              to the success screen on the NEXT visit.
  //   paymentStatus: 'VERIFYING' → mid-flight network state; meaningless on reload.
  //
  // WHEN TO ERASE: immediately when paymentStatus becomes PAID. The booking
  // record is already CONFIRMED in the database — there is nothing to recover.
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // resetWizard: wipes all in-memory state AND sessionStorage so the wizard
  // starts cleanly from Step 1. Called by:
  //   • ?reset=1 query param on mount  ("Reserve Session" navbar button)
  //   • "Cancel Booking" button on the Step 6 failure screen
  // ─────────────────────────────────────────────────────────────────────────
  const resetWizard = useCallback(() => {
    sessionStorage.removeItem('wizard_state');
    setStep(1);
    setSelectedPackage(null);
    setSelectedInstructor(null);
    setSelectedVehicle(null);
    setSelectedDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setSelectedTimeSlot(null);
    setNotes('');
    setCreatedBookingId(null);
    setPaymentStatus('IDLE');
    setPaymentPhase('idle');
    setLoading(false);
    setError(null);
    setSuccessMessage(null);
  }, []);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    // ── BUG 2 FIX: ?reset=1 query parameter ─────────────────────────────────
    // The "Reserve Session" navbar button navigates to /book?reset=1.
    // When detected here, we immediately wipe sessionStorage and start fresh,
    // ignoring any previously saved wizard state. This guarantees the wizard
    // always opens at Step 1 regardless of the user's previous session.
    if (searchParams.get('reset') === '1') {
      sessionStorage.removeItem('wizard_state');
      isInitialMount.current = false;
      // Replace the URL to remove ?reset=1 without adding a new history entry.
      // This prevents the browser Back button from re-triggering the reset.
      router.replace('/book', { scroll: false });
      return;
    }

    const saved = sessionStorage.getItem('wizard_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Safety guard: never restore a completed or mid-verification state.
        // If the user lands on /book after a successful booking, start fresh.
        if (parsed.paymentStatus === 'PAID' || parsed.paymentStatus === 'VERIFYING') {
          sessionStorage.removeItem('wizard_state');
          isInitialMount.current = false;
          return;
        }

        if (parsed.step) setStep(parsed.step);
        if (parsed.selectedPackage) setSelectedPackage(parsed.selectedPackage);
        if (parsed.selectedInstructor) setSelectedInstructor(parsed.selectedInstructor);
        if (parsed.selectedVehicle) setSelectedVehicle(parsed.selectedVehicle);
        if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
        if (parsed.selectedTimeSlot) setSelectedTimeSlot(parsed.selectedTimeSlot);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.studentPhone) {
          setStudentPhone(parsed.studentPhone);
          setInitialPhone(parsed.studentPhone);
        }
        if (parsed.studentEmail) setStudentEmail(parsed.studentEmail);
        if (parsed.createdBookingId) setCreatedBookingId(parsed.createdBookingId);
        // Only restore FAILED or PENDING states — these allow retry without
        // losing the bookingId. PAID and VERIFYING are intentionally excluded.
        if (parsed.paymentStatus === 'FAILED' || parsed.paymentStatus === 'PENDING') {
          setPaymentStatus(parsed.paymentStatus);
        }

        // P-05 RECOVERY: If we restored step=6 with a bookingId, the user
        // refreshed during or after payment. Trigger an on-mount status check
        // to determine the true backend state before rendering anything.
        if (parsed.step === 6 && parsed.createdBookingId) {
          setIsRecoveringState(true);
        }
      } catch (e) {
        console.error('Failed to parse wizard state', e);
        sessionStorage.removeItem('wizard_state');
      }
    }
    // Set flag to allow saving state on subsequent renders
    isInitialMount.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to sessionStorage whenever it changes.
  // When payment is PAID: erase the entry entirely (booking complete, nothing to recover).
  // When VERIFYING: skip saving (transient mid-flight state, meaningless on reload).
  useEffect(() => {
    if (isInitialMount.current) return;

    // Completed: erase storage so next visit starts fresh.
    if (paymentStatus === 'PAID') {
      sessionStorage.removeItem('wizard_state');
      return;
    }

    // Transient verification state: do not persist — useless on reload.
    if (paymentStatus === 'VERIFYING') return;

    const state = {
      step,
      selectedPackage,
      selectedInstructor,
      selectedVehicle,
      selectedDate,
      selectedTimeSlot,
      notes,
      studentName,
      studentPhone,
      studentEmail,
      createdBookingId,
      paymentStatus,
    };
    sessionStorage.setItem('wizard_state', JSON.stringify(state));
  }, [step, selectedPackage, selectedInstructor, selectedVehicle, selectedDate, selectedTimeSlot, notes, studentName, studentPhone, studentEmail, createdBookingId, paymentStatus]);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // P-05: true while we are querying the backend to determine booking status after
  // a page refresh during Step 6. Prevents rendering stale "Complete Payment" UI.
  const [isRecoveringState, setIsRecoveringState] = useState<boolean>(false);

  // Automatically clear stale validation errors whenever the user changes steps
  useEffect(() => {
    setError(null);
  }, [step]);

  // ─── P-05: POST-REFRESH BOOKING STATE RECOVERY ────────────────────────────
  // Fires once when isRecoveringState becomes true (set in the sessionStorage
  // restore effect when step=6 + createdBookingId are both present).
  //
  // This effect is READ-ONLY — it never re-runs payment verification.
  // It queries the DB for the current booking/payment status and dispatches
  // the user to the correct frontend state based on the full state matrix.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecoveringState || !createdBookingId) return;

    async function recoverPaymentState() {
      console.log(`[P-05 Recovery] Starting recovery for booking: ${createdBookingId}`);
      try {
        const result = await getBookingStatusAction(createdBookingId!);
        console.log(`[P-05 Recovery] getBookingStatusAction result:`, result);

        if (!result.success) {
          console.log(`[P-05 Recovery] Action failed. Reason: ${result.error}. Resetting wizard.`);
          sessionStorage.removeItem('wizard_state');
          resetWizard();
          setError(`Could not find your booking (${result.error}). Please start a new booking.`);
          setIsRecoveringState(false);
          return;
        }

        const { bookingStatus, paymentStatus: dbPaymentStatus } = result;
        console.log(`[P-05 Recovery] Current state -> Booking: ${bookingStatus}, Payment: ${dbPaymentStatus}`);

        // ── Terminal success states ────────────────────────────────────────────
        // CONFIRMED/COMPLETED + PAID/REFUNDED → confirmation page
        if (
          (bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED') &&
          (dbPaymentStatus === 'PAID' || dbPaymentStatus === 'REFUNDED')
        ) {
          console.log('[P-05 Recovery] Terminal success state. Navigating to confirmation.');
          sessionStorage.removeItem('wizard_state');
          setIsRecoveringState(false);
          router.replace(`/booking/${createdBookingId}/confirmation`);
          return;
        }

        // COMPLETED + PAID (all sessions done) → dashboard
        if (bookingStatus === 'COMPLETED' && dbPaymentStatus === 'PAID') {
          console.log('[P-05 Recovery] Terminal completed state. Navigating to dashboard.');
          sessionStorage.removeItem('wizard_state');
          setIsRecoveringState(false);
          router.replace('/dashboard');
          return;
        }

        // PENDING booking + PAID payment (webhook lag window) → confirmation
        if (bookingStatus === 'PENDING' && dbPaymentStatus === 'PAID') {
          console.log('[P-05 Recovery] Pending + Paid state. Navigating to confirmation.');
          sessionStorage.removeItem('wizard_state');
          setIsRecoveringState(false);
          router.replace(`/booking/${createdBookingId}/confirmation`);
          return;
        }

        // ── Cancelled states ───────────────────────────────────────────────────
        if (bookingStatus === 'CANCELLED') {
          console.log(`[P-05 Recovery] Cancelled state. Payment: ${dbPaymentStatus}. Resetting wizard.`);
          sessionStorage.removeItem('wizard_state');
          resetWizard();
          if (dbPaymentStatus === 'REFUNDED') {
            setError('Your booking was cancelled and a refund was issued. Please check your dashboard for details.');
          } else if (dbPaymentStatus === 'FAILED') {
            setError('Your booking was cancelled after a failed payment. Please start a new booking.');
          } else {
            setError('Your booking has expired or was cancelled. Please start a new booking.');
          }
          setIsRecoveringState(false);
          return;
        }

        // ── Recoverable states — stay on Step 6 ───────────────────────────────
        // PENDING booking + FAILED payment → retry screen
        if (bookingStatus === 'PENDING' && dbPaymentStatus === 'FAILED') {
          console.log('[P-05 Recovery] Recoverable failed state. Displaying retry screen.');
          setPaymentStatus('FAILED');
          setIsRecoveringState(false);
          return;
        }

        // PENDING booking + PENDING payment → "Complete Payment" screen (user can retry)
        if (bookingStatus === 'PENDING' && dbPaymentStatus === 'PENDING') {
          console.log('[P-05 Recovery] Recoverable pending state. Displaying Razorpay waiting screen.');
          setPaymentStatus('PENDING');
          setIsRecoveringState(false);
          return;
        }

        // ── Unexpected combination — safe fallback ─────────────────────────────
        console.warn('[P-05 Recovery] Unexpected booking state combination:', { bookingStatus, dbPaymentStatus });
        sessionStorage.removeItem('wizard_state');
        resetWizard();
        setError('An unexpected booking state was detected. Please start a new booking or contact support.');
        setIsRecoveringState(false);
      } catch (err) {
        console.error('[P-05 Recovery] Exception during recovery:', err);
        sessionStorage.removeItem('wizard_state');
        resetWizard();
        setError('A network error occurred while verifying your booking. Please check your dashboard.');
        setIsRecoveringState(false);
      }
    }

    recoverPaymentState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecoveringState]);


  // Automatically clear stale validation errors and reset created booking ID
  // whenever any key booking selection changes (date, slot, instructor, vehicle, package).
  // This guarantees that picking a new slot starts with a clean slate and creates
  // a fresh booking transaction rather than reusing a stale or conflicting booking record.
  useEffect(() => {
    setError(null);
    setCreatedBookingId((prevId) => (paymentStatus === 'PAID' ? prevId : null));
    if (paymentStatus !== 'PAID') {
      setPaymentStatus('IDLE');
    }
  }, [selectedPackage, selectedInstructor, selectedVehicle, selectedDate, selectedTimeSlot]);

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
    if (paymentStatus === 'PAID') {
      console.warn('Booking is already paid. Ignoring create request.');
      return;
    }
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
    setPaymentPhase('creating-booking');

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
      setPaymentPhase('idle');
      setError(res.error || 'Failed to create booking.');
      return;
    }

    setCreatedBookingId(res.booking.id);
    setPaymentStatus('PENDING');
    setPaymentPhase('initializing-razorpay');
    setStep(6);

    // Launch Razorpay Order & Checkout Modal immediately
    await launchRazorpayCheckout(res.booking.id);
  };

  // Step B: Create Razorpay Order & Trigger Checkout Modal
  const launchRazorpayCheckout = async (bookingId: string) => {
    if (paymentStatus === 'PAID') {
      console.warn('Payment already successful. Ignoring checkout launch.');
      return;
    }
    await launchHook(bookingId, {
      onLoading: (isLoading) => {
        setLoading(isLoading);
        if (!isLoading) {
          // Order created — overlay off, Razorpay modal is about to open.
          setPaymentPhase('idle');
        }
      },
      onVerifying: () => {
        // Razorpay handler fired — user completed payment in the modal.
        // Show VERIFYING immediately before the backend round-trip.
        setPaymentStatus('VERIFYING');
        setPaymentPhase('verifying-payment');
      },
      onError: (err) => {
        // ALWAYS ensure phase/loading are cleared so the overlay is removed.
        setPaymentPhase('idle');
        setLoading(false);
        // Only update paymentStatus and show the error for real (non-empty) messages.
        // The hook calls onError('') on initialization to clear the previous error
        // display — that empty-string call must NOT set paymentStatus to FAILED.
        if (err) {
          setPaymentStatus('FAILED');
          setError(err);
        }
      },
      onSuccess: (msg) => {
        // ── FAILURE POINT 1 FIX ─────────────────────────────────────────────
        // Wipe sessionStorage SYNCHRONOUSLY before any React state setter.
        //
        // Without this, the save-state useEffect can fire in the same render
        // batch as setPaymentStatus('PAID') but with a stale closure where
        // paymentStatus is still 'PENDING', writing step:6 + PENDING back
        // to storage right before the wipe. The 2-second navigation timer
        // then moves the user away before the wipe effect has committed.
        //
        // Doing it here — synchronously, in the callback — is guaranteed to
        // run BEFORE React schedules any re-renders or effects.
        // ────────────────────────────────────────────────────────────────────
        sessionStorage.removeItem('wizard_state');

        // Backend has verified. Only NOW set PAID — shows "Payment Successful".
        setPaymentStatus('PAID');
        setPaymentPhase('idle');
        setLoading(false);
        setSuccessMessage(msg);
      },
      onDismiss: () => {
        // ── BUG 1 FIX ────────────────────────────────────────────────────────
        // This callback is now called from the `finally` block in the hook,
        // guaranteeing it fires even when markPaymentFailedAction throws.
        // ─────────────────────────────────────────────────────────────────────
        setPaymentStatus('FAILED');
        setPaymentPhase('idle');
        setLoading(false);
        setError('Payment was not completed. Your booking slot is still reserved. You can retry or return to booking.');
      },
      onPaymentFailed: (err) => {
        // ── BUG 1 FIX ────────────────────────────────────────────────────────
        // Also called from `finally` — guaranteed to fire even on backend errors.
        // ─────────────────────────────────────────────────────────────────────
        setPaymentStatus('FAILED');
        setPaymentPhase('idle');
        setLoading(false);
        setError(`Payment declined: ${err}`);
      },
    });
  };

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] BookingWizard state changed - step: ${step}, paymentStatus: ${paymentStatus}, paymentPhase: ${paymentPhase}`);
  }, [step, paymentStatus, paymentPhase]);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto relative">

      {/* ─── FULL-SCREEN LOADING OVERLAY ─────────────────────────────────────
          Shown during: booking creation, Razorpay init, payment verification.
          Blocks all background UI so no intermediate state can flash through.
          ─────────────────────────────────────────────────────────────────── */}
      {paymentPhase !== 'idle' && (
        <div className="fixed top-0 left-0 h-[100dvh] w-screen z-[9999] flex items-center justify-center bg-white/95">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
            {/* Animated ring spinner */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                {paymentPhase === 'verifying-payment' ? (
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                ) : (
                  <CreditCard className="w-8 h-8 text-blue-600" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold text-slate-900">
                {paymentPhase === 'creating-booking' && 'Creating your booking…'}
                {paymentPhase === 'initializing-razorpay' && 'Connecting to Razorpay…'}
                {paymentPhase === 'verifying-payment' && 'Verifying Payment…'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {paymentPhase === 'creating-booking' &&
                  'Reserving your slot and preparing your booking record. This takes just a moment.'}
                {paymentPhase === 'initializing-razorpay' &&
                  'Preparing your secure payment session. The Razorpay checkout will open shortly.'}
                {paymentPhase === 'verifying-payment' &&
                  'Confirming your payment with your bank and generating your booking receipt. This usually takes 2-3 seconds.'}
              </p>
              {paymentPhase === 'verifying-payment' && (
                <p className="text-[11px] font-semibold text-slate-600 mt-2">
                  Please do not close or refresh this page.
                </p>
              )}
            </div>

            {/* Pulsing progress dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-hover space-y-8">
      
      {/* Slim Elegant Progress Line */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline text-xs uppercase tracking-widest text-slate-400 font-sans">
          <span className="font-serif text-lg text-slate-700 normal-case font-normal whitespace-nowrap">
            Step <em className="italic text-blue-600 font-normal">{step}</em> of 6
          </span>
          <span className="hidden sm:inline text-blue-600 font-medium tracking-widest text-right">
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

      {/* Error Alert – moved to above the payment button for in-viewport visibility */}


      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-400 rounded-xl text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE PACKAGE */}
      {step === 1 && (
        <div className="space-y-6 pb-24 sm:pb-0">
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
            <div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory hide-scrollbar gap-4 pb-4 sm:pb-0">
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
                      className={`min-w-[85vw] sm:min-w-0 snap-center p-5 rounded-2xl border cursor-pointer transition-all ${
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

          <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur border-t border-slate-200 sm:border-0 z-40 pb-safe flex justify-end sm:pt-4">
            <button
              disabled={!selectedPackage}
              onClick={() => setStep(2)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-4 sm:py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Next: Choose Instructor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE INSTRUCTOR */}
      {step === 2 && (
        <div className="space-y-6 pb-24 sm:pb-0">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <span>Select Certified Instructor</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Choose a senior pedagogical instructor.</p>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory hide-scrollbar gap-4 pb-4 sm:pb-0">
            {instructors.map((inst) => {
              const isSelected = selectedInstructor?.id === inst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstructor(inst)}
                  className={`min-w-[85vw] sm:min-w-0 snap-center p-5 rounded-2xl border cursor-pointer transition-all ${
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

          <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur border-t border-slate-200 sm:border-0 z-40 pb-safe flex items-center justify-between gap-3 sm:pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-4 sm:py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedInstructor}
              onClick={() => setStep(3)}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-4 sm:py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Next: Choose Vehicle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE VEHICLE */}
      {step === 3 && (
        <div className="space-y-6 pb-24 sm:pb-0">
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

          <div className="flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory hide-scrollbar gap-4 pb-4 sm:pb-0">
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
                  className={`min-w-[85vw] sm:min-w-0 snap-center p-5 rounded-2xl border transition-all ${
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

          <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur border-t border-slate-200 sm:border-0 z-40 pb-safe flex items-center justify-between gap-3 sm:pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-4 sm:py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedVehicle}
              onClick={() => setStep(4)}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-4 sm:py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Next: Select Date & Slots</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CALENDAR & AVAILABLE SLOTS */}
      {step === 4 && (
        <div className="space-y-6 pb-24 sm:pb-0">
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

          <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur border-t border-slate-200 sm:border-0 z-40 pb-safe flex items-center justify-between gap-3 sm:pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-4 sm:py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={!selectedTimeSlot}
              onClick={() => setStep(5)}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-slate-950 font-bold px-6 py-4 sm:py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Next: Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: BOOKING SUMMARY */}
      {step === 5 && (
        <div className="space-y-6 pb-24 sm:pb-0">
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
                  <div className="auth-error-box p-3 bg-rose-50 border border-rose-300 text-rose-300 rounded-xl text-xs flex items-center gap-2">
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
                          className="flex-1 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:scale-[1.01] text-slate-900 px-4 py-2.5 rounded-xl outline-none text-xs transition-all duration-200"
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

          <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur border-t border-slate-200 sm:border-0 z-40 pb-safe flex flex-col gap-3 sm:pt-4">
            {/* Validation error — rendered directly above the payment button so it stays in viewport */}
            {error && (
              <div role="alert" aria-live="assertive" className="p-3 bg-rose-50 border border-rose-300 text-rose-600 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setError(null);
                setCreatedBookingId(null);
                setPaymentStatus('IDLE');
                setStep(4);
              }}
              className="px-6 py-4 sm:py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
            >
              Back
            </button>
            <button
              disabled={loading || isGuest}
              onClick={handleCreatePendingBooking}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-slate-950 font-extrabold px-4 sm:px-8 py-4 sm:py-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/15 disabled:opacity-50"
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
        </div>
      )}

      {/* STEP 6: RAZORPAY CHECKOUT & RETRY */}
      {step === 6 && (
        <div className="space-y-6 text-center">
          <div className="p-10 bg-white border border-slate-100 rounded-3xl space-y-6">

            {/* ── P-05: Recovery loading gate ───────────────────────────────
                Shown while the post-refresh status check is in progress.
                Prevents any stale sub-state (PENDING, FAILED, etc.) from
                flashing before the backend has confirmed the real state.
                ─────────────────────────────────────────────────────────── */}
            {isRecoveringState && (
              <div className="space-y-5">
                <div className="w-20 h-20 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-slate-900">Checking your booking…</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    We are confirming the status of your booking. This takes just a moment.
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">Please do not close or refresh this page.</p>
                </div>
              </div>
            )}

            {/* ── VERIFYING: Backend signature check in progress ─────── */}
            {!isRecoveringState && paymentStatus === 'VERIFYING' && (
              <VerifyingPaymentLogger />
            )}


            {/* ── PAID: Backend confirmed ──────────────────────────────── */}
            {!isRecoveringState && paymentStatus === 'PAID' && (
              <PaidPaymentLogger />
            )}

            {/* ── FAILED / CANCELLED: Show retry options ───────────────── */}
            {!isRecoveringState && paymentStatus === 'FAILED' && (
              <div className="space-y-5">
                <div className="w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-slate-900">Payment Failed or Cancelled</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Your booking slot is still reserved (status: <strong className="text-blue-600">PENDING</strong>).
                    No duplicate booking will be created if you retry.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    disabled={loading}
                    onClick={() => {
                      setError(null);
                      createdBookingId && launchRazorpayCheckout(createdBookingId);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry Payment</span>
                  </button>
                  <button
                    onClick={() => { setStep(5); setPaymentStatus('IDLE'); setPaymentPhase('idle'); setError(null); }}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition"
                  >
                    Back to Booking
                  </button>
                  <button
                    onClick={resetWizard}
                    className="border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            )}

            {/* ── PENDING / IDLE: Razorpay modal is open, waiting ──────── */}
            {!isRecoveringState && (paymentStatus === 'IDLE' || paymentStatus === 'PENDING') && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-slate-50 border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto">
                  <CreditCard className="w-10 h-10 text-slate-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-slate-900">Complete Payment</h3>
                  <p className="text-xs text-slate-500">Please complete your payment in the Razorpay popup window.</p>
                  <p className="text-[11px] text-slate-400">Do not close or refresh this page while the payment window is open.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
    </div>
  );
}

// Subcomponents to log lifecycle precisely
function VerifyingPaymentLogger() {
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] VERIFYING component mounted and rendered in DOM`);
    return () => console.log(`[${new Date().toISOString()}] VERIFYING component unmounted`);
  }, []);

  return (
    <div className="space-y-5">
      <div className="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto">
        <ShieldCheck className="w-10 h-10 text-blue-600 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h3 className="font-serif text-2xl text-slate-900">Verifying Payment…</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Your payment is being cryptographically verified via HMAC SHA256 signature.
        </p>
        <p className="text-[11px] font-semibold text-slate-600">
          Please do not close or refresh this page.
        </p>
      </div>
    </div>
  );
}

function PaidPaymentLogger() {
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] PAID component mounted and rendered in DOM`);
    return () => console.log(`[${new Date().toISOString()}] PAID component unmounted`);
  }, []);

  return (
    <div className="space-y-5">
      <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <div className="space-y-2">
        <h3 className="font-serif text-2xl text-slate-900">Payment Successful!</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          ✓ Your payment has been verified securely.
        </p>
        <p className="text-xs text-slate-500">
          Booking status updated to{' '}
          <strong className="text-emerald-600">CONFIRMED</strong>.
        </p>
        <p className="text-[11px] text-slate-400 animate-pulse">Redirecting to your Booking Confirmed page…</p>
      </div>
    </div>
  );
}
