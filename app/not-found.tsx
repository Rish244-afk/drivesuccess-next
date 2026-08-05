import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-hover">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-300 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-3xl text-slate-900">404 - Page Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The driving academy page you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
