import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vahathi Motor Driving School - DriveSuccess Academy',
    short_name: 'DriveSuccess',
    description:
      'Certified driving school in Bengaluru with Hyundai Creta, Honda City & Hatchback fleet, 10/15 days training, and 2W/4W RTO licensing support.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080c14',
    theme_color: '#F59E0B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
