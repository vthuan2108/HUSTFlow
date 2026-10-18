/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Habit } from '../types';
import { CalendarCheck, Trash2, Plus, Flame, Check, Sparkles, X } from 'lucide-react';
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

  const todayStr = getLocalDateString();

  // Get current week days (Monday to Sunday)
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      const dateStr = getLocalDateString(d);
      
      let dayName = '';
      switch (d.getDay()) {
        case 1: dayName = 'T2'; break;
        case 2: dayName = 'T3'; break;
        case 3: dayName = 'T4'; break;
        case 4: dayName = 'T5'; break;
        case 5: dayName = 'T6'; break;
        case 6: dayName = 'T7'; break;
        case 0: dayName = 'CN'; break;
      }

      days.push({
        dateStr,
        dayName,
        isToday: dateStr === todayStr,
        dayNum: d.getDate()
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Metrics
  const totalHabits = habits.length;
  const todayCompletedCount = habits.filter(h => !!h.history[todayStr]).length;
  const maxStreak = habits.length > 0
    ? Math.max(0, ...habits.map(h => calculateHabitStreak(h.history)))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddHabit(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-5" id="habit-section">
      {/* 1. Header & Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268]">
            TỔNG THÓI QUEN
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-light text-[#2C2825]">{totalHabits}</h3>
            <span className="text-xs text-[#7A7268]">mục tiêu duy trì</span>
          </div>
        </div>

        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268]">
            HOÀN THÀNH HÔM NAY
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-light text-[#2E6930]">{todayCompletedCount}/{totalHabits}</h3>
            <span className="text-xs text-[#7A7268]">
              {totalHabits > 0 ? `${Math.round((todayCompletedCount / totalHabits) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268]">
            CHUỖI NGÀY CAO NHẤT
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-light text-[#B85D38]">{maxStreak}</h3>
            <span className="text-xs text-[#7A7268]">ngày liên tiếp</span>
          </div>
        </div>
      </div>

      {/* 2. Main Habit Management Card */}
      <div className="bg-white border border-[#E7E1D7] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFECE6]">
          <div>
            <h3 className="text-sm font-bold text-[#2C2825] flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#2E6930]" />
              Thói quen rèn luyện mỗi ngày
            </h3>
            <p className="text-xs text-[#7A7268] mt-0.5">
              Tích lũy từng ngày để tạo nên sự bứt phá lâu dài
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2E6930] hover:bg-[#255527] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm thói quen</span>
          </button>
        </div>

        {/* Form add habit modal / collapsible */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="bg-[#FAF8F5] border border-[#E7E1D7] p-4 rounded-xl space-y-3 overflow-hidden text-xs shadow-xs"
            >
              <div className="flex items-center justify-between pb-1">
                <span className="font-semibold text-xs text-[#2C2825]">Thiết lập thói quen mới</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-[#8C827A] hover:text-[#2C2825]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                    Tên thói quen
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đọc sách 20 phút, Luyện nghe Dictation..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-[#E7E1D7] rounded-lg px-3 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                    Mục tiêu / Ghi chú
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 15 phút mỗi sáng sau khi thức dậy..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-[#E7E1D7] rounded-lg px-3 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs text-[#7A7268] hover:text-[#2C2825] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2E6930] hover:bg-[#255527] text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Lưu thói quen
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Habits List */}
        <div className="space-y-3" id="habit-list-container">
          {habits.length > 0 ? (
            habits.map(habit => {
              const streak = calculateHabitStreak(habit.history);
              const isTodayDone = !!habit.history[todayStr];

              return (
                <div
                  key={habit.id}
                  className="bg-[#FAF8F5] hover:bg-[#F5F2EC] border border-[#E7E1D7] p-4 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  {/* Left: Info & Streak */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-[#2C2825]">
                        {habit.title}
                      </h4>
                      {streak > 0 && (
                        <span className="text-[10px] bg-[#FEF3EB] text-[#B85D38] border border-[#FCDDCB] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 shadow-xs">
                          <Flame className="w-3 h-3 fill-current" />
                          {streak} ngày liên tiếp
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-xs text-[#7A7268] leading-relaxed">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* Right: 7-Day History Circles + Quick Checkin + Delete */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap justify-between md:justify-end">
                    {/* 7 Days of Current Week */}
                    <div className="flex items-center gap-1.5">
                      {weekDays.map(day => {
                        const isDone = !!habit.history[day.dateStr];
                        return (
                          <button
                            key={day.dateStr}
                            onClick={() => onToggleHabitDay(habit.id, day.dateStr)}
                            className={`w-7 h-7 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isDone
                                ? 'bg-[#2E6930] text-white shadow-xs'
                                : day.isToday
                                ? 'border-2 border-[#2E6930] bg-white text-[#2E6930] font-bold'
                                : 'bg-[#EAE5DC] text-[#7A7268] hover:bg-[#DDD8CE]'
                            }`}
                            title={`${day.dayName} (${day.dateStr}): Bấm để bật/tắt`}
                          >
                            {isDone ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <span className="text-[9px] font-mono leading-none">{day.dayName}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Today Check-in Button */}
                    <button
                      onClick={() => onToggleHabitDay(habit.id, todayStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isTodayDone
                          ? 'bg-[#EEF5EE] text-[#2E6930] border border-[#CFE4CF]'
                          : 'bg-[#2E6930] hover:bg-[#255527] text-white shadow-xs'
                      }`}
                    >
                      {isTodayDone ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã xong</span>
                        </>
                      ) : (
                        <span>Điểm danh</span>
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-[#8C827A] hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Xóa thói quen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[#9C948A] text-xs flex flex-col items-center gap-2 border border-dashed border-[#E7E1D7] rounded-xl">
              <CalendarCheck className="w-8 h-8 opacity-30" />
              <span>Chưa có thói quen nào. Hãy tạo thói quen đầu tiên để bắt đầu rèn luyện!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
