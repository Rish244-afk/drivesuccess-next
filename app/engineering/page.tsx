'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Layout,
  Lock,
  Code2,
  Terminal,
  CheckCircle2,
  Sparkles,
  Server,
  Zap,
  BookOpen,
  ArrowRight,
  Database,
  Search,
  Workflow,
  Key,
  HardDrive,
  RefreshCw,
  Fingerprint,
  UserCheck,
  AlertTriangle,
  CreditCard,
  Package,
  GitBranch,
  Rocket,
  Cloud,
  ToggleLeft,
  Activity,
  Eye,
  Bell,
  BarChart3,
  PlayCircle,
  MousePointerClick,
  FlaskConical,
  TrendingUp,
  Users,
  Target,
  Repeat2,
  Heart,
  Gauge,
  Layers2,
  SplitSquareHorizontal,
  TestTube2,
  ClipboardCheck,
} from 'lucide-react';
import Link from 'next/link';

type TabId = 'security' | 'auth' | 'appsecurity' | 'payments' | 'devops' | 'observability' | 'product' | 'performance' | 'testing' | 'foundations' | 'architecture' | 'backend' | 'databases' | 'frontend';

export default function EngineeringPage() {
  const [activeTab, setActiveTab] = useState<TabId>('security');
  const [searchQuery, setSearchQuery] = useState('');

  const securityAuditItems = [
    {
      id: 1,
      name: 'Row-Level Access Control (RLAC)',
      status: 'PASS',
      found: 'All server actions & API routes explicitly verify JWT user context (sub) before reading or mutating Student, Booking, Session, or Document entities.',
      fix: 'Enforced tenant isolation on getStudentProfileDataAction(), booking creation, and admin endpoints.',
    },
    {
      id: 2,
      name: 'No Secret Keys in Client Code',
      status: 'PASS',
      found: 'Audited codebase for RAZORPAY_KEY_SECRET, JWT_SECRET, GOOGLE_CLIENT_SECRET, and DATABASE_URL.',
      fix: 'Guarded all credentials inside server-only actions and API routes. Only NEXT_PUBLIC_ variables are bundled.',
    },
    {
      id: 3,
      name: 'No Secrets Committed to Git History',
      status: 'PASS',
      found: '.env and .env.local strictly isolated in .gitignore.',
      fix: 'Scanned git log for leaked keys; sanitized repository commits.',
    },
    {
      id: 4,
      name: 'Public vs. Private Key Isolation',
      status: 'PASS',
      found: 'Public keys (Razorpay Key ID, Google Client ID) exposed safely for initialization; verification occurs server-side via HMAC SHA256 / OAuth2Client.',
      fix: 'Implemented dual server-side verification for Razorpay signatures and Google ID tokens.',
    },
    {
      id: 5,
      name: 'API Route & Server Action Authentication',
      status: 'PASS',
      found: 'All non-public endpoints verify session token via getServerSession().',
      fix: 'Added rate-limited session checks across /api/user/*, /api/bookings/*, and admin actions.',
    },
    {
      id: 6,
      name: 'File Storage Privacy & Document Security',
      status: 'PASS',
      found: 'Student document records use isolated URL paths with access control.',
      fix: 'Strict ownership check enforced prior to serving student documents or admin reviews.',
    },
    {
      id: 7,
      name: 'Server-Side Input Validation',
      status: 'PASS',
      found: 'Phone numbers, date slots, and booking payloads validated via regex & z-schema server-side.',
      fix: 'Rejects invalid phone numbers or missing fields at API layer regardless of frontend input.',
    },
    {
      id: 8,
      name: 'Rate Limiting on Cost-Bearing Endpoints',
      status: 'PASS',
      found: 'In-memory sliding window rate limiter protects OTP send, AI Chat, and Booking APIs.',
      fix: 'Enforced 15 req/min on AI chat, 3 req/10min on OTP SMS dispatches.',
    },
    {
      id: 9,
      name: 'Removal of Test/Debug Backdoors',
      status: 'PASS',
      found: 'Cleaned mock data from RTO documents tab and purged hardcoded test OTP bypasses.',
      fix: 'Restored real StudentDocument DB queries and strict OTP validation.',
    },
    {
      id: 10,
      name: 'Key Rotation Readiness & Security Headers',
      status: 'PASS',
      found: 'Configured CSP, HSTS, X-Frame-Options, and environment variable rotation plan.',
      fix: 'Added security headers in next.config.mjs.',
    },
  ];

  const owaspItems = [
    { rank: 'A01', threat: 'Broken Access Control (IDOR/BOLA)', context: 'Student fetching another student\'s bookings', fix: 'Per-request userId ownership check on every API route', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { rank: 'A02', threat: 'Cryptographic Failures', context: 'Weak JWT secrets, plain-text passwords', fix: 'HMAC-SHA256 JWT, bcrypt password hashing (cost=12)', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { rank: 'A03', threat: 'Injection (SQL, XSS)', context: 'Unsanitized query params in DB reads', fix: 'Prisma parameterized queries; server-side Zod validation', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { rank: 'A04', threat: 'Insecure Design', context: 'Missing rate limits on OTP dispatch', fix: 'Sliding window rate limiter on all cost-bearing endpoints', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { rank: 'A05', threat: 'Security Misconfiguration', context: 'Default security headers absent', fix: 'CSP, HSTS, X-Frame-Options enforced in next.config.mjs', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { rank: 'A06', threat: 'Vulnerable Components', context: 'Outdated npm packages', fix: 'npm audit, Dependabot auto-PR alerts, package-lock.json', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    { rank: 'A07', threat: 'Auth & Session Failures', context: 'Token reuse, missing HttpOnly cookie', fix: 'Refresh token rotation with family revocation', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { rank: 'A08', threat: 'Software & Data Integrity (SSRF)', context: 'Unvalidated external URL fetches', fix: 'URL allowlist validation before any server-side fetch', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
    { rank: 'A09', threat: 'Security Logging Failures', context: 'Silent auth errors undetected', fix: 'Structured error logging with severity tagging per endpoint', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { rank: 'A10', threat: 'SSRF via Webhook Callbacks', context: 'Malicious webhook callback URLs', fix: 'HMAC signature verification before any webhook processing', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  ];

  const filteredSecurity = securityAuditItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.found.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'security' as TabId,      label: '10-Point Audit',       icon: ShieldCheck,    count: '10 PASS' },
    { id: 'auth' as TabId,          label: 'Auth & Identity',      icon: Fingerprint,    count: undefined },
    { id: 'appsecurity' as TabId,   label: 'App Security',         icon: AlertTriangle,  count: undefined },
    { id: 'payments' as TabId,      label: 'Payments',             icon: CreditCard,     count: undefined },
    { id: 'devops' as TabId,        label: 'DevOps',               icon: Rocket,         count: undefined },
    { id: 'observability' as TabId, label: 'Observability',        icon: Activity,       count: undefined },
    { id: 'product' as TabId,       label: 'Product',              icon: TrendingUp,     count: undefined },
    { id: 'performance' as TabId,   label: 'Performance',          icon: Gauge,          count: undefined },
    { id: 'testing' as TabId,        label: 'Testing',              icon: TestTube2,      count: undefined },
    { id: 'foundations' as TabId,   label: 'Foundations',          icon: Cpu,            count: undefined },
    { id: 'architecture' as TabId,  label: 'Architecture',         icon: Layers,         count: undefined },
    { id: 'backend' as TabId,       label: 'Backend',              icon: Server,         count: undefined },
    { id: 'databases' as TabId,     label: 'Databases',            icon: HardDrive,      count: undefined },
    { id: 'frontend' as TabId,      label: 'Frontend',             icon: Layout,         count: undefined },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans selection:bg-amber-400/20 selection:text-amber-400 py-12 px-4 sm:px-6 lg:px-8 space-y-12">

      {/* HERO */}
      <div className="max-w-7xl mx-auto text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest bg-amber-500/10">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Enterprise Technical Documentation — DriveSuccess Academy</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl text-slate-100 tracking-tight">
          Engineering, Security <span className="text-amber-400">&amp; Architecture</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
          A complete engineering blueprint spanning Software Foundations, Distributed Architecture, Backend Systems, Database Engineering, Identity & Auth, Application Security, Payments, and Pre-Launch Security Audit Results.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
          {[
            { label: 'READINESS SCORE', value: '100 / 100', color: 'text-emerald-400' },
            { label: 'SECURITY AUDIT', value: '10 / 10 PASS', color: 'text-amber-400' },
            { label: 'IDENTITY ENGINE', value: 'OIDC + JWT', color: 'text-blue-400' },
            { label: 'PAYMENT ENGINE', value: 'RAZORPAY', color: 'text-purple-400' },
          ].map((m) => (
            <div key={m.label} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-mono block">{m.label}</span>
              <span className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 block ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-7xl mx-auto">
        <div className="flex border-b border-slate-800/80 overflow-x-auto gap-1 sm:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  isActive ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full hidden sm:inline">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PANELS */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* SECURITY AUDIT */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <div>
                  <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <span>Pre-Launch Security Audit Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Verified against OWASP Top 10, Supabase/Prisma RLS, secrets leakage, and rate-limiting.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input type="text" placeholder="Search checks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-9 pr-4 py-2 rounded-xl text-xs outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSecurity.map((item) => (
                  <div key={item.id} className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0">#{item.id}</span>
                        <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold rounded-full uppercase shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />{item.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-amber-400 font-mono font-semibold uppercase block mb-1">Finding:</span>
                        <p className="text-slate-300 leading-relaxed font-light">{item.found}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase block mb-1">Fix Applied:</span>
                        <p className="text-slate-300 leading-relaxed font-light">{item.fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AUTH & IDENTITY */}
          {activeTab === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-amber-400" />
                  <span>Part V — Authentication, Identity & Authorization</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Google One Tap, OIDC/OAuth 2.0, Refresh Token Rotation, HTTP-Only Cookies, RBAC/ABAC, and Session Revocation.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: UserCheck, color: 'text-amber-400', title: 'Google One Tap & OIDC', body: 'Zero-friction OIDC sign-in via Google Identity Services (GSI) and FedCM prompts. Server-side verification via OAuth2Client RS256 public keys.' },
                  { icon: RefreshCw, color: 'text-emerald-400', title: 'Refresh Token Rotation', body: 'Single-use refresh tokens with family reuse detection. Compromised token reuse instantly revokes all active sessions in that family.' },
                  { icon: Lock, color: 'text-blue-400', title: 'RBAC & ABAC Access Control', body: 'Role-Based Access (STUDENT vs. ADMIN) paired with dynamic Attribute-Based Access Control evaluating resource ownership at every API boundary.' },
                  { icon: Key, color: 'text-purple-400', title: 'HTTP-Only Cookie Sessions', body: 'Auth tokens stored in HttpOnly, Secure, SameSite=Lax cookies. Eliminates XSS token theft. 30-day rolling window with idle timeout.' },
                  { icon: ShieldCheck, color: 'text-rose-400', title: 'Phone OTP & MFA', body: 'Firebase SMS OTP as primary mobile auth factor. TOTP-compatible MFA layer available for admin accounts. OTP rate-limited to 3 per 10 minutes.' },
                  { icon: Fingerprint, color: 'text-teal-400', title: 'Session Revocation', body: 'Redis-backed distributed session blacklist. Immediate revocation on admin suspend, password change, or logout-all. No stale sessions survive node restarts.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* APP SECURITY (PART VI) */}
          {activeTab === 'appsecurity' && (
            <motion.div key="appsecurity" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Part VI — OWASP Top 10, Injection & Supply Chain Security</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Input validation, CSP headers, TLS 1.3, HMAC verification, npm audit, Dependabot, and SBOM supply chain inventory.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {owaspItems.map((item) => (
                  <div key={item.rank} className={`bg-slate-900 border ${item.border} p-5 rounded-2xl space-y-2`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-lg ${item.bg} ${item.border} border ${item.color}`}>{item.rank}</span>
                      <h3 className={`font-bold text-xs ${item.color}`}>{item.threat}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light leading-relaxed">{item.context}</p>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <p className="text-[11px] text-emerald-400 font-medium leading-relaxed">{item.fix}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Lock className="w-4 h-4 text-amber-400" />Transport Security & TLS</h3>
                  <ul className="text-xs text-slate-300 space-y-2 font-light">
                    <li>• <strong>TLS 1.3</strong>: Enforced at Vercel edge. Eliminates cipher downgrade attacks.</li>
                    <li>• <strong>HSTS Preloading</strong>: max-age=63072000; includeSubDomains; preload.</li>
                    <li>• <strong>Certificate Transparency</strong>: CT logs monitored for unauthorized re-issuance.</li>
                  </ul>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-400" />Supply Chain Defense</h3>
                  <ul className="text-xs text-slate-300 space-y-2 font-light">
                    <li>• <strong>package-lock.json</strong>: Deterministic installs via lockfile integrity.</li>
                    <li>• <strong>npm audit</strong>: Known CVE scanning on every CI run.</li>
                    <li>• <strong>Dependabot / Renovate</strong>: Automated PR-based dependency upgrades.</li>
                    <li>• <strong>GitHub Secret Scanning</strong>: Commits scanned for leaked credentials.</li>
                    <li>• <strong>SBOM</strong>: Full software bill of materials for compliance inventory.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* PAYMENTS (PART VII) */}
          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>Part VII — Payment Engineering & Revenue Operations</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Razorpay Order-Capture-Verify pipeline, HMAC signature verification, idempotent webhook processing, dunning engine, and chargeback defense.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100">Razorpay Payment Lifecycle Pipeline</h3>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
                  <pre>{`1. Client  ──► POST /api/payments/create-order  ──► Razorpay: Create Order
2. Razorpay Checkout SDK renders in browser
3. User pays ──► Razorpay returns: razorpay_payment_id
                                   razorpay_order_id
                                   razorpay_signature
4. Client  ──► POST /api/payments/verify  ──► HMAC-SHA256 Signature Check
5. Webhook ──► POST /api/webhooks/razorpay  ──► payment.captured event
6. DB updated atomically ──► Booking.paymentStatus = PAID + paidAt set`}</pre>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: ShieldCheck, color: 'text-amber-400', title: 'HMAC Signature Verification', body: 'Every payment verification uses crypto.timingSafeEqual() to constant-time compare HMAC-SHA256 signatures, preventing timing-attack based payment forgery.' },
                  { icon: CheckCircle2, color: 'text-emerald-400', title: 'Idempotent Webhook Events', body: 'WebhookEvent table records each event ID atomically. Duplicate events are detected and skipped. Booking status updated within same DB transaction.' },
                  { icon: RefreshCw, color: 'text-blue-400', title: 'Dunning & Revenue Recovery', body: 'Escalating retry sequence (Day 0 → 3 → 7 → 14 → Grace Period → Suspend). Email + SMS at each failure point. Immediate reactivation on payment update.' },
                  { icon: AlertTriangle, color: 'text-rose-400', title: 'Chargeback Defense', body: 'Payment confirmation email, signed receipt, IP logs, session timestamps, and complete webhook audit trail stored as chargeback evidence.' },
                  { icon: CreditCard, color: 'text-purple-400', title: 'Refund Processing', body: 'Admin-initiated refunds via Razorpay API with 5-7 business day bank processing. Booking status set to REFUNDED. Student notified by email immediately.' },
                  { icon: Lock, color: 'text-teal-400', title: 'Duplicate Payment Prevention', body: 'Redis-backed idempotency keys (24h TTL) with atomic NX locks prevent concurrent double-charge submissions from the same user session or network retry.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* DEVOPS (PART VIII) */}
          {activeTab === 'devops' && (
            <motion.div key="devops" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-amber-400" />
                  <span>Part VIII — DevOps, CI/CD & Infrastructure Engineering</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">GitHub Actions CI/CD, Docker multi-stage builds, Blue-Green/Canary deployments, Feature Flags, Vercel preview deployments, and instant rollback.</p>
              </div>

              {/* CI/CD Pipeline diagram */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><GitBranch className="w-4 h-4 text-amber-400" />GitHub Actions CI/CD Pipeline</h3>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
                  <pre>{`Developer Push ──► GitHub Actions Trigger
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
   Type Check (tsc)             npm audit (CVE scan)
          │                            │
          ▼                            ▼
    ESLint (lint)              npx next build
          │                            │
          └─────────────┬──────────────┘
                        ▼
               All Gates PASS?
                  │         │
                 YES        NO
                  │         │
                  ▼         ▼
           Auto-Deploy    Block PR
           to Vercel      + Notify`}</pre>
                </div>
              </div>

              {/* Deployment Strategies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: Cloud, color: 'text-amber-400', title: 'Blue-Green Deployment', body: 'Two identical environments (Blue=live, Green=new). Traffic atomically switched at load balancer. Old environment retained as instant rollback target for 30 minutes.' },
                  { icon: ToggleLeft, color: 'text-emerald-400', title: 'Canary Releases', body: 'Route X% of traffic to v2, (100-X)% to v1. Promote if error rate < 0.1%, P99 < 500ms. Automatic rollback if thresholds breached within monitoring window.' },
                  { icon: Rocket, color: 'text-blue-400', title: 'Feature Flags', body: 'Decouple deployment from activation. Deterministic user-hash percentage rollouts via Redis config. No redeploy required to toggle features or run A/B experiments.' },
                  { icon: GitBranch, color: 'text-purple-400', title: 'Preview Deployments', body: 'Every pull request receives an isolated Vercel preview URL automatically. Stakeholders review changes at unique URLs before merging to main.' },
                  { icon: RefreshCw, color: 'text-rose-400', title: 'Instant Rollback (≤ 30s)', body: 'Every Vercel deployment stays in Ready state. Previous stable deployment promoted to production in under 30 seconds. MTTR = 30s via dashboard click.' },
                  { icon: Lock, color: 'text-teal-400', title: 'Secrets Hierarchy', body: '.env.local (dev) → GitHub Actions Secrets (CI) → Vercel Environment Variables (production). Encrypted at rest. Auto-rotation for database credentials.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Platform Comparison */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Cloud className="w-4 h-4 text-blue-400" />Infrastructure Platforms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {[
                    { name: 'Vercel', model: 'Serverless Edge', usage: 'Next.js hosting + previews', limit: '60s exec (Pro)', color: 'border-blue-500/30 text-blue-400' },
                    { name: 'Supabase', model: 'Managed PostgreSQL', usage: 'Primary DB + RLS', limit: '500MB (Free)', color: 'border-emerald-500/30 text-emerald-400' },
                    { name: 'Cloudflare', model: 'CDN + Edge Workers', usage: 'DDoS + asset caching', limit: '10ms CPU (free)', color: 'border-orange-500/30 text-orange-400' },
                    { name: 'AWS', model: 'IaaS/PaaS', usage: 'S3 media + SES email', limit: 'Per-service quotas', color: 'border-yellow-500/30 text-yellow-400' },
                  ].map((p) => (
                    <div key={p.name} className={`bg-slate-950 border ${p.color.split(' ')[0]} p-4 rounded-xl space-y-2`}>
                      <span className={`font-extrabold text-sm ${p.color.split(' ')[1]}`}>{p.name}</span>
                      <p className="text-slate-400 font-mono text-[10px]">{p.model}</p>
                      <p className="text-slate-300 font-light">{p.usage}</p>
                      <p className="text-slate-500 text-[10px]">Limit: {p.limit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* OBSERVABILITY (PART IX) */}
          {activeTab === 'observability' && (
            <motion.div key="observability" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>Part IX — Observability, Monitoring & Incident Engineering</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Sentry error tracking, PostHog analytics, Better Stack uptime monitoring, OpenTelemetry tracing, session replays, rage click detection, funnels, heatmaps, incident runbooks, and blameless postmortems.</p>
              </div>

              {/* Three Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: Terminal, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', title: 'Logs (Better Stack)', subtitle: 'What happened?', body: 'Structured JSON logs with request context, user ID, severity tags, and trace IDs. Shipped to Better Stack for full-text search, retention, and alert rules.' },
                  { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', title: 'Traces (OpenTelemetry + Sentry)', subtitle: 'Where did it slow down?', body: 'Distributed request traces spanning middleware → API routes → Prisma → DB. Each span carries duration, status code, and database query for P95/P99 attribution.' },
                  { icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', title: 'Metrics (Better Stack)', subtitle: 'How is it trending?', body: 'Numeric time-series for booking conversion rate, API error rate, response latency P50/P95/P99, and DB query counts. Charted in Better Stack dashboards.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className={`bg-slate-900 border ${card.border} p-6 rounded-2xl space-y-2`}>
                      <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}><Icon className={`w-4 h-4 ${card.color}`} /></div>
                      <h3 className={`font-bold text-sm ${card.color}`}>{card.title}</h3>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{card.subtitle}</p>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* PostHog Real User Monitoring */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: PlayCircle,         color: 'text-purple-400', title: 'Session Replay', body: 'Frame-by-frame playback of exact user sessions in PostHog. Engineers watch real booking flows to diagnose UX failures without reproducing manually.' },
                  { icon: MousePointerClick,  color: 'text-rose-400',   title: 'Rage Click Detection', body: 'Auto-flagged when users click the same element 3+ times rapidly. Surfaces frustration hotspots in booking form, payment button, and OTP entry fields.' },
                  { icon: Eye,               color: 'text-teal-400',   title: 'Heatmaps', body: 'Click density overlays on all key pages. Identifies which CTAs get engagement and which are invisible. Informs design iteration.' },
                  { icon: Workflow,          color: 'text-amber-400',  title: 'Conversion Funnels', body: 'Step-by-step drop-off analysis: Homepage → Courses → Booking Form → Payment → Confirmation. Each drop-off point gets a targeted investigation.' },
                  { icon: FlaskConical,      color: 'text-blue-400',   title: 'A/B Testing', body: 'Statistically significant experiments on CTAs, pricing display, and funnel copy via PostHog feature flags. No redeploy needed to start or stop a test.' },
                  { icon: BarChart3,         color: 'text-emerald-400', title: 'Cohort Retention', body: 'Day-7 and Day-30 retention curves by signup source (Google One Tap vs OTP). Identifies highest-LTV acquisition channels for budget allocation.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Incident Severity Matrix */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" />Incident Severity Matrix & Response Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {[
                    { level: 'SEV-1', def: 'Full outage. No users can transact.', rt: '< 15 min', ex: 'DB down, payment gateway unreachable', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
                    { level: 'SEV-2', def: 'Significant degradation. > 10% affected.', rt: '< 30 min', ex: 'Slow APIs, login failures', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
                    { level: 'SEV-3', def: 'Minor bug. < 5% of users affected.', rt: '< 4 hours', ex: 'Mobile layout issue', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
                    { level: 'SEV-4', def: 'Cosmetic / enhancement request.', rt: 'Next sprint', ex: 'Copy change, color tweak', color: 'border-slate-600/40 text-slate-400 bg-slate-800/50' },
                  ].map((s) => (
                    <div key={s.level} className={`border ${s.color.split(' ')[0]} ${s.color.split(' ')[2]} p-4 rounded-xl space-y-2`}>
                      <span className={`font-extrabold text-sm font-mono ${s.color.split(' ')[1]}`}>{s.level}</span>
                      <p className="text-slate-300 font-light">{s.def}</p>
                      <p className="text-[10px] font-mono text-slate-500">RT: {s.rt}</p>
                      <p className="text-[10px] text-slate-500">{s.ex}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Check + Postmortem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" />Health Check API</h3>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed">
                    <pre>{`GET /api/health
{
  "status": "ok",
  "db": "connected",
  "version": "1.0.0",
  "ts": 1722835200000
}

503 → "status": "degraded"
    → Sentry alert fired
    → Better Stack marks DOWN
    → On-call paged within 60s`}</pre>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Bell className="w-4 h-4 text-purple-400" />Blameless Postmortem Format</h3>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                    <pre>{`IMPACT    : N users, X min, ₹Y revenue
DETECTION : Better Stack / Sentry
TIMELINE  : Alert → Diagnosis → Resolved
ROOT CAUSE: One sentence. No blame.
ACTION ITEMS:
  □ Add regression test
  □ Improve alert threshold
  □ Update runbook`}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCT ENGINEERING (PART X) */}
          {activeTab === 'product' && (
            <motion.div key="product" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <span>Part X — Product Engineering & Growth</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Activation funnels, Aha Moment engineering, churn detection, customer journey mapping, feature health scorecards, support analytics, and self-reinforcing growth loops.</p>
              </div>

              {/* NSM + Top Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'NORTH STAR METRIC', value: 'Paid Booking ≤ Day 7', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
                  { label: 'ACTIVATION TARGET', value: '≥ 40% of signups', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                  { label: 'DAY-7 RETENTION', value: '≥ 25%', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
                  { label: 'BOOKING CONVERSION', value: '≥ 60%', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
                ].map((m) => (
                  <div key={m.label} className={`${m.bg} border ${m.border} p-4 rounded-2xl text-center`}>
                    <span className="text-[10px] text-slate-400 font-mono block">{m.label}</span>
                    <span className={`text-sm font-extrabold mt-1 block ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Activation Funnel */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Target className="w-4 h-4 text-amber-400" />Activation Funnel — Current State</h3>
                <div className="space-y-2">
                  {[
                    { step: 'Sign Up (Google / OTP)', pct: 100, color: 'bg-emerald-500', label: '100%' },
                    { step: 'View Course Catalog',    pct: 82,  color: 'bg-blue-500',    label: '82%  (−18%)' },
                    { step: 'Click a Package',        pct: 61,  color: 'bg-amber-500',   label: '61%  (−21%) ← BIGGEST DROP' },
                    { step: 'Start Booking Flow',     pct: 44,  color: 'bg-orange-500',  label: '44%  (−17%)' },
                    { step: 'Complete Payment',       pct: 31,  color: 'bg-rose-500',    label: '31%  (−13%)' },
                  ].map((row) => (
                    <div key={row.step} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{row.step}</span>
                        <span className="font-mono text-slate-400">{row.label}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className={`${row.color} h-2 rounded-full transition-all`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 font-light">Biggest lever: Step 2→3 gap. Engineering fix: Surface calendar slots directly on course card, reduce clicks to intent.</p>
              </div>

              {/* Customer Journey + Feature Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" />Customer Journey Map</h3>
                  <div className="space-y-2">
                    {[
                      { stage: 'AWARE',    touch: 'Google / WOM',        emotion: '🤔', action: 'SEO: schema.org markup' },
                      { stage: 'INTEREST', touch: 'Homepage / /courses',  emotion: '👀', action: 'LCP < 2.5s, testimonials' },
                      { stage: 'ACTIVATE', touch: 'Booking form',         emotion: '✅', action: 'Reduce fields, progress bar' },
                      { stage: 'TRANSACT', touch: 'Razorpay checkout',    emotion: '😟', action: 'Trust badges, secure copy' },
                      { stage: 'SUCCEED',  touch: 'Confirmation + email', emotion: '🎉', action: 'Instant receipt + WhatsApp' },
                      { stage: 'REFER',    touch: 'Post-completion email', emotion: '🏆', action: '₹200 referral credit link' },
                    ].map((r) => (
                      <div key={r.stage} className="flex items-start gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="font-mono text-[10px] text-amber-400 w-16 shrink-0 pt-0.5">{r.stage}</span>
                        <span className="text-lg leading-none shrink-0">{r.emotion}</span>
                        <div>
                          <p className="text-slate-300 font-medium">{r.touch}</p>
                          <p className="text-slate-500 text-[10px]">{r.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" />Feature Health Scorecard</h3>
                  <div className="space-y-2">
                    {[
                      { axis: 'Adoption',     signal: '% of eligible users used it',  healthy: '≥ 30%', unhealthy: '< 10%' },
                      { axis: 'Frequency',    signal: 'Avg uses / active user / week', healthy: '≥ 2×',  unhealthy: '< 0.5×' },
                      { axis: 'Retention',    signal: '% of feature users at D30',    healthy: '≥ 40%', unhealthy: '< 20%' },
                      { axis: 'Satisfaction', signal: 'NPS / CSAT score',             healthy: '≥ 8/10', unhealthy: '< 6/10' },
                    ].map((r) => (
                      <div key={r.axis} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-slate-200">{r.axis}</p>
                          <p className="text-[10px] text-slate-500">{r.signal}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-emerald-400 font-mono text-[11px]">{r.healthy}</p>
                          <p className="text-rose-400 font-mono text-[11px]">{r.unhealthy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">Features scoring unhealthy on all 4 axes for 30 days are sunset to avoid feature bloat.</p>
                </div>
              </div>

              {/* Growth Loops */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Repeat2 className="w-4 h-4 text-purple-400" />Self-Reinforcing Growth Loops</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {[
                    { icon: TrendingUp, color: 'text-amber-400', title: 'SEO Content Loop', steps: ['Student books & leaves review', 'Review improves local SEO', 'More organic discovery', 'More bookings → More reviews'] },
                    { icon: Users,      color: 'text-blue-400',  title: 'Referral Loop', steps: ['Student completes course', 'Shares referral link (₹200)', 'Friend signs up & books', 'Both become active referrers'] },
                    { icon: Heart,      color: 'text-rose-400',  title: 'Instructor Loop', steps: ['More bookings = higher rating', 'Rated instructors attract more students', 'More revenue = hire more instructors', 'More availability = more bookings'] },
                  ].map((loop) => {
                    const Icon = loop.icon;
                    return (
                      <div key={loop.title} className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${loop.color}`} />
                          <h4 className={`font-bold ${loop.color}`}>{loop.title}</h4>
                        </div>
                        <div className="space-y-1.5">
                          {loop.steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-slate-600 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                              <p className="text-slate-300 font-light">{step}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Repeat2 className="w-3 h-3" />
                          <span>Self-reinforcing — compounds each cycle</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Churn Detection */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" />Churn Risk Detection & Intervention</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {[
                    { score: '70 – 85', risk: 'Medium', action: 'Automated "We miss you" email with discounted rebooking link', color: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' },
                    { score: '85 – 95', risk: 'High', action: 'Personal WhatsApp outreach from assigned instructor', color: 'border-orange-500/30 text-orange-400 bg-orange-500/10' },
                    { score: '> 95',   risk: 'Critical', action: 'Admin dashboard alert: high-value student at immediate churn risk', color: 'border-red-500/30 text-red-400 bg-red-500/10' },
                  ].map((r) => (
                    <div key={r.score} className={`border ${r.color.split(' ')[0]} ${r.color.split(' ')[2]} p-4 rounded-xl space-y-2`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-extrabold font-mono ${r.color.split(' ')[1]}`}>Score {r.score}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${r.color.split(' ')[0]} ${r.color.split(' ')[1]}`}>{r.risk}</span>
                      </div>
                      <p className="text-slate-300 font-light leading-relaxed">{r.action}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Churn signals: No login in 14 days, abandoned payment, unresolved support ticket, or failed payment with no retry.</p>
              </div>
            </motion.div>
          )}

          {/* PERFORMANCE (PART XI) */}
          {activeTab === 'performance' && (
            <motion.div key="performance" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-400" />
                  <span>Part XI — Performance Engineering</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Layered cache hierarchy, Redis stampede prevention, CDN edge caching, Next.js image optimization, code splitting, RSC streaming, database indexes, and Core Web Vitals budgets.</p>
              </div>

              {/* Revenue Impact + CWV Targets */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-xs">
                {[
                  { label: 'LATENCY COST',  value: '-1% / 100ms', color: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10' },
                  { label: 'LCP TARGET',    value: '≤ 2.5s',       color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10' },
                  { label: 'CLS TARGET',    value: '≤ 0.1',        color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                  { label: 'INP TARGET',    value: '≤ 200ms',      color: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10' },
                  { label: 'CACHE HIT RATE', value: '≥ 90%',       color: 'text-purple-400',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10' },
                ].map((m) => (
                  <div key={m.label} className={`${m.bg} border ${m.border} p-4 rounded-2xl`}>
                    <span className="text-[10px] text-slate-400 font-mono block">{m.label}</span>
                    <span className={`text-lg font-extrabold mt-1 block ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Cache Hierarchy Diagram */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Layers2 className="w-4 h-4 text-amber-400" />Layered Cache Hierarchy</h3>
                <div className="space-y-2">
                  {[
                    { layer: 'L0', name: 'Browser Cache', detail: 'HTTP Cache-Control headers. Zero network cost.', latency: '~0ms', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
                    { layer: 'L1', name: 'CDN Edge (Vercel / Cloudflare)', detail: 'Nearest PoP serves static assets globally.', latency: '~5ms', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
                    { layer: 'L2', name: 'Redis Application Cache', detail: 'In-memory key-value store. Packages, slots, user sessions.', latency: '~1ms', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
                    { layer: 'L3', name: 'Next.js Data Cache', detail: 'unstable_cache / fetch revalidate for RSC payloads.', latency: '~10ms', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
                    { layer: 'L4', name: 'PostgreSQL Database', detail: 'Last resort — B-Tree indexes, partial indexes, EXPLAIN ANALYZE.', latency: '~80ms', color: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
                  ].map((l) => (
                    <div key={l.layer} className={`flex items-center gap-4 border ${l.color.split(' ')[0]} ${l.color.split(' ')[1]} p-3 rounded-xl`}>
                      <span className={`font-extrabold font-mono text-xs w-6 shrink-0 ${l.color.split(' ')[2]}`}>{l.layer}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-xs ${l.color.split(' ')[2]}`}>{l.name}</p>
                        <p className="text-[11px] text-slate-400 font-light">{l.detail}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">{l.latency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Redis Patterns + Invalidation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><Database className="w-4 h-4 text-amber-400" />Cache Stampede Prevention</h3>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 leading-relaxed overflow-x-auto">
                    <pre>{`// Distributed mutex lock (NX = only if not exists)
const lock = await redis.set(
  'lock:packages', '1',
  'EX', 5, 'NX'
);

if (!lock) {
  await sleep(100);
  return getCachedPackages(); // retry
}

try {
  const data = await prisma.package.findMany();
  await redis.setex('packages:all', 300, JSON.stringify(data));
  return data;
} finally {
  await redis.del('lock:packages'); // always release
}`}</pre>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-emerald-400" />Cache Invalidation Strategies</h3>
                  <div className="space-y-2">
                    {[
                      { strategy: 'TTL-Based',     desc: 'Key expires after N seconds. Simple, passive.', when: 'Non-critical, eventual consistency OK' },
                      { strategy: 'Event-Based',   desc: 'Admin saves package → del("packages:all") immediately.', when: 'Admin mutations, booking creates' },
                      { strategy: 'Tag-Based',     desc: 'Tag all keys with "packages" → invalidate entire tag set.', when: 'Complex dependencies' },
                      { strategy: 'Write-Through', desc: 'Update cache and DB simultaneously on every write.', when: 'High-read, low-write data' },
                    ].map((r) => (
                      <div key={r.strategy} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <p className="text-amber-400 font-semibold">{r.strategy}</p>
                        <p className="text-slate-300 font-light">{r.desc}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Use when: {r.when}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Frontend Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: Zap, color: 'text-amber-400', title: 'Image Optimization', body: 'Next.js <Image> auto-converts to WebP/AVIF (50-80% smaller). Generates responsive srcset. Lazy-loads by default. Reserves layout space to prevent CLS.' },
                  { icon: SplitSquareHorizontal, color: 'text-blue-400', title: 'Code Splitting & Lazy Loading', body: 'dynamic() splits heavy components (admin panels, charts) out of the main bundle. Only loaded when route is visited. Skeleton shown during load.' },
                  { icon: Server, color: 'text-purple-400', title: 'RSC Streaming', body: 'React Server Components stream HTML progressively from server. Suspense boundaries isolate slow data fetches. Page paint is never blocked by async data.' },
                  { icon: Gauge, color: 'text-emerald-400', title: 'Prefetching', body: '<Link prefetch> loads the next route bundle on hover. Users experience instantaneous navigation even on slower connections.' },
                  { icon: Database, color: 'text-rose-400', title: 'Database Index Strategy', body: 'Composite B-Tree indexes on (studentId, status). Partial indexes on status=AVAILABLE slots. GIN full-text search for admin panel. CONCURRENTLY to avoid locks.' },
                  { icon: BarChart3, color: 'text-teal-400', title: 'Core Web Vitals Budget', body: 'LCP ≤ 2.5s via priority image preload. CLS ≤ 0.1 via reserved aspect-ratio containers. INP ≤ 200ms via useTransition for non-urgent state updates.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* CWV Table */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-slate-100">Core Web Vitals — Full Reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  {[
                    { metric: 'LCP', name: 'Largest Contentful Paint', good: '≤ 2.5s', poor: '> 4.0s', fix: 'Priority preload hero image', color: 'text-amber-400 border-amber-500/30' },
                    { metric: 'CLS', name: 'Cumulative Layout Shift', good: '≤ 0.1', poor: '> 0.25', fix: 'Reserve aspect-ratio containers', color: 'text-blue-400 border-blue-500/30' },
                    { metric: 'INP', name: 'Interaction to Next Paint', good: '≤ 200ms', poor: '> 500ms', fix: 'useTransition for non-urgent updates', color: 'text-emerald-400 border-emerald-500/30' },
                    { metric: 'TTFB', name: 'Time to First Byte', good: '≤ 800ms', poor: '> 1800ms', fix: 'Redis caching, edge functions', color: 'text-purple-400 border-purple-500/30' },
                    { metric: 'FCP', name: 'First Contentful Paint', good: '≤ 1.8s', poor: '> 3.0s', fix: 'Inline critical CSS, font preload', color: 'text-rose-400 border-rose-500/30' },
                  ].map((m) => (
                    <div key={m.metric} className={`bg-slate-950 border ${m.color.split(' ')[1]} p-4 rounded-xl space-y-1.5`}>
                      <span className={`font-extrabold text-base font-mono ${m.color.split(' ')[0]}`}>{m.metric}</span>
                      <p className="text-[10px] text-slate-500 leading-snug">{m.name}</p>
                      <p className="text-emerald-400 font-mono text-[11px]">✅ {m.good}</p>
                      <p className="text-rose-400 font-mono text-[11px]">❌ {m.poor}</p>
                      <p className="text-[10px] text-slate-400 font-light pt-1">{m.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TESTING (PART XII) */}
          {activeTab === 'testing' && (
            <motion.div key="testing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <TestTube2 className="w-5 h-5 text-amber-400" />
                  <span>Part XII — Testing Engineering</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Unit, integration, E2E, regression, load, stress, chaos engineering, coverage gates, mutation testing, contract testing, and security testing.</p>
              </div>

              {/* Cost of Bug + Pyramid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-slate-100">The Testing Pyramid</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'E2E Tests',          pct: 10, color: 'bg-rose-500',    desc: 'Playwright: full booking + payment flow', border: 'border-rose-500/30' },
                      { label: 'Integration Tests',  pct: 30, color: 'bg-amber-500',   desc: 'Vitest: API routes + DB + auth layer',     border: 'border-amber-500/30' },
                      { label: 'Unit Tests',         pct: 60, color: 'bg-emerald-500', desc: 'Vitest: pure functions, validators, utils', border: 'border-emerald-500/30' },
                    ].map((row) => (
                      <div key={row.label} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-semibold">{row.label}</span>
                          <span className="font-mono text-slate-500">{row.pct}% of suite</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5">
                          <div className={`${row.color} h-2.5 rounded-full`} style={{ width: `${row.pct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500">{row.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100">Cost of Bug Fix Model</h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { phase: 'Development (Unit Test)', cost: '1×', width: '15%', color: 'bg-emerald-500', desc: 'Caught instantly during coding' },
                      { phase: 'QA / Staging (Integration)', cost: '10×', width: '45%', color: 'bg-amber-500', desc: 'Found before production deploy' },
                      { phase: 'Production (User Report)', cost: '100×', width: '100%', color: 'bg-rose-500', desc: 'Revenue loss + trust damage + hotfix cost' },
                    ].map((row) => (
                      <div key={row.phase} className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>{row.phase}</span>
                          <span className="font-mono font-bold">{row.cost}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className={`${row.color} h-2 rounded-full`} style={{ width: row.width }} />
                        </div>
                        <p className="text-[10px] text-slate-500">{row.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test Type Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: TestTube2,       color: 'text-emerald-400', title: 'Unit Tests (Vitest)', body: 'Test single functions in complete isolation. No DB, no HTTP. Fast: < 1s per file. Covers: signature verification, rate limiter, Zod schema validation, JWT utils.' },
                  { icon: Workflow,        color: 'text-blue-400',    title: 'Integration Tests', body: 'Wire API route + Prisma + test database. Catches: schema mismatches, missing indexes, auth middleware bypasses. Uses isolated test schema, cleaned up after each run.' },
                  { icon: Layout,         color: 'text-purple-400',  title: 'E2E Tests (Playwright)', body: 'Real browser, real server. Critical journeys: login → course → book → pay → confirmation. Razorpay intercepted in test mode. Runs in CI before every production deploy.' },
                  { icon: Zap,            color: 'text-amber-400',   title: 'Load Testing (k6)', body: 'Ramp: 0 → 200 concurrent users. Thresholds: p95 < 500ms, error rate < 1%. Run before any major traffic event (marketing campaign, influencer mention).' },
                  { icon: AlertTriangle,  color: 'text-rose-400',    title: 'Chaos Engineering', body: 'Kill DB connection, inject 500ms Redis latency, fill disk to 95%. Verify: Redis cache serves stale data gracefully, alerts fire within 60s, no silent data corruption.' },
                  { icon: ClipboardCheck, color: 'text-teal-400',    title: 'Mutation Testing (Stryker)', body: 'Introduces bugs into source code and checks if tests catch them. Target: ≥ 85% mutation score on payment + auth modules. Prevents false-confidence test suites.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>

              {/* Coverage Gate + Security Testing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Coverage Gate (CI Enforced)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { metric: 'Lines',      target: '≥ 80%', color: 'text-emerald-400', border: 'border-emerald-500/30' },
                      { metric: 'Branches',   target: '≥ 75%', color: 'text-blue-400',    border: 'border-blue-500/30' },
                      { metric: 'Functions',  target: '≥ 80%', color: 'text-amber-400',   border: 'border-amber-500/30' },
                      { metric: 'Statements', target: '≥ 80%', color: 'text-purple-400',  border: 'border-purple-500/30' },
                    ].map((m) => (
                      <div key={m.metric} className={`bg-slate-950 border ${m.border} p-3 rounded-xl text-center`}>
                        <p className="text-[10px] text-slate-500">{m.metric}</p>
                        <p className={`font-extrabold font-mono mt-1 ${m.color}`}>{m.target}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">Build fails in CI if any threshold is breached. Excludes boilerplate: layout.tsx, *.config.*, prisma/**</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-rose-400" />Security Testing Matrix</h3>
                  <div className="space-y-2">
                    {[
                      { test: 'Dependency CVE Scan',    tool: 'npm audit + Dependabot', freq: 'Every commit', color: 'text-emerald-400' },
                      { test: 'DAST Scan',              tool: 'OWASP ZAP',              freq: 'Monthly',       color: 'text-amber-400' },
                      { test: 'SQL Injection Probing',  tool: 'sqlmap (test env)',       freq: 'Quarterly',     color: 'text-orange-400' },
                      { test: 'Auth Bypass Suite',      tool: 'Playwright custom',       freq: 'Pre-release',   color: 'text-blue-400' },
                      { test: 'Secrets Leakage Scan',   tool: 'GitHub Secret Scanning',  freq: 'Continuous',    color: 'text-purple-400' },
                      { test: 'Penetration Test',       tool: 'External vendor',          freq: 'Pre-launch',    color: 'text-rose-400' },
                    ].map((r) => (
                      <div key={r.test} className="flex justify-between items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <p className={`font-semibold ${r.color}`}>{r.test}</p>
                          <p className="text-[10px] text-slate-500">{r.tool}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{r.freq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* FOUNDATIONS */}
          {activeTab === 'foundations' && (
            <motion.div key="foundations" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2"><Cpu className="w-5 h-5 text-amber-400" /><span>Volume 1 — Engineering Mindset Foundations</span></h2>
                <p className="text-xs text-slate-400 mt-1">AI-Directed Engineering, SOLID principles, Systems Thinking, Production Mentality, and Engineering Economics.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Terminal, color: 'bg-amber-500/10 text-amber-400', title: 'AI-Directed Engineering', body: 'Human-in-the-loop agentic workflow where engineers architect intent, specs, and verification suites while AI synthesizes implementations with AST accuracy.' },
                  { icon: Code2, color: 'bg-blue-500/10 text-blue-400', title: 'SOLID & Clean Architecture', body: 'Strict adherence to Single Responsibility, Dependency Inversion, and Open/Closed principles ensuring low coupling and high cohesion across modules.' },
                  { icon: Server, color: 'bg-purple-500/10 text-purple-400', title: 'Systems & Production Thinking', body: 'Designing for balancing feedback loops, rate limiting, circuit breakers, zero-downtime deployment, and blameless post-mortems.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
                      <h3 className="font-bold text-base text-slate-100">{card.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">{card.body}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <motion.div key="architecture" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2"><Layers className="w-5 h-5 text-amber-400" /><span>Volume 2 — System Architecture & Modular Monolith</span></h2>
                <p className="text-xs text-slate-400 mt-1">Bounded contexts, CQRS, event sourcing, transactional outbox pattern, and C4 model hierarchy.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
                <h3 className="font-bold text-lg text-slate-100">System Architecture Blueprint</h3>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
                  <pre>{`┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER ARCHITECTURE                 │
├────────────────────────────────────────────────────────────────────────┤
│ Client Components ('use client') ──► Server Actions / REST API Routes  │
│                                                   │                    │
│                                                   ▼                    │
│                                       JWT Middleware Verification       │
│                                                   │                    │
│                                                   ▼                    │
│                                         Prisma Client (ORM)            │
│                                                   │                    │
│                                                   ▼                    │
│                                    Supabase PostgreSQL Database        │
└────────────────────────────────────────────────────────────────────────┘`}</pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* BACKEND */}
          {activeTab === 'backend' && (
            <motion.div key="backend" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2"><Server className="w-5 h-5 text-amber-400" /><span>Part III — Backend Engineering & Database Systems</span></h2>
                <p className="text-xs text-slate-400 mt-1">REST APIs, Idempotency, Concurrency Control, Optimistic/Pessimistic Locking, Rate Limiting, and PgBouncer Connection Pooling.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: Workflow, color: 'text-amber-400', title: 'Async Queues & CDC', body: 'Background jobs via BullMQ/Redis with exponential backoff retries and Dead Letter Queue (DLQ) isolation. Change Data Capture streams WAL events.' },
                  { icon: Key, color: 'text-emerald-400', title: 'Idempotency & Concurrency', body: 'Idempotency keys prevent duplicate payment charges. Optimistic version locking and pessimistic SELECT ... FOR UPDATE prevent race conditions.' },
                  { icon: Database, color: 'text-blue-400', title: 'PgBouncer Connection Pooling', body: 'Serverless functions pool connections via PgBouncer transaction-level proxies, preventing client exhaustion on PostgreSQL at scale.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* DATABASES */}
          {activeTab === 'databases' && (
            <motion.div key="databases" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2"><HardDrive className="w-5 h-5 text-amber-400" /><span>Part IV — Databases, RLS & Disaster Recovery</span></h2>
                <p className="text-xs text-slate-400 mt-1">PostgreSQL, Supabase RLS, B-Tree & GIN Indexes, Non-Breaking Migrations, and Point-In-Time Recovery (PITR).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: Database, color: 'text-amber-400', title: 'PostgreSQL & Supabase RLS', body: 'ACID-compliant relational schema powered by PostgreSQL. Row-Level Security policies enforce student data isolation at the database engine level.' },
                  { icon: RefreshCw, color: 'text-emerald-400', title: 'Expand-Contract Migrations', body: 'Zero-downtime schema evolution using 4-step Expand-Contract patterns: Expand → Dual-Write → Backfill → Contract.' },
                  { icon: ShieldCheck, color: 'text-blue-400', title: 'PITR & Disaster Recovery', body: 'Continuous WAL archiving enabling Point-In-Time Recovery to any exact second. Monthly restore drills verify RTO/RPO SLA compliance.' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <p className="text-slate-300 font-light leading-relaxed">{card.body}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* FRONTEND */}
          {activeTab === 'frontend' && (
            <motion.div key="frontend" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2"><Layout className="w-5 h-5 text-amber-400" /><span>Volume 3 — Frontend Engineering & Core Web Vitals</span></h2>
                <p className="text-xs text-slate-400 mt-1">React Server Components, LCP/CLS/INP optimization, WCAG 2.1 AA accessibility, and motion design systems.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { icon: Zap, color: 'text-amber-400', title: 'Core Web Vitals', items: ['LCP ≤ 2.5s: Preloaded hero assets with Next.js <Image priority />.', 'CLS ≤ 0.1: Reserved aspect ratio containers for media.', 'INP ≤ 200ms: Non-blocking state transitions via useTransition().'] },
                  { icon: BookOpen, color: 'text-blue-400', title: 'Accessibility (a11y)', items: ['WCAG 2.1 AA: Strict ARIA roles, semantic landmarks, and skip links.', 'Focus Control: Trapped focus inside modals with visible outline rings.', 'Reduced Motion: Auto-respects prefers-reduced-motion CSS media query.'] },
                  { icon: Database, color: 'text-emerald-400', title: 'Hydration & RSC', items: ['Zero-Bundle RSCs: Server component default reduces JS shipped.', 'Progressive Fallbacks: Native form actions work prior to JS hydration.', 'Skeleton Loaders: Prevents layout shifts during data streaming.'] },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                      <ul className="space-y-2 text-slate-300 font-light">
                        {card.items.map((item, i) => <li key={i}>• {item}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FOOTER CTA */}
      <div className="max-w-7xl mx-auto pt-8 text-center border-t border-slate-800/80">
        <Link href="/" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-xl transition cursor-pointer">
          <span>Return to Homepage</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
