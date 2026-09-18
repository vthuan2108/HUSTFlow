/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, Priority } from '../types';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  AlertCircle,
  CalendarCheck2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskSectionProps {
  tasks: Task[];
  onAddTask: (title: string, priority: Priority, dueDate: string, description?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskSection({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask
}: TaskSectionProps) {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('SO_CAP');
  const [dueDate, setDueDate] = useState(todayStr);
  const [description, setDescription] = useState('');
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const getDifficultyRank = (p: Priority) => {
    switch (p) {
      case 'THAN_CAP': return 4;
      case 'CAO_CAP': return 3;
      case 'TRUNG_CAP': return 2;
      case 'SO_CAP': return 1;
      default: return 0;
    }
  };

  const todayTasks = tasks
    .filter(task => task.dueDate === todayStr)
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return getDifficultyRank(b.priority) - getDifficultyRank(a.priority);
    });

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(title, priority, dueDate, description);
    setTitle('');
    setDescription('');
    setIsAdding(false);
  };

  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case 'SO_CAP':
        return { label: 'Novice', color: 'text-slate-300 border-slate-950 bg-slate-900', xp: 15, stones: 10 };
      case 'TRUNG_CAP':
        return { label: 'Adept', color: 'text-slate-950 border-slate-950 bg-blue-400', xp: 30, stones: 20 };
      case 'CAO_CAP':
        return { label: 'Earth', color: 'text-slate-950 border-slate-950 bg-orange-400', xp: 60, stones: 40 };
      case 'THAN_CAP':
        return { label: 'Heaven', color: 'text-slate-950 border-slate-950 bg-amber-400', xp: 120, stones: 80 };
    }
  };

  const getLeftBorderColor = (p: Priority) => {
    switch (p) {
      case 'TRUNG_CAP': return 'border-l-4 border-l-blue-400';
      case 'CAO_CAP': return 'border-l-4 border-l-orange-400';
      case 'THAN_CAP': return 'border-l-4 border-l-amber-400';
      default: return 'border-l-4 border-l-slate-500';
    }
  };

  const handleDeleteWithConfirm = (task: Task) => {
    setDeletingTask(task);
  };

  const confirmDeleteTask = () => {
    if (!deletingTask) return;
    onDeleteTask(deletingTask.id);
    setDeletingTask(null);
  };

  return (
    <div className="neo-card p-5 flex flex-col h-[590px] max-h-[590px] overflow-hidden" id="task-section">
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-4 shrink-0 border-b-2 border-slate-950 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-amber-400 animate-pulse" />
            Daily Tasks
          </h3>
          <p className="text-[10px] text-slate-500">Daily discipline to break through cultivation realms</p>
        </div>
        
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] neo-btn neo-btn-secondary px-3 py-1.5 flex items-center gap-1"
          id="toggle-add-task-btn"
        >
          <Plus className="w-3 h-3" />
          {isAdding ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {/* Form to add task */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitTask}
            className="bg-slate-950 border-2 border-slate-950 p-3.5 rounded-xl mb-4 space-y-2.5 shrink-0 overflow-hidden shadow-[2px_2px_0px_#000]"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Write Essay Task 2..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Tier / Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-1.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="SO_CAP">Novice (White)</option>
                  <option value="TRUNG_CAP">Adept (Blue)</option>
                  <option value="CAO_CAP">Earth (Orange)</option>
                  <option value="THAN_CAP">Heaven (Gold)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-0.5 text-xs text-slate-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Description</label>
                <input
                  type="text"
                  placeholder="Detailed notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 neo-btn neo-btn-primary text-[10px] tracking-wider"
            >
              CREATE TASK (+ ADD TASK)
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task Scroll List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" id="task-list-scroller">
        {todayTasks.length > 0 ? (
          todayTasks.map(task => {
            const info = getPriorityInfo(task.priority);
            return (
              <div
                key={task.id}
                className={`bg-[#1e2638] border-2 border-slate-950 p-3 rounded-xl transition-all flex items-start gap-3 shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px] ${
                  task.isCompleted ? 'bg-slate-950/40 opacity-50 select-none shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0' : ''
                } ${getLeftBorderColor(task.priority)}`}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="text-slate-500 hover:text-amber-400 mt-0.5 cursor-pointer shrink-0"
                >
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-bold text-slate-200 truncate ${task.isCompleted ? 'line-through text-slate-500 font-medium' : ''}`}>
                      {task.title}
                    </h4>
                    <span className={`text-[8px] border-2 border-slate-950 px-2 py-0.5 rounded-lg font-bold uppercase shrink-0 shadow-[1px_1px_0px_#000] ${info?.color}`}>
                      {info?.label}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{task.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      Due: {task.dueDate}
                    </span>
                    <span className="text-amber-500/80 font-bold">
                      +{info?.xp} EXP / +{info?.stones} Stones
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteWithConfirm(task)}
                  className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-900 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 text-slate-600 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-700" />
            Domain at peace. No tasks scheduled for today!
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {deletingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-card max-w-sm w-full p-6 space-y-4 text-left"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border-2 border-slate-950 shadow-[2px_2px_0px_#000]">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide pixel-label">
                  Delete Task
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Are you sure you want to delete Task: <span className="text-amber-400 font-bold">"{deletingTask.title}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 font-bold text-[10px]">
                <button
                  onClick={() => setDeletingTask(null)}
                  className="flex-1 py-2 neo-btn neo-btn-secondary text-[10px] font-bold"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmDeleteTask}
                  className="flex-1 py-2 neo-btn neo-btn-danger text-[10px] font-bold text-white"
                >
                  CONFIRM DELETE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
