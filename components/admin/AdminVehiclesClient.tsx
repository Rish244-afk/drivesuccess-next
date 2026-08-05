'use client';

import React, { useState } from 'react';
import { Car, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { createVehicleAction, deleteVehicleAction } from '@/actions/admin';

interface AdminVehiclesClientProps {
  initialVehicles: any[];
}

export function AdminVehiclesClient({ initialVehicles }: AdminVehiclesClientProps) {
  const [vehicles, setVehicles] = useState<any[]>(initialVehicles);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [tier, setTier] = useState('TIER_A_COMPACT');
  const [transmission, setTransmission] = useState('MANUAL');
  const [ratePerSession, setRatePerSession] = useState('500');
  const [description, setDescription] = useState('');

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createVehicleAction({
      name,
      plateNumber,
      tier,
      transmission,
      ratePerSession,
      description,
      imageUrl: '/images/fleet_wagonr_1785513709373.jpg',
      status: 'AVAILABLE',
    });

    if (res.success && res.vehicle) {
      setMessage('Vehicle added to fleet successfully!');
      setVehicles((prev) => [res.vehicle, ...prev]);
      setShowModal(false);
      setName('');
      setPlateNumber('');
      setLoading(false);
    } else {
      setLoading(false);
      alert(res.error || 'Failed to create vehicle.');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    const res = await deleteVehicleAction(id);
    if (res.success) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } else {
      alert(res.error || 'Failed to delete vehicle.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl">
        <h2 className="font-heading font-extrabold text-xl text-slate-900">Learning Fleet ({vehicles.length})</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((veh) => (
          <div key={veh.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                  {veh.tier} • {veh.transmission}
                </span>
                <button
                  onClick={() => handleDeleteVehicle(veh.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-heading font-extrabold text-lg text-slate-900">{veh.name}</h3>
              <p className="font-mono text-xs text-slate-400">Plate: {veh.plateNumber}</p>
              <p className="text-xs text-blue-600 font-extrabold">₹{veh.ratePerSession} / session</p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
              <span className="text-[10px] uppercase font-bold text-emerald-400">{veh.status}</span>
              <span className="font-mono text-[10px] text-slate-400">{veh.id.slice(-6)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-white/10 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full space-y-4 shadow-hover">
            <h3 className="font-heading font-extrabold text-xl text-slate-900">Add Vehicle to Fleet</h3>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Vehicle Model / Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maruti Suzuki Swift"
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Plate Number</label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="KA-01-AB-1234"
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                  >
                    <option value="TIER_A_COMPACT">Tier A Compact</option>
                    <option value="TIER_B_PREMIUM">Tier B Premium</option>
                    <option value="SUV">SUV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="AUTOMATIC">Automatic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Rate Per Session (₹)</label>
                <input
                  type="number"
                  required
                  value={ratePerSession}
                  onChange={(e) => setRatePerSession(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 bg-blue-600 text-slate-950 rounded-xl font-bold uppercase"
                >
                  {loading ? 'Saving...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
