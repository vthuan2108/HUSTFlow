/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  Bot,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  BarChart3,
  Calendar as CalendarIcon,
  CheckSquare,
  Music,
  BookOpen,
  Keyboard,
  ShieldAlert,
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideSectionId = 
  | 'AI_PLANNER'
  | 'TODO'
  | 'CULTIVATION'
  | 'POMODORO'
  | 'CALENDAR'
  | 'GRADES'
  | 'LOFI_PLAYER'
  | 'IELTS'
  | 'NOTES_SHORTCUTS';

interface GuideSectionConfig {
  id: GuideSectionId;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

const GUIDE_SECTIONS: GuideSectionConfig[] = [
  {
    id: 'AI_PLANNER',
    icon: '🔮',
    title: 'Heavenly Secrets (Smart AI)',
    desc: 'Manual progress analysis, retreat scheduling & task management',
    badge: 'AI Smart'
  },
  {
    id: 'TODO',
    icon: '⚔️',
    title: 'Tasks (Todo List) & Eisenhower Matrix',
    desc: 'Categorize by Day / Week / Month & earn cultivation points',
    badge: 'Core'
  },
  {
    id: 'CULTIVATION',
    icon: '🧘',
    title: 'Cultivation Realms & Kunlun Mirage',
    desc: '15 cultivation realms, breakthroughs & Treasure Store',
    badge: 'Gamify'
  },
  {
    id: 'POMODORO',
    icon: '⏳',
    title: 'Pomodoro & Focus Soundscape',
    desc: 'Cultivation countdown timer & focus ambient audio',
  },
  {
    id: 'CALENDAR',
    icon: '📅',
    title: 'Schedules & Timetable',
    desc: 'Automated calendar, drag & drop, and color groups',
  },
  {
    id: 'GRADES',
    icon: '📊',
    title: 'Gradebook & Google Sheets Sync',
    desc: 'Calculate CPA/GPA & 2-way sync with Google Drive',
  },
  {
    id: 'LOFI_PLAYER',
    icon: '🔴',
    title: 'Floating Mini Lofi Player',
    desc: 'Draggable YouTube Lofi player at bottom corner',
  },
  {
    id: 'IELTS',
    icon: '🇬🇧',
    title: 'IELTS Practice Logbook',
    desc: 'Reading/Listening test log & progress charts',
  },
  {
    id: 'NOTES_SHORTCUTS',
    icon: '📝',
    title: 'Notes & Keyboard Shortcuts',
    desc: 'Scripture Vault notes & convenient shortcuts',
  }
];

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeSection, setActiveSection] = useState<GuideSectionId>('AI_PLANNER');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0a0d14] border-2 border-slate-950 rounded-2xl w-full max-w-5xl h-[88vh] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col relative"
        >
          {/* Top Modal Header */}
          <div className="bg-[#0f141c] border-b-2 border-slate-950 px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black shadow-[2px_2px_0px_#000]">
                <HelpCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2">
                  📜 HUSTFLOW USER GUIDE
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-bold font-mono">
                    User Guide
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  Comprehensive guide to all features and systems in HUSTFlow
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-800"
              title="Close guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Main Body (2 Columns Layout) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Navigation Sidebar */}
            <div className="w-full md:w-80 border-b-2 md:border-b-0 md:border-r-2 border-slate-950 bg-[#0c1018] p-3 space-y-1.5 overflow-y-auto shrink-0">
              <span className="px-2 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Features Directory:
              </span>
              {GUIDE_SECTIONS.map((sec) => {
                const isSelected = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-[#161c2a] border-amber-400 text-slate-100 shadow-[3px_3px_0px_#000]'
                        : 'bg-[#0f141c]/60 border-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-900'
                    }`}
                  >
                    <span className="text-xl shrink-0">{sec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-black text-[11px] truncate font-mono ${isSelected ? 'text-amber-400' : ''}`}>
                          {sec.title}
                        </span>
                        {sec.badge && (
                          <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono shrink-0">
                            {sec.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] opacity-75 truncate font-sans text-slate-400 mt-0.5">
                        {sec.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Detailed Guide Content Area */}
            <div className="flex-1 bg-[#07090f] p-5 sm:p-7 overflow-y-auto font-sans leading-relaxed text-slate-300 text-xs sm:text-sm space-y-6">
              
              {/* ================= SECTION 1: CHATBOT AI ================= */}
              {activeSection === 'AI_PLANNER' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🔮</span>
                    <div>
                      <h3 className="text-base font-extrabold text-purple-400 font-mono uppercase tracking-wide">
                        Heavenly Secrets Pavilion (AI Mentor & Smart Planner)
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        AI system that analyzes application data to assist in managing all tasks and schedules
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-100 text-xs uppercase font-mono text-amber-400 flex items-center gap-2">
                      ⚡ KEY AI CHATBOT CAPABILITIES:
                    </h4>

                    {/* Single Column Vertical List */}
                    <div className="space-y-3 font-sans">
                      {/* Feature 1 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-emerald-300 font-mono text-xs flex items-center gap-2">
                          <span>📌 1. Create / Edit / Delete Tasks (Task Management)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          AI can automatically generate new tasks, modify priority/deadlines of existing items, or purge overdue duplicate tasks on demand.
                        </p>
                      </div>

                      {/* Feature 2 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-sky-300 font-mono text-xs flex items-center gap-2">
                          <span>📅 2. Timetable & Schedule Management (Calendar & Timetable)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          AI reads upcoming 30-day schedules, identifies free slots, inserts 15–30 minute buffer breaks between university lectures, and formulates an optimal timetable.
                        </p>
                      </div>

                      {/* Feature 3 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-purple-300 font-mono text-xs flex items-center gap-2">
                          <span>🧘 3. Manual Progress Analysis & Seclusion Planning</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          AI monitors course manuals (Calculus, Linear Algebra, Philosophy...), analyzes uncompleted cultivation stages, and schedules required Pomodoro focus sessions to conquer midterm and final examinations.
                        </p>
                      </div>

                      {/* Feature 4 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-amber-300 font-mono text-xs flex items-center gap-2">
                          <span>📊 4. CPA/GPA Grade Analytics</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          Analyzes grade trends from Google Sheets, issues alerts for at-risk courses, and advises on target semester GPAs needed to elevate cumulative CPA.
                        </p>
                      </div>

                      {/* Feature 5 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-rose-300 font-mono text-xs flex items-center gap-2">
                          <span>🔮 5. Heavenly Divination (Auto Daily Plan)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          Aggregates overdue tasks with tomorrow's class schedule to forge a comprehensive daily study and meditation plan.
                        </p>
                      </div>

                      {/* Feature 6 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-teal-300 font-mono text-xs flex items-center gap-2">
                          <span>⚡ 6. Fast Command Targeting (/task, /calendar)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          Use prefix <code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/task [content]</code> to scope AI exclusively to Tasks, or <code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/calendar [content]</code> to focus strictly on Timetable scheduling.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 2: TODO LIST ================= */}
              {activeSection === 'TODO' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">⚔️</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Tasks (Todo List) & Eisenhower Matrix
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Manage academic assignments, categorize into Day / Week / Month cycles, and synchronize with Cloud
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* 3 Categories / Types */}
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-amber-300">
                        🗓️ 3 Task Categories by Timeframe:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                        <div className="bg-[#141a27] p-3 rounded-lg border border-sky-500/30">
                          <span className="text-sky-300 font-bold block mb-1">📅 Daily Tasks (DAY)</span>
                          <span className="text-[10px] text-slate-300">Tasks requiring completion within the current day.</span>
                        </div>
                        <div className="bg-[#141a27] p-3 rounded-lg border border-amber-500/30">
                          <span className="text-amber-300 font-bold block mb-1">📆 Weekly Tasks (WEEK)</span>
                          <span className="text-[10px] text-slate-300">Milestones to accomplish throughout the academic week.</span>
                        </div>
                        <div className="bg-[#141a27] p-3 rounded-lg border border-purple-500/30">
                          <span className="text-purple-300 font-bold block mb-1">🗓️ Monthly Tasks (MONTH)</span>
                          <span className="text-[10px] text-slate-300">Major projects & exam deadlines across the month.</span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Levels */}
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-sky-400">
                        🎯 Cultivation Priority Levels & Rewards (EXP / Spirit Stones):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-amber-500/30">
                          <span className="text-amber-400 font-bold">🟡 HEAVEN TIER / HIGH VOW</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Critical & urgent. Rewards <strong>+50 EXP & +50 Spirit Stones</strong>.</div>
                        </div>
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-orange-500/30">
                          <span className="text-orange-400 font-bold">🟠 EARTH TIER / ESSENTIAL</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">High importance. Rewards <strong>+35 EXP & +35 Spirit Stones</strong>.</div>
                        </div>
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-sky-500/30">
                          <span className="text-sky-400 font-bold">🔷 ADEPT TIER / ROUTINE</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Daily routine task. Rewards <strong>+25 EXP & +25 Spirit Stones</strong>.</div>
                        </div>
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-emerald-500/30">
                          <span className="text-emerald-400 font-bold">🌱 NOVICE TIER</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Minor casual task. Rewards <strong>+15 EXP & +15 Spirit Stones</strong>.</div>
                        </div>
                      </div>
                    </div>

                    {/* Anti-procrastination Tam Ma */}
                    <div className="bg-purple-950/20 border border-purple-500/40 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-purple-300 text-xs uppercase font-mono flex items-center gap-1.5">
                        💀 Anti-Procrastination Mechanism (Inner Demon Warning):
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Whenever any task becomes overdue, inner demon miasma infiltrates your dantian, inflicting a <strong>-30% penalty to Cultivation EXP accumulation</strong>. Resolve overdue tasks immediately, or use a <strong>Mind-Purifying Talisman</strong> from the Treasure Store to dispel the demonic miasma!
                      </p>
                    </div>

                    {/* Google Tasks Sync */}
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-emerald-400">
                        🔄 Two-Way Google Tasks Synchronization:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Seamlessly syncs all tasks with your Google Tasks account upon signing in with Google. Marking tasks complete or deleting them updates simultaneously on Google Cloud.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 3: CULTIVATION REALMS ================= */}
              {activeSection === 'CULTIVATION' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🧘</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        15 Cultivation Realms & Kunlun Mirage System
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Transform your academic journey into a cultivation breakthrough progression (Standard Er Gen style)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h4 className="font-extrabold text-slate-100 text-xs uppercase font-mono text-amber-400">
                      🏆 15 CULTIVATION REALMS (ASCENDING):
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div className="bg-[#0f141c] border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-slate-300 font-bold">1. 🌫️ Ngưng Khí Kỳ</span> (Tầng 1 đến Tầng 15)
                      </div>
                      <div className="bg-[#0f141c] border border-blue-900/50 p-2.5 rounded-xl">
                        <span className="text-blue-400 font-bold">2. 💧 Trúc Cơ Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-emerald-900/50 p-2.5 rounded-xl">
                        <span className="text-emerald-400 font-bold">3. 🟢 Kết Đan Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-purple-900/50 p-2.5 rounded-xl">
                        <span className="text-purple-400 font-bold">4. 🟣 Nguyên Anh Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-amber-900/50 p-2.5 rounded-xl">
                        <span className="text-amber-400 font-bold">5. 🟡 Hóa Thần Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-orange-900/50 p-2.5 rounded-xl">
                        <span className="text-orange-400 font-bold">6. 🟠 Anh Biến Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-rose-900/50 p-2.5 rounded-xl">
                        <span className="text-rose-400 font-bold">7. 🔴 Vấn Đỉnh Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-pink-900/50 p-2.5 rounded-xl">
                        <span className="text-pink-400 font-bold">8. 🌸 Cảnh Giới Quá Độ</span> (Âm Hư Cảnh, Dương Thực Cảnh)
                      </div>
                      <div className="bg-[#0f141c] border border-cyan-900/50 p-2.5 rounded-xl">
                        <span className="text-cyan-400 font-bold">9. ❄️ Khuy Niết / Tịnh Niết / Toái Niết</span>
                      </div>
                      <div className="bg-[#0f141c] border border-violet-900/50 p-2.5 rounded-xl">
                        <span className="text-violet-400 font-bold">10. ⚡ Thiên Nhân Ngũ Suy</span> (Đệ Nhất ➔ Đệ Ngũ Suy)
                      </div>
                      <div className="bg-[#0f141c] border border-teal-900/50 p-2.5 rounded-xl">
                        <span className="text-teal-300 font-bold">11. 🌌 Không Niết / Không Linh / Không Huyền</span>
                      </div>
                      <div className="bg-[#0f141c] border border-red-900/50 p-2.5 rounded-xl">
                        <span className="text-red-400 font-bold">12. 🔥 Huyền Kiếp Cảnh</span> (9 Kiếp Ngoại/Nội/Hồn Kiếp)
                      </div>
                      <div className="bg-[#0f141c] border border-amber-600/50 p-2.5 rounded-xl">
                        <span className="text-amber-300 font-bold">13. 👑 Không Kiếp Cảnh</span> (Đại Tôn - Thiên Tôn Chí Tôn)
                      </div>
                      <div className="bg-[#0f141c] border border-emerald-500/50 p-2.5 rounded-xl">
                        <span className="text-emerald-300 font-bold">14. 🏆 Bán Bộ Đạp Thiên</span> (9 Cầu Dung Nhập Quy Tắc)
                      </div>
                      <div className="bg-[#0f141c] border border-amber-400 p-2.5 rounded-xl col-span-1 sm:col-span-2 text-center">
                        <span className="text-amber-200 font-black">15. 🌟 ĐẠP THIÊN CẢNH (Siêu Thoát Vạn Giới - Đạo Tổ Vương Lâm)</span>
                      </div>
                    </div>

                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-emerald-400">
                        ⚡ Bottleneck Breakthrough Elixirs (Treasure Store Shop):
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        At critical realm bottlenecks (Trúc Cơ, Kết Đan, Nguyên Anh, Huyền Kiếp...), Daoists must gather enough Spirit Stones to acquire the corresponding pills from the Treasure Store (Foundation Pill, Core Formation Pill, Nascent Soul Pill, Tribulation Crossing Talisman) to ensure a 100% breakthrough success rate!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 4: POMODORO ================= */}
              {activeSection === 'POMODORO' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">⏳</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Pomodoro Timer & Focus Soundscapes
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Focused 25-minute cultivation meditation + 5-minute restorative breaks
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase font-mono text-amber-300">
                        ⚡ Pomodoro Cultivation Workflow:
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-300">
                        <li><strong>Focus Mode (Cultivation)</strong>: 25 minutes default. Click <strong>Start</strong> to activate.</li>
                        <li><strong>Break Mode (Rest)</strong>: 5 minutes default relaxation after each focus cycle.</li>
                        <li><strong>Earn EXP & Spirit Stones</strong>: Each minute of meditation yields <strong>+1 Cultivation EXP</strong> & <strong>+1 Spirit Stone</strong>.</li>
                      </ul>
                    </div>

                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase font-mono text-emerald-300">
                        🎵 Meditation Soundscapes:
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-300">
                        <li>Supports <strong>Gentle Rain 🌧️</strong>, <strong>Ocean Waves 🌊</strong>, <strong>Forest Breeze 🌲</strong>, and <strong>White Noise ⚪</strong>.</li>
                        <li>Optional <strong>🔴 YouTube Lofi Stream</strong> automatically plays harmonized background beats when timer runs.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 5: CALENDAR ================= */}
              {activeSection === 'CALENDAR' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">📅</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Automated Schedules & Timetable
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Manage all classes, exams, and milestones in Month / Week / Agenda views
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-sky-300">
                        🗓️ 3 Intuitive Calendar Views:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Toggle between <strong>Month View</strong>, <strong>Week View</strong>, and <strong>Agenda List View</strong> in the top-right toolbar.
                      </p>
                    </div>

                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-purple-300">
                        📁 Calendar Color Groups:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Categorize events by color: <strong>University Classes (Blue)</strong>, <strong>Exams (Red)</strong>, <strong>IELTS Prep (Yellow)</strong>...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 6: GRADES ================= */}
              {activeSection === 'GRADES' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">📊</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Gradebook & Two-Way Google Sheets Sync
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Track cumulative CPA, semester GPA & automatically synchronize with Google Drive
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-emerald-400">
                        🔄 Direct Two-Way Sync With Google Sheets:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                        <li>Paste your spreadsheet link into the Configuration field and click <strong>Save & Connect</strong>.</li>
                        <li>Click <strong>Two-Way Sync</strong>: Grade modifications on the web save to Google Sheets, and spreadsheet edits sync back!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 7: LOFI PLAYER ================= */}
              {activeSection === 'LOFI_PLAYER' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🔴</span>
                    <div>
                      <h3 className="text-base font-extrabold text-rose-400 font-mono uppercase tracking-wide">
                        Floating YouTube Mini Lofi Player
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Freely draggable YouTube music player widget positioned at the bottom corner
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-rose-400">
                        🔴 Floating `🔴 LOFI STREAM` Button:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Click the floating <strong>`🔴 LOFI STREAM`</strong> button at the bottom-left corner to launch the Lofi player instantly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 8: IELTS ================= */}
              {activeSection === 'IELTS' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🇬🇧</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        IELTS Mock Test Preparation Log
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Track Reading/Listening band scores and study progress for graduation and study abroad
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                    <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-amber-300">
                      📖 Automatic Band Score Conversion:
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Enter raw correct answers (e.g. 35/40 Reading questions), and the system automatically converts it to standard Band Score (Band 8.0) and updates your trajectory charts.
                    </p>
                  </div>
                </div>
              )}

              {/* ================= SECTION 9: NOTES & SHORTCUTS ================= */}
              {activeSection === 'NOTES_SHORTCUTS' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">📝</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Cultivation Notes & System Hotkeys
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Preserve academic knowledge and operate swiftly without mouse dependence
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-amber-400">
                        ⌨️ Convenient Keyboard Shortcuts:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className="text-slate-300">Start / Pause Pomodoro:</span>
                          <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Spacebar</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className="text-slate-300">Close Pop-up Modals:</span>
                          <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Esc</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
