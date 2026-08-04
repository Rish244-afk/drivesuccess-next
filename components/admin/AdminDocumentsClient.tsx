'use client';

import React, { useState } from 'react';
import { updateDocumentStatusAction } from '@/actions/admin';

export function AdminDocumentsClient({ documents }: { documents: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: string) => {
    setLoadingId(id);
    const res = await updateDocumentStatusAction(id, status);
    if (!res.success) {
      setLoadingId(null);
      alert(res.error);
    } else {
      setLoadingId(null);
    }
  };

  if (!documents.length) {
    return (
      <div className="bg-[#070B19] border border-slate-800/60 p-12 rounded-2xl text-center">
        <h3 className="text-slate-200 font-serif text-xl">No documents uploaded</h3>
        <p className="text-slate-500 font-light text-sm mt-2">Students have not uploaded any documents yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#070B19] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900 border-b border-slate-800">
            <th className="p-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
            <th className="p-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Type</th>
            <th className="p-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="p-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">File</th>
            <th className="p-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-slate-900/40 transition">
              <td className="p-5 text-sm text-slate-200">
                {doc.student?.name}
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.student?.email}</div>
              </td>
              <td className="p-5 text-sm text-slate-300">
                {doc.type.replace(/_/g, ' ').toUpperCase()}
              </td>
              <td className="p-5">
                <span className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full border ${
                  doc.status === 'verified' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                  doc.status === 'rejected' ? 'border-red-500/30 text-red-400 bg-red-500/5' :
                  'border-amber-500/30 text-amber-400 bg-amber-500/5'
                }`}>
                  {doc.status}
                </span>
              </td>
              <td className="p-5 text-sm">
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
                    View Document
                  </a>
                ) : (
                  <span className="text-slate-500 text-xs">No File</span>
                )}
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2">
                  <button
                    disabled={loadingId === doc.id || doc.status === 'verified'}
                    onClick={() => handleStatusUpdate(doc.id, 'verified')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    disabled={loadingId === doc.id || doc.status === 'rejected'}
                    onClick={() => handleStatusUpdate(doc.id, 'rejected')}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
