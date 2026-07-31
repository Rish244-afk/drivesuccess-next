import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '@/styles/globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AIChatWidget } from '@/components/ai/AIChatWidget';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' });

export const viewport: Viewport = {
  themeColor: '#0b192c',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://drivesuccess.edu'),
  title: {
    default: 'DriveSuccess Academy | Professional Driving School',
    template: '%s | DriveSuccess Academy',
  },
  description:
    'Empowering the next generation of safe drivers through structured sensor-led pedagogy, dual-control fleet, certified instructors, and RTO licensing support.',
  keywords: [
    'Driving School',
    'Driver License',
    'Driving Lessons',
    '4 Wheeler License',
    '2 Wheeler Training',
    'Dual Control Fleet',
    'RTO Licensing',
  ],
  authors: [{ name: 'DriveSuccess Academy' }],
  openGraph: {
    title: 'DriveSuccess Academy | Professional Driving School',
    description:
      'Master the road with confidence. Dual-control fleet, certified instructors, flexible schedules, and RTO licensing support.',
    url: 'https://drivesuccess.edu',
    siteName: 'DriveSuccess Academy',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DriveSuccess Academy | Professional Driving School',
    description: 'Master the road with confidence. Dual-control fleet & RTO licensing support.',
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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-body bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        
        {/* Accessibility Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-amber-500 focus:text-slate-950 font-bold text-xs"
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
      </body>
    </html>
  );
}
