/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { WeeklyChallenge, DailyLog, Task, TodoItem } from '../types';
import { Target, Plus, CheckCircle, Trash2 } from 'lucide-react';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface PerformanceStatsProps {
  challenges: WeeklyChallenge[];
  dailyLogs: DailyLog[];
  onClaimChallenge: (id: string) => void;
  onAddChallenge?: (title: string, targetValue: number, tuViReward: number, linhThachReward: number) => void;
  onProgressChallenge?: (id: string, amount: number) => void;
  onDeleteChallenge?: (id: string) => void;
  tasks?: Task[];
  todoItems: TodoItem[];
  currentUser?: any;
  leaderboard?: any[];
  isFetchingLeaderboard?: boolean;
  onRefreshLeaderboard?: () => void;
  state?: any;
}

export default function PerformanceStats({
  challenges = [],
  dailyLogs = [],
  onClaimChallenge,
  onAddChallenge,
  onProgressChallenge,
  onDeleteChallenge,
  todoItems = []
}: PerformanceStatsProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(5);

  // 1. Calculate General Task Metrics
  const totalItems = todoItems.length;
  const completedItems = todoItems.filter(t => t.isCompleted).length;
  const overallRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // 2. Compute Weekly Performance Data (for past 12 weeks)
  const weeklyData = useMemo(() => {
    const weeks: Array<{
      weekStart: string;
      weekLabel: string;
      dateRange: string;
      total: number;
      completed: number;
      rate: number;
    }> = [];

    const now = new Date();
    // Monday of current week
    const currentDay = now.getDay();
    const currentDiff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const currentMonday = new Date(now.setDate(currentDiff));
    currentMonday.setHours(0, 0, 0, 0);

    // Look back 11 weeks + current week = 12 weeks
    for (let w = 11; w >= 0; w--) {
      const mon = new Date(currentMonday);
      mon.setDate(currentMonday.getDate() - w * 7);

      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);

      const weekDates: string[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(mon);
        day.setDate(mon.getDate() + d);
        weekDates.push(getLocalDateString(day));
      }

      const weekItems = todoItems.filter(item => {
        const itemDate = item.dueDate || item.createdAt.split('T')[0];
        return weekDates.includes(itemDate);
      });

      const total = weekItems.length;
      const completed = weekItems.filter(t => t.isCompleted).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const monStr = mon.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const sunStr = sun.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

      weeks.push({
        weekStart: getLocalDateString(mon),
        weekLabel: monStr,
        dateRange: `${monStr} – ${sunStr}`,
        total,
        completed,
        rate
      });
    }

    return weeks;
  }, [todoItems]);

  // Find Best Week
  const { bestWeekRate, bestWeekRange } = useMemo(() => {
    const weeksWithTasks = weeklyData.filter(w => w.total > 0);
    if (weeksWithTasks.length === 0) {
      return { bestWeekRate: overallRate, bestWeekRange: 'Chưa có dữ liệu' };
    }
    const best = weeksWithTasks.reduce((max, curr) => (curr.rate > max.rate ? curr : max), weeksWithTasks[0]);
    return {
      bestWeekRate: best.rate,
      bestWeekRange: best.dateRange
    };
  }, [weeklyData, overallRate]);

  // Compute Consecutive Streak of weeks with >= 50%
  const consecutiveWeeks = useMemo(() => {
    let streak = 0;
    // Walk backward from the latest week that has tasks
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      const w = weeklyData[i];
      if (w.total > 0) {
        if (w.rate >= 50) {
          streak++;
        } else {
          break;
        }
      }
    }
    return streak;
  }, [weeklyData]);

  // Total weeks tracked
  const weeksTracked = useMemo(() => {
    const tracked = weeklyData.filter(w => w.total > 0).length;
    return tracked > 0 ? tracked : 1;
  }, [weeklyData]);

  // 3. Compute 365-Day Activity Heatmap Data
  const { heatmapWeeks, totalCompletedYear } = useMemo(() => {
    const today = new Date();
    // End on Sunday of current week
    const currentDay = today.getDay();
    const endSunday = new Date(today);
    endSunday.setDate(today.getDate() + (currentDay === 0 ? 0 : 7 - currentDay));
    endSunday.setHours(23, 59, 59, 999);

    // Count tasks completed per date string
    const completedByDate: Record<string, number> = {};
    let yearTotal = 0;

    todoItems.forEach(t => {
      if (t.isCompleted) {
        const dateStr = t.completedAt ? t.completedAt.split('T')[0] : (t.dueDate || t.createdAt.split('T')[0]);
        completedByDate[dateStr] = (completedByDate[dateStr] || 0) + 1;
        yearTotal++;
      }
    });

    // Also include logs if present
    dailyLogs.forEach(log => {
      if (log.tasksCompleted && log.tasksCompleted > 0) {
        if (!completedByDate[log.date]) {
          completedByDate[log.date] = log.tasksCompleted;
          yearTotal += log.tasksCompleted;
        }
      }
    });

    // 52 weeks grid (each week is 7 days from Mon to Sun)
    const weeks: Array<Array<{ dateStr: string; count: number; monthLabel?: string }>> = [];
    const startDate = new Date(endSunday);
    startDate.setDate(endSunday.getDate() - 52 * 7 + 1); // 52 weeks back, starting Monday

    let currentCursor = new Date(startDate);
    for (let w = 0; w < 52; w++) {
      const colDays: Array<{ dateStr: string; count: number; monthLabel?: string }> = [];
      let monthLabel: string | undefined = undefined;

      for (let d = 0; d < 7; d++) {
        const dStr = getLocalDateString(currentCursor);
        const count = completedByDate[dStr] || 0;

        // Check if 1st day of month falls here to place month label
        if (currentCursor.getDate() <= 7 && d === 0) {
          monthLabel = `Th${currentCursor.getMonth() + 1}`;
        }

        colDays.push({ dateStr: dStr, count, monthLabel });
        currentCursor.setDate(currentCursor.getDate() + 1);
      }
      weeks.push(colDays);
    }

    return { heatmapWeeks: weeks, totalCompletedYear: yearTotal };
  }, [todoItems, dailyLogs]);

  // 4. Compute Day-of-Week Metrics (T2 to CN)
  const { dayStats, bestDay, busiestDay } = useMemo(() => {
    // Indices: 0: T2 (Mon), 1: T3, 2: T4, 3: T5, 4: T6, 5: T7, 6: CN (Sun)
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const fullNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const completed = [0, 0, 0, 0, 0, 0, 0];

    todoItems.forEach(t => {
      const dStr = t.dueDate || t.createdAt.split('T')[0];
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayIdx = (dateObj.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        totals[dayIdx]++;
        if (t.isCompleted) {
          completed[dayIdx]++;
        }
      }
    });

    const totalCompletedAllDays = completed.reduce((a, b) => a + b, 0);

    const stats = dayLabels.map((lbl, idx) => {
      const tot = totals[idx];
      const comp = completed[idx];
      const compRate = tot > 0 ? Math.round((comp / tot) * 100) : 0;
      const share = totalCompletedAllDays > 0 ? Math.round((comp / totalCompletedAllDays) * 100) : 0;

      return {
        label: lbl,
        fullName: fullNames[idx],
        total: tot,
        completed: comp,
        completionRate: compRate,
        shareRate: share
      };
    });

    // Best day by completion rate (minimum 1 task)
    const withTasks = stats.filter(s => s.total > 0);
    const best = withTasks.length > 0
      ? withTasks.reduce((max, s) => (s.completionRate > max.completionRate ? s : max), withTasks[0])
      : stats[0];

    // Busiest day by share rate
    const busiest = stats.reduce((max, s) => (s.shareRate > max.shareRate ? s : max), stats[0]);

    return { dayStats: stats, bestDay: best, busiestDay: busiest };
  }, [todoItems]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !onAddChallenge) return;
    onAddChallenge(newGoalTitle.trim(), newGoalTarget, 50, 20);
    setNewGoalTitle('');
    setIsAddingGoal(false);
  };

  // Terracotta heatmap color selector (matching Image 2)
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-[#F0EAE1] hover:bg-[#E5DDD2]';
    if (count <= 2) return 'bg-[#E6B89C] hover:bg-[#DCAB8E]';
    if (count <= 4) return 'bg-[#D98A60] hover:bg-[#CC7C51]';
    return 'bg-[#B85D38] hover:bg-[#A34E2B]';
  };

  return (
    <div className="space-y-5" id="performance-stats">
      {/* 1. TOP 4 METRIC CARDS (Beaverplans Image 2 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: TỶ LỆ HOÀN THÀNH */}
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-light text-[#9A3412] tracking-tight">
              {overallRate}%
            </h3>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268] mt-2">
              TỶ LỆ HOÀN THÀNH
            </p>
          </div>
          <p className="text-xs text-[#4A443C] mt-1 font-mono">
            {completedItems} trên {totalItems} việc
          </p>
        </div>

        {/* Card 2: TUẦN TỐT NHẤT */}
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-light text-[#9A3412] tracking-tight">
              {bestWeekRate}%
            </h3>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268] mt-2">
              TUẦN TỐT NHẤT
            </p>
          </div>
          <p className="text-xs text-[#4A443C] mt-1 font-mono">
            {bestWeekRange}
          </p>
        </div>

        {/* Card 3: CHUỖI TUẦN */}
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-light text-[#9A3412] tracking-tight">
              {consecutiveWeeks}
            </h3>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268] mt-2">
              CHUỖI TUẦN
            </p>
          </div>
          <p className="text-xs text-[#4A443C] mt-1">
            liên tiếp đạt 50%+
          </p>
        </div>

        {/* Card 4: TUẦN ĐÃ THEO DÕI */}
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-light text-[#9A3412] tracking-tight">
              {weeksTracked}
            </h3>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#7A7268] mt-2">
              TUẦN ĐÃ THEO DÕI
            </p>
          </div>
          <p className="text-xs text-[#4A443C] mt-1">
            từ trước tới nay
          </p>
        </div>
      </div>

      {/* 2. SECTION: TỪNG TUẦN (Weekly Performance Bar Chart) */}
      <div className="bg-white border border-[#E7E1D7] rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h4 className="text-xs font-bold text-[#7A7268] uppercase tracking-wider">
            TỪNG TUẦN
          </h4>
          <p className="text-xs text-[#524B43] mt-0.5">
            Chiều cao cột là khối lượng của tuần; phần tô đậm là những gì bạn đã làm xong
          </p>
        </div>

        {/* Stacked Bars Container */}
        <div className="pt-8 pb-2">
          {/* Find max total in weekly data for normalization (minimum 5 for pleasant view) */}
          {(() => {
            const maxTasks = Math.max(5, ...weeklyData.map(w => w.total));

            return (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-end h-40">
                {weeklyData.map((w, idx) => {
                  const hasTasks = w.total > 0;
                  const totalHeightPct = hasTasks ? Math.max(15, Math.round((w.total / maxTasks) * 100)) : 0;
                  const completedRatio = w.total > 0 ? w.completed / w.total : 0;

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                      {/* Percent on top of column */}
                      <span className={`text-[10px] font-mono mb-1.5 transition-colors ${
                        hasTasks ? 'text-[#2C2825] font-semibold' : 'text-transparent'
                      }`}>
                        {w.rate}%
                      </span>

                      {/* Stacked Bar Box */}
                      <div className="w-full max-w-[38px] h-28 flex flex-col justify-end">
                        {hasTasks ? (
                          <div
                            className="w-full bg-[#D9E8D8] rounded-t-[4px] relative overflow-hidden transition-all duration-300"
                            style={{ height: `${totalHeightPct}%` }}
                            title={`${w.dateRange}: ${w.completed}/${w.total} nhiệm vụ hoàn thành`}
                          >
                            {/* Completed Portion: Dark Forest Green */}
                            <div
                              className="w-full bg-[#2E6930] absolute bottom-0 left-0 transition-all duration-500 rounded-t-[2px]"
                              style={{ height: `${Math.round(completedRatio * 100)}%` }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-[#EAE5DC] rounded-full" />
                        )}
                      </div>

                      {/* Week Start Date Label */}
                      <span className="text-[10px] text-[#7A7268] font-mono mt-2">
                        {w.weekLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3. SECTION: HOẠT ĐỘNG (Activity Heatmap) */}
      <div className="bg-white border border-[#E7E1D7] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-[#7A7268] uppercase tracking-wider">
              HOẠT ĐỘNG
            </h4>
            <p className="text-xs text-[#524B43] mt-0.5">
              {totalCompletedYear} việc đã hoàn thành trong năm qua
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#7A7268] font-mono">
            <span>ÍT</span>
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#F0EAE1]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E6B89C]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D98A60]" />
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#B85D38]" />
            <span>NHIỀU</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-[680px]">
            {/* Week Columns Grid */}
            <div className="flex items-start gap-1">
              {/* Day Labels on Left: T2, T4, T6, CN */}
              <div className="flex flex-col justify-between h-[96px] text-[9px] text-[#8C827A] font-mono pr-2 shrink-0 select-none">
                <span>T2</span>
                <span>T4</span>
                <span>T6</span>
                <span>CN</span>
              </div>

              {/* 52 Columns */}
              <div className="flex-1 flex gap-1">
                {heatmapWeeks.map((colDays, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1 shrink-0">
                    {colDays.map((dayItem, dIdx) => (
                      <div
                        key={dIdx}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] transition-colors cursor-pointer ${getHeatmapColor(
                          dayItem.count
                        )}`}
                        title={`${dayItem.dateStr}: ${dayItem.count} việc hoàn thành`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 & 5. SECTIONS: MỨC ĐỘ HOÀN THÀNH & PHÂN BỐ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 4: MỨC ĐỘ HOÀN THÀNH (Completion Rate by Day) */}
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#7A7268] uppercase tracking-wider">
              MỨC ĐỘ HOÀN THÀNH
            </h4>
            <p className="text-xs text-[#524B43] mt-0.5">
              {bestDay.total > 0
                ? `${bestDay.fullName} là ngày bạn làm tốt nhất — ${bestDay.completionRate}% số việc bạn xếp vào đó được làm xong.`
                : 'Chưa có đủ dữ liệu theo ngày.'}
            </p>
          </div>

          {/* 7 Vertical Green Bars */}
          <div className="pt-6">
            <div className="grid grid-cols-7 gap-2 items-end h-36">
              {dayStats.map((s, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  {/* Bar Box */}
                  <div className="w-full max-w-[32px] h-24 bg-[#D9E8D8] rounded-t-[4px] relative overflow-hidden">
                    <div
                      className="w-full bg-[#2E6930] absolute bottom-0 left-0 transition-all duration-500 rounded-t-[2px]"
                      style={{ height: `${s.completionRate}%` }}
                      title={`${s.fullName}: ${s.completed}/${s.total} việc (${s.completionRate}%)`}
                    />
                  </div>

                  <span className="text-[11px] text-[#2C2825] font-medium mt-2">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-[#7A7268] font-mono">
                    {s.completionRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: PHÂN BỐ (Workload Distribution by Day) */}
        <div className="bg-white border border-[#E7E1D7] rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#7A7268] uppercase tracking-wider">
              PHÂN BỐ
            </h4>
            <p className="text-xs text-[#524B43] mt-0.5">
              {busiestDay.completed > 0
                ? `${busiestDay.fullName} là ngày bận rộn nhất — ${busiestDay.shareRate}% tổng số việc bạn hoàn thành rơi vào ngày đó.`
                : 'Chưa có đủ dữ liệu theo ngày.'}
            </p>
          </div>

          {/* 7 Vertical Terracotta Bars */}
          <div className="pt-6">
            <div className="grid grid-cols-7 gap-2 items-end h-36">
              {dayStats.map((s, idx) => {
                // Find highest share to scale bar heights
                const maxShare = Math.max(25, ...dayStats.map(d => d.shareRate));
                const barHeightPct = s.shareRate > 0 ? Math.max(12, Math.round((s.shareRate / maxShare) * 100)) : 4;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    {/* Bar Box */}
                    <div className="w-full max-w-[32px] h-24 flex flex-col justify-end">
                      <div
                        className="w-full bg-[#B85D38] rounded-t-[4px] transition-all duration-500"
                        style={{ height: `${barHeightPct}%` }}
                        title={`${s.fullName}: ${s.shareRate}% tổng việc hoàn thành`}
                      />
                    </div>

                    <span className="text-[11px] text-[#2C2825] font-medium mt-2">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-[#7A7268] font-mono">
                      {s.shareRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 6. WEEKLY GOALS / CHALLENGES SECTION (Modern Productivity Goals) */}
      <div className="bg-white border border-[#E7E1D7] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
          <div>
            <h4 className="text-xs font-bold text-[#7A7268] uppercase tracking-wider">
              MỤC TIÊU TUẦN
            </h4>
            <p className="text-xs text-[#524B43] mt-0.5">
              Các cột mốc tuần giúp bạn duy trì năng suất và kỷ luật
            </p>
          </div>

          {onAddChallenge && (
            <button
              onClick={() => setIsAddingGoal(!isAddingGoal)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#2C2825] border border-[#E7E1D7] rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2E6930]" />
              <span>Thêm mục tiêu</span>
            </button>
          )}
        </div>

        {/* Add Goal Form */}
        {isAddingGoal && (
          <form onSubmit={handleCreateGoal} className="p-4 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                  Tên mục tiêu
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàn thành 10 bài tập Giải tích..."
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-white border border-[#E7E1D7] rounded-lg px-3 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                  Chỉ tiêu số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white border border-[#E7E1D7] rounded-lg px-3 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingGoal(false)}
                className="px-3 py-1 text-xs text-[#7A7268] hover:text-[#2C2825] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#2E6930] hover:bg-[#255527] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Lưu mục tiêu
              </button>
            </div>
          </form>
        )}

        {/* Goals List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {challenges.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            const isCompleted = goal.currentValue >= goal.targetValue;

            return (
              <div
                key={goal.id}
                className="p-4 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isCompleted ? 'bg-[#EEF5EE] text-[#2E6930]' : 'bg-white border border-[#E7E1D7] text-[#7A7268]'
                    }`}>
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className={`text-xs font-medium ${isCompleted ? 'line-through text-[#8C827A]' : 'text-[#2C2825]'}`}>
                        {goal.title}
                      </h5>
                      <span className="text-[10px] text-[#7A7268] font-mono mt-0.5 block">
                        Tiến độ: {goal.currentValue}/{goal.targetValue} ({pct}%)
                      </span>
                    </div>
                  </div>

                  {onDeleteChallenge && (
                    <button
                      onClick={() => onDeleteChallenge(goal.id)}
                      className="text-[#A8A196] hover:text-rose-600 transition-colors p-1"
                      title="Xóa mục tiêu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-[#EAE5DC] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-[#2E6930]' : 'bg-[#B85D38]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {!isCompleted && onProgressChallenge && (
                      <button
                        onClick={() => onProgressChallenge(goal.id, 1)}
                        className="text-[10px] font-medium text-[#2E6930] hover:underline cursor-pointer"
                      >
                        + Cập nhật tiến độ (+1)
                      </button>
                    )}

                    {isCompleted && !goal.isClaimed && (
                      <button
                        onClick={() => onClaimChallenge(goal.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#2E6930] bg-[#EEF5EE] px-2 py-0.5 rounded-md cursor-pointer ml-auto"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Đã đạt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
