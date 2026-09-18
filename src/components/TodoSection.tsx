/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TodoItem, Priority } from '../types';
import {
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Sparkles,
  ListTodo,
  RefreshCw,
  LogIn,
  LogOut,
  CalendarDays,
  Clock,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/firebase';
import { syncGoogleTasks, patchTaskOnGoogle, deleteTaskOnGoogle, pushTaskToGoogle } from '../lib/googleTasks';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface TodoSectionProps {
  todoItems: TodoItem[];
  onAddTodo: (title: string, difficulty: Priority, dueDate?: string, googleTaskId?: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onSyncTodos: (syncedTodos: TodoItem[]) => void;
  deletedGoogleTaskIds?: string[];
  onClearDeletedGoogleTaskIds?: () => void;
}

export default function TodoSection({
  todoItems,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onSyncTodos,
  deletedGoogleTaskIds = [],
  onClearDeletedGoogleTaskIds
}: TodoSectionProps) {
  const [newTitle, setNewTitle] = useState('');
  const [todoDate, setTodoDate] = useState(getLocalDateString());
  const [weekOffset, setWeekOffset] = useState(0);
  const [difficulty, setDifficulty] = useState<Priority>('SO_CAP');
  const [columnDifficulty, setColumnDifficulty] = useState<Priority>('SO_CAP');

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Column focused popover for quick adding
  const [activeAddColumnDate, setActiveAddColumnDate] = useState<string | null>(null);
  const [columnNewTitle, setColumnNewTitle] = useState('');

  // Track dragging
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  // Confirmations
  const [deletingTodo, setDeletingTodo] = useState<TodoItem | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setIsLoggedIn(true);
        setUserProfile(user);
      },
      () => {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle manual Google Sign In
  const handleSignIn = async () => {
    try {
      setSyncMessage('Connecting to Google Tasks...');
      const result = await googleSignIn();
      if (result) {
        setIsLoggedIn(true);
        setUserProfile(result.user);
        setSyncMessage('Connected to Google Tasks! Auto-syncing...');
        handleSync(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setSyncMessage('Connection failed. Please try again!');
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setUserProfile(null);
    setSyncMessage('Disconnected from Google Tasks.');
    setShowLogoutConfirm(false);
  };

  // Synchronize Google Tasks
  const handleSync = async (forcedToken?: string) => {
    const token = forcedToken || getAccessToken();
    if (!token) {
      handleSignIn();
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Syncing with Google Tasks...');
    try {
      const result = await syncGoogleTasks(token, todoItems, deletedGoogleTaskIds);
      onSyncTodos(result.syncedTodos);
      if (onClearDeletedGoogleTaskIds) {
        onClearDeletedGoogleTaskIds();
      }
      setSyncMessage(
        `Sync completed! Added/updated ${result.addedCount + result.updatedCount} tasks.`
      );
    } catch (err: any) {
      console.error('Sync failed:', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('401')) {
        await logout();
        setIsLoggedIn(false);
        setUserProfile(null);
        setSyncMessage('Google Tasks session expired. Please reconnect!');
      } else {
        setSyncMessage('Sync error. Please check your network connection!');
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    let gId: string | undefined = undefined;
    if (isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        let tempTuVi = 15;
        let tempLinhThach = 5;
        if (difficulty === 'TRUNG_CAP') {
          tempTuVi = 30;
          tempLinhThach = 15;
        } else if (difficulty === 'CAO_CAP') {
          tempTuVi = 60;
          tempLinhThach = 35;
        } else if (difficulty === 'THAN_CAP') {
          tempTuVi = 120;
          tempLinhThach = 75;
        }

        const tempTodo: TodoItem = {
          id: `todo_temp`,
          title: newTitle.trim(),
          type: 'DAY',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          tuViReward: tempTuVi,
          linhThachReward: tempLinhThach,
          dueDate: todoDate,
          difficulty
        };
        const pushedId = await pushTaskToGoogle(token, tempTodo);
        if (pushedId) {
          gId = pushedId;
        }
      }
    }
    onAddTodo(newTitle.trim(), difficulty, todoDate, gId);
    setNewTitle('');
    setDifficulty('SO_CAP');
  };

  // Get Monday to Sunday for the current week or other weeks
  const getDaysOfCurrentWeek = (offset: number): Date[] => {
    const now = new Date();
    // Shift date by offset * 7 days
    now.setDate(now.getDate() + offset * 7);
    const day = now.getDay(); // 0 is Sun, 1 is Mon...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getDaysOfCurrentWeek(weekOffset);
  const weekDayStrings = weekDays.map(d => getLocalDateString(d));

  // Helpers to get day titles in English
  const getDayLabel = (date: Date): { short: string; full: string; color: string } => {
    const day = date.getDay();
    const isToday = getLocalDateString(date) === getLocalDateString();

    let labels = { short: '', full: '', color: 'border-slate-900 bg-slate-950/20' };
    if (isToday) {
      labels = { short: 'Today', full: 'Today', color: 'border-amber-500/40 bg-amber-500/5' };
    } else {
      switch (day) {
        case 1: labels = { short: 'Mon', full: 'Monday', color: 'border-slate-900/60' }; break;
        case 2: labels = { short: 'Tue', full: 'Tuesday', color: 'border-slate-900/60' }; break;
        case 3: labels = { short: 'Wed', full: 'Wednesday', color: 'border-slate-900/60' }; break;
        case 4: labels = { short: 'Thu', full: 'Thursday', color: 'border-slate-900/60' }; break;
        case 5: labels = { short: 'Fri', full: 'Friday', color: 'border-slate-900/60' }; break;
        case 6: labels = { short: 'Sat', full: 'Saturday', color: 'border-slate-900/60' }; break;
        case 0: labels = { short: 'Sun', full: 'Sunday', color: 'border-slate-900/60' }; break;
      }
    }
    return labels;
  };

  // Reschedule with drag and drop
  const handleDragStart = (id: string) => {
    setDraggedTodoId(id);
  };

  const todayStr = getLocalDateString();
  const pendingTodosUpToToday = todoItems.filter(i => {
    const itemDate = i.dueDate || i.createdAt.split('T')[0];
    return !i.isCompleted && itemDate <= todayStr;
  });

  const handleDropOnDay = (dateStr: string) => {
    if (!draggedTodoId) return;

    const targetTodo = todoItems.find(t => t.id === draggedTodoId);
    if (targetTodo) {
      // Modify local state by updating its target date
      const updatedTodos = todoItems.map(t => {
        if (t.id === draggedTodoId) {
          const updated = { ...t, dueDate: dateStr };
          // If synced, also update Google Tasks in background
          if (t.googleTaskId && isLoggedIn) {
            const token = getAccessToken();
            if (token) {
              patchTaskOnGoogle(token, t.googleTaskId, { title: t.title, dueDate: dateStr });
            }
          }
          return updated;
        }
        return t;
      });
      onSyncTodos(updatedTodos);
    }
    setDraggedTodoId(null);
  };

  const handleToggleTodoWithGoogleSync = async (todo: TodoItem) => {
    // 1. Toggle locally
    onToggleTodo(todo.id);

    // 2. Sync status to Google Tasks if linked and logged in
    if (todo.googleTaskId && isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        // Toggle completed status on Google Tasks
        await patchTaskOnGoogle(token, todo.googleTaskId, {
          isCompleted: !todo.isCompleted,
          completedAt: !todo.isCompleted ? new Date().toISOString() : undefined
        });
      }
    }
  };

  const handleDeleteWithGoogleSync = (todo: TodoItem) => {
    setDeletingTodo(todo);
  };

  const confirmDeleteTodo = async () => {
    if (!deletingTodo) return;
    onDeleteTodo(deletingTodo.id);

    // 2. Delete on Google if linked and logged in
    if (deletingTodo.googleTaskId && isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        await deleteTaskOnGoogle(token, deletingTodo.googleTaskId);
      }
    }
    setDeletingTodo(null);
  };

  const handleAddInColumn = async (dateStr: string) => {
    if (!columnNewTitle.trim()) return;
    
    let gId: string | undefined = undefined;
    if (isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        let tempTuVi = 15;
        let tempLinhThach = 5;
        if (columnDifficulty === 'TRUNG_CAP') {
          tempTuVi = 30;
          tempLinhThach = 15;
        } else if (columnDifficulty === 'CAO_CAP') {
          tempTuVi = 60;
          tempLinhThach = 35;
        } else if (columnDifficulty === 'THAN_CAP') {
          tempTuVi = 120;
          tempLinhThach = 75;
        }

        const tempTodo: TodoItem = {
          id: `todo_temp`,
          title: columnNewTitle.trim(),
          type: 'DAY',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          tuViReward: tempTuVi,
          linhThachReward: tempLinhThach,
          dueDate: dateStr,
          difficulty: columnDifficulty
        };
        const pushedId = await pushTaskToGoogle(token, tempTodo);
        if (pushedId) {
          gId = pushedId;
        }
      }
    }
    onAddTodo(columnNewTitle.trim(), columnDifficulty, dateStr, gId);
    setColumnNewTitle('');
    setColumnDifficulty('SO_CAP');
    setActiveAddColumnDate(null);
  };

  // Helpers for text labels and colors
  const getDifficultyInfo = (diff?: Priority) => {
    switch (diff) {
      case 'SO_CAP':
        return { label: 'Novice', color: 'text-slate-300 border-slate-800 bg-slate-900/40', xp: 15, stones: 5 };
      case 'TRUNG_CAP':
        return { label: 'Adept', color: 'text-blue-400 border-blue-900/50 bg-blue-950/20', xp: 30, stones: 15 };
      case 'CAO_CAP':
        return { label: 'Earth', color: 'text-orange-400 border-orange-900/50 bg-orange-950/20', xp: 60, stones: 35 };
      case 'THAN_CAP':
        return { label: 'Heaven', color: 'text-amber-400 border-amber-500/30 bg-amber-950/10', xp: 120, stones: 75 };
      default:
        return { label: 'Novice', color: 'text-slate-300 border-slate-800 bg-slate-900/40', xp: 15, stones: 5 };
    }
  };

  const getLeftBorderColor = (diff?: Priority) => {
    switch (diff) {
      case 'TRUNG_CAP': return 'border-l-4 border-l-blue-400';
      case 'CAO_CAP': return 'border-l-4 border-l-orange-400';
      case 'THAN_CAP': return 'border-l-4 border-l-amber-400';
      default: return 'border-l-4 border-l-slate-500';
    }
  };

  const getDifficultyRank = (p?: Priority) => {
    switch (p) {
      case 'THAN_CAP': return 4;
      case 'CAO_CAP': return 3;
      case 'TRUNG_CAP': return 2;
      case 'SO_CAP': return 1;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6" id="todo-section-container">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Core Stat 1 */}
        <div className="neo-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">COMPLETED TASKS</p>
            <h4 className="text-2xl font-black text-slate-100 font-mono mt-0.5 pixel-label">
              {todoItems.filter(i => i.isCompleted).length}/{todoItems.length}
            </h4>
            <p className="text-[9px] text-slate-400 mt-0.5">Total completed tasks</p>
          </div>
          <div className="p-2.5 bg-slate-950 border-2 border-slate-950 rounded-xl text-amber-500 shadow-[1px_1px_0px_#000]">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Stat */}
        <div className="neo-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">TODAY'S TASKS</p>
            <h4 className="text-2xl font-black text-slate-100 font-mono mt-0.5 pixel-label">
              {todoItems.filter(i => (i.dueDate || i.createdAt.split('T')[0]) === new Date().toISOString().split('T')[0] && i.isCompleted).length}/{todoItems.filter(i => (i.dueDate || i.createdAt.split('T')[0]) === new Date().toISOString().split('T')[0]).length}
            </h4>
            <p className="text-[9px] text-slate-400 mt-0.5">Tasks scheduled for today</p>
          </div>
          <div className="p-2.5 bg-slate-950 border-2 border-slate-950 rounded-xl text-emerald-400 shadow-[1px_1px_0px_#000]">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control panel and google tasks sync */}
      <div className="neo-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Sync Controls */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-100">Sect Quest Board</h3>
          </div>
          <p className="text-[10px] text-slate-500">Drag & drop to reschedule. Two-way sync with Google Tasks.</p>
          
          {/* Week offset controls */}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="px-2 py-1 bg-slate-950 border-2 border-slate-950 hover:border-amber-400 hover:text-amber-400 text-slate-400 text-[10px] rounded-lg cursor-pointer transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              &larr; Prev Week
            </button>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-lg border-2 border-slate-950 shadow-[1px_1px_0px_#000] pixel-label">
              {weekOffset === 0 ? 'Current Week' : weekOffset > 0 ? `Next Week +${weekOffset}` : `Prev Week ${weekOffset}`}
            </span>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="px-2 py-1 bg-slate-950 border-2 border-slate-950 hover:border-amber-400 hover:text-amber-400 text-slate-400 text-[10px] rounded-lg cursor-pointer transition-all shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Next Week &rarr;
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[9px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                Back to Current Week
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Display */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 bg-slate-950 border-2 border-slate-950 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 shadow-[1px_1px_0px_#000]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono truncate max-w-[120px] font-bold">{userProfile?.displayName || 'Connected'}</span>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
                title="Disconnect Google Tasks"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 neo-btn neo-btn-secondary text-[10px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              Connect Google Tasks
            </button>
          )}

          {/* Sync Button */}
          <button
            onClick={() => handleSync()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-1.5 neo-btn neo-btn-primary text-[10px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-slate-950' : ''}`} />
            {isSyncing ? 'Syncing...' : 'SYNC GOOGLE TASKS'}
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {syncMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-slate-950 border-2 border-slate-950 p-2.5 rounded-xl text-[11px] text-amber-400 flex items-center gap-2 shadow-[2px_2px_0px_#000]"
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
          <span>{syncMessage}</span>
        </motion.div>
      )}

      {/* Main Grid Content - 7 columns */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 xl:gap-4 overflow-x-auto pb-4">
        {weekDays.map((dayDate, dayIdx) => {
          const dateStr = weekDayStrings[dayIdx];
          const label = getDayLabel(dayDate);

          // Get todo items due on this day (comparing date strings)
          const dayItems = todoItems
            .filter(item => {
              const itemDueDate = item.dueDate || item.createdAt.split('T')[0];
              return itemDueDate === dateStr;
            })
            .sort((a, b) => {
              if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
              }
              return getDifficultyRank(b.difficulty) - getDifficultyRank(a.difficulty);
            });

          const isTodayColumn = dateStr === new Date().toISOString().split('T')[0];

          return (
            <div
              key={dateStr}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOnDay(dateStr)}
              className={`neo-card p-3 flex flex-col h-[400px] transition-all min-w-[150px] ${
                draggedTodoId ? 'border-dashed border-amber-400 bg-amber-400/5 shadow-none' : ''
              } ${isTodayColumn ? 'border-amber-400 shadow-[4px_4px_0px_0px_#fbbf24]' : ''}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-slate-950 shrink-0">
                <div>
                  <h4 className="text-xs font-black text-slate-200">{label.full}</h4>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {dayDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActiveAddColumnDate(activeAddColumnDate === dateStr ? null : dateStr);
                    setColumnNewTitle('');
                  }}
                  className="p-1 rounded-md bg-slate-950 border-2 border-slate-950 text-slate-400 hover:text-amber-400 hover:border-amber-400 shadow-[1px_1px_0px_#000] cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                  title="Quick add task for this day"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Day Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 py-1">
                {/* Column quick add form */}
                {activeAddColumnDate === dateStr && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2 bg-slate-950 border-2 border-slate-950 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]"
                  >
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Task title..."
                      value={columnNewTitle}
                      onChange={(e) => setColumnNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddInColumn(dateStr);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    <select
                      value={columnDifficulty}
                      onChange={(e) => setColumnDifficulty(e.target.value as Priority)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1 py-0.5 text-[9px] text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="SO_CAP">Novice (White)</option>
                      <option value="TRUNG_CAP">Adept (Blue)</option>
                      <option value="CAO_CAP">Earth (Orange)</option>
                      <option value="THAN_CAP">Heaven (Gold)</option>
                    </select>
                    <div className="flex justify-between items-center gap-1.5">
                      <button
                        onClick={() => setActiveAddColumnDate(null)}
                        className="text-[9px] text-slate-500 hover:text-slate-300 px-1 py-0.5 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddInColumn(dateStr)}
                        className="text-[9px] bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded border border-slate-950 cursor-pointer shadow-[1px_1px_0px_#000]"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}

                {dayItems.length > 0 ? (
                  dayItems.map(item => {
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        className={`group/todo p-2.5 rounded-xl border-2 border-slate-950 cursor-grab active:cursor-grabbing transition-all flex flex-col justify-between shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px] ${
                          item.isCompleted
                            ? 'bg-slate-950/40 opacity-50 shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0'
                            : 'bg-[#1e2638]'
                        } ${getLeftBorderColor(item.difficulty)}`}
                      >
                        <div className="flex items-start gap-1.5">
                          <button
                            onClick={() => handleToggleTodoWithGoogleSync(item)}
                            className={`mt-0.5 transition-colors cursor-pointer shrink-0 ${
                              item.isCompleted ? 'text-amber-500' : 'text-slate-600 hover:text-amber-400'
                            }`}
                          >
                            {item.isCompleted ? (
                              <CheckCircle className="w-3.5 h-3.5 fill-amber-500/10" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <p
                            className={`text-[10px] text-slate-200 leading-normal break-words ${
                              item.isCompleted ? 'line-through text-slate-500 font-medium' : 'font-bold'
                            }`}
                          >
                            {item.title}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t-2 border-slate-950 text-[8px] font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.googleTaskId ? (
                              <span className="text-[8px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                Synced
                              </span>
                            ) : (
                              <span className="text-[8px] text-slate-500 bg-slate-950/40 border border-slate-900/40 px-1.5 py-0.5 rounded">
                                Offline
                              </span>
                            )}

                            {(() => {
                              const diff = getDifficultyInfo(item.difficulty);
                              return (
                                <span className={`text-[7px] border px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider ${diff.color}`}>
                                  {diff.label}
                                </span>
                              );
                            })()}

                            {item.isPriority && (
                              <span className="text-[8px] text-amber-400 bg-amber-950/40 border border-amber-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                <Flame className="w-2 h-2 fill-current" />
                                Priority
                              </span>
                            )}

                            {item.estimatedMinutes && (
                              <span className="text-[8px] text-blue-400 bg-blue-950/40 border border-blue-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                {item.estimatedMinutes}m
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/todo:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteWithGoogleSync(item)}
                              className="text-slate-600 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[9px] text-slate-600 py-12 border border-dashed border-slate-900/60 rounded-xl">
                    <Clock className="w-3.5 h-3.5 opacity-40 mb-1" />
                    Idle
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unfinished Quests Reminder */}
      {pendingTodosUpToToday.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-900/60 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-900/40">
            <div className="px-2.5 py-1 bg-rose-950/80 border border-rose-900 text-rose-400 rounded-lg animate-pulse text-[10px] font-black">
              ⚠️ INNER DEMON ALERT
            </div>
            <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
              Unfinished Cultivation Quests Report
            </h4>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Fellow Daoist, the spiritual array detected <strong className="text-rose-400 font-mono">{pendingTodosUpToToday.length} unfinished tasks</strong> up to today. {pendingTodosUpToToday.filter(i => i.dueDate && i.dueDate < todayStr).length > 0 && <span>Including <strong className="text-rose-400 font-mono">{pendingTodosUpToToday.filter(i => i.dueDate && i.dueDate < todayStr).length} overdue tasks</strong>! </span>}
            Cultivation opportunities pass in a flash. Procrastination consumes cultivation fruits and summons inner demons. Complete the following quests to advance your Dao:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingTodosUpToToday.slice(0, 6).map(item => {
              const overdue = item.dueDate && item.dueDate < todayStr;
              return (
                <div key={item.id} className="flex items-start gap-2 p-2.5 bg-slate-950/80 border border-slate-900 rounded-xl">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${overdue ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-200 font-bold truncate">{item.title}</p>
                    <p className="text-[8px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <span>Cycle: Daily</span>
                      {item.dueDate && (
                        <span className={overdue ? 'text-rose-400 font-bold' : ''}>
                          - Due: {new Date(item.dueDate).toLocaleDateString()} {overdue && '(OVERDUE!)'}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleTodoWithGoogleSync(item)}
                    className="text-[9px] text-amber-500 hover:text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded cursor-pointer shrink-0 transition-all font-semibold"
                  >
                    Complete Now
                  </button>
                </div>
              );
            })}
            {pendingTodosUpToToday.length > 6 && (
              <div className="col-span-full text-center text-[10px] text-slate-500 italic">
                ... and {pendingTodosUpToToday.length - 6} more unfinished tasks waiting for you.
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Input Form as Backup */}
      <div className="bg-[#0f141c]/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-3">
          <Plus className="w-4 h-4 text-amber-500" />
          Create New Task
        </h4>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Task Description (Quest Title)</label>
            <input
              type="text"
              required
              placeholder="e.g. Write IELTS Task 2 Essay..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Difficulty Tier</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Priority)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="SO_CAP">Novice (White)</option>
              <option value="TRUNG_CAP">Adept (Blue)</option>
              <option value="CAO_CAP">Earth (Orange)</option>
              <option value="THAN_CAP">Heaven (Gold)</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Due Date</label>
            <input
              type="date"
              value={todoDate}
              onChange={(e) => setTodoDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Add Quest
          </button>
        </form>
      </div>

      {/* Custom Confirmation Modals */}
      <AnimatePresence>
        {deletingTodo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f141c] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Delete Quest
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Are you sure you want to delete quest: <span className="text-amber-400 font-bold">"{deletingTodo.title}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 font-bold text-[10px]">
                <button
                  onClick={() => setDeletingTodo(null)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmDeleteTodo}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-slate-100 rounded-xl cursor-pointer transition-all shadow-lg shadow-rose-500/10"
                >
                  CONFIRM DELETE
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f141c] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Disconnect Google Tasks
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Are you sure you want to disconnect from Google Tasks? Synchronization will be paused.
                </p>
              </div>

              <div className="flex gap-2 font-bold text-[10px]">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-slate-950 rounded-xl cursor-pointer transition-all shadow-lg"
                >
                  DISCONNECT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
