/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { DailyLog, TodoItem } from '../types';

interface StreakGridProps {
  dailyLogs: DailyLog[];
  todoItems: TodoItem[];
}

type PeriodType = 'T1_4' | 'T5_8' | 'T9_12';

const PERIOD_CONFIG: Record<PeriodType, { startMonth: number; endMonth: number; label: string }> = {
  'T1_4': { startMonth: 0, endMonth: 3, label: 'Tháng 1 - 4' },
  'T5_8': { startMonth: 4, endMonth: 7, label: 'Tháng 5 - 8' },
  'T9_12': { startMonth: 8, endMonth: 11, label: 'Tháng 9 - 12' },
};

export default function StreakGrid({ dailyLogs, todoItems }: StreakGridProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Automatically determine the active 4-month period based on current month (no button needed)
  const currentPeriod: PeriodType = currentMonth <= 3 ? 'T1_4' : (currentMonth <= 7 ? 'T5_8' : 'T9_12');

  // Get active stats for a specific date (YYYY-MM-DD)
  const getLogForDate = (dateStr: string) => {
    return dailyLogs.find(l => l.date === dateStr);
  };

  // Helper to determine color intensity based on activity (Green / Emerald palette)
  const getColorClass = (log: DailyLog | undefined, isCurrentPeriod: boolean) => {
    if (!isCurrentPeriod) {
      return 'bg-transparent border-transparent opacity-0 pointer-events-none';
    }
    if (!log) {
      return 'bg-[#161b22] border-slate-900/80 hover:border-slate-600';
    }
    
    const activity = (log.tuViGained || 0) + (log.meditationMinutes * 2) + (log.tasksCompleted * 10);
    if (activity === 0) return 'bg-[#161b22] border-slate-900/80 hover:border-slate-600';
    if (activity < 20) return 'bg-[#0e4429] border-[#0e4429]/60 hover:brightness-125';
    if (activity < 60) return 'bg-[#006d32] border-[#006d32]/60 hover:brightness-125';
    if (activity < 120) return 'bg-[#26a641] border-[#26a641]/60 hover:brightness-125';
    return 'bg-[#39d353] border-[#39d353]/60 shadow-[0_0_6px_rgba(57,211,83,0.45)] hover:brightness-125';
  };

  // 4-Month Period Weeks Calculation
  const weeks = useMemo(() => {
    const { startMonth, endMonth } = PERIOD_CONFIG[currentPeriod];
    const oneDayMs = 24 * 60 * 60 * 1000;

    const startDate = new Date(currentYear, startMonth, 1);
    let startDayOfWeek = startDate.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const alignedStartDate = new Date(startDate.getTime() - startDayOfWeek * oneDayMs);

    const endDate = new Date(currentYear, endMonth + 1, 0);
    let endDayOfWeek = endDate.getDay() - 1;
    if (endDayOfWeek < 0) endDayOfWeek = 6;
    const alignedEndDate = new Date(endDate.getTime() + (6 - endDayOfWeek) * oneDayMs);

    const totalDays = Math.round((alignedEndDate.getTime() - alignedStartDate.getTime()) / oneDayMs) + 1;
    const allDays = [];

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(alignedStartDate.getTime() + i * oneDayMs);
      const yyyy = date.getFullYear();
      const m = date.getMonth();
      const d = date.getDate();
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isCurrentPeriod = yyyy === currentYear && m >= startMonth && m <= endMonth;
      const isToday = dateStr === todayStr;

      allDays.push({
        date,
        dateStr,
        dayNum: d,
        month: m,
        isCurrentPeriod,
        isToday,
        log: isCurrentPeriod ? getLogForDate(dateStr) : undefined
      });
    }

    const weeksList: typeof allDays[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeksList.push(allDays.slice(i, i + 7));
    }
    return weeksList;
  }, [currentPeriod, currentYear, dailyLogs, todayStr]);

  // Calculate period stats
  const periodStats = useMemo(() => {
    const { startMonth, endMonth } = PERIOD_CONFIG[currentPeriod];
    let focusMinutes = 0;
    let tasksCount = 0;

    dailyLogs.forEach(log => {
      if (!log.date) return;
      const parts = log.date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (y === currentYear && m >= startMonth && m <= endMonth) {
          focusMinutes += log.meditationMinutes || 0;
          tasksCount += log.tasksCompleted || 0;
        }
      }
    });

    return { focusMinutes, tasksCount };
  }, [currentPeriod, currentYear, dailyLogs]);

  // Calculate global stats & streaks
  const totalReviews = todoItems.filter(i => i.isCompleted).length;

  const calculateStreaks = () => {
    const activeDates = dailyLogs
      .filter(log => log.tuViGained > 0 || log.meditationMinutes > 0 || log.tasksCompleted > 0)
      .map(log => log.date)
      .sort();
    
    if (activeDates.length === 0) {
      return { current: 0, longest: 0, activeDaysCount: 0 };
    }

    const uniqueDates = Array.from(new Set(activeDates));
    const activeDaysCount = uniqueDates.length;
    
    let longest = 0;
    let tempStreak = 0;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    let hasToday = uniqueDates.includes(todayStr);
    let hasYesterday = uniqueDates.includes(yesterdayStr);
    
    let lastTime: number | null = null;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (const dateStr of uniqueDates) {
      const curTime = new Date(dateStr + 'T00:00:00').getTime();
      if (lastTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curTime - lastTime) / oneDayMs);
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          if (tempStreak > longest) longest = tempStreak;
          tempStreak = 1;
        }
      }
      lastTime = curTime;
    }
    if (tempStreak > longest) longest = tempStreak;

    let current = 0;
    if (hasToday || hasYesterday) {
      let checkDate = hasToday ? new Date() : yesterday;
      let streakCount = 0;
      while (true) {
        const cY = checkDate.getFullYear();
        const cM = String(checkDate.getMonth() + 1).padStart(2, '0');
        const cD = String(checkDate.getDate()).padStart(2, '0');
        const checkStr = `${cY}-${cM}-${cD}`;
        if (uniqueDates.includes(checkStr)) {
          streakCount++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      current = streakCount;
    }

    return { current, longest, activeDaysCount };
  };

  const { current: currentStreak, longest: longestStreak, activeDaysCount: activeDays } = calculateStreaks();
  const totalFocusMinutes = dailyLogs.reduce((acc, log) => acc + (log.meditationMinutes || 0), 0);

  return (
    <div className="neo-card p-4 sm:p-5 space-y-4" id="streak-grid-container">
      {/* 4 Core Stats Columns (Green/Emerald Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b-2 border-slate-950 pb-3 font-mono">
        <div className="space-y-0.5">
          <h5 className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {totalReviews.toLocaleString('en-US')}
          </h5>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-sans">TỔNG NHIỆM VỤ HOÀN THÀNH</p>
        </div>
        <div className="space-y-0.5">
          <h5 className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {activeDays.toLocaleString('en-US')}
          </h5>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-sans">NGÀY TU LUYỆN</p>
        </div>
        <div className="space-y-0.5">
          <h5 className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {currentStreak.toLocaleString('en-US')}
          </h5>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-sans">NGÀY BẾ QUAN HIỆN TẠI</p>
        </div>
        <div className="space-y-0.5">
          <h5 className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {longestStreak.toLocaleString('en-US')}
          </h5>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-sans">NGÀY BẾ QUAN DÀI NHẤT</p>
        </div>
      </div>

      {/* Header Row (Exact Style as requested in image) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
              HOẠT ĐỘNG
            </span>
          </div>

          {/* Legend on Top Right */}
          <div className="flex items-center gap-1.5 text-[8.5px] text-slate-400 font-mono">
            <span>Ít</span>
            <span className="w-2 h-2 rounded-[2px] border border-slate-950 bg-[#161b22]" />
            <span className="w-2 h-2 rounded-[2px] border border-slate-950 bg-[#0e4429]" />
            <span className="w-2 h-2 rounded-[2px] border border-slate-950 bg-[#006d32]" />
            <span className="w-2 h-2 rounded-[2px] border border-slate-950 bg-[#26a641]" />
            <span className="w-2 h-2 rounded-[2px] border border-slate-950 bg-[#39d353] shadow-[0_0_4px_rgba(57,211,83,0.5)]" />
            <span>Nhiều</span>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-200">
          <span className="font-mono text-emerald-400 font-bold">{totalFocusMinutes.toLocaleString('en-US')} phút</span> tập trung đã tích lũy
        </p>

        {/* Contribution Matrix Grid - Fitted without scrolling */}
        <div className="w-full flex justify-center pt-2">
          <div className="flex gap-1.5 items-start">
            {/* Day of week labels on the left (T2, T4, T6, CN) aligned with the 7 grid rows */}
            <div className="flex flex-col gap-[2.5px] sm:gap-[3px] pt-3.5 select-none font-mono text-[7px] sm:text-[7.5px] font-bold text-slate-500 leading-none">
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5">T2</div>
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5" />
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5">T4</div>
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5" />
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5">T6</div>
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5" />
              <div className="w-4 h-2.5 sm:h-[11px] flex items-center justify-end pr-0.5">CN</div>
            </div>

            {/* Weeks List */}
            <div className="flex gap-[2.5px] sm:gap-[3px]">
              {weeks.map((week, colIdx) => {
                const firstDayInWeek = week[0];
                const firstOfMonth = week.find(d => d.isCurrentPeriod && d.dayNum === 1);
                let monthLabel: string | null = null;
                
                if (firstOfMonth) {
                  monthLabel = `Th${firstOfMonth.month + 1}`;
                } else if (colIdx === 0 && firstDayInWeek.isCurrentPeriod) {
                  monthLabel = `Th${firstDayInWeek.month + 1}`;
                }

                return (
                  <div key={colIdx} className="flex flex-col gap-[2.5px] sm:gap-[3px] relative pt-3.5 hover:z-50">
                    {monthLabel && (
                      <span className="absolute top-0 left-0 text-[7px] sm:text-[7.5px] text-slate-400 font-bold font-mono whitespace-nowrap">
                        {monthLabel}
                      </span>
                    )}
                    {week.map((day, dayIdx) => {
                      return (
                        <div
                          key={dayIdx}
                          className={`w-2.5 h-2.5 sm:w-[11px] sm:h-[11px] rounded-[2px] relative group hover:z-50 border border-slate-950 transition-all ${getColorClass(
                            day.log,
                            day.isCurrentPeriod
                          )} ${day.isToday ? 'ring-1 ring-amber-400' : ''}`}
                        >
                          {/* Rich Tooltip */}
                          {day.isCurrentPeriod && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-36 p-1.5 bg-slate-950 border-2 border-slate-950 rounded-lg shadow-[3px_3px_0px_#000] text-[8.5px] leading-normal text-slate-300 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-[100] font-sans text-left">
                              <p className="font-bold text-slate-200 border-b border-slate-900 pb-0.5 mb-1 font-mono text-center text-[9px]">
                                {day.dateStr} {day.isToday ? '(Hôm nay)' : ''}
                              </p>
                              {day.log ? (
                                <div className="space-y-0.5">
                                  <p className="flex justify-between">
                                    <span>Thiền Định:</span>
                                    <span className="font-bold text-emerald-400">{day.log.meditationMinutes}p</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Nhiệm Vụ:</span>
                                    <span className="font-bold text-cyan-400">{day.log.tasksCompleted}</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Tu Vi:</span>
                                    <span className="font-bold text-amber-400">+{day.log.tuViGained} XP</span>
                                  </p>
                                </div>
                              ) : (
                                <p className="text-slate-500 text-center italic py-0.5">Chưa bế quan</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
