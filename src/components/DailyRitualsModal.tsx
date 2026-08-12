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
  AlertCircle
} from 'lucide-react';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DailyRitualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'PLANNING' | 'REFLECTION';
  todoItems: TodoItem[];
  dailyLogs: DailyLog[];
  onSyncTodos: (syncedTodos: TodoItem[]) => void;
  onAddExp: (tuVi: number, linhThach: number) => void;
  onCompletePlanning: (date: string) => void;
  onCompleteReflection: (date: string) => void;
}

export default function DailyRitualsModal({
  isOpen,
  onClose,
  initialType,
  todoItems,
  dailyLogs,
  onSyncTodos,
  onAddExp,
  onCompletePlanning,
  onCompleteReflection
}: DailyRitualsModalProps) {
  const [ritualType, setRitualType] = useState<'PLANNING' | 'REFLECTION'>(initialType);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setRitualType(initialType);
  }, [initialType]);

  // Dates
  const todayStr = getLocalDateString();
  const [ritualDate, setRitualDate] = useState<string>(todayStr);

  // Wizard state: Local todos
  const [localTodos, setLocalTodos] = useState<TodoItem[]>([]);
  // Wizard state: Selected priority IDs
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  // Wizard state: Estimated durations
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, number>>({});
  // Wizard state: Focus rating
  const [focusRating, setFocusRating] = useState<number>(3);

  // Wizard state: Quick add todo
  const [wizardNewTodoTitle, setWizardNewTodoTitle] = useState('');
  const [wizardNewTodoDiff, setWizardNewTodoDiff] = useState<Priority>('SO_CAP');

  // Initialize wizard when opened
  useEffect(() => {
    if (isOpen) {
      setLocalTodos(JSON.parse(JSON.stringify(todoItems)));
      setStep(1);

      if (ritualType === 'PLANNING') {
        const datePriorities = todoItems
          .filter(t => t.dueDate === ritualDate && t.isDailyTarget)
          .map(t => t.id);
        setSelectedPriorities(datePriorities);

        const estMap: Record<string, number> = {};
        todoItems.forEach(t => {
          if (t.estimatedMinutes) estMap[t.id] = t.estimatedMinutes;
        });
        setEstimatedTimes(estMap);
      }
    }
  }, [isOpen, ritualType, todoItems, ritualDate]);

  if (!isOpen) return null;

  const overdueTodos = localTodos.filter(t => {
    if (t.isCompleted) return false;
    if (!t.dueDate) return false;
    return t.dueDate < ritualDate;
  });

  const ritualDateTodos = localTodos.filter(t => t.dueDate === ritualDate);

  const getDifficultyInfo = (diff?: Priority) => {
    switch (diff) {
      case 'SO_CAP':
        return { label: 'Sơ Cấp', color: 'text-slate-300 border-slate-800 bg-slate-900/40' };
      case 'TRUNG_CAP':
        return { label: 'Trung Cấp', color: 'text-blue-400 border-blue-900/50 bg-blue-950/20' };
      case 'CAO_CAP':
        return { label: 'Địa Cấp', color: 'text-orange-400 border-orange-900/50 bg-orange-950/20' };
      case 'THAN_CAP':
        return { label: 'Thiên Cấp', color: 'text-amber-400 border-amber-500/30 bg-amber-950/10' };
      default:
        return { label: 'Sơ Cấp', color: 'text-slate-300 border-slate-800 bg-slate-900/40' };
    }
  };

  const handleQuickAddTodoInWizard = () => {
    if (!wizardNewTodoTitle.trim()) return;

    let tuViReward = 15;
    let linhThachReward = 5;
    if (wizardNewTodoDiff === 'TRUNG_CAP') { tuViReward = 30; linhThachReward = 15; }
    else if (wizardNewTodoDiff === 'CAO_CAP') { tuViReward = 60; linhThachReward = 35; }
    else if (wizardNewTodoDiff === 'THAN_CAP') { tuViReward = 120; linhThachReward = 75; }

    const newTodo: TodoItem = {
      id: `todo_wiz_${Date.now()}_${Math.random()}`,
      title: wizardNewTodoTitle.trim(),
      type: 'DAY',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      tuViReward,
      linhThachReward,
      dueDate: ritualDate,
      difficulty: wizardNewTodoDiff,
      isDailyTarget: true
    };

    const updated = [newTodo, ...localTodos];
    setLocalTodos(updated);
    if (!selectedPriorities.includes(newTodo.id)) {
      setSelectedPriorities(prev => [...prev, newTodo.id]);
    }
    setWizardNewTodoTitle('');
  };

  const togglePrioritySelection = (id: string) => {
    setSelectedPriorities(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        if (prev.length >= 3) {
          alert('Đạo hữu chỉ nên chọn tối đa 3 nhiệm vụ trọng tâm hàng ngày!');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleFinishWizard = () => {
    let finalTodos = [...localTodos];
    finalTodos = finalTodos.map(t => {
      let isTarget = t.isDailyTarget;
      if (selectedPriorities.includes(t.id)) isTarget = true;
      else if (t.dueDate === ritualDate && !selectedPriorities.includes(t.id)) isTarget = false;

      const est = estimatedTimes[t.id] || t.estimatedMinutes;
      return {
        ...t,
        isDailyTarget: isTarget,
        estimatedMinutes: est
      };
    });

    onSyncTodos(finalTodos);

    if (ritualType === 'PLANNING') {
      onCompletePlanning(ritualDate);
      onAddExp(30, 15);
      alert('☀️ ĐẠO TÂM ĐÃ ĐỊNH!\n\nĐạo hữu đã hoàn thành Nghi Thức Vấn Đạo. Nhận ngay +30 Tu Vi & +15 Linh Thạch!');
    } else {
      onCompleteReflection(ritualDate);
      onAddExp(30, 15);
      alert('🌙 ĐẠO QUẢ ĐÃ TỔNG KẾT!\n\nĐạo hữu đã hoàn thành Nghi Thức Kết Nhật. Nhận ngay +30 Tu Vi & +15 Linh Thạch!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <div className="bg-[#0e131d] border-2 border-slate-950 rounded-2xl w-full max-w-xl shadow-[8px_8px_0px_#000] relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 bg-[#141a27] border-b-2 border-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">
                {ritualType === 'PLANNING' ? '☀️ Nghi Thức Vấn Đạo (Planning)' : '🌙 Nghi Thức Kết Nhật (Reflection)'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {ritualType === 'PLANNING' ? 'Định hình 3 việc trọng tâm & ước tính thời gian' : 'Rà soát đạo quả & đúc kết kinh nghiệm ngày'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-950 border border-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 font-sans text-xs">
          {/* STEP 1: Overdue Task Sweep */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-200">
                  {overdueTodos.length > 0
                    ? `Phát hiện ${overdueTodos.length} nhiệm vụ quá hạn từ trước. Hãy dời sang hôm nay hoặc dọn dẹp!`
                    : 'Tuyệt vời! Không có nhiệm vụ nào bị tồn đọng quá hạn trong quá khứ.'}
                </p>
              </div>

              {overdueTodos.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {overdueTodos.map(todo => (
                    <div key={todo.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-200 truncate">{todo.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setLocalTodos(prev => prev.map(t => t.id === todo.id ? { ...t, dueDate: ritualDate } : t));
                          }}
                          className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[9.5px] font-bold uppercase cursor-pointer"
                        >
                          Dời sang hôm nay
                        </button>
                        <button
                          onClick={() => {
                            setLocalTodos(prev => prev.filter(t => t.id !== todo.id));
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-950/40 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Pick 3 Core Priority Focus Tasks */}
          {step === 2 && ritualType === 'PLANNING' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 font-bold">Chọn tối đa 3 Nhiệm Vụ Trọng Tâm cho hôm nay ({selectedPriorities.length}/3):</p>
              </div>

              {/* Quick Add Todo Field */}
              <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-900">
                <input
                  type="text"
                  placeholder="Thêm nhanh việc quan trọng..."
                  value={wizardNewTodoTitle}
                  onChange={(e) => setWizardNewTodoTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTodoInWizard()}
                  className="bg-transparent flex-1 text-slate-100 focus:outline-none text-xs px-2"
                />
                <select
                  value={wizardNewTodoDiff}
                  onChange={(e) => setWizardNewTodoDiff(e.target.value as Priority)}
                  className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-2 font-mono"
                >
                  <option value="SO_CAP">Sơ Cấp</option>
                  <option value="TRUNG_CAP">Trung Cấp</option>
                  <option value="CAO_CAP">Địa Cấp</option>
                  <option value="THAN_CAP">Thiên Cấp</option>
                </select>
                <button
                  onClick={handleQuickAddTodoInWizard}
                  className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] uppercase cursor-pointer"
                >
                  Thêm
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {ritualDateTodos.map(todo => {
                  const isSelected = selectedPriorities.includes(todo.id);
                  const diffInfo = getDifficultyInfo(todo.difficulty);

                  return (
                    <div
                      key={todo.id}
                      onClick={() => togglePrioritySelection(todo.id)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 shadow-[2px_2px_0px_#000]'
                          : 'bg-slate-950 border-slate-900 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-700'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="font-bold text-slate-100">{todo.title}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${diffInfo.color}`}>
                        {diffInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Estimate Time & Finish */}
          {step === 3 && ritualType === 'PLANNING' && (
            <div className="space-y-4">
              <p className="text-slate-300 font-bold">Ước tính thời gian bế quan (phút) cho các việc trọng tâm:</p>
              <div className="space-y-3">
                {selectedPriorities.map(pId => {
                  const todo = localTodos.find(t => t.id === pId);
                  if (!todo) return null;

                  return (
                    <div key={pId} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center justify-between">
                      <span className="font-bold text-slate-200">{todo.title}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <input
                          type="number"
                          min={5}
                          max={300}
                          step={5}
                          value={estimatedTimes[pId] || 25}
                          onChange={(e) => setEstimatedTimes({ ...estimatedTimes, [pId]: Number(e.target.value) })}
                          className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-xs text-amber-300 font-bold focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">phút</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REFLECTION STEPS */}
          {ritualType === 'REFLECTION' && step === 2 && (
            <div className="space-y-4">
              <p className="text-slate-300 font-bold">Đánh giá mức độ tập trung bế quan hôm nay:</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { rating: 1, label: 'Tâm Ma Xâm Nhập', emoji: '😞', desc: 'Xao nhãng nhiều' },
                  { rating: 2, label: 'Tâm Cảnh Tạm Ổn', emoji: '😐', desc: 'Hoàn thành khá' },
                  { rating: 3, label: 'Đại Đạo Viên Mãn', emoji: '🤩', desc: 'Tập trung tuyệt đối' }
                ].map(item => (
                  <button
                    key={item.rating}
                    type="button"
                    onClick={() => setFocusRating(item.rating)}
                    className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer space-y-1 ${
                      focusRating === item.rating
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-[2px_2px_0px_#000]'
                        : 'bg-slate-950 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="text-2xl">{item.emoji}</div>
                    <div className="font-bold text-[11px]">{item.label}</div>
                    <div className="text-[9px] text-slate-500 font-mono">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-[#141a27] border-t-2 border-slate-950 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-800 flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
          ) : <div />}

          {step < (ritualType === 'PLANNING' ? 3 : 2) ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              className="px-4 py-1.5 neo-btn neo-btn-primary text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishWizard}
              className="px-5 py-2 neo-btn neo-btn-success text-xs font-black flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Award className="w-4 h-4" /> Hoàn Thành & Nhận +30 Tu Vi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
