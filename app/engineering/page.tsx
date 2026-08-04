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
} from 'lucide-react';
import Link from 'next/link';

export default function EngineeringPage() {
  const [activeTab, setActiveTab] = useState<'foundations' | 'architecture' | 'frontend' | 'security'>('security');
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

  const filteredSecurity = securityAuditItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.found.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans selection:bg-amber-400/20 selection:text-amber-400 py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* 1. HERO HEADER */}
      <div className="max-w-7xl mx-auto text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest bg-amber-500/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Enterprise Technical Documentation & Security Audit</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl text-slate-100 tracking-tight">
          DriveSuccess <span className="text-amber-400">Engineering & Architecture</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
          A complete engineering blueprint covering Software Engineering Foundations, Distributed Architecture, Next.js & React Frontend Mechanics, and Pre-Launch Security Audit Results.
        </p>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <span className="text-xs text-slate-400 font-mono block">READINESS SCORE</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1 block">100 / 100</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <span className="text-xs text-slate-400 font-mono block">SECURITY AUDIT</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono mt-1 block">10 / 10 PASS</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <span className="text-xs text-slate-400 font-mono block">CORE WEB VITALS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono mt-1 block">OPTIMIZED</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <span className="text-xs text-slate-400 font-mono block">FRAMEWORK</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono mt-1 block">NEXT.JS 14</span>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="max-w-7xl mx-auto">
        <div className="flex border-b border-slate-800/80 overflow-x-auto gap-4 sm:gap-8 justify-start sm:justify-center">
          {[
            { id: 'security', label: '10-Point Security Audit', icon: ShieldCheck, count: '10 PASS' },
            { id: 'foundations', label: 'Engineering Foundations', icon: Cpu },
            { id: 'architecture', label: 'System Architecture', icon: Layers },
            { id: 'frontend', label: 'Frontend Engineering', icon: Layout },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB CONTENT PANELS */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB: SECURITY AUDIT */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <div>
                  <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <span>Pre-Launch Security Audit Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified against OWASP Top 10, Supabase/Prisma RLS policies, secrets leakage, and rate-limiting.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search security checks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 pl-9 pr-4 py-2 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSecurity.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl hover:border-slate-700 transition"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          #{item.id}
                        </span>
                        <h3 className="font-heading font-bold text-sm text-slate-100">{item.name}</h3>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold rounded-full tracking-wider uppercase shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-amber-400 font-mono font-semibold uppercase block mb-1">Audit Finding:</span>
                        <p className="text-slate-300 leading-relaxed font-light">{item.found}</p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase block mb-1">Production Fix Applied:</span>
                        <p className="text-slate-300 leading-relaxed font-light">{item.fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: ENGINEERING FOUNDATIONS */}
          {activeTab === 'foundations' && (
            <motion.div
              key="foundations"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  <span>Volume 1 — Engineering Mindset Foundations</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Core tenets of modern software development, AI-directed pair programming, and production economics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-100">AI-Directed Engineering</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    Human-in-the-loop agentic workflow where engineers architect intent, specs, and verification suites while AI synthesizes implementations with AST accuracy.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-100">SOLID & Clean Architecture</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    Strict adherence to Single Responsibility, Dependency Inversion, and Open/Closed principles ensuring low coupling and high cohesion across modules.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-100">Systems & Production Thinking</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    Designing for balancing feedback loops, rate limiting, circuit breakers, zero-downtime deployment, and blameless post-mortems.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: SYSTEM ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Volume 2 — System Architecture & Modular Monolith</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bounded contexts, CQRS, event sourcing, transactional outbox pattern, and C4 model hierarchy.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
                <h3 className="font-heading font-bold text-lg text-slate-100">System Architecture Blueprint</h3>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400 block mb-1">Domain-Driven Design (DDD)</span>
                    <p className="text-slate-300 font-light leading-relaxed">
                      Bounded contexts isolate Student, Booking, Session, and RTO Document domains cleanly with immutable Value Objects.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">Transactional Integrity</span>
                    <p className="text-slate-300 font-light leading-relaxed">
                      Razorpay payment captures update booking state and confirm sessions within single atomic database transactions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: FRONTEND ENGINEERING */}
          {activeTab === 'frontend' && (
            <motion.div
              key="frontend"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
                <h2 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-amber-400" />
                  <span>Volume 3 — Frontend Engineering & Core Web Vitals</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  React Server Components, LCP/CLS/INP optimization, WCAG 2.1 AA accessibility, and motion design systems.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <h3 className="font-heading font-bold text-base text-slate-100">Core Web Vitals</h3>
                  <ul className="space-y-2 text-slate-300 font-light">
                    <li>• <strong>LCP ≤ 2.5s</strong>: Preloaded hero assets with Next.js &lt;Image priority /&gt;.</li>
                    <li>• <strong>CLS ≤ 0.1</strong>: Reserved aspect ratio containers for media.</li>
                    <li>• <strong>INP ≤ 200ms</strong>: Non-blocking state transitions via useTransition().</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  <h3 className="font-heading font-bold text-base text-slate-100">Accessibility (a11y)</h3>
                  <ul className="space-y-2 text-slate-300 font-light">
                    <li>• <strong>WCAG 2.1 AA</strong>: Strict ARIA roles, semantic landmarks, and skip links.</li>
                    <li>• <strong>Focus Control</strong>: Trapped focus inside modals with visible outline rings.</li>
                    <li>• <strong>Reduced Motion</strong>: Auto-respects prefers-reduced-motion.</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                  <Database className="w-6 h-6 text-emerald-400" />
                  <h3 className="font-heading font-bold text-base text-slate-100">Hydration & RSC</h3>
                  <ul className="space-y-2 text-slate-300 font-light">
                    <li>• <strong>Zero-Bundle RSCs</strong>: Server component default reduces JS shipped.</li>
                    <li>• <strong>Progressive Fallbacks</strong>: Native form actions work prior to JS hydration.</li>
                    <li>• <strong>Skeleton Loaders</strong>: Prevents layout shifts during data streaming.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. FOOTER CTA */}
      <div className="max-w-7xl mx-auto pt-8 text-center border-t border-slate-800/80">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-xl transition cursor-pointer"
        >
          <span>Return to Homepage</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
