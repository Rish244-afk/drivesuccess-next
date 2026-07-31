import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
        <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-3xl text-slate-100">404 - Page Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The driving academy page you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
