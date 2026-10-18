/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TodoItem, Priority, normalizePriority, getTodoPriority } from '../types';
import {
  Plus,
  Trash2,
  RefreshCw,
  LogIn,
  LogOut,
  Calendar,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  Inbox,
  ListChecks,
  CalendarClock,
  Copy,
  ClipboardCheck,
  FolderPlus,
  MoreHorizontal,
  AlertTriangle,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/firebase';
import { patchTaskOnGoogle, deleteTaskOnGoogle, pushTaskToGoogle, syncGoogleTasks } from '../lib/googleTasks';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface ParsedTaskRow {
  id: string;
  rawDate: string;
  normalizedDate?: string;
  title: string;
}

export function parseExcelDate(raw: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return undefined;

  // 1. ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = String(isoMatch[2]).padStart(2, '0');
    const day = String(isoMatch[3]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. 2-digit year: DD/MM/YY or DD-MM-YY
  const dmy2Match = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmy2Match) {
    const day = String(dmy2Match[1]).padStart(2, '0');
    const month = String(dmy2Match[2]).padStart(2, '0');
    const year = `20${dmy2Match[3]}`;
    return `${year}-${month}-${day}`;
  }

  // 4. Short DD/MM or DD-MM (assume current year)
  const dmMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (dmMatch) {
    const currentYear = new Date().getFullYear();
    const day = String(dmMatch[1]).padStart(2, '0');
    const month = String(dmMatch[2]).padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  // 5. Native Date parse
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    if (!isNaN(d.getFullYear()) && d.getFullYear() > 2000) {
      return getLocalDateString(d);
    }
  }

  return undefined;
}

export function parseExcelClipboard(pastedText: string): ParsedTaskRow[] {
  if (!pastedText.trim()) return [];

  const lines = pastedText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // Parse lines into raw cell tokens by \t (or comma/semicolon)
  const rawRows: string[][] = lines.map(line => {
    if (line.includes('\t')) {
      return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
    }
    if (line.includes(',')) {
      return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    }
    if (line.includes(';')) {
      return line.split(';').map(c => c.trim().replace(/^["']|["']$/g, ''));
    }
    return [line];
  });

  // Skip header if first line looks like header
  let startIndex = 0;
  const firstRowJoined = rawRows[0].join(' ').toLowerCase();
  if (
    firstRowJoined.includes('ngày') ||
    firstRowJoined.includes('date') ||
    firstRowJoined.includes('task') ||
    firstRowJoined.includes('công việc') ||
    firstRowJoined.includes('tiêu đề') ||
    firstRowJoined.includes('deadline') ||
    firstRowJoined.includes('hạn')
  ) {
    startIndex = 1;
  }

  const validRows = rawRows.slice(startIndex);
  if (validRows.length === 0) return [];

  // Determine which column is Date:
  let col0DateCount = 0;
  let col1DateCount = 0;

  validRows.forEach(row => {
    if (row.length >= 2) {
      if (parseExcelDate(row[0])) col0DateCount++;
      if (parseExcelDate(row[1])) col1DateCount++;
    }
  });

  const isCol0Date = col0DateCount >= col1DateCount;

  const result: ParsedTaskRow[] = [];
  validRows.forEach((row, idx) => {
    let dateStr = '';
    let title = '';

    if (row.length >= 2) {
      dateStr = isCol0Date ? row[0] : row[1];
      title = isCol0Date ? row[1] : row[0];
    } else if (row.length === 1) {
      if (parseExcelDate(row[0])) {
        dateStr = row[0];
        title = 'Nhiệm vụ mới';
      } else {
        title = row[0];
      }
    }

    if (!title.trim() && !dateStr.trim()) return;

    const cleanTitle = title.replace(/^[-*+•\d+.)]\s*/, '').trim();

    result.push({
      id: `row_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      rawDate: dateStr,
      normalizedDate: parseExcelDate(dateStr),
      title: cleanTitle || 'Nhiệm vụ mới'
    });
  });

  return result;
}

interface TodoSectionProps {
  todoItems: TodoItem[];
  onAddTodo: (title: string, difficulty: Priority, dueDate?: string, googleTaskId?: string, project?: string) => void;
  onUpdateTodo?: (updatedTodo: TodoItem) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onSyncTodos: (syncedTodos: TodoItem[]) => void;
  deletedGoogleTaskIds?: string[];
  onClearDeletedGoogleTaskIds?: () => void;
}

interface MasterTask {
  title: string;
  project: string;
}

const DUMMY_PROJECTS = new Set(['beaverplans', 'linear algebra', 'piano', 'lck']);
const DUMMY_TITLES = new Set([
  'color polish', 'finalize copy', 'improve sync', 'ui polish', 'release polish', 'official release?',
  'read chap 3', 'do homework', 'review lecture notes', 'practice sessions', 'weekly lessons',
  'moonlight sonata 1st mvt.', 'hle vs dk', 'hle vs t1'
]);

export default function TodoSection({
  todoItems,
  onAddTodo,
  onUpdateTodo,
  onToggleTodo,
  onDeleteTodo,
  onSyncTodos,
  deletedGoogleTaskIds = [],
  onClearDeletedGoogleTaskIds
}: TodoSectionProps) {
  // Navigation & Date states
  const [weekOffset, setWeekOffset] = useState(0);
  const todayStr = getLocalDateString();

  // Projects state - strictly user-defined, no dummy sample data
  const [projects, setProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('tlk_beaver_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out dummy sample projects
          const cleanProjects = parsed.filter(p => !DUMMY_PROJECTS.has(String(p).toLowerCase()));
          if (cleanProjects.length > 0) return cleanProjects;
        }
      } catch (e) {}
    }
    // Extract unique projects from user's actual todos
    const existingProjects = Array.from(
      new Set(
        todoItems
          .map(t => (t.project || t.googleTaskListName || '').trim().toLowerCase())
          .filter(p => p && !DUMMY_PROJECTS.has(p))
      )
    );
    return existingProjects;
  });

  useEffect(() => {
    localStorage.setItem('tlk_beaver_projects', JSON.stringify(projects));
  }, [projects]);

  // Master tasks registered per project - starts empty for real users
  const [masterTasks, setMasterTasks] = useState<MasterTask[]>(() => {
    const saved = localStorage.getItem('tlk_beaver_master_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            m => !DUMMY_TITLES.has(String(m.title).toLowerCase()) && !DUMMY_PROJECTS.has(String(m.project).toLowerCase())
          );
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tlk_beaver_master_tasks', JSON.stringify(masterTasks));
  }, [masterTasks]);

  // One-time cleanup effect to purge dummy sample tasks from todoItems
  useEffect(() => {
    const hasDummy = todoItems.some(
      t => t.project && DUMMY_PROJECTS.has(t.project.toLowerCase()) && DUMMY_TITLES.has(t.title.toLowerCase())
    );
    if (hasDummy) {
      const cleaned = todoItems.filter(
        t => !(t.project && DUMMY_PROJECTS.has(t.project.toLowerCase()) && DUMMY_TITLES.has(t.title.toLowerCase()))
      );
      onSyncTodos(cleaned);
    }
  }, []);

  // Quick inline add states for projects
  const [addingTaskForProject, setAddingTaskForProject] = useState<string | null>(null);
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');
  const [selectedDaysForNewTask, setSelectedDaysForNewTask] = useState<number[]>([]); // Optional day scheduling
  const [draggedMasterTask, setDraggedMasterTask] = useState<{ project: string; title: string } | null>(null);

  // Add project inline state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Edit & Delete Project
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [editProjectInput, setEditProjectInput] = useState('');
  const [deletingProjectName, setDeletingProjectName] = useState<string | null>(null);

  // Edit & Delete Master Task
  const [editingMasterTask, setEditingMasterTask] = useState<{ project: string; oldTitle: string } | null>(null);
  const [editMasterTaskInput, setEditMasterTaskInput] = useState('');
  const [deletingMasterTask, setDeletingMasterTask] = useState<{ project: string; title: string } | null>(null);

  // Edit Task State
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<Priority>('SO_CAP');
  const [editDueDate, setEditDueDate] = useState('');

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Column quick add modal / popover
  const [activeAddColumnDate, setActiveAddColumnDate] = useState<string | null>(null);
  const [columnNewTitle, setColumnNewTitle] = useState('');
  const [columnProject, setColumnProject] = useState('');

  // Top quick add modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [todoDate, setTodoDate] = useState(getLocalDateString());
  const [todoProject, setTodoProject] = useState('');
  const [difficulty, setDifficulty] = useState<Priority>('SO_CAP');

  // Track dragging
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  // Confirmations
  const [deletingTodo, setDeletingTodo] = useState<TodoItem | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRollOverModal, setShowRollOverModal] = useState(false);
  const [selectedRollOverIds, setSelectedRollOverIds] = useState<string[]>([]);

  // Copy / Paste Plan Notification
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  // Bulk Delete State
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteScope, setBulkDeleteScope] = useState<'WEEK' | 'MONTH' | 'BACKLOG' | 'ALL'>('WEEK');
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [bulkDeleteProject, setBulkDeleteProject] = useState<string>('ALL');
  const [bulkDeleteMonth, setBulkDeleteMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bulkDeleteWeekDate, setBulkDeleteWeekDate] = useState<string>(() => getLocalDateString());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Excel Import States (2-column: Date & Task)
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelPastedText, setExcelPastedText] = useState('');
  const [excelParsedRows, setExcelParsedRows] = useState<ParsedTaskRow[]>([]);
  const [excelDefaultProject, setExcelDefaultProject] = useState('Chung');
  const [isImportingExcel, setIsImportingExcel] = useState(false);

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

  const handleSignIn = async () => {
    try {
      const user = await googleSignIn();
      if (user) {
        setIsLoggedIn(true);
        setUserProfile(user);
        const token = getAccessToken();
        if (token) handleSync(token);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
      setSyncMessage('Đăng nhập Google thất bại.');
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setUserProfile(null);
    setSyncMessage('Đã ngắt kết nối Google Tasks.');
    setShowLogoutConfirm(false);
  };

  const handleSync = async (forcedToken?: string) => {
    const token = forcedToken || getAccessToken();
    if (!token) {
      handleSignIn();
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Đang đồng bộ với Google Tasks...');
    try {
      const result = await syncGoogleTasks(token, todoItems, deletedGoogleTaskIds);
      onSyncTodos(result.syncedTodos);
      if (onClearDeletedGoogleTaskIds) {
        onClearDeletedGoogleTaskIds();
      }
      setSyncMessage(`Đã đồng bộ! Đã cập nhật ${result.addedCount + result.updatedCount} nhiệm vụ.`);
    } catch (err: any) {
      console.error('Sync failed:', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('401')) {
        await logout();
        setIsLoggedIn(false);
        setUserProfile(null);
        setSyncMessage('Phiên làm việc Google Tasks hết hạn. Vui lòng kết nối lại!');
      } else {
        setSyncMessage('Lỗi đồng bộ. Vui lòng kiểm tra kết nối mạng!');
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Helper to schedule a task to calendar and push to Google Tasks immediately if logged in
  const scheduleTaskWithGoogleSync = async (
    title: string,
    dueDate?: string,
    project?: string,
    difficulty: Priority = 'SO_CAP'
  ) => {
    let gId: string | undefined = undefined;
    if (isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        const tempTodo: TodoItem = {
          id: `todo_temp`,
          title: title.trim(),
          type: 'DAY',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          tuViReward: 15,
          linhThachReward: 5,
          dueDate: dueDate || undefined,
          difficulty,
          project: project || ''
        };
        const pushedId = await pushTaskToGoogle(token, tempTodo);
        if (pushedId) gId = pushedId;
      }
    }
    onAddTodo(title.trim(), difficulty, dueDate || undefined, gId, project || '');
  };

  // Excel Import Handlers (2-column: Date & Task)
  const handlePastedTextChange = (text: string) => {
    setExcelPastedText(text);
    const parsed = parseExcelClipboard(text);
    setExcelParsedRows(parsed);
  };

  const handleUpdateExcelRowDate = (rowId: string, newDate: string) => {
    setExcelParsedRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, normalizedDate: newDate || undefined } : r))
    );
  };

  const handleUpdateExcelRowTitle = (rowId: string, newTitle: string) => {
    setExcelParsedRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, title: newTitle } : r))
    );
  };

  const handleDeleteExcelRow = (rowId: string) => {
    setExcelParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleExecuteExcelImport = async () => {
    if (excelParsedRows.length === 0) return;
    setIsImportingExcel(true);

    try {
      const count = excelParsedRows.length;
      const prj = excelDefaultProject === 'Chung' ? '' : excelDefaultProject;

      for (const row of excelParsedRows) {
        if (!row.title.trim()) continue;
        await scheduleTaskWithGoogleSync(
          row.title.trim(),
          row.normalizedDate || undefined,
          prj,
          'SO_CAP'
        );
      }

      setShowExcelImportModal(false);
      setExcelPastedText('');
      setExcelParsedRows([]);
      setClipboardNotice(`Đã thêm thành công ${count} công việc từ Excel!`);
      setTimeout(() => setClipboardNotice(null), 3500);
    } catch (err) {
      console.error('Failed to import tasks from Excel:', err);
    } finally {
      setIsImportingExcel(false);
    }
  };

  // Drag and drop handler
  const handleDragStart = (id: string) => {
    setDraggedTodoId(id);
  };

  const handleDropOnDay = async (dateStr: string) => {
    if (draggedMasterTask) {
      await scheduleTaskWithGoogleSync(draggedMasterTask.title, dateStr || undefined, draggedMasterTask.project);
      setDraggedMasterTask(null);
      return;
    }

    if (!draggedTodoId) return;

    const targetTodo = todoItems.find(t => t.id === draggedTodoId);
    if (targetTodo) {
      const updatedTodos = todoItems.map(t => {
        if (t.id === draggedTodoId) {
          const updated = { ...t, dueDate: dateStr || undefined };
          if (t.googleTaskId && isLoggedIn) {
            const token = getAccessToken();
            if (token) {
              patchTaskOnGoogle(token, t.googleTaskId, { title: t.title, dueDate: dateStr || undefined });
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
    onToggleTodo(todo.id);

    if (todo.googleTaskId && isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        await patchTaskOnGoogle(token, todo.googleTaskId, {
          isCompleted: !todo.isCompleted,
          completedAt: !todo.isCompleted ? new Date().toISOString() : undefined
        });
      }
    }
  };

  const confirmDeleteTodo = async () => {
    if (!deletingTodo) return;
    onDeleteTodo(deletingTodo.id);

    if (deletingTodo.googleTaskId && isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        await deleteTaskOnGoogle(token, deletingTodo.googleTaskId);
      }
    }
    setDeletingTodo(null);
  };

  // Helper: Get 7 days of the current week offset (Monday to Sunday)
  const getDaysOfCurrentWeek = (offset: number): Date[] => {
    const now = new Date();
    now.setDate(now.getDate() + offset * 7);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = useMemo(() => getDaysOfCurrentWeek(weekOffset), [weekOffset]);
  const weekDayStrings = useMemo(() => weekDays.map(d => getLocalDateString(d)), [weekDays]);

  const weekStartStr = weekDays[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const weekEndStr = weekDays[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  // Calculate days remaining in current week (until Sunday)
  const daysRemainingInWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const remaining = day === 0 ? 0 : 7 - day;
    return remaining;
  }, []);

  // Filter tasks in current week
  const weekTodos = useMemo(() => {
    return todoItems.filter(item => {
      return item.dueDate && weekDayStrings.includes(item.dueDate);
    });
  }, [todoItems, weekDayStrings]);

  const weekCompletedCount = weekTodos.filter(t => t.isCompleted).length;
  const weekTotalCount = weekTodos.length;
  const weekPercent = weekTotalCount > 0 ? Math.round((weekCompletedCount / weekTotalCount) * 100) : 0;

  // Overdue incomplete tasks
  const overdueTodos = useMemo(() => {
    return todoItems.filter(i => {
      return !i.isCompleted && i.dueDate && i.dueDate < todayStr;
    });
  }, [todoItems, todayStr]);

  // Backlog tasks (no dueDate)
  const backlogItems = useMemo(() => {
    return todoItems.filter(item => !item.dueDate);
  }, [todoItems]);

  // Matched tasks for bulk deletion based on scope and filters
  // Calculation of week days & label for bulk deletion based on bulkDeleteWeekDate
  const bulkDeleteWeekInfo = useMemo(() => {
    const dateStr = bulkDeleteWeekDate || getLocalDateString();
    const parts = dateStr.split('-');
    let target = new Date();
    if (parts.length === 3) {
      target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    const day = target.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = target.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(target);
    monday.setDate(diff);

    const dayStrings: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dayStrings.push(getLocalDateString(d));
    }

    const startFormatted = monday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const endFormatted = sunday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      dayStrings,
      startFormatted,
      endFormatted,
      label: `${startFormatted} – ${endFormatted}`,
      mondayDate: monday
    };
  }, [bulkDeleteWeekDate]);

  const handleShiftBulkDeleteWeek = (offsetWeeks: number) => {
    const monday = new Date(bulkDeleteWeekInfo.mondayDate);
    monday.setDate(monday.getDate() + offsetWeeks * 7);
    setBulkDeleteWeekDate(getLocalDateString(monday));
  };

  const handleShiftBulkDeleteMonth = (offsetMonths: number) => {
    const [yearStr, monthStr] = bulkDeleteMonth.split('-');
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + offsetMonths, 1);
    const nextMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setBulkDeleteMonth(nextMonthStr);
  };

  // Matched tasks for bulk deletion based on scope and filters
  const matchedBulkDeleteTodos = useMemo(() => {
    return todoItems.filter(item => {
      // 1. Scope filter
      if (bulkDeleteScope === 'WEEK') {
        if (!item.dueDate || !bulkDeleteWeekInfo.dayStrings.includes(item.dueDate)) return false;
      } else if (bulkDeleteScope === 'MONTH') {
        if (!item.dueDate || !item.dueDate.startsWith(bulkDeleteMonth)) return false;
      } else if (bulkDeleteScope === 'BACKLOG') {
        if (item.dueDate) return false;
      }
      // 'ALL' matches all tasks

      // 2. Status filter
      if (bulkDeleteStatus === 'COMPLETED' && !item.isCompleted) return false;
      if (bulkDeleteStatus === 'PENDING' && item.isCompleted) return false;

      // 3. Project filter
      if (bulkDeleteProject !== 'ALL') {
        const itemProject = (item.project || '').toLowerCase().trim();
        if (itemProject !== bulkDeleteProject.toLowerCase().trim()) return false;
      }

      return true;
    });
  }, [todoItems, bulkDeleteScope, bulkDeleteWeekInfo, bulkDeleteMonth, bulkDeleteStatus, bulkDeleteProject]);

  // Execute bulk delete
  const handleExecuteBulkDelete = async () => {
    if (matchedBulkDeleteTodos.length === 0) return;
    setIsBulkDeleting(true);

    try {
      const idsToDelete = new Set(matchedBulkDeleteTodos.map(t => t.id));
      const count = matchedBulkDeleteTodos.length;
      const remainingTodos = todoItems.filter(t => !idsToDelete.has(t.id));

      // 1. Bulk sync remaining tasks to app state
      onSyncTodos(remainingTodos);

      // 2. Propagate deletions to Google Tasks and App deletedGoogleTaskIds
      const token = isLoggedIn ? getAccessToken() : null;
      matchedBulkDeleteTodos.forEach(t => {
        if (t.googleTaskId) {
          onDeleteTodo(t.id);
          if (token) {
            deleteTaskOnGoogle(token, t.googleTaskId).catch(err => {
              console.warn('Bulk delete Google Task error:', err);
            });
          }
        }
      });

      setShowBulkDeleteModal(false);
      setClipboardNotice(`Đã xóa thành công ${count} nhiệm vụ!`);
      setTimeout(() => setClipboardNotice(null), 3500);
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add Task to Column
  const handleAddInColumn = async (dateStr: string) => {
    if (!columnNewTitle.trim()) return;

    const prj = columnProject.trim() || (projects.length > 0 ? projects[0] : '');
    const title = columnNewTitle.trim();

    await scheduleTaskWithGoogleSync(title, dateStr || undefined, prj, 'SO_CAP');

    // Also register to master tasks if not existing
    if (prj) {
      setMasterTasks(prev => {
        const exists = prev.some(m => m.project.toLowerCase() === prj.toLowerCase() && m.title.toLowerCase() === title.toLowerCase());
        if (!exists) {
          return [...prev, { title, project: prj }];
        }
        return prev;
      });
    }

    setColumnNewTitle('');
    setActiveAddColumnDate(null);
  };

  // Top Modal Submit
  const handleSubmitTopModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const prj = todoProject.trim() || (projects.length > 0 ? projects[0] : '');
    const title = newTitle.trim();

    await scheduleTaskWithGoogleSync(title, todoDate || undefined, prj, difficulty);

    if (prj) {
      setMasterTasks(prev => {
        const exists = prev.some(m => m.project.toLowerCase() === prj.toLowerCase() && m.title.toLowerCase() === title.toLowerCase());
        if (!exists) {
          return [...prev, { title, project: prj }];
        }
        return prev;
      });
    }

    setNewTitle('');
    setDifficulty('SO_CAP');
    setShowQuickAddModal(false);
  };

  // Editing Handlers
  const startEditing = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditProject(todo.project || '');
    setEditDifficulty(getTodoPriority(todo));
    setEditDueDate(todo.dueDate || getLocalDateString());
  };

  const handleSaveEdit = async () => {
    if (!editingTodo || !editTitle.trim()) return;

    const normDifficulty = normalizePriority(editDifficulty);
    const updated: TodoItem = {
      ...editingTodo,
      title: editTitle.trim(),
      project: editProject.trim() || undefined,
      difficulty: normDifficulty,
      dueDate: editDueDate || undefined
    };

    if (onUpdateTodo) {
      onUpdateTodo(updated);
    } else {
      const nextTodos = todoItems.map(t => t.id === updated.id ? updated : t);
      onSyncTodos(nextTodos);
    }

    if (updated.googleTaskId && isLoggedIn) {
      const token = getAccessToken();
      if (token) {
        patchTaskOnGoogle(token, updated.googleTaskId, {
          title: updated.title,
          dueDate: updated.dueDate
        }).catch(err => {
          console.warn('Google Task edit sync failed:', err);
        });
      }
    }

    setEditingTodo(null);
  };

  // Add Task directly from a Project Card with days selection
  const handleAddProjectTask = (projectName: string) => {
    if (!newProjectTaskTitle.trim()) return;

    const title = newProjectTaskTitle.trim();

    // Register master task
    setMasterTasks(prev => {
      const exists = prev.some(m => m.project.toLowerCase() === projectName.toLowerCase() && m.title.toLowerCase() === title.toLowerCase());
      if (!exists) {
        return [...prev, { title, project: projectName }];
      }
      return prev;
    });

    // Schedule into selected days ONLY if user explicitly checked any days
    if (selectedDaysForNewTask.length > 0) {
      selectedDaysForNewTask.forEach(async dayIdx => {
        const targetDate = weekDays[dayIdx];
        if (targetDate) {
          const dateStr = getLocalDateString(targetDate);
          await scheduleTaskWithGoogleSync(title, dateStr, projectName);
        }
      });
    }

    setNewProjectTaskTitle('');
    setSelectedDaysForNewTask([]);
    setAddingTaskForProject(null);
  };

  // Add a new Project
  const handleAddNewProject = () => {
    const trimmed = newProjectName.trim().toLowerCase();
    if (!trimmed) return;
    if (!projects.includes(trimmed)) {
      setProjects(prev => [...prev, trimmed]);
    }
    setNewProjectName('');
    setIsAddingProject(false);
  };

  // Rename Project
  const handleRenameProject = (oldName: string, newName: string) => {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed || trimmed === oldName.toLowerCase()) {
      setEditingProjectName(null);
      return;
    }

    setProjects(prev => prev.map(p => p.toLowerCase() === oldName.toLowerCase() ? trimmed : p));

    setMasterTasks(prev => prev.map(m => m.project.toLowerCase() === oldName.toLowerCase() ? { ...m, project: trimmed } : m));

    const updatedTodos = todoItems.map(t => {
      if ((t.project || '').toLowerCase() === oldName.toLowerCase()) {
        return { ...t, project: trimmed };
      }
      return t;
    });
    onSyncTodos(updatedTodos);

    setEditingProjectName(null);
  };

  // Delete Project
  const handleDeleteProject = (projectName: string) => {
    setProjects(prev => prev.filter(p => p.toLowerCase() !== projectName.toLowerCase()));
    setMasterTasks(prev => prev.filter(m => m.project.toLowerCase() !== projectName.toLowerCase()));

    const updatedTodos = todoItems.filter(t => (t.project || '').toLowerCase() !== projectName.toLowerCase());
    onSyncTodos(updatedTodos);

    setDeletingProjectName(null);
  };

  // Rename Master Task
  const handleRenameMasterTask = (project: string, oldTitle: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed.toLowerCase() === oldTitle.toLowerCase()) {
      setEditingMasterTask(null);
      return;
    }

    setMasterTasks(prev => prev.map(m => {
      if (m.project.toLowerCase() === project.toLowerCase() && m.title.toLowerCase() === oldTitle.toLowerCase()) {
        return { ...m, title: trimmed };
      }
      return m;
    }));

    const updatedTodos = todoItems.map(t => {
      if ((t.project || '').toLowerCase() === project.toLowerCase() && t.title.toLowerCase() === oldTitle.toLowerCase()) {
        return { ...t, title: trimmed };
      }
      return t;
    });
    onSyncTodos(updatedTodos);

    setEditingMasterTask(null);
  };

  // Delete Master Task
  const handleDeleteMasterTask = (project: string, title: string) => {
    setMasterTasks(prev => prev.filter(m => !(m.project.toLowerCase() === project.toLowerCase() && m.title.toLowerCase() === title.toLowerCase())));

    const updatedTodos = todoItems.filter(t => !((t.project || '').toLowerCase() === project.toLowerCase() && t.title.toLowerCase() === title.toLowerCase()));
    onSyncTodos(updatedTodos);

    setDeletingMasterTask(null);
  };

  // Copy Plan feature (Beaverplans)
  const handleCopyPlan = () => {
    if (weekTodos.length === 0) {
      setClipboardNotice('Tuần này chưa có nhiệm vụ nào để chép.');
      setTimeout(() => setClipboardNotice(null), 3000);
      return;
    }

    // Create normalized blueprint by day of week (0 to 6)
    const blueprint = weekTodos.map(item => {
      const d = new Date(item.dueDate + 'T00:00:00');
      let dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday...
      // Map to 0=Mon, 1=Tue, ..., 6=Sun
      const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1;
      return {
        title: item.title,
        project: item.project || '',
        dayOffset,
        difficulty: item.difficulty || 'SO_CAP'
      };
    });

    localStorage.setItem('tlk_copied_week_plan', JSON.stringify(blueprint));
    setClipboardNotice(`Đã chép kế hoạch (${blueprint.length} việc)! Hãy chuyển sang tuần khác và bấm "Dán kế hoạch".`);
    setTimeout(() => setClipboardNotice(null), 4000);
  };

  // Paste Plan feature (Beaverplans)
  const handlePastePlan = () => {
    const saved = localStorage.getItem('tlk_copied_week_plan');
    if (!saved) {
      setClipboardNotice('Chưa có kế hoạch nào được chép. Hãy bấm "Chép kế hoạch" trước!');
      setTimeout(() => setClipboardNotice(null), 3000);
      return;
    }

    try {
      const blueprint: Array<{ title: string; project: string; dayOffset: number; difficulty: Priority }> = JSON.parse(saved);
      if (!Array.isArray(blueprint) || blueprint.length === 0) return;

      blueprint.forEach(entry => {
        const targetDate = weekDays[entry.dayOffset];
        if (targetDate) {
          const dateStr = getLocalDateString(targetDate);
          onAddTodo(entry.title, entry.difficulty || 'SO_CAP', dateStr, undefined, entry.project);
        }
      });

      setClipboardNotice(`Đã dán thành công ${blueprint.length} việc vào tuần này!`);
      setTimeout(() => setClipboardNotice(null), 4000);
    } catch (e) {
      console.error('Failed to parse copied plan:', e);
    }
  };

  // Short Vietnamese day labels matching Beaverplans
  const getDayShortName = (index: number): string => {
    switch (index) {
      case 0: return 'T2';
      case 1: return 'T3';
      case 2: return 'T4';
      case 3: return 'T5';
      case 4: return 'T6';
      case 5: return 'T7';
      case 6: return 'CN';
      default: return '';
    }
  };

  // Jump to specific date's week
  const handleJumpToDate = (targetDateStr: string) => {
    if (!targetDateStr) return;
    const parts = targetDateStr.split('-');
    if (parts.length !== 3) return;
    const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const now = new Date();

    const targetDay = target.getDay();
    const targetDiff = target.getDate() - targetDay + (targetDay === 0 ? -6 : 1);
    const targetMonday = new Date(target.setDate(targetDiff));
    targetMonday.setHours(0, 0, 0, 0);

    const nowDay = now.getDay();
    const nowDiff = now.getDate() - nowDay + (nowDay === 0 ? -6 : 1);
    const nowMonday = new Date(now.setDate(nowDiff));
    nowMonday.setHours(0, 0, 0, 0);

    const diffWeeks = Math.round((targetMonday.getTime() - nowMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
  };

  // Render a sleek Beaverplans Day Column
  const renderDayColumn = (dayDate: Date, dayIndex: number) => {
    const dateStr = getLocalDateString(dayDate);
    const dayName = getDayShortName(dayIndex);
    const isToday = dateStr === todayStr;

    const dayItems = todoItems
      .filter(item => item.dueDate === dateStr)
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return 0;
      });

    const completedCount = dayItems.filter(item => item.isCompleted).length;
    const totalCount = dayItems.length;
    const isAllDone = totalCount > 0 && completedCount === totalCount;

    return (
      <div
        key={dateStr}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDropOnDay(dateStr)}
        className={`bg-[#F8F6F1] border rounded-2xl p-2.5 flex flex-col min-h-[380px] max-h-[520px] transition-all ${
          isToday
            ? 'border-[#2E6930]/40 ring-1 ring-[#2E6930]/20 bg-[#F4F8F4]'
            : 'border-[#EBE6DC] hover:border-[#D8D2C5]'
        } ${(draggedTodoId || draggedMasterTask) ? 'border-dashed border-[#2E6930]/50 bg-[#EEF5EE]/60' : ''}`}
      >
        {/* Day Column Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECE7DF] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#2C2825]">{dayName}</span>
            <span className="text-[10px] text-[#8C827A] font-mono">
              {dayDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </span>
            {isToday && (
              <span className="text-[8px] bg-[#EEF5EE] text-[#2E6930] font-bold px-1 py-0.2 rounded-full uppercase tracking-wider">
                Hôm nay
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isAllDone
                  ? 'bg-[#D8ECD8] text-[#245D26] font-bold'
                  : totalCount > 0
                    ? 'bg-[#EDE8DF] text-[#6B645C]'
                    : 'bg-[#EDE8DF]/70 text-[#9C948A]'
              }`}
            >
              {completedCount}/{totalCount}
            </span>

            <button
              onClick={() => {
                setActiveAddColumnDate(activeAddColumnDate === dateStr ? null : dateStr);
                setColumnNewTitle('');
                setColumnProject(projects[0] || '');
              }}
              className="p-0.5 rounded text-[#8C827A] hover:text-[#2C2825] hover:bg-white transition-colors cursor-pointer"
              title="Thêm nhiệm vụ cho ngày này"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Add Form in Column */}
        {activeAddColumnDate === dateStr && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 bg-white border border-[#E7E1D7] rounded-xl space-y-1.5 mb-2 shrink-0 shadow-xs"
          >
            <input
              type="text"
              required
              autoFocus
              placeholder="Tên công việc..."
              value={columnNewTitle}
              onChange={(e) => setColumnNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddInColumn(dateStr);
              }}
              className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
            />
            <div className="flex justify-between items-center gap-1">
              <select
                value={columnProject}
                onChange={(e) => setColumnProject(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-1.5 py-0.5 text-[10px] text-[#6B645C] focus:outline-none cursor-pointer max-w-[100px] truncate"
              >
                {projects.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveAddColumnDate(null)}
                  className="text-[10px] text-[#8C827A] hover:text-[#2C2825] px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleAddInColumn(dateStr)}
                  className="text-[10px] bg-[#2E6930] hover:bg-[#255527] text-white font-medium px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                >
                  Thêm
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Task Capsule List (Beaverplans Authentic Style) */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0 py-0.5 scrollbar-thin">
          {dayItems.length > 0 ? (
            dayItems.map(item => {
              const displayProject = item.project || item.googleTaskListName || 'CHUNG';

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className={`group/todo bg-white rounded-xl p-2.5 border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#D5CDC2] hover:shadow-xs transition-all flex items-start gap-2.5 cursor-grab active:cursor-grabbing ${
                    item.isCompleted
                      ? 'border-[#ECE7DF] bg-white/80'
                      : 'border-[#ECE7DF]'
                  }`}
                >
                  {/* Round Checkbox (Green filled when done, delicate hollow when undone) */}
                  <button
                    onClick={() => handleToggleTodoWithGoogleSync(item)}
                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      item.isCompleted
                        ? 'bg-[#2E6930] text-white shadow-2xs'
                        : 'border border-[#B5ACA1] hover:border-[#2E6930] bg-white'
                    }`}
                    title={item.isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                  >
                    {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top Tag: Project name in tiny uppercase + dot-menu */}
                    <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-[#8A8177] mb-0.5">
                      <span className="truncate max-w-[110px]" title={displayProject}>
                        {displayProject}
                      </span>
                      <div className="opacity-0 group-hover/todo:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(item);
                          }}
                          className="text-[#8C827A] hover:text-[#2C2825] p-0.5 rounded cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTodo(item);
                          }}
                          className="text-[#8C827A] hover:text-rose-600 p-0.5 rounded cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom: Task Title (clean, legible, not violently crossed out) */}
                    <p
                      className={`text-[12px] font-medium leading-tight break-words ${
                        item.isCompleted
                          ? 'text-[#8A8177]'
                          : 'text-[#2C2825]'
                      }`}
                    >
                      {item.title}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-[11px] text-[#A8A196]/80 py-8">
              <span>Chưa có việc</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Backlog Column (Unscheduled Tasks)
  const renderBacklogColumn = () => {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDropOnDay('')}
        className={`bg-[#F8F6F1] border rounded-2xl p-2.5 flex flex-col min-h-[380px] max-h-[520px] transition-all border-[#EBE6DC] hover:border-[#D8D2C5] ${
          (draggedTodoId || draggedMasterTask) ? 'border-dashed border-[#2E6930]/50 bg-[#EEF5EE]/60' : ''
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECE7DF] shrink-0">
          <div className="flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-[#7A7268]" />
            <span className="text-xs font-bold text-[#2C2825]">Chưa xếp ngày</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDE8DF] text-[#6B645C]">
              {backlogItems.length}
            </span>

            <button
              onClick={() => {
                setActiveAddColumnDate(activeAddColumnDate === 'backlog' ? null : 'backlog');
                setColumnNewTitle('');
                setColumnProject(projects[0] || '');
              }}
              className="p-0.5 rounded text-[#8C827A] hover:text-[#2C2825] hover:bg-white transition-colors cursor-pointer"
              title="Thêm việc chưa xếp ngày"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeAddColumnDate === 'backlog' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 bg-white border border-[#E7E1D7] rounded-xl space-y-1.5 mb-2 shrink-0 shadow-xs"
          >
            <input
              type="text"
              required
              autoFocus
              placeholder="Tên công việc..."
              value={columnNewTitle}
              onChange={(e) => setColumnNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddInColumn('');
              }}
              className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
            />
            <div className="flex justify-between items-center gap-1">
              <select
                value={columnProject}
                onChange={(e) => setColumnProject(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-1.5 py-0.5 text-[10px] text-[#6B645C] focus:outline-none cursor-pointer max-w-[100px] truncate"
              >
                {projects.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveAddColumnDate(null)}
                  className="text-[10px] text-[#8C827A] hover:text-[#2C2825] px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleAddInColumn('')}
                  className="text-[10px] bg-[#2E6930] hover:bg-[#255527] text-white font-medium px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                >
                  Thêm
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0 py-0.5 scrollbar-thin">
          {backlogItems.length > 0 ? (
            backlogItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                className="group/todo bg-white rounded-xl p-2.5 border border-[#ECE7DF] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#D5CDC2] hover:shadow-xs transition-all flex items-start gap-2.5 cursor-grab active:cursor-grabbing"
              >
                <button
                  onClick={() => handleToggleTodoWithGoogleSync(item)}
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    item.isCompleted
                      ? 'bg-[#2E6930] text-white shadow-2xs'
                      : 'border border-[#B5ACA1] hover:border-[#2E6930] bg-white'
                  }`}
                >
                  {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-[#8A8177] mb-0.5">
                    <span className="truncate max-w-[110px]">
                      {item.project || 'CHUNG'}
                    </span>
                    <div className="opacity-0 group-hover/todo:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                      <button onClick={() => startEditing(item)} className="text-[#8C827A] hover:text-[#2C2825]">
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={() => setDeletingTodo(item)} className="text-[#8C827A] hover:text-rose-600">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-[12px] font-medium leading-tight break-words ${item.isCompleted ? 'text-[#8A8177]' : 'text-[#2C2825]'}`}>
                    {item.title}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-[11px] text-[#A8A196]/80 py-8">
              <span>Kéo thả việc vào đây để lưu trữ</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" id="todo-section-container">
      {/* Top Banner & Progress Bar (Authentic Beaverplans Style) */}
      <div className="bg-white border border-[#E7E1D7] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        {/* Full-width Sleek Green Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-[#EAE5DC] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2E6930] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${weekPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#2C2825] shrink-0">
            {weekCompletedCount}/{weekTotalCount} • {weekPercent}%
          </span>
        </div>

        {/* Motivational / Days left subtitle */}
        <div className="flex items-center justify-between text-xs text-[#7A7268]">
          <span>
            {weekOffset === 0
              ? daysRemainingInWeek > 0
                ? `Còn ${daysRemainingInWeek} ngày trong tuần, tiếp tục cố gắng nhé`
                : 'Hôm nay là ngày cuối tuần, hãy tổng kết tuần nhé'
              : weekOffset > 0
                ? `Kế hoạch cho tương lai (${weekOffset} tuần tới)`
                : `Lịch sử công việc (${Math.abs(weekOffset)} tuần trước)`}
          </span>
        </div>

        {/* Clean Week Navigator & Control Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#F2EFE9]">
          {/* Left: Date Navigator */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-1 text-xs font-mono font-semibold text-[#2C2825]">
              <Calendar className="w-3.5 h-3.5 text-[#2E6930]" />
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-0.5 hover:text-[#2E6930] transition-colors cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5">{weekStartStr} – {weekEndStr}</span>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-0.5 hover:text-[#2E6930] transition-colors cursor-pointer"
                title="Tuần sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E7E1D7] text-[#7A7268]">
              {weekOffset === 0 ? 'Tuần này' : weekOffset > 0 ? `+${weekOffset} tuần` : `${weekOffset} tuần`}
            </span>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 text-xs font-medium text-[#2E6930] hover:bg-[#EEF5EE] rounded-lg transition-colors cursor-pointer"
              >
                Hôm nay
              </button>
            )}

            <input
              type="date"
              onChange={(e) => handleJumpToDate(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E7E1D7] text-[#2C2825] text-xs rounded-xl px-2 py-1 focus:outline-none focus:border-[#2E6930] cursor-pointer"
              title="Nhảy nhanh đến tuần của ngày đã chọn"
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Chuyển việc button */}
            {overdueTodos.length > 0 && (
              <button
                onClick={() => {
                  setSelectedRollOverIds(overdueTodos.map(t => t.id));
                  setShowRollOverModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FFF6F0] hover:bg-[#FCEEE3] text-[#B85D38] border border-[#F4DACB] rounded-xl text-xs font-medium transition-colors cursor-pointer"
                title="Dời các việc quá hạn sang hôm nay"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Chuyển việc ({overdueTodos.length})</span>
              </button>
            )}

            {/* Xóa hàng loạt button */}
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-rose-50 text-[#7A7268] hover:text-rose-600 border border-[#E7E1D7] hover:border-rose-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title="Xóa công việc hàng loạt theo tuần, tháng hoặc trạng thái"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Xóa hàng loạt</span>
            </button>

            {/* Dán từ Excel button */}
            <button
              onClick={() => {
                setExcelDefaultProject(projects[0] || 'Chung');
                setExcelPastedText('');
                setExcelParsedRows([]);
                setShowExcelImportModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EEF5EE] text-[#5C554B] hover:text-[#2E6930] border border-[#E7E1D7] hover:border-[#2E6930]/40 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title="Dán 2 cột từ Excel: Ngày thực hiện & Tên công việc"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E6930]" />
              <span className="hidden sm:inline">Dán từ Excel</span>
            </button>

            {/* Google Tasks Sync */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E7E1D7] px-2.5 py-1 rounded-xl text-xs text-[#2C2825]">
                <span className="w-2 h-2 rounded-full bg-[#2E6930]" />
                <span className="truncate max-w-[100px] font-medium">{userProfile?.displayName || 'Google'}</span>
                <button
                  onClick={handleLogout}
                  className="text-[#8C827A] hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                  title="Ngắt kết nối"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#2C2825] border border-[#E7E1D7] rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3 text-[#2E6930]" />
                <span>Google</span>
              </button>
            )}

            <button
              onClick={() => handleSync()}
              disabled={isSyncing}
              className="p-1.5 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#2C2825] border border-[#E7E1D7] rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Đồng bộ nhiệm vụ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#2E6930]' : 'text-[#7A7268]'}`} />
            </button>

            <button
              onClick={() => {
                setTodoProject(projects[0] || '');
                setShowQuickAddModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#2E6930] hover:bg-[#255527] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm việc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status or Clipboard Notice Banner */}
      <AnimatePresence>
        {(syncMessage || clipboardNotice) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#F0F7F0] border border-[#CFE4CF] text-[#2E6930] p-2.5 rounded-xl text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage || clipboardNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN BEAVERPLANS SPLIT LAYOUT: LEFT DỰ ÁN, RIGHT TUẦN NÀY */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* LEFT COLUMN: DỰ ÁN (~30%) */}
        <div className="w-full lg:w-[310px] xl:w-[330px] shrink-0 space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#797268]">
              Dự án
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleCopyPlan}
                className="text-[#797268] hover:text-[#2E6930] transition-colors cursor-pointer underline decoration-dotted"
                title="Chép toàn bộ công việc tuần này làm mẫu"
              >
                Chép kế hoạch
              </button>
              <span className="text-[#C5BEB4]">·</span>
              <button
                onClick={handlePastePlan}
                className="text-[#797268] hover:text-[#2E6930] transition-colors cursor-pointer underline decoration-dotted"
                title="Dán kế hoạch đã chép vào tuần này"
              >
                Dán kế hoạch
              </button>
            </div>
          </div>

          {/* Project Cards List */}
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="bg-white border border-[#E7E1D7] rounded-2xl p-5 text-center space-y-2.5 shadow-xs">
                <div className="mx-auto w-9 h-9 rounded-full bg-[#FAF8F5] text-[#7A7268] border border-[#E7E1D7] flex items-center justify-center">
                  <FolderPlus className="w-4 h-4 text-[#2E6930]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#2C2825]">Chưa có dự án nào</p>
                  <p className="text-[11px] text-[#7A7268] mt-0.5">Tạo dự án để gom nhóm công việc (ví dụ: Đại số, IELTS, Web...)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingProject(true)}
                  className="px-3 py-1.5 bg-[#2E6930] hover:bg-[#255527] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dự án đầu tiên</span>
                </button>
              </div>
            ) : (
              projects.map((project) => {
                // Master tasks registered for this project
                const projectMasterTasks = masterTasks.filter(
                  m => m.project.toLowerCase() === project.toLowerCase()
                );

                // All tasks in current week belonging to this project
                const projectWeekTodos = weekTodos.filter(
                  t => (t.project || t.googleTaskListName || '').toLowerCase() === project.toLowerCase()
                );
                const projectCompletedCount = projectWeekTodos.filter(t => t.isCompleted).length;
                const projectTotalCount = projectWeekTodos.length;
                const projectProgressPercent = projectTotalCount > 0
                  ? Math.round((projectCompletedCount / projectTotalCount) * 100)
                  : 0;

                return (
                  <div
                    key={project}
                    className="bg-white border border-[#E7E1D7] rounded-2xl p-4 space-y-3 shadow-xs hover:border-[#D5CDC2] transition-all"
                  >
                    {/* Project Header */}
                    <div className="flex items-center justify-between group/header gap-2">
                      {editingProjectName === project ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            type="text"
                            autoFocus
                            value={editProjectInput}
                            onChange={(e) => setEditProjectInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameProject(project, editProjectInput);
                              if (e.key === 'Escape') setEditingProjectName(null);
                            }}
                            className="w-full bg-[#FAF8F5] border border-[#2E6930] rounded-lg px-2 py-0.5 text-xs text-[#2C2825] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameProject(project, editProjectInput)}
                            className="p-1 rounded bg-[#2E6930] text-white hover:bg-[#255527] cursor-pointer shrink-0"
                            title="Lưu"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProjectName(null)}
                            className="p-1 rounded bg-stone-100 text-[#7A7268] hover:text-[#2C2825] cursor-pointer shrink-0"
                            title="Hủy"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold text-[#2C2825] lowercase truncate">
                            {project}
                          </span>

                          {/* Hover edit & delete buttons for project */}
                          <div className="opacity-0 group-hover/header:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProjectName(project);
                                setEditProjectInput(project);
                              }}
                              className="text-[#8C827A] hover:text-[#2C2825] p-0.5 rounded hover:bg-[#F2EFE9] cursor-pointer transition-colors"
                              title="Sửa tên dự án"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProjectName(project)}
                              className="text-[#8C827A] hover:text-rose-600 p-0.5 rounded hover:bg-[#F2EFE9] cursor-pointer transition-colors"
                              title="Xóa dự án"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mini Green Progress Bar */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-12 h-1.5 bg-[#EAE5DC] rounded-full overflow-hidden">
                          <div
                            className="bg-[#2E6930] h-full rounded-full transition-all duration-300"
                            style={{ width: `${projectProgressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tasks List inside Project */}
                    <div className="space-y-1.5">
                      {projectMasterTasks.length > 0 ? (
                        projectMasterTasks.map((mt, idx) => {
                          // Find all instances of this task in current week
                          const instances = projectWeekTodos.filter(
                            t => t.title.toLowerCase().trim() === mt.title.toLowerCase().trim()
                          );
                          const scheduled = instances.length;
                          const done = instances.filter(t => t.isCompleted).length;
                          const isAllDone = scheduled > 0 && done === scheduled;

                          const isEditingThis = editingMasterTask &&
                            editingMasterTask.project.toLowerCase() === project.toLowerCase() &&
                            editingMasterTask.oldTitle.toLowerCase() === mt.title.toLowerCase();

                          if (isEditingThis) {
                            return (
                              <div key={idx} className="flex items-center gap-1.5 py-1 w-full">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editMasterTaskInput}
                                  onChange={(e) => setEditMasterTaskInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameMasterTask(project, mt.title, editMasterTaskInput);
                                    if (e.key === 'Escape') setEditingMasterTask(null);
                                  }}
                                  className="flex-1 bg-[#FAF8F5] border border-[#2E6930] rounded-lg px-2 py-0.5 text-xs text-[#2C2825] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameMasterTask(project, mt.title, editMasterTaskInput)}
                                  className="p-1 rounded bg-[#2E6930] text-white hover:bg-[#255527] cursor-pointer shrink-0"
                                  title="Lưu"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMasterTask(null)}
                                  className="p-1 rounded bg-stone-100 text-[#7A7268] hover:text-[#2C2825] cursor-pointer shrink-0"
                                  title="Hủy"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              draggable
                              onDragStart={() => setDraggedMasterTask({ project, title: mt.title })}
                              onDragEnd={() => setDraggedMasterTask(null)}
                              className="flex items-center justify-between gap-2 py-1 px-1 -mx-1 rounded-lg group/master hover:bg-[#FAF8F5] transition-colors cursor-grab active:cursor-grabbing"
                              title="Kéo sang cột ngày trên lịch để xếp việc, hoặc bấm tròn để thêm vào hôm nay"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  onClick={async () => {
                                    // Toggle the first incomplete instance or toggle all
                                    if (instances.length > 0) {
                                      const target = instances.find(t => !t.isCompleted) || instances[0];
                                      handleToggleTodoWithGoogleSync(target);
                                    } else {
                                      // If not yet scheduled this week, schedule it for today and push to Google Tasks!
                                      await scheduleTaskWithGoogleSync(mt.title, todayStr, project);
                                    }
                                  }}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                    isAllDone
                                      ? 'bg-[#2E6930] text-white shadow-2xs'
                                      : 'border border-[#B5ACA1] hover:border-[#2E6930] bg-white'
                                  }`}
                                  title={instances.length === 0 ? 'Thêm việc này vào hôm nay' : 'Đánh dấu hoàn thành'}
                                >
                                  {isAllDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </button>

                                <span
                                  className={`text-xs text-[#2C2825] truncate ${
                                    isAllDone ? 'text-[#8A8177]' : ''
                                  }`}
                                  title={mt.title}
                                >
                                  {mt.title}
                                </span>

                                {/* Hover edit & delete buttons for master task */}
                                <div className="opacity-0 group-hover/master:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingMasterTask({ project, oldTitle: mt.title });
                                      setEditMasterTaskInput(mt.title);
                                    }}
                                    className="text-[#8C827A] hover:text-[#2C2825] p-0.5 rounded hover:bg-[#F2EFE9] cursor-pointer transition-colors"
                                    title="Sửa đầu việc mẫu"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingMasterTask({ project, title: mt.title });
                                    }}
                                    className="text-[#8C827A] hover:text-rose-600 p-0.5 rounded hover:bg-[#F2EFE9] cursor-pointer transition-colors"
                                    title="Xóa đầu việc mẫu"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Ratio Pill (e.g. 4/4, 3/9) */}
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                                  isAllDone
                                    ? 'bg-[#D8ECD8] text-[#245D26] font-bold'
                                    : scheduled > 0
                                      ? 'bg-[#EDE8DF] text-[#6B645C]'
                                      : 'bg-[#EDE8DF]/60 text-[#9C948A]'
                                }`}
                              >
                                {done}/{scheduled}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[11px] text-[#A8A196] italic py-1">
                          Chưa có đầu việc mẫu
                        </div>
                      )}
                    </div>

                    {/* Inline Add Task to Project */}
                    {addingTaskForProject === project ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2 border-t border-[#F2EFE9] space-y-2"
                      >
                        <input
                          type="text"
                          autoFocus
                          placeholder="Tên công việc mới..."
                          value={newProjectTaskTitle}
                          onChange={(e) => setNewProjectTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddProjectTask(project);
                          }}
                          className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2.5 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                        />

                        {/* Optional Day scheduling: T2..CN */}
                        <div className="space-y-1 pt-1 border-t border-[#F0EBE1]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#8A8177]">Lên lịch tuần (tùy chọn):</span>
                            <span className="text-[9px] text-[#A8A196]">
                              {selectedDaysForNewTask.length === 0 ? 'Chỉ lưu trong dự án' : `Đã chọn ${selectedDaysForNewTask.length} ngày`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[0, 1, 2, 3, 4, 5, 6].map(dIdx => {
                              const isSelected = selectedDaysForNewTask.includes(dIdx);
                              return (
                                <button
                                  key={dIdx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDaysForNewTask(prev =>
                                      prev.includes(dIdx) ? prev.filter(x => x !== dIdx) : [...prev, dIdx]
                                    );
                                  }}
                                  className={`w-5 h-5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#2E6930] text-white shadow-2xs'
                                      : 'bg-[#FAF8F5] text-[#7A7268] border border-[#E7E1D7] hover:border-[#2E6930]'
                                  }`}
                                  title={`Lên lịch vào ${getDayShortName(dIdx)}`}
                                >
                                  {getDayShortName(dIdx)}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingTaskForProject(null);
                              setNewProjectTaskTitle('');
                              setSelectedDaysForNewTask([]);
                            }}
                            className="text-[11px] text-[#7A7268] hover:text-[#2C2825] px-2 py-0.5 rounded cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddProjectTask(project)}
                            className="text-[11px] bg-[#2E6930] hover:bg-[#255527] text-white font-medium px-2.5 py-0.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                          >
                            Lưu
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingTaskForProject(project);
                          setNewProjectTaskTitle('');
                          setSelectedDaysForNewTask([]); // Empty by default!
                        }}
                        className="text-xs text-[#797268] hover:text-[#2E6930] transition-colors cursor-pointer flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>thêm công việc</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Add New Project Card / Button */}
            {isAddingProject ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-[#2E6930]/40 rounded-2xl p-3 space-y-2 shadow-xs"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Tên dự án mới (ví dụ: giải tích, ielts...)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewProject();
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2.5 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProject(false);
                      setNewProjectName('');
                    }}
                    className="text-[11px] text-[#7A7268] hover:text-[#2C2825] px-2 py-0.5 rounded cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewProject}
                    className="text-[11px] bg-[#2E6930] hover:bg-[#255527] text-white font-medium px-2.5 py-0.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    Tạo dự án
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setIsAddingProject(true)}
                className="w-full py-2.5 border border-dashed border-[#D5CDC2] rounded-2xl text-xs text-[#797268] hover:border-[#2E6930] hover:text-[#2E6930] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Thêm dự án mới</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: TUẦN NÀY (~70%) */}
        <div className="flex-1 w-full space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#797268]">
              Tuần này
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#797268]">
              <button
                onClick={() => setWeekOffset(0)}
                className="hover:text-[#2E6930] transition-colors cursor-pointer underline decoration-dotted"
              >
                Xem hôm nay
              </button>
              <span className="text-[#C5BEB4]">·</span>
              <span className="hidden sm:inline text-[#8C827A]">kéo thả giữa các ngày để đổi lịch</span>
            </div>
          </div>

          {/* 2-Row Grid: Row 1 (T2..T5), Row 2 (T6..CN + Chưa xếp ngày) */}
          <div className="space-y-3">
            {/* Row 1: T2, T3, T4, T5 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {weekDays.slice(0, 4).map((dayDate, idx) => renderDayColumn(dayDate, idx))}
            </div>

            {/* Row 2: T6, T7, CN + Chưa xếp ngày */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {weekDays.slice(4, 7).map((dayDate, idx) => renderDayColumn(dayDate, idx + 4))}
              {renderBacklogColumn()}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD TASK MODAL */}
      <AnimatePresence>
        {showQuickAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
                <h3 className="text-sm font-bold text-[#2C2825]">Thêm nhiệm vụ mới</h3>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="text-[#8C827A] hover:text-[#2C2825] p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitTopModal} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                    Tên nhiệm vụ
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ví dụ: color polish, read chap 3..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                      Dự án
                    </label>
                    <select
                      value={todoProject}
                      onChange={(e) => setTodoProject(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-2 text-xs text-[#2C2825] focus:outline-none cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                      Ngày thực hiện
                    </label>
                    <input
                      type="date"
                      value={todoDate}
                      onChange={(e) => setTodoDate(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-2 text-xs text-[#2C2825] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#EFECE6]">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(false)}
                    className="flex-1 py-2 text-xs font-medium text-[#7A7268] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#2E6930] hover:bg-[#255527] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Tạo nhiệm vụ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT TASK MODAL */}
        {editingTodo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
                <h3 className="text-sm font-bold text-[#2C2825]">Chỉnh sửa nhiệm vụ</h3>
                <button
                  onClick={() => setEditingTodo(null)}
                  className="text-[#8C827A] hover:text-[#2C2825] p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                    Nội dung nhiệm vụ
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                    }}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                      Dự án
                    </label>
                    <select
                      value={editProject}
                      onChange={(e) => setEditProject(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-2 text-xs text-[#2C2825] focus:outline-none cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#7A7268] block mb-1">
                      Ngày thực hiện
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-2 text-xs text-[#2C2825] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#EFECE6]">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="flex-1 py-2 text-xs font-medium text-[#7A7268] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-2 bg-[#2E6930] hover:bg-[#255527] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deletingTodo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#2C2825]">Xác nhận xóa nhiệm vụ</h3>
                <p className="text-xs text-[#7A7268] leading-relaxed">
                  Bạn có chắc muốn xóa nhiệm vụ <strong className="text-[#2C2825]">"{deletingTodo.title}"</strong> không?
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingTodo(null)}
                  className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteTodo}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* LOGOUT GOOGLE CONFIRM MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-[#FAF8F5] text-[#2C2825] border border-[#E7E1D7] flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#2C2825]">Ngắt kết nối Google Tasks</h3>
                <p className="text-xs text-[#7A7268] leading-relaxed">
                  Bạn có chắc muốn ngắt kết nối với Google Tasks không?
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-2 bg-[#B85D38] hover:bg-[#A34F2C] text-white rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Ngắt kết nối
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ROLL OVER SELECTION MODAL */}
        {showRollOverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-[#E7E1D7]">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#2C2825] flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[#B85D38]" />
                    <span>Dời nhiệm vụ sang hôm nay</span>
                  </h3>
                  <p className="text-xs text-[#7A7268]">
                    Chọn các nhiệm vụ chưa hoàn thành bạn muốn dời sang hôm nay ({todayStr})
                  </p>
                </div>
                <button
                  onClick={() => setShowRollOverModal(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRollOverIds.length === overdueTodos.length) {
                      setSelectedRollOverIds([]);
                    } else {
                      setSelectedRollOverIds(overdueTodos.map(t => t.id));
                    }
                  }}
                  className="text-xs font-medium text-[#2E6930] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRollOverIds.length === overdueTodos.length && overdueTodos.length > 0}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded accent-[#2E6930] cursor-pointer"
                  />
                  <span>
                    {selectedRollOverIds.length === overdueTodos.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </span>
                </button>

                <span className="text-[11px] text-[#7A7268]">
                  Đã chọn <strong>{selectedRollOverIds.length}</strong> / {overdueTodos.length} nhiệm vụ
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[45vh]">
                {overdueTodos.map((todo) => {
                  const isSelected = selectedRollOverIds.includes(todo.id);
                  return (
                    <label
                      key={todo.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#FAF8F5] border-[#2E6930]/40 text-[#2C2825]'
                          : 'bg-white border-[#E7E1D7] text-[#7A7268] hover:bg-[#FAF8F5]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedRollOverIds(prev => prev.filter(id => id !== todo.id));
                          } else {
                            setSelectedRollOverIds(prev => [...prev, todo.id]);
                          }
                        }}
                        className="mt-0.5 w-4 h-4 rounded accent-[#2E6930] cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className={`text-xs font-medium leading-snug break-words ${isSelected ? 'text-[#2C2825]' : 'text-[#5C554B]'}`}>
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-[#B85D38] font-mono bg-[#FFF3EC] px-1.5 py-0.5 rounded border border-[#F4DACB]">
                            Hạn cũ: {todo.dueDate}
                          </span>
                          {todo.project && (
                            <span className="text-[#7A7268] bg-[#F5F2EC] px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                              {todo.project}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E1D7]">
                <button
                  type="button"
                  onClick={() => setShowRollOverModal(false)}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={selectedRollOverIds.length === 0}
                  onClick={async () => {
                    if (selectedRollOverIds.length === 0) return;
                    const selectedSet = new Set(selectedRollOverIds);
                    const updated = todoItems.map(t => {
                      if (selectedSet.has(t.id)) {
                        if (t.googleTaskId && isLoggedIn) {
                          const token = getAccessToken();
                          if (token) {
                            patchTaskOnGoogle(token, t.googleTaskId, { dueDate: todayStr });
                          }
                        }
                        return { ...t, dueDate: todayStr };
                      }
                      return t;
                    });
                    onSyncTodos(updated);
                    setShowRollOverModal(false);
                  }}
                  className="px-4 py-2 bg-[#2E6930] hover:bg-[#255427] text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dời {selectedRollOverIds.length} việc sang hôm nay</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        {deletingProjectName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#2C2825]">Xác nhận xóa dự án</h3>
                <p className="text-xs text-[#7A7268] leading-relaxed">
                  Bạn có chắc muốn xóa dự án <strong className="text-[#2C2825]">"{deletingProjectName}"</strong> và các công việc thuộc dự án này không?
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingProjectName(null)}
                  className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(deletingProjectName)}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Master Task Confirmation Modal */}
        {deletingMasterTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#2C2825]">Xóa đầu việc mẫu</h3>
                <p className="text-xs text-[#7A7268] leading-relaxed">
                  Xóa đầu việc <strong className="text-[#2C2825]">"{deletingMasterTask.title}"</strong> khỏi dự án <strong className="text-[#2C2825]">"{deletingMasterTask.project}"</strong>?
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingMasterTask(null)}
                  className="flex-1 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMasterTask(deletingMasterTask.project, deletingMasterTask.title)}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E1D7] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2C2825]">Xóa công việc hàng loạt</h3>
                    <p className="text-[11px] text-[#7A7268]">Dọn dẹp nhanh các công việc theo tuần, tháng hoặc trạng thái</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="p-1 rounded-lg text-[#8C827A] hover:text-[#2C2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* 1. Scope selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2C2825] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2E6930]" />
                    <span>Chọn phạm vi thời gian</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkDeleteScope('WEEK')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        bulkDeleteScope === 'WEEK'
                          ? 'border-[#2E6930] bg-[#EEF5EE]/60 text-[#2C2825] ring-1 ring-[#2E6930]/30'
                          : 'border-[#E7E1D7] bg-[#FAF8F5] text-[#7A7268] hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold">Theo Tuần</div>
                      <div className="text-[10px] text-[#8C827A] font-mono mt-0.5">
                        {bulkDeleteWeekInfo.startFormatted} – {bulkDeleteWeekInfo.endFormatted}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkDeleteScope('MONTH')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        bulkDeleteScope === 'MONTH'
                          ? 'border-[#2E6930] bg-[#EEF5EE]/60 text-[#2C2825] ring-1 ring-[#2E6930]/30'
                          : 'border-[#E7E1D7] bg-[#FAF8F5] text-[#7A7268] hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold">Theo Tháng</div>
                      <div className="text-[10px] text-[#8C827A] mt-0.5">
                        Tháng {bulkDeleteMonth.split('-')[1]}/{bulkDeleteMonth.split('-')[0]}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkDeleteScope('BACKLOG')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        bulkDeleteScope === 'BACKLOG'
                          ? 'border-[#2E6930] bg-[#EEF5EE]/60 text-[#2C2825] ring-1 ring-[#2E6930]/30'
                          : 'border-[#E7E1D7] bg-[#FAF8F5] text-[#7A7268] hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold">Chưa xếp ngày</div>
                      <div className="text-[10px] text-[#8C827A] mt-0.5">
                        Danh sách Backlog ({backlogItems.length})
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkDeleteScope('ALL')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        bulkDeleteScope === 'ALL'
                          ? 'border-rose-400 bg-rose-50/70 text-rose-800 ring-1 ring-rose-300'
                          : 'border-[#E7E1D7] bg-[#FAF8F5] text-[#7A7268] hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold">Tất cả công việc</div>
                      <div className="text-[10px] text-[#8C827A] mt-0.5">
                        Toàn bộ ({todoItems.length} việc)
                      </div>
                    </button>
                  </div>

                  {/* Dedicated Week Selector Panel when WEEK scope is active */}
                  {bulkDeleteScope === 'WEEK' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl space-y-2 mt-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2825]">
                          <Calendar className="w-3.5 h-3.5 text-[#2E6930]" />
                          <span>Tuần chọn xóa:</span>
                          <span className="font-mono text-[#2E6930] font-semibold bg-[#EEF5EE] px-2 py-0.5 rounded-lg border border-[#D5E7D5]">
                            {bulkDeleteWeekInfo.label}
                          </span>
                        </div>

                        {/* Prev / Next Week */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleShiftBulkDeleteWeek(-1)}
                            className="p-1 rounded-lg bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#5C554B] transition-colors cursor-pointer"
                            title="Tuần trước"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShiftBulkDeleteWeek(1)}
                            className="p-1 rounded-lg bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#5C554B] transition-colors cursor-pointer"
                            title="Tuần sau"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 pt-1.5 border-t border-[#EDE8E0]">
                        <span className="text-[11px] text-[#7A7268]">Chọn nhanh:</span>
                        <button
                          type="button"
                          onClick={() => setBulkDeleteWeekDate(todayStr)}
                          className="px-2 py-0.5 rounded-lg text-[10.5px] bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#2C2825] transition-colors cursor-pointer font-medium"
                        >
                          Tuần này
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (weekDays[0]) {
                              setBulkDeleteWeekDate(getLocalDateString(weekDays[0]));
                            }
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10.5px] bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#2C2825] transition-colors cursor-pointer font-medium"
                        >
                          Tuần đang xem
                        </button>

                        <div className="flex-1" />

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#7A7268]">Nhảy đến ngày:</span>
                          <input
                            type="date"
                            value={bulkDeleteWeekDate}
                            onChange={(e) => setBulkDeleteWeekDate(e.target.value)}
                            className="bg-white border border-[#E7E1D7] text-[#2C2825] text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#2E6930] cursor-pointer"
                            title="Chọn một ngày bất kỳ để chọn tuần của ngày đó"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Dedicated Month Selector Panel when MONTH scope is active */}
                  {bulkDeleteScope === 'MONTH' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl space-y-2 mt-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2825]">
                          <Calendar className="w-3.5 h-3.5 text-[#2E6930]" />
                          <span>Tháng chọn xóa:</span>
                          <span className="font-mono text-[#2E6930] font-semibold bg-[#EEF5EE] px-2 py-0.5 rounded-lg border border-[#D5E7D5]">
                            Tháng {bulkDeleteMonth.split('-')[1]}/{bulkDeleteMonth.split('-')[0]}
                          </span>
                        </div>

                        {/* Prev / Next Month */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleShiftBulkDeleteMonth(-1)}
                            className="p-1 rounded-lg bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#5C554B] transition-colors cursor-pointer"
                            title="Tháng trước"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShiftBulkDeleteMonth(1)}
                            className="p-1 rounded-lg bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#5C554B] transition-colors cursor-pointer"
                            title="Tháng sau"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 pt-1.5 border-t border-[#EDE8E0]">
                        <span className="text-[11px] text-[#7A7268]">Chọn nhanh:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            setBulkDeleteMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                          }}
                          className="px-2 py-0.5 rounded-lg text-[10.5px] bg-white border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#2C2825] transition-colors cursor-pointer font-medium"
                        >
                          Tháng này
                        </button>

                        <div className="flex-1" />

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#7A7268]">Chọn tháng:</span>
                          <input
                            type="month"
                            value={bulkDeleteMonth}
                            onChange={(e) => setBulkDeleteMonth(e.target.value)}
                            className="bg-white border border-[#E7E1D7] text-[#2C2825] text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#2E6930] cursor-pointer"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 2. Filters: Status & Project */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F2EFE9]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#5C554B] flex items-center gap-1">
                      <Filter className="w-3 h-3 text-[#7A7268]" />
                      <span>Trạng thái</span>
                    </label>
                    <select
                      value={bulkDeleteStatus}
                      onChange={(e) => setBulkDeleteStatus(e.target.value as any)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] cursor-pointer"
                    >
                      <option value="ALL">Tất cả việc</option>
                      <option value="COMPLETED">Chỉ việc đã hoàn thành ✓</option>
                      <option value="PENDING">Chỉ việc chưa xong ⏳</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#5C554B] flex items-center gap-1">
                      <FolderPlus className="w-3 h-3 text-[#7A7268]" />
                      <span>Dự án</span>
                    </label>
                    <select
                      value={bulkDeleteProject}
                      onChange={(e) => setBulkDeleteProject(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] cursor-pointer"
                    >
                      <option value="ALL">Tất cả dự án</option>
                      {projects.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Warning for broad scope */}
                {bulkDeleteScope === 'ALL' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Lưu ý: Bạn đang chọn xóa <strong>toàn bộ</strong> công việc. Hành động này không thể hoàn tác!</span>
                  </div>
                )}

                {/* 3. Live Preview & Matching List */}
                <div className="space-y-1.5 pt-2 border-t border-[#F2EFE9]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2C2825]">
                      Xem trước danh sách xóa
                    </span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      matchedBulkDeleteTodos.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-[#EAE5DC] text-[#7A7268]'
                    }`}>
                      {matchedBulkDeleteTodos.length} nhiệm vụ
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto bg-[#FAF8F5] rounded-xl p-2 border border-[#ECE7DF] space-y-1.5 scrollbar-thin">
                    {matchedBulkDeleteTodos.length > 0 ? (
                      matchedBulkDeleteTodos.map(todo => (
                        <div
                          key={todo.id}
                          className="bg-white p-2 rounded-lg border border-[#EBE6DC] text-xs flex items-start justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${todo.isCompleted ? 'line-through text-[#8C827A]' : 'text-[#2C2825]'}`}>
                              {todo.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[9.5px] text-[#8C827A] mt-0.5">
                              {todo.dueDate ? (
                                <span className="font-mono bg-[#F2EFE9] px-1 py-0.2 rounded text-[#5C554B]">
                                  {todo.dueDate}
                                </span>
                              ) : (
                                <span className="bg-[#F2EFE9] px-1 py-0.2 rounded text-[#5C554B]">
                                  Chưa xếp ngày
                                </span>
                              )}
                              {todo.project && (
                                <span className="uppercase font-semibold text-[#7A7268]">
                                  • {todo.project}
                                </span>
                              )}
                            </div>
                          </div>
                          {todo.isCompleted && (
                            <span className="text-[9px] bg-[#EEF5EE] text-[#2E6930] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                              Đã xong
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-[#8C827A]">
                        Không tìm thấy công việc nào khớp với bộ lọc trên
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E1D7] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={matchedBulkDeleteTodos.length === 0 || isBulkDeleting}
                  onClick={handleExecuteBulkDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isBulkDeleting ? 'Đang xóa...' : `Xác nhận xóa (${matchedBulkDeleteTodos.length} việc)`}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Excel 2-Column Bulk Import Modal */}
        {showExcelImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E7E1D7] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E1D7] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF5EE] text-[#2E6930] flex items-center justify-center border border-[#D5E7D5]">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2C2825]">Dán công việc từ Excel / Bảng tính</h3>
                    <p className="text-[11px] text-[#7A7268]">
                      Bôi đen 2 cột (Ngày thực hiện & Tên việc) trong Excel rồi dán (Ctrl+V) vào đây
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExcelImportModal(false)}
                  className="p-1 rounded-lg text-[#8C827A] hover:text-[#2C2825] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {excelParsedRows.length === 0 ? (
                  /* Step 1: Paste Input */
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2C2825] flex items-center justify-between">
                        <span>Dán dữ liệu 2 cột từ Excel / Google Sheets:</span>
                        <span className="text-[10px] text-[#8C827A] font-normal">
                          (Dán theo thứ tự nào máy cũng tự nhận diện đúng)
                        </span>
                      </label>
                      <textarea
                        autoFocus
                        rows={7}
                        value={excelPastedText}
                        onChange={(e) => handlePastedTextChange(e.target.value)}
                        placeholder={`Dán 2 cột từ Excel vào đây (Ctrl+V)...\n\nVí dụ:\n18/10/2026\tLàm bài tập Giải tích chương 3\n19/10/2026\tNộp báo cáo thí nghiệm Vật lý\n20/10\tLuyện đề IELTS Cam 18 Reading\n\tLàm slide Triết học (để trống ngày = Chưa xếp ngày)`}
                        className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl p-3 text-xs text-[#2C2825] font-mono placeholder:text-[#A8A196] focus:outline-none focus:border-[#2E6930] focus:ring-1 focus:ring-[#2E6930]/30 resize-none"
                      />
                    </div>

                    <div className="p-3 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl space-y-1.5 text-xs text-[#5C554B]">
                      <div className="font-bold text-[#2C2825] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6930]" />
                        <span>Hệ thống tự động xử lý thông minh:</span>
                      </div>
                      <ul className="text-[11px] text-[#7A7268] space-y-1 pl-5 list-disc">
                        <li>
                          <strong>Tự nhận diện thứ tự cột</strong>: [Ngày - Tên việc] hoặc [Tên việc - Ngày] đều được.
                        </li>
                        <li>
                          <strong>Chuẩn hóa mọi kiểu ngày</strong>: <code className="text-[#2E6930] bg-[#EEF5EE] px-1 rounded">18/10/2026</code>, <code className="text-[#2E6930] bg-[#EEF5EE] px-1 rounded">18/10</code>, <code className="text-[#2E6930] bg-[#EEF5EE] px-1 rounded">2026-10-18</code>...
                        </li>
                        <li>
                          <strong>Ô ngày để trống</strong> sẽ tự động chuyển vào danh sách <em>Chưa xếp ngày (Backlog)</em>.
                        </li>
                        <li>
                          <strong>Tự động bỏ qua</strong> hàng tiêu đề nếu có (như <em>Ngày, Nhiệm vụ...</em>).
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  /* Step 2: Excel Preview Table */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2C2825]">
                          Xem trước bảng dữ liệu đã nhận diện
                        </span>
                        <span className="font-mono text-xs font-bold bg-[#EEF5EE] text-[#2E6930] px-2 py-0.5 rounded-full border border-[#D5E7D5]">
                          {excelParsedRows.length} nhiệm vụ
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setExcelPastedText('');
                          setExcelParsedRows([]);
                        }}
                        className="text-xs text-[#7A7268] hover:text-[#2E6930] underline decoration-dotted cursor-pointer transition-colors"
                      >
                        Dán lại
                      </button>
                    </div>

                    {/* Table */}
                    <div className="border border-[#E7E1D7] rounded-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#FAF8F5] border-b border-[#E7E1D7] sticky top-0 z-10 text-[11px] font-bold text-[#5C554B]">
                          <tr>
                            <th className="py-2 px-3 w-10 text-center">#</th>
                            <th className="py-2 px-3 w-36">Ngày thực hiện</th>
                            <th className="py-2 px-3">Tên công việc</th>
                            <th className="py-2 px-2 w-10 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2EFE9] bg-white">
                          {excelParsedRows.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                              <td className="py-2 px-3 text-center text-[#8C827A] font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="date"
                                    value={row.normalizedDate || ''}
                                    onChange={(e) => handleUpdateExcelRowDate(row.id, e.target.value)}
                                    className="bg-[#FAF8F5] border border-[#E7E1D7] text-[#2C2825] text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#2E6930] cursor-pointer"
                                  />
                                  {!row.normalizedDate && (
                                    <span className="text-[9.5px] bg-[#EDE8DF] text-[#7A7268] px-1.5 py-0.5 rounded shrink-0">
                                      Chưa xếp
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={row.title}
                                  onChange={(e) => handleUpdateExcelRowTitle(row.id, e.target.value)}
                                  className="w-full bg-[#FAF8F5] border border-[#E7E1D7] text-[#2C2825] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#2E6930]"
                                  placeholder="Tên công việc..."
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExcelRow(row.id)}
                                  className="p-1 text-[#8C827A] hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Optional Project Assignment */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#7A7268]">Gán vào dự án:</span>
                        <select
                          value={excelDefaultProject}
                          onChange={(e) => setExcelDefaultProject(e.target.value)}
                          className="bg-[#FAF8F5] border border-[#E7E1D7] text-[#2C2825] text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-[#2E6930] cursor-pointer font-medium"
                        >
                          <option value="Chung">Chung (Không dự án)</option>
                          {projects.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E1D7] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowExcelImportModal(false)}
                  disabled={isImportingExcel}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={excelParsedRows.length === 0 || isImportingExcel}
                  onClick={handleExecuteExcelImport}
                  className="px-4 py-2 bg-[#2E6930] hover:bg-[#255527] text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>
                    {isImportingExcel
                      ? 'Đang thêm...'
                      : `Xác nhận thêm (${excelParsedRows.length} việc)`}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
