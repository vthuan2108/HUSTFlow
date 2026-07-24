/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DailyLog, TodoItem } from '../types';
import { Flame, Sparkles } from 'lucide-react';

interface StreakGridProps {
  dailyLogs: DailyLog[];
  todoItems: TodoItem[];
}

export default function StreakGrid({ dailyLogs, todoItems }: StreakGridProps) {
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Get active stats for a specific date (YYYY-MM-DD)
  const getLogForDate = (dateStr: string) => {
    return dailyLogs.find(l => l.date === dateStr);
  };

  // 1. MONTH VIEW CALCULATIONS
  const getMonthDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6;

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dayNum: d,
        dateStr,
        log: getLogForDate(dateStr)
      });
    }

    return days;
  };

  // 2. YEAR VIEW CALCULATIONS (Current calendar year only)
  const getYearDays = () => {
    const days = [];
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Start of current calendar year
    const startDate = new Date(currentYear, 0, 1);
    let startDayOfWeek = startDate.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const alignedStartDate = new Date(startDate.getTime() - startDayOfWeek * oneDayMs);

    // End of current calendar year
    const endDate = new Date(currentYear, 11, 31);
    let endDayOfWeek = endDate.getDay() - 1;
    if (endDayOfWeek < 0) endDayOfWeek = 6;
    
    const alignedEndDate = new Date(endDate.getTime() + (6 - endDayOfWeek) * oneDayMs);
    
    const totalDays = Math.round((alignedEndDate.getTime() - alignedStartDate.getTime()) / oneDayMs) + 1;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(alignedStartDate.getTime() + i * oneDayMs);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        date,
        dateStr,
        log: yyyy === currentYear ? getLogForDate(dateStr) : undefined
      });
    }
    return days;
  };

  const monthDays = getMonthDays();
  const yearDays = getYearDays();

  // Helper to determine color intensity based on activity (GitHub Green palette)
  const getColorClass = (log: DailyLog | undefined) => {
    if (!log) return 'bg-[#161b22] border-[#21262d]/40';
    
    const activity = (log.tuViGained || 0) + (log.meditationMinutes * 2) + (log.tasksCompleted * 10);
    if (activity === 0) return 'bg-[#161b22] border-[#21262d]/40';
    if (activity < 20) return 'bg-[#0e4429] border-[#0e4429]/40';
    if (activity < 60) return 'bg-[#006d32] border-[#006d32]/40';
    if (activity < 120) return 'bg-[#26a641] border-[#26a641]/40';
    return 'bg-[#39d353] border-[#39d353]/40 shadow-[0_0_10px_rgba(57,211,83,0.35)]';
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Calculate stats & streaks
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
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
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
        const checkStr = checkDate.toISOString().split('T')[0];
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

  // Divide yearDays into 53 columns (weeks)
  const weeks: { date: Date; dateStr: string; log: DailyLog | undefined }[][] = [];
  for (let i = 0; i < yearDays.length; i += 7) {
    weeks.push(yearDays.slice(i, i + 7));
  }

  return (
    <div className="neo-card p-5 space-y-5" id="streak-grid-container">
      {/* 4 Core Stats Columns (Green/Emerald Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b-2 border-slate-950 pb-4 font-mono">
        <div className="space-y-0.5">
          <h5 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {totalReviews.toLocaleString('en-US')}
          </h5>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-sans">TỔNG NHIỆM VỤ HOÀN THÀNH</p>
        </div>
        <div className="space-y-0.5">
          <h5 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {activeDays.toLocaleString('en-US')}
          </h5>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-sans">NGÀY TU LUYỆN</p>
        </div>
        <div className="space-y-0.5">
          <h5 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {currentStreak.toLocaleString('en-US')}
          </h5>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-sans">NGÀY BẾ QUAN HIỆN TẠI</p>
        </div>
        <div className="space-y-0.5">
          <h5 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight pixel-label">
            {longestStreak.toLocaleString('en-US')}
          </h5>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-sans">NGÀY BẾ QUAN DÀI NHẤT</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 bg-slate-950 border-2 border-slate-950 rounded-lg text-emerald-400 shrink-0 shadow-[1px_1px_0px_#000]">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Trận Pháp Bế Quan
            </h4>
            <p className="text-[8px] text-slate-500 font-sans">Đại trận đồ theo dõi quá trình hành trì bế quan tu luyện</p>
          </div>
        </div>

        {/* Tab Toggle buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border-2 border-slate-950 text-[8.5px] font-bold shadow-[1px_1px_0px_#000]">
          <button
            onClick={() => setViewMode('MONTH')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'MONTH'
                ? 'bg-emerald-400 text-slate-950 font-black border border-slate-950 shadow-[1px_1px_0px_#000]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tháng {currentMonth + 1}
          </button>
          <button
            onClick={() => setViewMode('YEAR')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'YEAR'
                ? 'bg-emerald-400 text-slate-950 font-black border border-slate-950 shadow-[1px_1px_0px_#000]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cả Năm
          </button>
        </div>
      </div>

      {viewMode === 'MONTH' ? (
        // Month Calendar View (Standard grid format)
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
            <span className="text-sm font-bold text-slate-200">{monthNames[currentMonth]} {currentYear}</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 uppercase tracking-wider font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> bế quan định lực
            </span>
          </div>

          <div className="w-full max-w-md mx-auto">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>

            {/* Calendar Day Blocks */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isToday = day.dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                
                // Color intensity logic helper
                const hasLog = !!day.log;
                const activity = day.log ? (day.log.tuViGained || 0) + (day.log.meditationMinutes * 2) + (day.log.tasksCompleted * 10) : 0;
                const isLightBg = hasLog && activity >= 60;
                const textColor = hasLog 
                  ? (isLightBg ? 'text-slate-950 font-black' : 'text-slate-100 font-bold') 
                  : 'text-slate-400 hover:text-slate-200';

                return (
                  <div
                    key={day.dateStr}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group border-2 border-slate-950 transition-all shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px] ${
                      hasLog
                        ? getColorClass(day.log)
                        : 'bg-[#111827]/40 border-slate-950 hover:bg-[#111827]/60'
                    } ${
                      isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0f141c]' : ''
                    }`}
                  >
                    <span className={`text-xs ${textColor}`}>{day.dayNum}</span>
                    
                    {/* Small dot below the number if active */}
                    {hasLog && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isLightBg ? 'bg-slate-950/60' : 'bg-emerald-400/80'}`} />
                    )}

                    {/* Rich Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-950 border-2 border-slate-950 rounded-lg shadow-[3px_3px_0px_#000] text-[9px] leading-normal text-slate-300 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 font-sans text-left">
                      <p className="font-bold text-slate-200 border-b border-slate-900 pb-1 mb-1 font-mono text-center">
                        {day.dateStr} {isToday ? '(Hôm nay)' : ''}
                      </p>
                      {day.log ? (
                        <div className="space-y-0.5">
                          <p className="flex justify-between">
                            <span>Tu Vi:</span>
                            <span className="font-bold text-amber-400">+{day.log.tuViGained} XP</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Thiền Định:</span>
                            <span className="font-bold text-blue-400">{day.log.meditationMinutes}p</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Nhiệm Vụ:</span>
                            <span className="font-bold text-emerald-400">{day.log.tasksCompleted}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center italic py-0.5">Chưa bế quan</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Year Grid Contribution View (GitHub style)
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[9.5px] text-slate-400 border-b border-slate-950 pb-1.5">
            <span>Đại Trận Pháp 365 Ngày Tu Vi</span>
            <span className="text-[8px] text-slate-500 font-sans">Cuộn ngang ➔</span>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex gap-2 items-start py-1 pl-1 min-w-max">
              {/* Day Labels column */}
              <div className="flex flex-col justify-between text-[7.5px] text-slate-500 font-bold h-[72px] pr-1.5 select-none font-mono py-0.5">
                <span>T2</span>
                <span>T4</span>
                <span>T6</span>
                <span>CN</span>
              </div>

              {/* Weeks List */}
              <div className="flex gap-0.5">
                {weeks.map((week, colIdx) => {
                  const firstDay = week[0].date;
                  const monthLabel = colIdx === 0 || (colIdx > 0 && firstDay.getMonth() !== weeks[colIdx - 1][0].date.getMonth())
                    ? `Tháng ${firstDay.getMonth() + 1}`
                    : null;

                  return (
                    <div key={colIdx} className="flex flex-col gap-0.5 relative pt-4">
                      {monthLabel && (
                        <span className="absolute top-0 left-0 text-[7px] text-slate-500 font-bold whitespace-nowrap">
                          {monthLabel}
                        </span>
                      )}
                      {week.map((day, dayIdx) => {
                        const isToday = day.dateStr === today.toISOString().split('T')[0];
                        return (
                          <div
                            key={dayIdx}
                            className={`w-2.5 h-2.5 rounded-sm relative group border-2 border-slate-950 cursor-default ${getColorClass(day.log)} ${
                              isToday ? 'ring-1 ring-emerald-400' : ''
                            }`}
                          >
                            {/* Rich Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-950 border-2 border-slate-950 rounded-lg shadow-[3px_3px_0px_#000] text-[9px] leading-normal text-slate-300 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 font-sans text-left">
                              <p className="font-bold text-slate-200 border-b border-slate-900 pb-1 mb-1 font-mono text-center">
                                {day.dateStr}
                              </p>
                              {day.log ? (
                                <div className="space-y-0.5">
                                  <p className="flex justify-between">
                                    <span>Tu Vi:</span>
                                    <span className="font-bold text-amber-400">+{day.log.tuViGained} XP</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Thiền Định:</span>
                                    <span className="font-bold text-blue-400">{day.log.meditationMinutes}p</span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Nhiệm Vụ:</span>
                                    <span className="font-bold text-emerald-400">{day.log.tasksCompleted}</span>
                                  </p>
                                </div>
                              ) : (
                                <p className="text-slate-500 text-center italic py-0.5">Chưa bế quan</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend indicator */}
          <div className="flex justify-end items-center gap-1.5 text-[8px] text-slate-500 font-sans pr-1">
            <span>Ít</span>
            <span className="w-2.5 h-2.5 rounded border-2 border-slate-950 bg-[#161b22]" />
            <span className="w-2.5 h-2.5 rounded border-2 border-slate-950 bg-[#0e4429]" />
            <span className="w-2.5 h-2.5 rounded border-2 border-slate-950 bg-[#006d32]" />
            <span className="w-2.5 h-2.5 rounded border-2 border-slate-950 bg-[#26a641]" />
            <span className="w-2.5 h-2.5 rounded border-2 border-slate-950 bg-[#39d353]" />
            <span>Nhiều</span>
          </div>
        </div>
      )}
    </div>
  );
}
