'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, CheckCircle2, Star } from 'lucide-react';
import { createInstructorAction, deleteInstructorAction } from '@/actions/admin';

interface AdminInstructorsClientProps {
  initialInstructors: any[];
}

export function AdminInstructorsClient({ initialInstructors }: AdminInstructorsClientProps) {
  const [instructors, setInstructors] = useState<any[]>(initialInstructors);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('6');
  const [rating, setRating] = useState('4.9');
  const [specialties, setSpecialties] = useState('Highway Driving, Parallel Parking');
  const [bio, setBio] = useState('');

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await createInstructorAction({
      name,
      email,
      phone,
      experienceYears,
      rating,
      specialties,
      bio,
    });

    if (res.success && res.instructor) {
      setMessage('Instructor profile created successfully!');
      setInstructors((prev) => [res.instructor, ...prev]);
      setShowModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setLoading(false);
    } else {
      setLoading(false);
      alert(res.error || 'Failed to create instructor.');
    }
  };

  const handleDeleteInstructor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instructor?')) return;
    const res = await deleteInstructorAction(id);
    if (res.success) {
      setInstructors((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert(res.error || 'Failed to delete instructor.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl">
        <h2 className="font-heading font-extrabold text-xl text-slate-900">Academy Instructors ({instructors.length})</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Instructor</span>
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
        {instructors.map((inst) => (
          <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-600 px-2 py-0.5 rounded text-xs font-extrabold">
                  <Star className="w-3 h-3 fill-blue-600" />
                  <span>{inst.rating}</span>
                </div>
                <button
                  onClick={() => handleDeleteInstructor(inst.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-heading font-extrabold text-lg text-slate-900">{inst.name}</h3>
              <p className="text-xs text-slate-400">{inst.experienceYears} Years Experience</p>
              <p className="text-xs text-slate-600 font-mono">{inst.phone} • {inst.email}</p>
              
              <div className="flex flex-wrap gap-1 pt-1">
                {(inst.specialties || []).map((sp: string, idx: number) => (
                  <span key={idx} className="bg-white text-slate-600 text-[10px] px-2 py-0.5 rounded border border-slate-200">
                    {sp}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
              <span>RTO Certified</span>
              <span className="font-mono text-[10px] text-slate-400">{inst.id.slice(-6)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-white/10 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full space-y-4 shadow-hover">
            <h3 className="font-heading font-extrabold text-xl text-slate-900">Add New Instructor</h3>

            <form onSubmit={handleCreateInstructor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rajesh Kumar"
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@drivesuccess.edu"
                    className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Exp (Years)</label>
                  <input
                    type="number"
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Rating (★)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Specialties (comma separated)</label>
                <input
                  type="text"
                  required
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="Night Driving, Parallel Parking"
                  className="w-full bg-white border border-slate-200 text-slate-900 p-3 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Bio</label>
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
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
                  {loading ? 'Saving...' : 'Add Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
