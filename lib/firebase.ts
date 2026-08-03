import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, GoogleAuthProvider as FirebaseGoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA0deq7JNh5ySpdiH_YLEFAxtADG0L4U-Y',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'drivesuccess-academy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'drivesuccess-academy',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'drivesuccess-academy.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '194979861459',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:194979861459:web:b0b849777500c357719526',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleAuthProvider = new FirebaseGoogleAuthProvider();

export { auth, RecaptchaVerifier, signInWithPhoneNumber, googleAuthProvider, signInWithPopup };
export type { ConfirmationResult };
