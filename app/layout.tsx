import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { JsonLdSchemas } from '@/components/seo/JsonLdSchemas';

const AIChatWidget = dynamic(() => import('@/components/ai/AIChatWidget').then((mod) => mod.AIChatWidget), { ssr: false });
const CookieConsentBanner = dynamic(() => import('@/components/privacy/CookieConsentBanner').then((mod) => mod.CookieConsentBanner), { ssr: false });
const BackToTop = dynamic(() => import('@/components/ui/BackToTop').then((mod) => mod.BackToTop), { ssr: false });

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] });

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://drivesuccess-next.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Vahathi Motor Driving School | DriveSuccess Academy Bengaluru',
    template: '%s | Vahathi Motor Driving School',
  },
  description:
    'Vahathi Motor Driving School (DriveSuccess Academy) - Professional driving lessons for Hyundai Creta SUV, Honda City, Swift & WagonR. 10 & 15 days packages with 2W & 4W RTO license support in Bengaluru. Call +91 7829780778.',
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
    title: 'Vahathi Motor Driving School | DriveSuccess Academy',
    description:
      'Master the road with confidence. Hyundai Creta SUV & Honda City dual-control fleet, certified instructors, flexible schedules, and RTO licensing support.',
    url: 'https://drivesuccess-next.vercel.app',
    siteName: 'Vahathi Motor Driving School',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vahathi Motor Driving School | DriveSuccess Academy',
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
      <body className="font-sans bg-white text-slate-900 min-h-screen flex flex-col antialiased selection:bg-blue-500/20 selection:text-blue-600">
        <JsonLdSchemas />
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
            {children}
          </main>

          <Footer />
          <AIChatWidget />
          <CookieConsentBanner />
          <BackToTop />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
