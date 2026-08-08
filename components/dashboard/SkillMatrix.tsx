'use client';

import React from 'react';
import { Star, Award, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';

interface Skill {
  name: string;
  rating: number; // 1 to 5
  description: string;
  category: 'Control' | 'Safety' | 'Maneuver';
}

interface SkillMatrixProps {
  skills?: Skill[];
  instructorNote?: string;
}

const DEFAULT_SKILLS: Skill[] = [
  {
    name: 'Reverse & Parallel Parking',
    rating: 4,
    description: 'Precision parking in tight spaces and curb alignment.',
    category: 'Maneuver',
  },
  {
    name: 'Lane Discipline & Highway Merging',
    rating: 5,
    description: 'Maintaining smooth lane position and blind-spot checking.',
    category: 'Safety',
  },
  {
    name: 'Hill Start & Clutch Control',
    rating: 3,
    description: 'Holding vehicle on steep incline without roll-back.',
    category: 'Control',
  },
  {
    name: 'Traffic Signal & Junction Awareness',
    rating: 4,
    description: 'Anticipating pedestrian movements and signal timings.',
    category: 'Safety',
  },
  {
    name: 'Night Driving & Beam Control',
    rating: 2,
    description: 'Handling low visibility, high beam glare, and nocturnal road hazards.',
    category: 'Control',
  },
  {
    name: 'Emergency Braking & ABS Reaction',
    rating: 5,
    description: 'Immediate controlled stopping without skid or swerve.',
    category: 'Control',
  },
];

export function SkillMatrix({ skills = DEFAULT_SKILLS, instructorNote }: SkillMatrixProps) {
  const avgRating = (
    skills.reduce((acc, curr) => acc + curr.rating, 0) / skills.length
  ).toFixed(1);

  return (
    <div className="bg-[#0D0E15] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 text-slate-100">
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-cyan-400" />
            Pedagogical Driving Skill Matrix
          </span>
          <h3 className="font-serif text-2xl text-white font-normal">
            Practical Competency Matrix
          </h3>
        </div>

        <div className="flex items-center gap-3 bg-cyan-950/40 border border-cyan-500/30 px-4 py-2 rounded-2xl">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Average Skill Rating</span>
            <span className="font-serif text-lg font-bold text-white">
              {avgRating} <span className="text-xs font-sans text-amber-400 font-medium">/ 5.0 ★</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Skill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="bg-[#12141F] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-cyan-500/40 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                  {skill.category}
                </span>
                <h4 className="font-serif text-base text-white font-medium mt-1">
                  {skill.name}
                </h4>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= skill.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {skill.description}
            </p>

            {/* Proficiency Bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                style={{ width: `${(skill.rating / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Instructor Feedback Note */}
      <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Instructor Evaluator Note
          </h5>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            {instructorNote ||
              '“Demonstrates excellent lane discipline and emergency braking reactions. Focus next session on parallel parking alignment and smooth hill clutch release.” — Academy Senior Instructor'}
          </p>
        </div>
      </div>
    </div>
  );
}
