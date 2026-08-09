'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  FileCheck,
} from 'lucide-react';

function isSafeDocumentUrl(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.startsWith('/api/documents/download') ||
    lower.startsWith('data:image/jpeg;base64,') ||
    lower.startsWith('data:image/png;base64,') ||
    lower.startsWith('data:image/webp;base64,') ||
    lower.startsWith('data:application/pdf;base64,') ||
    lower.startsWith('https://')
  );
}

interface DocumentVaultProps {
  documents: Array<{
    id?: string;
    type: string;
    fileUrl?: string | null;
    status: string;
    uploadedAt?: Date | string | null;
  }>;
  onRefresh?: () => void;
}

const DOCUMENT_TYPES = [
  {
    type: 'government_id',
    name: 'Government Driving ID / Aadhaar / Passport',
    description: 'Government issued identity proof required for RTO registration.',
    required: true,
  },
  {
    type: 'learner_license',
    name: "Learner's Licence Permit",
    description: 'Valid LLR permit issued by transport department.',
    required: true,
  },
  {
    type: 'medical_certificate',
    name: 'Medical Certificate (Form 1A)',
    description: 'Physical fitness certificate signed by registered medical practitioner.',
    required: true,
  },
  {
    type: 'rto_form_20',
    name: 'Passport Photo / RTO Form 20',
    description: 'Recent passport photo and RTO application form.',
    required: false,
  },
];

export function DocumentVault({ documents, onRefresh }: DocumentVaultProps) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDocStatus = (type: string) => {
    const userDoc = documents?.find((d) => d.type === type);
    const downloadUrl = userDoc?.id
      ? `/api/documents/download?id=${userDoc.id}`
      : userDoc?.fileUrl;

    return {
      doc: userDoc,
      status: userDoc?.status || 'not_uploaded',
      url: downloadUrl,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB');
      return;
    }

    setUploadingType(type);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error uploading document.');
    } finally {
      setUploadingType(null);
    }
  };

  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const totalDocs = DOCUMENT_TYPES.length;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            RTO Verification Vault
          </span>
          <h3 className="font-serif text-2xl text-slate-900 font-normal">
            Required Documents
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-900">
            {verifiedCount} of {totalDocs} Verified
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const { doc, status, url } = getDocStatus(docType.type);
          const isUploading = uploadingType === docType.type;

          return (
            <div
              key={docType.type}
              className="group relative bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-serif text-lg text-slate-900 font-normal leading-snug">
                    {docType.name}
                  </h4>
                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                      status === 'verified'
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : status === 'submitted'
                        ? 'border-blue-300 text-blue-700 bg-blue-50'
                        : status === 'rejected'
                        ? 'border-red-300 text-red-700 bg-red-50'
                        : 'border-amber-300 text-amber-800 bg-amber-50'
                    }`}
                  >
                    {status === 'not_uploaded' ? 'Missing' : status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  {docType.description}
                </p>
              </div>

              {/* Upload or View Controls */}
              <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                {url && isSafeDocumentUrl(url) ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview Document</span>
                  </a>
                ) : url ? (
                  <span className="text-[11px] text-red-500 font-mono">Blocked Unsafe File</span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No document uploaded yet</span>
                )}

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, docType.type)}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <button
                    disabled={isUploading}
                    className={`text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                      url
                        ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{url ? 'Replace' : 'Upload'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
