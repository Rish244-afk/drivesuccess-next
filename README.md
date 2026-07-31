# 🏎️ DriveSuccess Academy — Production Ready Next.js 14 Platform

> Production-ready, full-stack Next.js 14 (App Router) driving school web application featuring real phone SMS OTP authentication, database-driven booking concurrency engine, Razorpay payment webhooks, student dashboard, separate admin portal, multi-channel notifications (Resend email & WhatsApp), AI assistant with live database function calling, and strict production security.

---

## 🛠️ Technology Stack

- **Core Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript 5+ (Strict Mode)
- **Styling**: Tailwind CSS, Vanilla CSS Glassmorphism
- **Database & ORM**: PostgreSQL (Supabase / Vercel Postgres) + Prisma ORM 5.22
- **Authentication**: Real Phone SMS OTP (MSG91 Gateway) + 30-Day Rolling `jose` JWT HTTP-Only Cookies
- **Payment Gateway**: Razorpay (Cryptographic HMAC SHA256 Signature Verification & Webhooks)
- **State & Form Handling**: Zustand, React Hook Form, Zod Validation
- **Animations**: Framer Motion
- **Icons & UI**: Lucide React
- **Notifications**: Resend Email API, WhatsApp Dispatcher, In-App PostgreSQL Notifications
- **AI Assistant**: DriveAI Engine with Database Tool Function Calling (`checkAvailability`, `createBooking`, `getFAQAnswer`)

---

## 📁 Project Directory Structure

```
/drivesuccess-next
├── /actions            # Server Actions (Auth, Bookings, Admin, Razorpay, Notifications, AI)
├── /app                # App Router Routes & API Handlers
│   ├── /admin          # Separate Admin Control Center (Overview, Bookings, Packages, Fleet, Instructors)
│   ├── /api            # API Routes (Auth, Payments, Webhooks, Notifications, AI, Health)
│   ├── /auth           # SMS OTP Student Login Portal
│   ├── /book           # 6-Step Booking Wizard & Payment Checkout
│   ├── /courses        # Database-Driven Course Packages Page
│   ├── /dashboard       # Authenticated Student Dashboard & Progress Tracker
│   ├── /fleet          # Learning Vehicles Fleet Page
│   ├── /contact        # Contact & Pickup Location Info
│   ├── layout.tsx      # Root Layout with OpenGraph Metadata & Accessibility
│   ├── loading.tsx     # Animated Loading Skeleton Page
│   ├── error.tsx       # Interactive Error Boundary Page
│   ├── not-found.tsx   # Custom 404 Page
│   ├── robots.ts       # Dynamic Robots.txt Crawler Configuration
│   └── sitemap.ts      # Dynamic XML Sitemap
├── /components         # Modern Glassmorphic Components & UI Widgets
│   ├── /admin          # Admin Dashboard & CRUD Client Interfaces
│   ├── /ai             # Floating AI Chat Widget with Live Tool Invocations
│   ├── /booking        # 6-Step Interactive Booking Wizard
│   ├── /dashboard      # Authenticated Student Dashboard Client
│   ├── Footer.tsx      # 4-Column Responsive Footer
│   ├── Navbar.tsx      # Sticky Navbar with Notification Bell
│   └── NotificationBell.tsx # Live Polling Notification Dropdown
├── /lib                # Utilities (Prisma Client, Auth JWT, Razorpay, SMS, Security, Rate Limit)
├── /prisma             # Schema & Seed Script (Packages, Vehicles, Instructors, Bookings, Sessions)
├── /public             # High-Resolution Automotive Assets
├── .env.example        # Production Environment Variable Template
├── middleware.ts       # Edge Route Protection & CSRF Validation
├── next.config.mjs     # Security Headers (HSTS, CSP, X-Frame-Options)
└── README.md           # Production Deployment Guide & Checklist
```

---

## 🔐 Production Environment Variables Checklist

Create a `.env` file in the project root based on `.env.example`:

```bash
# Database Connections (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/drivesuccess_db?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/drivesuccess_db?schema=public"

# JWT Secret Key (Min 32 characters)
JWT_SECRET="drivesuccess_super_secret_jwt_key_2026_production_min_32_chars"

# MSG91 SMS Gateway
MSG91_AUTH_KEY="your_msg91_auth_key"
MSG91_TEMPLATE_ID="your_msg91_template_id"

# Razorpay Payment Gateway
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Resend Email API Key
RESEND_API_KEY="re_your_resend_api_key"

# Optional Twilio WhatsApp Token
TWILIO_WHATSAPP_TOKEN=""
```

---

## 🗄️ Database Setup & Seed Commands

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Database Migrations / Sync**:
   ```bash
   npx prisma db push
   ```

4. **Seed Database (Packages, Vehicles, Instructors, Sample Bookings)**:
   ```bash
   npm run db:seed
   ```

---

## 🔑 Admin Credentials Setup

The admin portal is completely separated from student phone login at `/admin/login`:

- **Admin Login URL**: `http://localhost:3000/admin/login`
- **Default Email**: `admin@drivesuccess.edu`
- **Default Password**: `admin123`

*(On first login, the application automatically upserts the default admin user with `Role.ADMIN`).*

---

## 🚀 Vercel Production Deployment Guide

1. **Push Repository to GitHub / GitLab**.
2. **Connect Project in Vercel**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Set Environment Variables in Vercel Dashboard**:
   - Add all key-value pairs from `.env.example`.
4. **Deploy**:
   - Click **Deploy**. Vercel will build all 29 routes statically & dynamically.

---

## 🏥 Health Check Endpoint

Monitor production uptime and database connectivity:
- **URL**: `GET /api/health`
- **Sample Output**:
  ```json
  {
    "status": "OK",
    "timestamp": "2026-07-31T22:37:00.000Z",
    "uptimeSeconds": 1240.5,
    "responseTimeMs": "12ms",
    "services": {
      "database": {
        "status": "HEALTHY",
        "provider": "PostgreSQL"
      },
      "environment": "production",
      "version": "1.0.0"
    }
  }
  ```

---

## ✅ Final Pre-Launch QA Checklist

- [x] All 29 App Router routes compile cleanly with `npm run build` (0 errors).
- [x] Real Phone OTP auth rate-limited (60s cooldown, 5-min expiry, bcrypt hashed).
- [x] Atomic Prisma transactions enforce zero double-bookings.
- [x] Razorpay payment signatures verified via backend HMAC SHA256 (Zero frontend trust).
- [x] Student dashboard scope protected (`where: { studentId: session.sub }`).
- [x] Admin portal protected behind separate authentication (`role: ADMIN`).
- [x] Multi-channel notifications active (In-App DB, Resend Email, WhatsApp).
- [x] AI Assistant function calling executing real database queries.
- [x] Production security headers, CSRF validation, and Token Bucket rate limiting enforced.
- [x] OpenGraph social tags, dynamic XML sitemap, and `robots.txt` active.
