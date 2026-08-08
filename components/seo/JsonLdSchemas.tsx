import React from 'react';

export function JsonLdSchemas() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    name: 'Vahathi Motor Driving School',
    image: 'https://drivesuccess-next.vercel.app/images/hero_bg.jpg',
    '@id': 'https://drivesuccess-next.vercel.app/#organization',
    url: 'https://drivesuccess-next.vercel.app',
    telephone: '+917829780778',
    priceRange: '₹4,500 - ₹18,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '29th Main Road, BTM 2nd Stage',
      addressLocality: 'Bengaluru',
      addressRegion: 'Karnataka',
      postalCode: '560076',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 12.9166,
      longitude: 77.6101,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '06:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: '07:00',
        closes: '14:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.95',
      reviewCount: '1250',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Driving School Courses & Packages',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '10 Days Hatchback Practical Driving Course',
          },
          price: '4500',
          priceCurrency: 'INR',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '15 Days Honda City Sedan Mastery Course',
          },
          price: '8500',
          priceCurrency: 'INR',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: '15 Days Hyundai Creta SUV Luxury Driving Package',
          },
          price: '18000',
          priceCurrency: 'INR',
        },
      ],
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What driving packages are offered at Vahathi Motor Driving School?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer 10-day and 15-day comprehensive driving courses across Hatchback (Swift/WagonR), Sedan (Honda City), and Luxury SUV (Hyundai Creta) tiers with dual-control vehicles and RTO license support.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Vahathi Motor Driving School provide RTO licensing assistance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! We provide complete end-to-end 2-Wheeler (2W) and 4-Wheeler (4W) RTO Learner and Permanent Driving License application support in Bengaluru.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where is Vahathi Motor Driving School located?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our primary academy and practical driving track is located at 29th Main Road, BTM 2nd Stage, Bengaluru, Karnataka 560076. Call +91 7829780778.',
        },
      },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://drivesuccess-next.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses & Packages',
        item: 'https://drivesuccess-next.vercel.app/courses',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Vehicle Fleet',
        item: 'https://drivesuccess-next.vercel.app/fleet',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Book Training Session',
        item: 'https://drivesuccess-next.vercel.app/book',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
