import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { JsonLdSchemas } from '@/components/seo/JsonLdSchemas';
import { PageTransitionProvider } from '@/components/providers/PageTransitionProvider';
import { PremiumCursor } from '@/components/ui/PremiumCursor';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BottomNav } from '@/components/ui/BottomNav';

const AIChatWidget = dynamic(() => import('@/components/ai/AIChatWidget').then((mod) => mod.AIChatWidget), { ssr: false });
const CookieConsentBanner = dynamic(() => import('@/components/privacy/CookieConsentBanner').then((mod) => mod.CookieConsentBanner), { ssr: false });
const BackToTop = dynamic(() => import('@/components/ui/BackToTop').then((mod) => mod.BackToTop), { ssr: false });

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] });

export const viewport: Viewport = {
  themeColor: '#F4F0E8',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://drivesuccess-next.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Vahathi Motor Driving School | Certified Driving Institution Bengaluru',
    template: '%s | Vahathi Motor Driving School',
  },
  description:
    'Vahathi Motor Driving School - Professional driving lessons for Hyundai Creta SUV, Honda City, Swift & WagonR. 10 & 15 days packages with 2W & 4W RTO license support in Bengaluru. Call +91 7829780778.',
  keywords: [
    'Driving School Bengaluru',
    'Vahathi Motor Driving School',
    'Creta SUV Driving Training',
    'Honda City Driving Lessons',
    '4 Wheeler Driving License',
    '2 Wheeler Training',
    'Dual Control Fleet',
    'RTO Licensing Support BTM Stage 2',
  ],
  authors: [{ name: 'Vahathi Motor Driving School' }],
  openGraph: {
    title: 'Vahathi Motor Driving School',
    description:
      'Master the road with confidence. Hyundai Creta SUV & Honda City dual-control fleet, certified instructors, flexible schedules, and RTO licensing support.',
    url: 'https://drivesuccess-next.vercel.app',
    siteName: 'Vahathi Motor Driving School',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vahathi Motor Driving School',
    description: 'Master the road with confidence. Dual-control fleet & RTO licensing support in Bengaluru.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-[#F4F0E8] text-[#2B3B2B] min-h-screen flex flex-col antialiased selection:bg-[#2B3B2B]/20 selection:text-[#2B3B2B]">
        <JsonLdSchemas />
        <PremiumCursor />
        <LoadingScreen />
        <SmoothScrollProvider>
          {/* Accessibility Skip Link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded-lg font-bold text-xs"
          >
            Skip to main content
          </a>

          <Navbar />

          {/* Main Accessibility Landmark */}
          <main id="main-content" className="flex-1" tabIndex={-1}>
            <PageTransitionProvider>
              {children}
            </PageTransitionProvider>
          </main>

          <Footer />
          <BottomNav />
          <AIChatWidget />
          <CookieConsentBanner />
          <BackToTop />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
