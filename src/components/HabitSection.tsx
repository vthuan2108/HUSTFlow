/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Habit } from '../types';
import { CalendarCheck, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HabitSectionProps {
  habits: Habit[];
  onAddHabit: (title: string, description?: string) => void;
  onToggleHabitDay: (id: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateHabitStreak(history: Record<string, boolean>): number {
  if (!history) return 0;
  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let startDate: Date | null = null;
  if (history[todayStr]) {
    startDate = today;
  } else if (history[yesterdayStr]) {
    startDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  let curr = new Date(startDate);

  while (true) {
    const dateStr = getLocalDateString(curr);
    if (history[dateStr]) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function HabitSection({ habits, onAddHabit, onToggleHabitDay, onDeleteHabit }: HabitSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      const dateStr = getLocalDateString(d);
      const dayLabel = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      days.push({
        dateStr,
        dayLabel,
        isToday: dateStr === getLocalDateString(),
        dayNum: d.getDate()
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddHabit(title, description);
    setTitle('');
    setDescription('');
    setIsAdding(false);
  };

  return (
    <div className="neo-card p-5 flex flex-col min-h-[300px] max-h-[380px]" id="habit-section">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-emerald-400" />
          Nhật Khóa Thói Quen
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] neo-btn neo-btn-secondary px-2.5 py-1.5"
          id="toggle-add-habit-btn"
        >
          {isAdding ? 'Hủy' : '+ Thêm'}
        </button>
      </div>

      {/* Form adding habit */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-950 border-2 border-slate-950 p-3 rounded-xl mb-4 space-y-2 shrink-0 overflow-hidden text-xs shadow-[2px_2px_0px_#000]"
          >
            <div>
              <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Tên Thói Quen Luyện Tập</label>
              <input
                type="text"
                required
                placeholder="VD: Luyện phát âm IPA, Chép chính tả..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Mục Tiêu / Chú thích</label>
              <input
                type="text"
                placeholder="VD: 15 phút mỗi ngày lúc sáng sớm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 neo-btn neo-btn-success text-[10px]"
            >
              THIẾT LẬP THÓI QUEN (+15 EXP NHẬN MỖI LẦN)
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Habits List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-0" id="habit-list-container">
        {habits.length > 0 ? (
          habits.map(habit => {
            return (
              <div
                key={habit.id}
                className="bg-[#1e2638] border-2 border-slate-950 p-3 rounded-xl transition-all flex items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-200 truncate">
                      {habit.title}
                    </h4>
                    {(() => {
                      const liveStreak = calculateHabitStreak(habit.history);
                      return liveStreak > 0 ? (
                        <span className="text-[8px] bg-amber-400 text-slate-950 border-2 border-slate-950 px-1.5 py-0.5 rounded-lg font-mono font-bold flex items-center gap-0.5 shadow-[1px_1px_0px_#000] pixel-label">
                          🔥 {liveStreak} ngày
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {habit.description && (
                    <p className="text-[9px] text-slate-500 truncate mt-0.5 leading-tight">{habit.description}</p>
                  )}
                  {/* Tiny 7-day history representation */}
                  <div className="flex gap-1.5 items-center pt-0.5">
                    {weekDays.map(day => {
                      const isCompleted = !!habit.history[day.dateStr];
                      return (
                        <div
                          key={day.dateStr}
                          className={`w-2.5 h-2.5 rounded border-2 ${
                            isCompleted
                              ? 'bg-emerald-400 border-slate-950'
                              : day.isToday
                              ? 'bg-amber-400/20 border-amber-400'
                              : 'bg-slate-950 border-slate-950'
                          }`}
                          title={`${day.dayLabel} (${day.dateStr}): ${isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Hoàn thành button for today */}
                  {(() => {
                    const todayStr = getLocalDateString();
                    const isTodayCompleted = !!habit.history[todayStr];
                    return (
                      <button
                        onClick={() => onToggleHabitDay(habit.id, todayStr)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all cursor-pointer ${
                          isTodayCompleted
                            ? 'bg-slate-950 border-2 border-slate-950 text-emerald-400 shadow-none'
                            : 'neo-btn neo-btn-success text-slate-950'
                        }`}
                      >
                        {isTodayCompleted ? 'ĐÃ XONG ✓' : 'HOÀN THÀNH'}
                      </button>
                    );
                  })()}

                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="text-slate-600 hover:text-rose-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Xóa thói quen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-650 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-700" />
            Nhật khóa trống trơn. Hãy thêm thói quen tốt để tinh tiến!
          </div>
        )}
      </div>
    </div>
  );
}
