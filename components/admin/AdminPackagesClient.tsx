'use client';

import React, { useState } from 'react';
import { Package, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { createPackageAction, deletePackageAction } from '@/actions/admin';

interface AdminPackagesClientProps {
  initialPackages: any[];
}

export function AdminPackagesClient({ initialPackages }: AdminPackagesClientProps) {
  const [packages, setPackages] = useState<any[]>(initialPackages);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('LICENSE_4W');
  const [price, setPrice] = useState('5000');
  const [sessionsCount, setSessionsCount] = useState('10');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Best Seller');

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createPackageAction({
      name,
      slug: name.toLowerCase().replace(/[^\w]+/g, '-'),
      type,
      price,
      sessionsCount,
      description,
      badge,
    });

    if (res.success && res.package) {
      setMessage('Package created successfully!');
      setPackages((prev) => [res.package, ...prev]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setLoading(false);
    } else {
      setLoading(false);
      alert(res.error || 'Failed to create package.');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    const res = await deletePackageAction(id);
    if (res.success) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(res.error || 'Failed to delete package.');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h2 className="font-heading font-extrabold text-xl text-slate-100">Package Offerings ({packages.length})</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Package</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                  {pkg.type}
                </span>
                <button
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-heading font-extrabold text-lg text-slate-100">{pkg.name}</h3>
              <p className="font-heading font-extrabold text-2xl text-amber-400">₹{pkg.price.toLocaleString()}</p>
              <p className="text-xs text-slate-400 line-clamp-2">{pkg.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
              <span>{pkg.sessionsCount} Practical Sessions</span>
              <span className="font-mono text-[10px] text-slate-500">{pkg.id.slice(-6)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-heading font-extrabold text-xl text-slate-100">Create New Package</h3>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase">Package Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Master License Package"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 uppercase">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
                  >
                    <option value="LICENSE_4W">4 Wheeler</option>
                    <option value="LICENSE_2W">2 Wheeler</option>
                    <option value="COMBO">Combo</option>
                    <option value="IDL_TRANSFER">IDL / Transfer</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="REGISTRATION">Registration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 uppercase">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase">Sessions Count</label>
                <input
                  type="number"
                  required
                  value={sessionsCount}
                  onChange={(e) => setSessionsCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 uppercase">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold uppercase"
                >
                  {loading ? 'Saving...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
