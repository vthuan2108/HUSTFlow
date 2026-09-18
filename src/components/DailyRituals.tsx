/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TodoItem, DailyLog, Priority } from '../types';
import { 
  Compass, 
  Flame, 
  Sparkles, 
  Smile, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  Award, 
  Clock, 
  AlertCircle,
  Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DailyRitualsProps {
  todoItems: TodoItem[];
  dailyLogs: DailyLog[];
  onSyncTodos: (syncedTodos: TodoItem[]) => void;
  onAddExp: (tuVi: number, linhThach: number) => void;
  planningCompletedDate: string;
  reflectionCompletedDate: string;
  onCompletePlanning: (date: string) => void;
  onCompleteReflection: (date: string) => void;
}

export default function DailyRituals({
  todoItems,
  dailyLogs,
  onSyncTodos,
  onAddExp,
  planningCompletedDate,
  reflectionCompletedDate,
  onCompletePlanning,
  onCompleteReflection
}: DailyRitualsProps) {
  const getDifficultyInfo = (diff?: Priority) => {
    switch (diff) {
      case 'SO_CAP':
        return { label: 'Novice', color: 'text-slate-300 border-slate-800 bg-slate-900/40' };
      case 'TRUNG_CAP':
        return { label: 'Adept', color: 'text-blue-400 border-blue-900/50 bg-blue-950/20' };
      case 'CAO_CAP':
        return { label: 'Earth', color: 'text-orange-400 border-orange-900/50 bg-orange-950/20' };
      case 'THAN_CAP':
        return { label: 'Heaven', color: 'text-amber-400 border-amber-500/30 bg-amber-950/10' };
      default:
        return { label: 'Novice', color: 'text-slate-300 border-slate-800 bg-slate-900/40' };
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [ritualType, setRitualType] = useState<'PLANNING' | 'REFLECTION'>('PLANNING');
  const [step, setStep] = useState(1);

  // Dates
  const todayStr = getLocalDateString();
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));

  // The actual date of the ritual (could be yesterday if filling retrospectively)
  const [ritualDate, setRitualDate] = useState<string>(todayStr);

  // Wizard state: Overdue items
  const [localTodos, setLocalTodos] = useState<TodoItem[]>([]);
  // Wizard state: Selected priority IDs
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  // Wizard state: Estimated durations
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, number>>({});
  // Wizard state: Focus rating (1 = poor, 2 = okay, 3 = perfect)
  const [focusRating, setFocusRating] = useState<number>(3);

  // Wizard state: Quick add todo
  const [wizardNewTodoTitle, setWizardNewTodoTitle] = useState('');
  const [wizardNewTodoDiff, setWizardNewTodoDiff] = useState<Priority>('SO_CAP');

  // Initialize wizard when opened
  useEffect(() => {
    if (isOpen) {
      setLocalTodos(JSON.parse(JSON.stringify(todoItems))); // deep copy
      setStep(1);

      if (ritualType === 'PLANNING') {
        // Find existing priorities for the ritual date if any
        const datePriorities = todoItems
          .filter(t => (t.dueDate || t.createdAt.split('T')[0]) === ritualDate && t.isPriority)
          .map(t => t.id);
        setSelectedPriorities(datePriorities);

        // Fetch estimated times
        const times: Record<string, number> = {};
        todoItems.forEach(t => {
          if (t.estimatedMinutes) times[t.id] = t.estimatedMinutes;
        });
        setEstimatedTimes(times);
      }
    }
  }, [isOpen, ritualType, ritualDate]);

  // Derived tasks based on ritualDate
  const getDifficultyRank = (p?: string) => {
    switch (p) {
      case 'THAN_CAP': return 4;
      case 'CAO_CAP': return 3;
      case 'TRUNG_CAP': return 2;
      case 'SO_CAP': return 1;
      default: return 0;
    }
  };

  const overdueTodos = localTodos.filter(t => {
    const itemDate = t.dueDate || t.createdAt.split('T')[0];
    return !t.isCompleted && itemDate < ritualDate;
  }).sort((a, b) => getDifficultyRank(b.difficulty) - getDifficultyRank(a.difficulty));

  const targetDateTodos = localTodos.filter(t => {
    const itemDate = t.dueDate || t.createdAt.split('T')[0];
    return itemDate === ritualDate;
  }).sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return getDifficultyRank(b.difficulty) - getDifficultyRank(a.difficulty);
  });

  const incompleteTargetTodos = targetDateTodos.filter(t => !t.isCompleted);

  // Stats for Reflection on the specific ritualDate
  const targetActiveLog = dailyLogs.find(l => l.date === ritualDate);
  const targetMeditation = targetActiveLog ? targetActiveLog.meditationMinutes : 0;
  const targetCompletedTasks = todoItems.filter(
    t => (t.dueDate || t.createdAt.split('T')[0]) === ritualDate && t.isCompleted
  ).length;
  const targetTuVi = (targetActiveLog?.tuViGained) || (targetCompletedTasks * 15 + Math.round(targetMeditation * 2));

  // Planning Completed & Reflection Completed flags (for today)
  const isPlanningDone = planningCompletedDate === todayStr;
  const isReflectionDone = reflectionCompletedDate === todayStr;

  // Missed yesterday detection
  const hasMissedYesterdayReflection = reflectionCompletedDate && 
                                        reflectionCompletedDate !== yesterdayStr && 
                                        reflectionCompletedDate !== todayStr;

  // Decide if we should show Morning or Evening card
  const hour = new Date().getHours();
  const showMorning = hour < 14; // Before 2 PM show Planning card by default

  const handleOpenRitual = (type: 'PLANNING' | 'REFLECTION', date: string = todayStr) => {
    setRitualType(type);
    setRitualDate(date);
    setIsOpen(true);
  };

  // Reschedule Overdue Task
  const handleRescheduleOverdue = (id: string, newDate: string) => {
    setLocalTodos(prev => prev.map(t => t.id === id ? { ...t, dueDate: newDate } : t));
  };

  // Delete Task in Wizard
  const handleDeleteTaskInWizard = (id: string) => {
    setLocalTodos(prev => prev.filter(t => t.id !== id));
  };

  // Toggle Priority
  const handleTogglePriority = (id: string) => {
    setSelectedPriorities(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) {
          alert('⚠️ Chỉ có thể định vị tối đa 3 nhiệm vụ trọng tâm (Đạo Tâm Ưu Tiên) mỗi ngày!');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Update Estimated Minutes
  const handleUpdateDuration = (id: string, minutes: number) => {
    setEstimatedTimes(prev => ({ ...prev, [id]: minutes }));
  };

  const handleUpdateTodoDifficultyInWizard = (id: string, diff: Priority) => {
    setLocalTodos(prev => prev.map(t => {
      if (t.id === id) {
        let tuViReward = 15;
        let linhThachReward = 5;
        if (diff === 'TRUNG_CAP') {
          tuViReward = 30;
          linhThachReward = 15;
        } else if (diff === 'CAO_CAP') {
          tuViReward = 60;
          linhThachReward = 35;
        } else if (diff === 'THAN_CAP') {
          tuViReward = 120;
          linhThachReward = 75;
        }
        return {
          ...t,
          difficulty: diff,
          tuViReward,
          linhThachReward
        };
      }
      return t;
    }));
  };

  const handleWizardAddTodo = () => {
    if (!wizardNewTodoTitle.trim()) return;

    let tuViReward = 15;
    let linhThachReward = 5;
    if (wizardNewTodoDiff === 'TRUNG_CAP') {
      tuViReward = 30;
      linhThachReward = 15;
    } else if (wizardNewTodoDiff === 'CAO_CAP') {
      tuViReward = 60;
      linhThachReward = 35;
    } else if (wizardNewTodoDiff === 'THAN_CAP') {
      tuViReward = 120;
      linhThachReward = 75;
    }

    const newTodo: TodoItem = {
      id: `todo_wiz_${Date.now()}`,
      title: wizardNewTodoTitle.trim(),
      type: 'DAY',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      tuViReward,
      linhThachReward,
      dueDate: ritualDate,
      difficulty: wizardNewTodoDiff
    };

    setLocalTodos(prev => [newTodo, ...prev]);
    setWizardNewTodoTitle('');
    setWizardNewTodoDiff('SO_CAP');
  };

  // Save Planning Ritual
  const handleCompletePlanning = () => {
    // Compile priority settings back to todoItems list
    const updatedTodos = localTodos.map(t => {
      const isPriority = selectedPriorities.includes(t.id);
      const estimatedMinutes = estimatedTimes[t.id] || undefined;
      return {
        ...t,
        isPriority,
        estimatedMinutes: isPriority ? estimatedMinutes : undefined
      };
    });

    onSyncTodos(updatedTodos);
    onAddExp(20, 0); // +20 Tu Vi reward
    onCompletePlanning(ritualDate);
    setIsOpen(false);
    alert(`🌅 Nghi Thức Vấn Đạo Hoàn Thành ngày ${ritualDate}! Đạo tâm kiên định, linh khí tràn đầy. Nhận thêm +20 Tu Vi.`);
  };

  // Save Reflection Ritual
  const handleCompleteReflection = () => {
    // 1. Reschedule unfinished tasks
    onSyncTodos(localTodos);

    // 2. Award Linh Thach based on Focus Rating
    let stonesEarned = 10;
    let focusLabel = 'Tâm Ma Quấy Nhiễu (Xao nhãng)';
    if (focusRating === 3) {
      stonesEarned = 20;
      focusLabel = 'Nhất Niệm Thông Thiên (Tập trung cực tốt)';
    } else if (focusRating === 2) {
      stonesEarned = 15;
      focusLabel = 'Đạo Tâm Dao Động (Tạm ổn)';
    }

    onAddExp(30, stonesEarned); // +30 Tu Vi, +Stones reward
    onCompleteReflection(ritualDate);
    setIsOpen(false);
    alert(`Night Reflection completed for ${ritualDate}!\n🌟 Cảnh giới tịnh tâm: ${focusLabel}\nNhận ngay +30 Tu Vi và +${stonesEarned} Linh Thạch. Chúc đạo hữu tĩnh tâm an giấc!`);
  };

  return (
    <div className="bg-[#0f141c]/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-4" id="daily-rituals-widget">
      {/* Widget Header */}
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-amber-500 animate-spin-slow" />
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Nghi Thức Đạo Tâm Hằng Ngày</h3>
          <p className="text-[9px] text-slate-500 font-sans">Lập kế hoạch và Đúc kết đạo quả (Sunsama Workflow)</p>
        </div>
      </div>

      {/* Missed yesterday banner */}
      {hasMissedYesterdayReflection && (
        <div className="bg-amber-950/20 border border-amber-900/60 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span className="text-[10px] text-slate-300 font-sans leading-relaxed">
              Đạo hữu chưa đúc kết đạo quả ngày hôm qua (<strong>{yesterdayStr}</strong>). Hãy tiến hành làm bù để nhận đầy đủ +30 Tu Vi và Linh Thạch!
            </span>
          </div>
          <button
            onClick={() => handleOpenRitual('REFLECTION', yesterdayStr)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1.5 rounded-lg font-bold text-[8.5px] uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-md"
          >
            LÀM BÙ NGAY
          </button>
        </div>
      )}

      {/* Main Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Morning Planning */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-36 transition-all ${
          isPlanningDone 
            ? 'bg-emerald-950/10 border-emerald-900/30 opacity-70' 
            : 'bg-slate-950/40 border-slate-900 hover:border-amber-500/20'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-amber-500 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                🌅 Buổi Sáng
              </span>
              {isPlanningDone && (
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full uppercase">
                  Đã Xong
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-200">Nghi Thức Vấn Đạo (Planning)</h4>
            <p className="text-[9px] text-slate-500 leading-normal">
              Xem xét việc trễ hạn, định hình 3 việc trọng tâm và ước tính thời gian tu luyện đầu ngày.
            </p>
          </div>

          <button
            onClick={() => handleOpenRitual('PLANNING', todayStr)}
            disabled={isPlanningDone}
            className={`w-full py-2 rounded-lg font-bold text-[9px] tracking-wider transition-all cursor-pointer ${
              isPlanningDone
                ? 'bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950'
            }`}
          >
            {isPlanningDone ? 'ĐẠO TÂM ĐÃ ĐỊNH' : 'KHỞI ĐỘNG VẤN ĐẠO'}
          </button>
        </div>

        {/* Card 2: Evening Reflection */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-36 transition-all ${
          isReflectionDone
            ? 'bg-emerald-950/10 border-emerald-900/30 opacity-70'
            : 'bg-slate-950/40 border-slate-900 hover:border-purple-500/20'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-purple-400 bg-purple-950/40 border border-purple-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                🌃 Buổi Tối
              </span>
              {isReflectionDone && (
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full uppercase">
                  Đã Xong
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-200">Nghi Thức Kết Nhật (Reflection)</h4>
            <p className="text-[9px] text-slate-500 leading-normal">
              Đúc kết số phút thiền định, đánh giá định lực tịnh tâm và sắp xếp việc chưa hoàn thành.
            </p>
          </div>

          <button
            onClick={() => handleOpenRitual('REFLECTION', todayStr)}
            disabled={isReflectionDone || (!isPlanningDone && showMorning)}
            className={`w-full py-2 rounded-lg font-bold text-[9px] tracking-wider transition-all cursor-pointer ${
              isReflectionDone
                ? 'bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed'
                : !isPlanningDone && showMorning
                ? 'bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-slate-200'
            }`}
            title={!isPlanningDone && showMorning ? 'Cần hoàn thành Vấn Đạo sáng trước' : ''}
          >
            {isReflectionDone ? 'ĐẠO QUẢ ĐÃ TỔNG KẾT' : 'KHỞI ĐỘNG KẾT NHẬT'}
          </button>
        </div>
      </div>

      {/* IMMERSIVE POPUP MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0f141c] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-[520px]"
            >
              {/* Modal Header */}
              <div className="bg-slate-950/60 px-5 py-3.5 border-b border-slate-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {ritualType === 'PLANNING' 
                      ? `🌅 Nghi Thức Vấn Đạo (${ritualDate === todayStr ? 'Hôm Nay' : ritualDate})` 
                      : `🌃 Nghi Thức Kết Nhật (${ritualDate === todayStr ? 'Hôm Nay' : ritualDate})`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Đạo hữu có muốn thoát khỏi nghi thức? Các thay đổi chưa lưu sẽ biến mất.')) {
                      setIsOpen(false);
                    }
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Steps Indicators */}
              <div className="bg-[#0c0f14] px-5 py-2.5 border-b border-slate-900/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500 font-bold">
                  <span className={step === 1 ? 'text-amber-500 font-extrabold' : ''}>1. LỌC ĐẠO TÂM</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span className={step === 2 ? 'text-amber-500 font-extrabold' : ''}>2. ƯU TIÊN</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span className={step === 3 ? 'text-amber-500 font-extrabold' : ''}>3. ĐỊNH THÌ</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span className={step === 4 ? 'text-amber-500 font-extrabold' : ''}>4. VIÊN MÃN</span>
                </div>
                <span className="text-[8px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-400">
                  Bước {step}/4
                </span>
              </div>

              {/* Steps Body */}
              <div className="flex-1 overflow-y-auto p-5 text-slate-300 min-h-0">
                {ritualType === 'PLANNING' ? (
                  /* PLANNING WIZARD STEPS */
                  <>
                    {step === 1 && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">Kiểm Điểm Nhiệm Vụ Quá Hạn</h4>
                            <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                              Linh khí ghi nhận những nhiệm vụ của quá khứ chưa được đáp đan điền. Hãy dời lịch sang ngày lập nghi thức hoặc dọn dẹp để nhẹ gánh đạo tâm!
                            </p>
                          </div>
                        </div>

                        {overdueTodos.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {overdueTodos.map(todo => (
                              <div key={todo.id} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-[10px] text-slate-200 font-bold truncate">{todo.title}</p>
                                    {(() => {
                                      const diff = getDifficultyInfo(todo.difficulty);
                                      return (
                                        <span className={`text-[6.5px] border px-1.5 py-0.2 rounded font-bold uppercase tracking-wider font-mono ${diff.color}`}>
                                          {diff.label}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-[7.5px] text-slate-500 font-mono mt-0.5">Hạn cũ: {todo.dueDate}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleRescheduleOverdue(todo.id, ritualDate)}
                                    className="px-2 py-1 bg-amber-950/30 hover:bg-amber-950/60 border border-amber-900/30 text-amber-400 font-bold text-[8px] rounded transition-all cursor-pointer"
                                  >
                                    Làm ngày này
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nextWeek = new Date();
                                      nextWeek.setDate(nextWeek.getDate() + 7);
                                      handleRescheduleOverdue(todo.id, getLocalDateString(nextWeek));
                                    }}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[8px] rounded transition-all cursor-pointer"
                                  >
                                    Tuần sau
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTaskInWizard(todo.id)}
                                    className="p-1 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                                    title="Xóa việc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-900 border-dashed rounded-xl">
                            <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                            <p className="text-[10px] text-slate-400 font-bold">Vô Ưu Vô Tà!</p>
                            <p className="text-[8.5px] text-slate-600 font-sans mt-0.5">Đạo phủ không có bất kỳ nhiệm vụ quá hạn nào tồn đọng.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">Xác Định Đạo Tâm Ưu Tiên (Tối Đa 3 Việc)</h4>
                            <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                              Khoanh vùng lực chiến! Lựa chọn các việc quan trọng nhất ngày {ritualDate === todayStr ? 'hôm nay' : ritualDate} để làm tâm điểm bứt phá đạo quả.
                            </p>
                          </div>
                        </div>

                        {/* Khung Thêm Việc Nhanh */}
                        <div className="bg-slate-950/40 border border-slate-900/60 p-3 rounded-xl space-y-2">
                          <p className="text-[8px] text-slate-500 font-bold uppercase font-mono tracking-wider">Thêm nhanh việc cho hôm nay:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="VD: Viết Essay IELTS Task 2..."
                              value={wizardNewTodoTitle}
                              onChange={e => setWizardNewTodoTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleWizardAddTodo();
                                }
                              }}
                              className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                            <select
                              value={wizardNewTodoDiff}
                              onChange={e => setWizardNewTodoDiff(e.target.value as Priority)}
                              className="bg-slate-950 border border-slate-900 rounded-lg px-2 py-1 text-[9px] text-slate-300 focus:outline-none cursor-pointer font-bold font-mono"
                            >
                              <option value="SO_CAP">Sơ Cấp (Trắng)</option>
                              <option value="TRUNG_CAP">Trung Cấp (Lam)</option>
                              <option value="CAO_CAP">Địa Cấp (Cam)</option>
                              <option value="THAN_CAP">Thiên Cấp (Vàng)</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleWizardAddTodo}
                              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-lg text-[9px] transition-colors cursor-pointer shrink-0"
                            >
                              + THÊM
                            </button>
                          </div>
                        </div>

                        {targetDateTodos.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {targetDateTodos.map(todo => {
                              const isSelected = selectedPriorities.includes(todo.id);
                              return (
                                <div
                                  key={todo.id}
                                  onClick={() => handleTogglePriority(todo.id)}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-amber-950/15 border-amber-500/40 text-amber-300'
                                      : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <span className="text-[10px] font-bold truncate">{todo.title}</span>
                                    {(() => {
                                      const diff = getDifficultyInfo(todo.difficulty);
                                      return (
                                        <select
                                          value={todo.difficulty || 'SO_CAP'}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => handleUpdateTodoDifficultyInWizard(todo.id, e.target.value as Priority)}
                                          className={`text-[6.5px] border px-1.5 py-0.2 rounded font-bold uppercase tracking-wider font-mono focus:outline-none cursor-pointer transition-colors ${diff.color}`}
                                        >
                                          <option value="SO_CAP" className="text-slate-300 bg-slate-950">Sơ Cấp</option>
                                          <option value="TRUNG_CAP" className="text-blue-400 bg-slate-950">Trung Cấp</option>
                                          <option value="CAO_CAP" className="text-orange-400 bg-slate-950">Địa Cấp</option>
                                          <option value="THAN_CAP" className="text-amber-400 bg-slate-950">Thiên Cấp</option>
                                        </select>
                                      );
                                    })()}
                                  </div>
                                  {isSelected ? (
                                    <span className="text-[8px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 flex items-center gap-0.5">
                                      <Flame className="w-2.5 h-2.5 fill-current" />
                                      Trọng Tâm
                                    </span>
                                  ) : (
                                    <span className="text-[8px] text-slate-600 border border-slate-800 px-1.5 py-0.5 rounded uppercase font-mono shrink-0">
                                      Bình Thường
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-900 border-dashed rounded-xl">
                            <AlertCircle className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
                            <p className="text-[10px] text-slate-400 font-bold">Lịch trình trống</p>
                            <p className="text-[8.5px] text-slate-600 font-sans mt-0.5">Ngày {ritualDate} không có nhiệm vụ nào trong danh sách. Hãy thêm việc ở tab Nhiệm Vụ Tông Môn trước nhé!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">Định Thì Khung Giờ (Estimated Duration)</h4>
                            <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                              Dự tính thời lượng cần bế quan thiền định cho các nhiệm vụ trọng tâm ngày {ritualDate === todayStr ? 'hôm nay' : ritualDate}.
                            </p>
                          </div>
                        </div>

                        {selectedPriorities.length > 0 ? (
                          <div className="space-y-3">
                            {selectedPriorities.map(id => {
                              const todo = localTodos.find(t => t.id === id);
                              if (!todo) return null;
                              const currentVal = estimatedTimes[id] || 30;

                              return (
                                <div key={id} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                                  <p className="text-[10px] font-bold text-slate-200">{todo.title}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold font-mono shrink-0">Bế quan dự kiến:</span>
                                    <div className="flex gap-1.5 flex-1">
                                      {[15, 30, 45, 60, 90, 120].map(mins => (
                                        <button
                                          key={mins}
                                          type="button"
                                          onClick={() => handleUpdateDuration(id, mins)}
                                          className={`flex-1 py-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer border ${
                                            currentVal === mins
                                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                          }`}
                                        >
                                          {mins}p
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-900 border-dashed rounded-xl">
                            <AlertCircle className="w-6 h-6 text-slate-700 mx-auto mb-1.5" />
                            <p className="text-[10px] text-slate-400 font-bold">Chưa chọn trọng tâm</p>
                            <p className="text-[8.5px] text-slate-600 font-sans mt-0.5">Bạn chưa chọn việc trọng tâm nào ở bước 2 để đặt thời lượng.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {step === 4 && (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-14 h-14 rounded-full bg-amber-950/30 border border-amber-900 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                          <Award className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest">Đạo Tâm Đã Quyết!</h4>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                            Kế hoạch ngày {ritualDate} đã định hình viên mãn. Các việc trọng tâm đã sẵn sàng linh khí, hãy toàn lực tập trung vượt kiếp học tập và làm việc!
                          </p>
                        </div>

                        {/* List summary */}
                        {selectedPriorities.length > 0 && (
                          <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-xl max-w-xs mx-auto text-left space-y-1.5">
                            <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest font-mono">Đạo tâm trọng tâm đã lập:</span>
                            {selectedPriorities.map(id => {
                              const todo = localTodos.find(t => t.id === id);
                              return todo ? (
                                <div key={id} className="text-[9px] font-bold text-slate-300 flex items-center gap-1">
                                  <span className="text-amber-500">✦</span>
                                  <span>{todo.title} ({estimatedTimes[id] || 30} phút)</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={handleCompletePlanning}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg hover:from-amber-600 hover:to-yellow-600 cursor-pointer"
                          >
                            XÁC NHẬN VẤN ĐẠO (+20 TU VI)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* REFLECTION WIZARD STEPS */
                  <>
                    {step === 1 && (
                      <div className="space-y-5">
                        <div className="flex gap-2">
                          <Award className="w-5 h-5 text-purple-400 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">Tổng Kết Đạo Quả Ngày {ritualDate === todayStr ? 'Hôm Nay' : ritualDate}</h4>
                            <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                              Linh Trận đã thống kê các quả vị đạt được trong ngày {ritualDate === todayStr ? 'hôm nay' : ritualDate} nhờ tinh thần bền bỉ:
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                            <p className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Bế Quan Thiền</p>
                            <h5 className="text-lg font-black text-blue-400 font-mono">{targetMeditation}</h5>
                            <p className="text-[7.5px] text-slate-600">phút tập trung</p>
                          </div>
                          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                            <p className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Nhiệm Vụ Thành</p>
                            <h5 className="text-lg font-black text-emerald-400 font-mono">{targetCompletedTasks}</h5>
                            <p className="text-[7.5px] text-slate-600">nhiệm vụ check</p>
                          </div>
                          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl text-center space-y-1">
                            <p className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Tu Vi Tích Lũy</p>
                            <h5 className="text-lg font-black text-amber-500 font-mono">+{targetTuVi}</h5>
                            <p className="text-[7.5px] text-slate-600">EXP thu nhận</p>
                          </div>
                        </div>

                        <div className="bg-[#0f141c] border border-slate-900/60 p-4 rounded-xl text-center font-sans text-[11px] leading-relaxed max-w-sm mx-auto text-slate-400">
                          {targetCompletedTasks > 0 || targetMeditation > 0 ? (
                            <span>✨ Đạo quả ngày này thật dồi dào! Đạo hữu đã đẩy lùi được phần nào tâm ma trì trệ để vững tâm tiến đạo. Hãy tiếp tục duy trì đà tu luyện này.</span>
                          ) : (
                            <span className="italic text-slate-500"> Đạo hữu chưa kịp hành trì đắp đan điền trong ngày này. Không sao cả, ngày tiếp theo là cơ hội mới để lập công bồi đức!</span>
                          )}
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Smile className="w-5 h-5 text-purple-400 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">Đánh Giá Tịnh Tâm Định Lực</h4>
                            <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                              Hãy thành thực soi chiếu đạo tâm ngày {ritualDate === todayStr ? 'hôm nay' : ritualDate}! Định lực tập trung tốt sẽ thu hoạch được lượng Linh Thạch bồi dưỡng rất đáng kể.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          {[
                            { val: 3, label: '🧘 Nhất Niệm Thông Thiên (Tập trung cực tốt)', desc: 'Hoàn thành tốt các mục tiêu đề ra, rất ít xao nhãng.', reward: '+20 Linh Thạch' },
                            { val: 2, label: '🌀 Đạo Tâm Dao Động (Tập trung tạm ổn)', desc: 'Có hoàn thành việc, nhưng đôi lúc vẫn bị điện thoại xao nhãng.', reward: '+15 Linh Thạch' },
                            { val: 1, label: '👹 Tâm Ma Xâm Nhập (Rất dễ xao nhãng)', desc: 'Trì trệ, lướt mạng xã hội nhiều, không tập trung được.', reward: '+10 Linh Thạch' },
                          ].map(opt => (
                            <div
                              key={opt.val}
                              onClick={() => setFocusRating(opt.val)}
                              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all text-left ${
                                focusRating === opt.val
                                  ? 'bg-purple-950/20 border-purple-500/50'
                                  : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                              }`}
                            >
                              <div>
                                <h5 className={`text-[10px] font-black ${focusRating === opt.val ? 'text-purple-300' : 'text-slate-300'}`}>{opt.label}</h5>
                                <p className="text-[8.5px] text-slate-500 font-sans mt-0.5">{opt.desc}</p>
                              </div>
                              <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-purple-400 font-mono font-bold whitespace-nowrap shrink-0">
                                {opt.reward}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">Giải Quyết Nhiệm Vụ Chưa Thành</h4>
                            <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                              Những nhiệm vụ ngày {ritualDate === todayStr ? 'hôm nay' : ritualDate} chưa được hoàn thành. Đạo hữu muốn giải quyết chúng như thế nào? Dời ngày để tiếp tục thực hiện?
                            </p>
                          </div>
                        </div>

                        {incompleteTargetTodos.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {incompleteTargetTodos.map(todo => (
                              <div key={todo.id} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-[10px] text-slate-200 font-bold truncate">{todo.title}</p>
                                    {(() => {
                                      const diff = getDifficultyInfo(todo.difficulty);
                                      return (
                                        <span className={`text-[6.5px] border px-1.5 py-0.2 rounded font-bold uppercase tracking-wider font-mono ${diff.color}`}>
                                          {diff.label}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      const tomorrow = new Date();
                                      tomorrow.setDate(tomorrow.getDate() + 1);
                                      handleRescheduleOverdue(todo.id, getLocalDateString(tomorrow));
                                    }}
                                    className="px-2 py-1 bg-purple-950/30 hover:bg-purple-950/60 border border-purple-900/30 text-purple-400 font-bold text-[8px] rounded transition-all cursor-pointer"
                                  >
                                    Dời sang mai
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nextWeek = new Date();
                                      nextWeek.setDate(nextWeek.getDate() + 7);
                                      handleRescheduleOverdue(todo.id, getLocalDateString(nextWeek));
                                    }}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[8px] rounded transition-all cursor-pointer"
                                  >
                                    Để tuần sau
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTaskInWizard(todo.id)}
                                    className="p-1 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                                    title="Xóa việc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-900 border-dashed rounded-xl">
                            <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                            <p className="text-[10px] text-slate-400 font-bold">Mọi Việc Viên Mãn!</p>
                            <p className="text-[8.5px] text-slate-600 font-sans mt-0.5">Không còn nhiệm vụ dang dở nào trong ngày này. Tuyệt vời!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {step === 4 && (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-14 h-14 rounded-full bg-purple-950/30 border border-purple-900 flex items-center justify-center mx-auto text-purple-400 animate-pulse">
                          <Gem className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest">Đạo Đời Hòa Hợp!</h4>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                            Đã hoàn tất chiêm nghiệm bản thân ngày {ritualDate}. Hãy đóng sổ ký lục và nghỉ ngơi bồi bổ nguyên khí để chuẩn bị bứt phá cho những chặng đường tiếp theo.
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleCompleteReflection}
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-100 font-bold text-[10px] tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg hover:from-purple-600 hover:to-indigo-600 cursor-pointer"
                          >
                            XÁC NHẬN KẾT NHẬT (+30 TU VI)
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="bg-[#0c0f14] px-5 py-3 border-t border-slate-900 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.max(prev - 1, 1))}
                  disabled={step === 1}
                  className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    step === 1
                      ? 'bg-slate-900 text-slate-600 border-slate-950 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  QUAY LẠI
                </button>

                <button
                  type="button"
                  onClick={() => setStep(prev => Math.min(prev + 1, 4))}
                  disabled={step === 4}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    step === 4
                      ? 'bg-slate-900 text-slate-600 border-slate-950 cursor-not-allowed'
                      : ritualType === 'PLANNING'
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                      : 'bg-purple-600 text-slate-100 hover:bg-purple-700'
                  }`}
                >
                  TIẾP TỤC
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
