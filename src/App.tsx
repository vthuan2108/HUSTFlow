/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import AIPanel from './components/AIPanel';
import GradeSection from './components/GradeSection';
import { fetchGradesFromGoogle, saveGradesToGoogle } from './lib/googleSheets';
import {
  Task,
  Habit,
  StoreItem,
  WeeklyChallenge,
  CultivationState,
  DailyLog,
  IeltsTestLog,
  IeltsTargets,
  TimeBlock,
  Priority,
  TodoItem,
  CultivationManual,
  CultivationNote,
  GardenPlant,
  GradeSubject,
  SemesterGPA,
  CalendarGroup,
  CalendarEvent
} from './types';
import { DEFAULT_CHALLENGES, getRealmInfo, STORE_ITEMS } from './data';
import CultivationHeader from './components/CultivationHeader';
import MeditationTimer from './components/MeditationTimer';
import TaskSection from './components/TaskSection';
import HabitSection from './components/HabitSection';
import TreasureStore from './components/TreasureStore';
import PerformanceStats from './components/PerformanceStats';
import IeltsMockTestLog from './components/IeltsMockTestLog';
import StreakGrid from './components/StreakGrid';
import TodoSection from './components/TodoSection';
import ScheduleSection from './components/ScheduleSection';
import ForbiddenNotes from './components/ForbiddenNotes';
import DailyRituals from './components/DailyRituals';
import DailyRitualsModal from './components/DailyRitualsModal';
import SpiritualGarden from './components/SpiritualGarden';
import FloatingLofiPlayer from './components/FloatingLofiPlayer';
import { AchievementsModal } from './components/AchievementsModal';
import { initAuth, googleSignIn, logout as firebaseLogout, getAccessToken } from './lib/firebase';
import { syncGoogleTasks, deleteTaskOnGoogle, patchTaskOnGoogle } from './lib/googleTasks';
import { saveUserDataToCloud, loadUserDataFromCloud, fetchLeaderboardFromCloud } from './lib/firestoreSync';
import { User } from 'firebase/auth';
import {
  Flame,
  LogOut,
  CheckCircle,
  Compass as CompassIcon,
  ListTodo,
  Sparkles,
  Lock,
  BookOpen,
  Scroll,
  LogIn,
  Cloud,
  GraduationCap,
  Calendar,
  Settings,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';


function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  // --- STATE SYSTEM ---
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('tlk_username') || 'Tiêu Đạo Hữu';
  });

  const [planningCompletedDate, setPlanningCompletedDate] = useState<string>(() => {
    return localStorage.getItem('tlk_planning_completed_date') || '';
  });

  const [reflectionCompletedDate, setReflectionCompletedDate] = useState<string>(() => {
    return localStorage.getItem('tlk_reflection_completed_date') || '';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('tlk_active_tab') || 'MEDITATION';
  });

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('tlk_spreadsheet_id') || '';
  });
  const [gradeSubjects, setGradeSubjects] = useState<GradeSubject[]>(() => {
    const saved = localStorage.getItem('tlk_grade_subjects');
    return saved ? JSON.parse(saved) : [];
  });
  const [semesterGpaList, setSemesterGpaList] = useState<SemesterGPA[]>(() => {
    const saved = localStorage.getItem('tlk_semester_gpa_list');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncingGrades, setIsSyncingGrades] = useState(false);
  const [cpaOverall, setCpaOverall] = useState<number>(() => {
    return Number(localStorage.getItem('tlk_cpa_overall') || '0');
  });
  const [isDirty, setIsDirty] = useState<boolean>(() => {
    return localStorage.getItem('tlk_grade_is_dirty') === 'true';
  });

  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    return localStorage.getItem('tlk_is_focus_mode') === 'true';
  });
  const [focusSelectedTaskId, setFocusSelectedTaskId] = useState<string>('');

  const [soundscape, setSoundscape] = useState<any>(() => {
    return (localStorage.getItem('tlk_soundscape') as any) || 'NONE';
  });

  const [todoItems, setTodoItems] = useState<TodoItem[]>(() => {
    const savedTodos = localStorage.getItem('tlk_todos');
    const savedTasks = localStorage.getItem('tlk_tasks');
    
    let parsedTodos: TodoItem[] = [];
    if (savedTodos) {
      try { 
        const res = JSON.parse(savedTodos);
        if (Array.isArray(res)) {
          parsedTodos = res.map(todo => ({
            ...todo,
            createdAt: todo?.createdAt || new Date().toISOString()
          }));
        }
      } catch (e) {}
    }
    
    let parsedTasks: Task[] = [];
    if (savedTasks) {
      try {
        const res = JSON.parse(savedTasks);
        if (Array.isArray(res)) parsedTasks = res;
      } catch (e) {}
    }
    
    if (parsedTodos.length > 0) {
      // If there are saved tasks that aren't represented in todos by title, merge them in!
      const todoTitles = new Set(parsedTodos.map(t => (t?.title || '').toLowerCase().trim()));
      parsedTasks.forEach(task => {
        const cleanedTitle = (task?.title || '').toLowerCase().trim();
        if (cleanedTitle && !todoTitles.has(cleanedTitle)) {
          let type: 'DAY' | 'WEEK' | 'MONTH' = 'DAY';
          if (task.priority === 'CAO_CAP') type = 'WEEK';
          else if (task.priority === 'THAN_CAP') type = 'MONTH';
          
          parsedTodos.push({
            id: task.id || `todo_${Date.now()}_${Math.random()}`,
            title: task.title,
            type,
            isCompleted: !!task.isCompleted,
            createdAt: task.createdAt || new Date().toISOString(),
            completedAt: task.completedAt,
            tuViReward: task.tuViReward || 15,
            linhThachReward: task.linhThachReward || 5,
            dueDate: task.dueDate
          });
          todoTitles.add(cleanedTitle);
        }
      });
      return parsedTodos;
    }
    
    if (parsedTasks.length > 0) {
      return parsedTasks.map(task => {
        let type: 'DAY' | 'WEEK' | 'MONTH' = 'DAY';
        if (task.priority === 'CAO_CAP') type = 'WEEK';
        else if (task.priority === 'THAN_CAP') type = 'MONTH';
        return {
          id: task.id || `todo_${Date.now()}_${Math.random()}`,
          title: task.title,
          type,
          isCompleted: !!task.isCompleted,
          createdAt: task.createdAt || new Date().toISOString(),
          completedAt: task.completedAt,
          tuViReward: task.tuViReward || 15,
          linhThachReward: task.linhThachReward || 5,
          dueDate: task.dueDate
        };
      });
    }

    return [];
  });

  const [cultState, setCultState] = useState<CultivationState>(() => {
    const saved = localStorage.getItem('tlk_cult_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          totalExp: 0,
          currentExp: 0,
          level: 1,
          linhThach: 100,
          spiritStonesEarned: 100,
          meditationMinutes: 0,
          tasksCompletedCount: 0,
          habitsCompletedCount: 0,
          shieldActive: false,
          ...parsed,
          inventory: Array.isArray(parsed?.inventory) ? parsed.inventory : [],
          unlockedRealms: Array.isArray(parsed?.unlockedRealms) ? parsed.unlockedRealms : ['Ngưng Khí Kỳ'],
          claimedAchievements: Array.isArray(parsed?.claimedAchievements) ? parsed.claimedAchievements : [],
        };
      } catch (e) { /* fallback */ }
    }
    return {
      totalExp: 0,
      currentExp: 0,
      level: 1,
      linhThach: 100,
      spiritStonesEarned: 100,
      meditationMinutes: 0,
      tasksCompletedCount: 0,
      habitsCompletedCount: 0,
      shieldActive: false,
      inventory: [],
      unlockedRealms: ['Ngưng Khí Kỳ'],
      claimedAchievements: []
    };
  });

  const tasks: Task[] = (todoItems || [])
    .map(todo => {
      let priority: Priority = 'SO_CAP';
      if ((todo?.tuViReward || 0) >= 120) priority = 'THAN_CAP';
      else if ((todo?.tuViReward || 0) >= 60) priority = 'CAO_CAP';
      else if ((todo?.tuViReward || 0) >= 30) priority = 'TRUNG_CAP';

      return {
        id: todo.id,
        title: todo.title,
        description: todo.type === 'WEEK' ? 'Nhiệm Vụ Hàng Tuần' : todo.type === 'MONTH' ? 'Nhiệm Vụ Hàng Tháng' : 'Nhiệm Vụ Hằng Ngày',
        priority,
        isCompleted: todo.isCompleted,
        dueDate: todo.dueDate || getLocalDateString(new Date(todo.createdAt || Date.now())),
        createdAt: todo.createdAt,
        completedAt: todo.completedAt,
        tuViReward: todo.tuViReward || 15,
        linhThachReward: todo.linhThachReward || 5
      };
    });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('tlk_habits');
    if (saved) {
      try {
        const res = JSON.parse(saved);
        if (Array.isArray(res)) {
          return res.map((h: Habit) => ({
            ...h,
            streak: calculateHabitStreak(h.history || {})
          }));
        }
      } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    const saved = localStorage.getItem('tlk_timeblocks');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [ieltsLogs, setIeltsLogs] = useState<IeltsTestLog[]>(() => {
    const saved = localStorage.getItem('tlk_ielts_logs');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [ieltsTargets, setIeltsTargets] = useState<IeltsTargets>(() => {
    const saved = localStorage.getItem('tlk_ielts_targets');
    if (saved) {
      try { const res = JSON.parse(saved); if (res && typeof res === 'object') return res; } catch (e) { /* fallback */ }
    }
    return { listening: 7.0, reading: 7.0, writing: 6.5, speaking: 6.5, overall: 7.0 };
  });

  const [camBooksList, setCamBooksList] = useState<number[]>(() => {
    const saved = localStorage.getItem('tlk_cam_books_list');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [19, 18, 17, 16, 15];
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('tlk_daily_logs');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [challenges, setChallenges] = useState<WeeklyChallenge[]>(() => {
    const saved = localStorage.getItem('tlk_challenges');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return DEFAULT_CHALLENGES;
  });

  const [manuals, setManuals] = useState<CultivationManual[]>(() => {
    const saved = localStorage.getItem('tlk_manuals');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  const DEFAULT_CALENDAR_GROUPS: CalendarGroup[] = [];

  const [calendarGroups, setCalendarGroups] = useState<CalendarGroup[]>(() => {
    const saved = localStorage.getItem('tlk_calendar_groups');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return DEFAULT_CALENDAR_GROUPS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('tlk_calendar_events');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tlk_calendar_groups', JSON.stringify(calendarGroups));
  }, [calendarGroups]);

  useEffect(() => {
    localStorage.setItem('tlk_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  const [notes, setNotes] = useState<CultivationNote[]>(() => {
    const saved = localStorage.getItem('tlk_forbidden_notes');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tlk_forbidden_notes', JSON.stringify(notes));
  }, [notes]);

  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>(() => {
    const saved = localStorage.getItem('tlk_garden_plants');
    if (saved) {
      try { const res = JSON.parse(saved); if (Array.isArray(res)) return res; } catch (e) { /* fallback */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tlk_garden_plants', JSON.stringify(gardenPlants));
  }, [gardenPlants]);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState<boolean>(false);

  const [deletedGoogleTaskIds, setDeletedGoogleTaskIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('tlk_deleted_google_task_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tlk_deleted_google_task_ids', JSON.stringify(deletedGoogleTaskIds));
  }, [deletedGoogleTaskIds]);

  // --- GOOGLE LOGIN & CLOUD SYNC STATES ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState<boolean>(false);
  const [showTabCustomizeModal, setShowTabCustomizeModal] = useState<boolean>(false);
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('tlk_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ['MEDITATION', 'TODOS', 'SCHEDULE', 'IELTS_ARENA', 'CULT_PATH', 'ANALYTICS', 'GRADES', 'STORE', 'CAM_DIA'];
  });

  useEffect(() => {
    localStorage.setItem('tlk_tab_order', JSON.stringify(tabOrder));
  }, [tabOrder]);

  const getTabConfig = (id: string) => {
    switch (id) {
      case 'MEDITATION':
        return { label: 'Thiền Định Pomodoro', icon: <Flame className="w-3.5 h-3.5" />, colorClass: 'bg-amber-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'TODOS':
        return { label: 'Nhiệm Vụ Tông Môn', icon: <ListTodo className="w-3.5 h-3.5" />, colorClass: 'bg-emerald-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'SCHEDULE':
        return { label: 'Lịch trình', icon: <Calendar className="w-3.5 h-3.5" />, colorClass: 'bg-amber-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'IELTS_ARENA':
        return { label: 'Nghiên Cứu Cổ Kinh', icon: <BookOpen className="w-3.5 h-3.5" />, colorClass: 'bg-blue-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'CULT_PATH':
        return { label: 'Tiên Lộ (Lộ Trình)', icon: <Scroll className="w-3.5 h-3.5" />, colorClass: 'bg-purple-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'ANALYTICS':
        return { label: 'Đạo Nhãn Thống Kê', icon: <CompassIcon className="w-3.5 h-3.5" />, colorClass: 'bg-pink-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'GRADES':
        return { label: 'Điểm số', icon: <GraduationCap className="w-3.5 h-3.5" />, colorClass: 'bg-blue-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'STORE':
        return { label: 'Tàng Bảo Các (Shop)', icon: <Sparkles className="w-3.5 h-3.5" />, colorClass: 'bg-rose-400 text-slate-950 shadow-[3px_3px_0px_#000]' };
      case 'CAM_DIA':
        return { label: 'Cấm Địa Tông Môn', icon: <Lock className="w-3.5 h-3.5" />, colorClass: 'bg-red-500 text-slate-950 shadow-[3px_3px_0px_#000]' };
      default:
        return { label: '', icon: null, colorClass: '' };
    }
  };

  // Focus mode task focus state
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState<boolean>(false);
  const [activeRitualModal, setActiveRitualModal] = useState<'NONE' | 'PLANNING' | 'REFLECTION'>('NONE');
  const [dismissedAIBubbleDate, setDismissedAIBubbleDate] = useState<string>('');

  const handleClaimAchievement = (achievementId: string, _rewardStones?: number) => {
    setCultState(prev => {
      const currentClaimed = prev.claimedAchievements || [];
      if (currentClaimed.includes(achievementId)) return prev;
      return {
        ...prev,
        claimedAchievements: [...currentClaimed, achievementId]
      };
    });
  };

  const handleEquipTitle = (title: string) => {
    setCultState(prev => ({
      ...prev,
      equippedTitle: title
    }));
  };

  // --- SAVE SYSTEM SYNC ---
  useEffect(() => {
    localStorage.setItem('tlk_username', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('tlk_planning_completed_date', planningCompletedDate);
  }, [planningCompletedDate]);

  useEffect(() => {
    localStorage.setItem('tlk_reflection_completed_date', reflectionCompletedDate);
  }, [reflectionCompletedDate]);

  // Save the current app URL so the extension's blocked.html can redirect back correctly
  useEffect(() => {
    try {
      localStorage.setItem('hustflow_app_url', window.location.origin + '/');
      localStorage.setItem('zenflow_app_url', window.location.origin + '/');
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('tlk_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('tlk_spreadsheet_id', spreadsheetId);
  }, [spreadsheetId]);

  useEffect(() => {
    localStorage.setItem('tlk_grade_subjects', JSON.stringify(gradeSubjects));
  }, [gradeSubjects]);

  useEffect(() => {
    localStorage.setItem('tlk_semester_gpa_list', JSON.stringify(semesterGpaList));
  }, [semesterGpaList]);

  useEffect(() => {
    localStorage.setItem('tlk_cpa_overall', String(cpaOverall));
  }, [cpaOverall]);

  useEffect(() => {
    localStorage.setItem('tlk_grade_is_dirty', isDirty ? 'true' : 'false');
  }, [isDirty]);

  useEffect(() => {
    localStorage.setItem('tlk_is_focus_mode', isFocusMode ? 'true' : 'false');
  }, [isFocusMode]);

  useEffect(() => {
    localStorage.setItem('tlk_cult_state', JSON.stringify(cultState));
  }, [cultState]);

  useEffect(() => {
    localStorage.setItem('tlk_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tlk_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('tlk_timeblocks', JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  useEffect(() => {
    localStorage.setItem('tlk_ielts_logs', JSON.stringify(ieltsLogs));
  }, [ieltsLogs]);

  useEffect(() => {
    localStorage.setItem('tlk_ielts_targets', JSON.stringify(ieltsTargets));
  }, [ieltsTargets]);

  useEffect(() => {
    localStorage.setItem('tlk_cam_books_list', JSON.stringify(camBooksList));
  }, [camBooksList]);

  useEffect(() => {
    localStorage.setItem('tlk_daily_logs', JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  useEffect(() => {
    localStorage.setItem('tlk_challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('tlk_manuals', JSON.stringify(manuals));
  }, [manuals]);

  useEffect(() => {
    localStorage.setItem('tlk_todos', JSON.stringify(todoItems));
  }, [todoItems]);

  const getStreakFromLogs = (logs: DailyLog[]): number => {
    if (!logs || logs.length === 0) return 0;
    const activeDays = logs
      .filter(log => log.meditationMinutes > 0 || log.tasksCompleted > 0)
      .map(log => log.date);

    if (activeDays.length === 0) return 0;

    const sortedDates = Array.from(new Set(activeDays))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const todayDateStr = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDateStr = getLocalDateString(yesterdayDate);

    if (sortedDates[0] !== todayDateStr && sortedDates[0] !== yesterdayDateStr) {
      return 0;
    }

    let streak = 0;
    let currentDateToCheck = new Date(sortedDates[0]);

    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = new Date(sortedDates[i]);
      const diffTime = Math.abs(currentDateToCheck.getTime() - logDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
      } else if (diffDays === 1) {
        streak++;
        currentDateToCheck = logDate;
      } else {
        break;
      }
    }
    return streak;
  };

  // --- GOOGLE AUTH & CLOUD SYNC EFFECTS ---
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        await handleAuthSuccess(result.user);
      }
    } catch (e) {
      alert('Đăng nhập Google thất bại. Đạo hữu vui lòng kiểm tra cấu hình domain hoặc thử lại.');
    }
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsCloudSyncing(true);
    try {
      const cloudData = await loadUserDataFromCloud(user.uid);
      let baseTodos = todoItems;
      if (cloudData) {
        const localLastUpdated = Number(localStorage.getItem('tlk_last_updated') || '0');
        const cloudLastUpdated = cloudData.lastUpdated || 0;

        if (cloudLastUpdated >= localLastUpdated) {
          console.log(`☁️ Cloud is newer (${cloudLastUpdated} >= ${localLastUpdated}). Overwriting local state with cloud state.`);
          setUserName(cloudData.userName);
          setPlanningCompletedDate(cloudData.planningCompletedDate || planningCompletedDate);
          setReflectionCompletedDate(cloudData.reflectionCompletedDate || reflectionCompletedDate);
          baseTodos = cloudData.todoItems || [];
          setTodoItems(baseTodos);
          setHabits(cloudData.habits || []);
          setChallenges(cloudData.challenges || DEFAULT_CHALLENGES);
          setCultState(cloudData.cultState);
          setDailyLogs(cloudData.dailyLogs || []);
          setIeltsLogs(cloudData.ieltsLogs || []);
          setIeltsTargets(cloudData.ieltsTargets);
          setCamBooksList(cloudData.camBooksList || []);
          setManuals(cloudData.manuals || []);
          setNotes(cloudData.notes || []);
          setGardenPlants((cloudData as any).gardenPlants || []);
          setTimeBlocks(cloudData.timeBlocks || []);
          setCalendarGroups(cloudData.calendarGroups || DEFAULT_CALENDAR_GROUPS);
          setCalendarEvents(cloudData.calendarEvents || []);
          
          localStorage.setItem('tlk_username', cloudData.userName);
          localStorage.setItem('tlk_planning_completed_date', cloudData.planningCompletedDate || localStorage.getItem('tlk_planning_completed_date') || '');
          localStorage.setItem('tlk_reflection_completed_date', cloudData.reflectionCompletedDate || localStorage.getItem('tlk_reflection_completed_date') || '');
          localStorage.setItem('tlk_todos', JSON.stringify(cloudData.todoItems || []));
          localStorage.setItem('tlk_habits', JSON.stringify(cloudData.habits || []));
          localStorage.setItem('tlk_challenges', JSON.stringify(cloudData.challenges || DEFAULT_CHALLENGES));
          localStorage.setItem('tlk_cult_state', JSON.stringify(cloudData.cultState));
          localStorage.setItem('tlk_daily_logs', JSON.stringify(cloudData.dailyLogs || []));
          localStorage.setItem('tlk_ielts_logs', JSON.stringify(cloudData.ieltsLogs || []));
          localStorage.setItem('tlk_ielts_targets', JSON.stringify(cloudData.ieltsTargets));
          localStorage.setItem('tlk_cam_books_list', JSON.stringify(cloudData.camBooksList || []));
          localStorage.setItem('tlk_manuals', JSON.stringify(cloudData.manuals || []));
          localStorage.setItem('tlk_forbidden_notes', JSON.stringify(cloudData.notes || []));
          localStorage.setItem('tlk_garden_plants', JSON.stringify((cloudData as any).gardenPlants || []));
          localStorage.setItem('tlk_timeblocks', JSON.stringify(cloudData.timeBlocks || []));
          localStorage.setItem('tlk_calendar_groups', JSON.stringify(cloudData.calendarGroups || DEFAULT_CALENDAR_GROUPS));
          localStorage.setItem('tlk_calendar_events', JSON.stringify(cloudData.calendarEvents || []));
          localStorage.setItem('tlk_last_updated', String(cloudLastUpdated));

          // Force immediate sync to Chrome Extension with fresh Firestore data
          const now = Date.now();
          window.postMessage({
            type: "TLK_STATE_SYNC",
            state: {
              userName: cloudData.userName,
              todoItems: cloudData.todoItems || [],
              habits: cloudData.habits || [],
              cultState: cloudData.cultState,
              gardenPlants: (cloudData as any).gardenPlants || [],
              dailyLogs: cloudData.dailyLogs || [],
              ieltsLogs: cloudData.ieltsLogs || [],
              ieltsTargets: cloudData.ieltsTargets,
              camBooksList: cloudData.camBooksList || [],
              challenges: cloudData.challenges || DEFAULT_CHALLENGES,
              manuals: cloudData.manuals || [],
              notes: cloudData.notes || [],
              spreadsheetId,
              cpaOverall,
              semesterGpaList,
              timeBlocks: cloudData.timeBlocks || [],
              calendarGroups: cloudData.calendarGroups || DEFAULT_CALENDAR_GROUPS,
              calendarEvents: cloudData.calendarEvents || [],
              lastUpdated: now,
              sender: 'web'
            }
          }, "*");
        } else {
          console.log(`☁️ Local is newer (${localLastUpdated} > ${cloudLastUpdated}). Push local state to Firestore.`);
          const localData = {
            userName,
            planningCompletedDate,
            reflectionCompletedDate,
            todoItems,
            tasks: [],
            habits,
            challenges,
            cultState: {
              ...cultState,
              currentStreak: getStreakFromLogs(dailyLogs),
            },
            dailyLogs,
            ieltsLogs,
            ieltsTargets,
            camBooksList,
            manuals,
            notes,
            gardenPlants,
            timeBlocks,
            calendarGroups,
            calendarEvents,
            lastUpdated: localLastUpdated,
          };
          await saveUserDataToCloud(user.uid, localData);
        }
      } else {
        // Initial upload of current local state for new user
        const now = Date.now();
        localStorage.setItem('tlk_last_updated', String(now));
        const localData = {
          userName,
          planningCompletedDate,
          reflectionCompletedDate,
          todoItems,
          tasks: [],
          habits,
          challenges,
          cultState: {
            ...cultState,
            currentStreak: getStreakFromLogs(dailyLogs),
          },
          dailyLogs,
          ieltsLogs,
          ieltsTargets,
          camBooksList,
          manuals,
          notes,
          gardenPlants,
          timeBlocks,
          calendarGroups,
          calendarEvents,
          lastUpdated: now,
        };
        await saveUserDataToCloud(user.uid, localData);
      }

      // --- AUTO SYNC GOOGLE TASKS ON RELOAD/MOUNT ---
      const token = getAccessToken();
      if (token) {
        try {
          const result = await syncGoogleTasks(token, baseTodos, deletedGoogleTaskIds);
          setTodoItems(result.syncedTodos);
          setDeletedGoogleTaskIds([]);
          localStorage.setItem('tlk_todos', JSON.stringify(result.syncedTodos));
          
          const now = Date.now();
          localStorage.setItem('tlk_last_updated', String(now));

          // Instantly sync the new todo list back to Firestore
          const updatedLocalData = {
            userName: cloudData ? (cloudData.lastUpdated && cloudData.lastUpdated >= Number(localStorage.getItem('tlk_last_updated') || '0') ? cloudData.userName : userName) : userName,
            planningCompletedDate: cloudData ? cloudData.planningCompletedDate : planningCompletedDate,
            reflectionCompletedDate: cloudData ? cloudData.reflectionCompletedDate : reflectionCompletedDate,
            todoItems: result.syncedTodos,
            tasks: [],
            habits: cloudData ? (cloudData.habits || []) : habits,
            challenges,
            cultState: {
              ...(cloudData ? cloudData.cultState : cultState),
              currentStreak: getStreakFromLogs(cloudData ? cloudData.dailyLogs : dailyLogs),
            },
            dailyLogs: cloudData ? (cloudData.dailyLogs || []) : dailyLogs,
            ieltsLogs: cloudData ? (cloudData.ieltsLogs || []) : ieltsLogs,
            ieltsTargets: cloudData ? (cloudData.ieltsTargets || { readingBand: 5.0, listeningBand: 5.0, overallBand: 5.0, targetDate: '' }) : ieltsTargets,
            camBooksList: cloudData ? (cloudData.camBooksList || []) : camBooksList,
            manuals: cloudData ? (cloudData.manuals || []) : manuals,
            notes: cloudData ? (cloudData.notes || []) : notes,
            gardenPlants: cloudData ? ((cloudData as any).gardenPlants || []) : gardenPlants,
            timeBlocks: cloudData ? (cloudData.timeBlocks || []) : timeBlocks,
            calendarGroups: cloudData ? (cloudData.calendarGroups || DEFAULT_CALENDAR_GROUPS) : calendarGroups,
            calendarEvents: cloudData ? (cloudData.calendarEvents || []) : calendarEvents,
            lastUpdated: now,
          };
          await saveUserDataToCloud(user.uid, updatedLocalData);
        } catch (syncErr) {
          console.error('Google Tasks automatic sync on reload failed:', syncErr);
        }
      }
      setHasLoadedFromCloud(true);
    } catch (error) {
      console.error('Error loading user data from cloud:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, _token) => {
        await handleAuthSuccess(user);
      },
      () => {
        setCurrentUser(null);
        setHasLoadedFromCloud(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      handleFetchLeaderboard();
    }
  }, [currentUser]);

  // --- CHROME EXTENSION STATE SYNCHRONIZATION ---
  // 1. Relay local state changes to Chrome Extension
  useEffect(() => {
    try {
      // NOTE: Do NOT set tlk_last_updated here.
      // This effect fires on every render (including the first render on a new machine),
      // which would set localLastUpdated to "now" and falsely make local data appear
      // newer than cloud data, causing handleAuthSuccess to push empty state to Firestore.
      // tlk_last_updated is only updated in the auto-save debounce (after hasLoadedFromCloud=true).
      const lastUpdated = Number(localStorage.getItem('tlk_last_updated') || '0');

      window.postMessage({
        type: "TLK_STATE_SYNC",
        state: {
          userName,
          todoItems,
          habits,
          cultState,
          gardenPlants,
          dailyLogs,
          ieltsLogs,
          ieltsTargets,
          camBooksList,
          challenges,
          manuals,
          notes,
          spreadsheetId,
          cpaOverall,
          semesterGpaList,
          timeBlocks,
          calendarGroups,
          calendarEvents,
          lastUpdated,
          sender: 'web'
        }
      }, "*");
    } catch (e) {
      console.warn("Failed to post message for state sync", e);
    }
  }, [
    userName,
    todoItems,
    habits,
    cultState,
    gardenPlants,
    dailyLogs,
    ieltsLogs,
    ieltsTargets,
    camBooksList,
    challenges,
    manuals,
    notes,
    spreadsheetId,
    cpaOverall,
    semesterGpaList,
    timeBlocks,
    calendarGroups,
    calendarEvents
  ]);

  // 2. Listen for state updates coming from Chrome Extension (2-way sync)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window || !event.data) return;
      const data = event.data;

      if (data.type === 'TLK_EXTENSION_STATE_UPDATED' && data.state) {
        const newState = data.state;
        if (newState.sender === 'extension') {
          console.log("HUSTFlow: Synchronized state from Extension New Tab action");
          if (newState.userName !== undefined) setUserName(newState.userName);
          if (newState.todoItems !== undefined) setTodoItems(newState.todoItems);
          if (newState.habits !== undefined) setHabits(newState.habits);
          if (newState.cultState !== undefined) setCultState(newState.cultState);
          if (newState.gardenPlants !== undefined) setGardenPlants(newState.gardenPlants);
          if (newState.dailyLogs !== undefined) setDailyLogs(newState.dailyLogs);
          if (newState.timeBlocks !== undefined) setTimeBlocks(newState.timeBlocks);
          if (newState.calendarGroups !== undefined) setCalendarGroups(newState.calendarGroups);
          if (newState.calendarEvents !== undefined) setCalendarEvents(newState.calendarEvents);
          
          if (newState.lastUpdated) {
            localStorage.setItem('tlk_last_updated', String(newState.lastUpdated));
          }
        }
      } else if (data.type === 'TLK_EXTENSION_LOADED_STATE') {
        if (!data.state) {
          // If extension has no state, immediately push web state to initialize it
          console.log("HUSTFlow: Startup sync - extension state is empty, pushing web state");
          const existingLastUpdated = Number(localStorage.getItem('tlk_last_updated') || '0');
          window.postMessage({
            type: "TLK_STATE_SYNC",
            state: {
              userName,
              todoItems,
              habits,
              cultState,
              gardenPlants,
              dailyLogs,
              ieltsLogs,
              ieltsTargets,
              camBooksList,
              challenges,
              manuals,
              notes,
              spreadsheetId,
              cpaOverall,
              semesterGpaList,
              timeBlocks,
              calendarGroups,
              calendarEvents,
              lastUpdated: existingLastUpdated,
              sender: 'web'
            }
          }, "*");
          return;
        }

        const extState = data.state;
        const localLastUpdated = Number(localStorage.getItem('tlk_last_updated') || '0');
        const extLastUpdated = extState.lastUpdated || 0;
        
        if (extLastUpdated > localLastUpdated) {
          console.log("HUSTFlow: Startup sync - loading newer state from Chrome Extension");
          if (extState.userName !== undefined) setUserName(extState.userName);
          if (extState.todoItems !== undefined) setTodoItems(extState.todoItems);
          if (extState.habits !== undefined) setHabits(extState.habits);
          if (extState.cultState !== undefined) setCultState(extState.cultState);
          if (extState.gardenPlants !== undefined) setGardenPlants(extState.gardenPlants);
          if (extState.dailyLogs !== undefined) setDailyLogs(extState.dailyLogs);
          if (extState.ieltsLogs !== undefined) setIeltsLogs(extState.ieltsLogs);
          if (extState.ieltsTargets !== undefined) setIeltsTargets(extState.ieltsTargets);
          if (extState.camBooksList !== undefined) setCamBooksList(extState.camBooksList);
          if (extState.challenges !== undefined) setChallenges(extState.challenges);
          if (extState.manuals !== undefined) setManuals(extState.manuals);
          if (extState.notes !== undefined) setNotes(extState.notes);
          if (extState.spreadsheetId !== undefined) setSpreadsheetId(extState.spreadsheetId);
          if (extState.cpaOverall !== undefined) setCpaOverall(extState.cpaOverall);
          if (extState.semesterGpaList !== undefined) setSemesterGpaList(extState.semesterGpaList);
          if (extState.timeBlocks !== undefined) setTimeBlocks(extState.timeBlocks);
          if (extState.calendarGroups !== undefined) setCalendarGroups(extState.calendarGroups);
          if (extState.calendarEvents !== undefined) setCalendarEvents(extState.calendarEvents);
          
          localStorage.setItem('tlk_last_updated', String(extLastUpdated));
        } else if (localLastUpdated > extLastUpdated) {
          console.log("HUSTFlow: Startup sync - web app is newer, pushing to extension");
          window.postMessage({
            type: "TLK_STATE_SYNC",
            state: {
              userName,
              todoItems,
              habits,
              cultState,
              gardenPlants,
              dailyLogs,
              ieltsLogs,
              ieltsTargets,
              camBooksList,
              challenges,
              manuals,
              notes,
              spreadsheetId,
              cpaOverall,
              semesterGpaList,
              timeBlocks,
              calendarGroups,
              calendarEvents,
              lastUpdated: localLastUpdated,
              sender: 'web'
            }
          }, "*");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    
    // Request initial state from extension content script
    window.postMessage({ type: "TLK_REQUEST_INITIAL_STATE" }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [
    userName,
    todoItems,
    habits,
    cultState,
    gardenPlants,
    dailyLogs,
    ieltsLogs,
    ieltsTargets,
    camBooksList,
    challenges,
    manuals,
    notes,
    spreadsheetId,
    cpaOverall,
    semesterGpaList,
    timeBlocks,
    calendarGroups,
    calendarEvents
  ]);

  // Debounced auto-sync to cloud when states change
  useEffect(() => {
    if (!currentUser || !hasLoadedFromCloud) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        const now = Date.now();
        localStorage.setItem('tlk_last_updated', String(now));
        const dataToSave = {
          userName,
          planningCompletedDate,
          reflectionCompletedDate,
          todoItems,
          tasks: [],
          habits,
          challenges,
          cultState: {
            ...cultState,
            currentStreak: getStreakFromLogs(dailyLogs),
          },
          dailyLogs,
          ieltsLogs,
          ieltsTargets,
          camBooksList,
          manuals,
          notes,
          gardenPlants,
          timeBlocks,
          calendarGroups,
          calendarEvents,
          lastUpdated: now,
        };
        await saveUserDataToCloud(currentUser.uid, dataToSave);
        console.log('☁️ Auto-synced data to Firebase Firestore at ' + now);
      } catch (e) {
        console.error('Auto-sync failed:', e);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [
    currentUser,
    hasLoadedFromCloud,
    userName,
    planningCompletedDate,
    reflectionCompletedDate,
    todoItems,
    habits,
    challenges,
    cultState,
    dailyLogs,
    ieltsLogs,
    ieltsTargets,
    camBooksList,
    manuals,
    notes,
    gardenPlants,
    timeBlocks,
    calendarGroups,
    calendarEvents,
  ]);

  // --- CULTIVATION CORE ACTIONS ---

  const checkTamMaActive = (): boolean => {
    const today = getLocalDateString();
    
    // 1. Check if there are overdue tasks by 2 or more days
    const hasOverdue2Days = todoItems.some(todo => {
      if (todo.isCompleted) return false;
      // Only check tasks that have an explicit dueDate — never use createdAt as fallback
      if (!todo.dueDate) return false;

      try {
        const timeDiff = new Date(today).getTime() - new Date(todo.dueDate).getTime();
        if (isNaN(timeDiff)) return false;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        return daysDiff >= 2;
      } catch (e) {
        return false;
      }
    });

    if (hasOverdue2Days) return true;

    // 2. Check if there has been no activity for 3 or more days
    const activeLogs = dailyLogs.filter(log => log.meditationMinutes > 0 || log.tasksCompleted > 0);
    if (activeLogs.length > 0) {
      const sortedActive = activeLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestActiveDate = sortedActive[0].date;
      const timeDiff = new Date(today).getTime() - new Date(latestActiveDate).getTime();
      const daysSinceLastActive = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      if (daysSinceLastActive >= 3) {
        return true;
      }
    }
    return false;
  };

  const addExp = (amount: number, stones: number) => {
    const today = getLocalDateString();
    const isTamMa = checkTamMaActive() && cultState.tamMaSuppressedDate !== today;
    
    // Apply Tụ Khí Quyết active spell (+30% Tu Vi from meditation/actions)
    const isSpellTuKhiActive = cultState.activeSpells?.includes('spell_tu_khi_quyet');
    const xpMultiplier = isSpellTuKhiActive && amount > 0 ? 1.3 : 1.0;
    const adjustedAmount = isTamMa && amount > 0
      ? Math.round(amount * 0.7 * xpMultiplier)
      : Math.round(amount * xpMultiplier);

    // Apply Tâm Ma Trảm active spell (Double Linh Thạch from all rewards)
    const isSpellTamMaActive = cultState.activeSpells?.includes('spell_tam_ma_tram');
    const stoneMultiplier = isSpellTamMaActive && stones > 0 ? 2.0 : 1.0;
    const adjustedStones = Math.round(stones * stoneMultiplier);

    setCultState(prev => {
      const newCurrentExp = Math.max(0, prev.currentExp + adjustedAmount);
      const newTotalExp = Math.max(0, prev.totalExp + adjustedAmount);
      const newLinhThach = Math.max(0, prev.linhThach + adjustedStones);
      const newStonesEarned = Math.max(0, prev.spiritStonesEarned + adjustedStones);

      // Log stats inside daily logs
      updateDailyLog(adjustedAmount, 0, 0);

      return {
        ...prev,
        currentExp: newCurrentExp,
        totalExp: newTotalExp,
        linhThach: newLinhThach,
        spiritStonesEarned: newStonesEarned
      };
    });
  };

  const updateDailyLog = (tuViGained: number, minutesMeditation: number, tasksDone: number) => {
    const today = getLocalDateString();
    setDailyLogs(prev => {
      const existing = prev.find(l => l.date === today);
      if (existing) {
        return prev.map(l => l.date === today ? {
          ...l,
          tuViGained: Math.max(0, l.tuViGained + tuViGained),
          meditationMinutes: Math.max(0, l.meditationMinutes + minutesMeditation),
          tasksCompleted: Math.max(0, l.tasksCompleted + tasksDone)
        } : l);
      } else {
        return [...prev, {
          date: today,
          tuViGained: Math.max(0, tuViGained),
          meditationMinutes: Math.max(0, minutesMeditation),
          tasksCompleted: Math.max(0, tasksDone)
        }];
      }
    });
  };

  const updateChallengeValue = (type: WeeklyChallenge['targetType'], increment: number) => {
    setChallenges(prev => {
      return prev.map(ch => {
        if (ch.targetType === type && !ch.isClaimed) {
          return {
            ...ch,
            currentValue: ch.currentValue + increment
          };
        }
        return ch;
      });
    });
  };

  // Auto-record bottleneck start stats snapshot when tu si enters a bottleneck level
  useEffect(() => {
    const realmInfo = getRealmInfo(cultState.level);
    if (realmInfo.bottleneck) {
      if (!cultState.bottleneckStartStats || cultState.bottleneckStartStats.level !== cultState.level) {
        setCultState(prev => ({
          ...prev,
          bottleneckStartStats: {
            level: prev.level,
            meditationMinutes: prev.meditationMinutes || 0,
            tasksCompletedCount: prev.tasksCompletedCount || 0
          }
        }));
      }
    }
  }, [cultState.level, cultState.meditationMinutes, cultState.tasksCompletedCount]);

  // --- BREAKTHROUGH SYSTEM ---
  const handleBreakthrough = (success: boolean) => {
    const realmInfo = getRealmInfo(cultState.level);
    const xpNeeded = realmInfo.xpNeeded;
    const isBottleneck = !!realmInfo.bottleneck;

    if (success) {
      setCultState(prev => {
        const nextLevel = Math.min(prev.level + 1, 100);
        const remainingExp = Math.max(prev.currentExp - xpNeeded, 0);
        const unlockedRealms = [...prev.unlockedRealms];
        const nextRealmInfo = getRealmInfo(nextLevel);
        
        if (!unlockedRealms.includes(nextRealmInfo.name)) {
          unlockedRealms.push(nextRealmInfo.name);
        }

        // Consume required bottleneck item if present
        let newInventory = [...prev.inventory];
        if (isBottleneck && realmInfo.bottleneck?.requiredItemId) {
          const reqId = realmInfo.bottleneck.requiredItemId;
          newInventory = newInventory.map(item =>
            item.itemId === reqId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
          ).filter(item => item.quantity > 0);
        }

        return {
          ...prev,
          level: nextLevel,
          currentExp: remainingExp,
          inventory: newInventory,
          breakthroughCount: (prev.breakthroughCount || 0) + 1,
          unlockedRealms,
          bottleneckStartStats: undefined // Clear snapshot for next bottleneck
        };
      });
    } else {
      // Failed breakthrough - Per user directive: wipe currentExp to 0, keep level/realm unchanged!
      setCultState(prev => {
        if (prev.shieldActive) {
          // Protected by Ho Tam Kinh shield
          return {
            ...prev,
            shieldActive: false // consume shield
          };
        } else {
          return {
            ...prev,
            currentExp: 0
          };
        }
      });
    }
  };

  // --- COMPONENT HANDLERS ---

  // Tasks
  const handleAddTask = (title: string, priority: Priority, dueDate: string, _desc?: string) => {
    // All tasks are daily tasks (type: 'DAY')
    let tuViReward = 15;
    let linhThachReward = 10;
    if (priority === 'TRUNG_CAP') {
      tuViReward = 30;
      linhThachReward = 20;
    } else if (priority === 'CAO_CAP') {
      tuViReward = 60;
      linhThachReward = 40;
    } else if (priority === 'THAN_CAP') {
      tuViReward = 120;
      linhThachReward = 80;
    }

    const newTodo: TodoItem = {
      id: `todo_${Date.now()}`,
      title,
      type: 'DAY',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      tuViReward,
      linhThachReward,
      dueDate: dueDate || getLocalDateString()
    };
    setTodoItems(prev => [newTodo, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    handleToggleTodo(id);
  };

  const handleDeleteTask = (id: string) => {
    handleDeleteTodo(id);
  };

  // Habits
  const handleAddHabit = (title: string, description?: string) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      title,
      description,
      createdAt: new Date().toISOString(),
      streak: 0,
      history: {}
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const calculateHabitStreak = (history: Record<string, boolean>): number => {
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
  };

  const healCultivationGaps = () => {
    setDailyLogs(prev => {
      if (!prev || prev.length === 0) return prev;
      
      const activeDays = prev
        .filter(log => log.meditationMinutes > 0 || log.tasksCompleted > 0)
        .map(log => log.date);
        
      if (activeDays.length === 0) return prev;
      
      const sortedDates = Array.from(new Set(activeDays))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
      const firstDate = new Date(sortedDates[0]);
      const today = new Date();
      const todayStr = getLocalDateString(today);
      
      const newLogs = [...prev];
      
      let curr = new Date(firstDate);
      while (getLocalDateString(curr) <= todayStr) {
        const dateStr = getLocalDateString(curr);
        const existing = newLogs.find(l => l.date === dateStr);
        if (!existing) {
          newLogs.push({
            date: dateStr,
            tuViGained: 0,
            meditationMinutes: 1, // mark as active with 1 minute bế quan
            tasksCompleted: 0
          });
        } else if (existing.meditationMinutes === 0 && existing.tasksCompleted === 0) {
          existing.meditationMinutes = 1; // activate
        }
        curr.setDate(curr.getDate() + 1);
      }
      return newLogs;
    });
  };

  const healHabitGaps = (h: Habit): Habit => {
    const dates = Object.keys(h.history).filter(d => h.history[d]);
    if (dates.length === 0) return h;
    
    const sorted = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const firstDate = new Date(sorted[0]);
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    const newHistory = { ...h.history };
    
    let curr = new Date(firstDate);
    while (getLocalDateString(curr) <= todayStr) {
      const dateStr = getLocalDateString(curr);
      newHistory[dateStr] = true;
      curr.setDate(curr.getDate() + 1);
    }
    
    const streak = calculateHabitStreak(newHistory);
    
    return {
      ...h,
      history: newHistory,
      streak
    };
  };

  const handleToggleHabitDay = (id: string, date: string) => {
    setHabits(prev => {
      return prev.map(h => {
        if (h.id === id) {
          const isCompleted = !h.history[date];
          const newHistory = { ...h.history, [date]: isCompleted };
          const streak = calculateHabitStreak(newHistory);

          const isSpellThanHanhActive = cultState.activeSpells?.includes('spell_than_hanh_bo');
          const habitXp = isSpellThanHanhActive ? 22 : 15;

          if (isCompleted) {
            addExp(habitXp, 5); // Constant 15 (or 22) XP and 5 Coins for habit ticking
            updateChallengeValue('HABITS_COMPLETED', 1);
            setCultState(c => ({ ...c, habitsCompletedCount: c.habitsCompletedCount + 1 }));
          } else {
            addExp(-habitXp, -5); // Deduct 15 (or 22) XP and 5 Coins when unchecking
            updateChallengeValue('HABITS_COMPLETED', -1);
            setCultState(c => ({ ...c, habitsCompletedCount: Math.max(0, c.habitsCompletedCount - 1) }));
          }

          return {
            ...h,
            history: newHistory,
            streak,
            lastCompletedDate: isCompleted ? date : h.lastCompletedDate
          };
        }
        return h;
      });
    });
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // --- TODO LIST HANDLERS ---
  const handleAddTodo = (title: string, difficulty: Priority, dueDate?: string, googleTaskId?: string) => {
    let tuViReward = 15;
    let linhThachReward = 5;

    if (difficulty === 'TRUNG_CAP') {
      tuViReward = 30;
      linhThachReward = 15;
    } else if (difficulty === 'CAO_CAP') {
      tuViReward = 60;
      linhThachReward = 35;
    } else if (difficulty === 'THAN_CAP') {
      tuViReward = 120;
      linhThachReward = 75;
    }

    const newTodo: TodoItem = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title,
      type: 'DAY',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      tuViReward,
      linhThachReward,
      dueDate: dueDate || getLocalDateString(),
      googleTaskId,
      difficulty
    };
    setTodoItems(prev => [newTodo, ...prev]);
  };

  const handleSyncTodos = (syncedTodos: TodoItem[]) => {
    setTodoItems(syncedTodos);
  };

  const handleToggleTodo = (id: string) => {
    setTodoItems(prev => {
      return prev.map(t => {
        if (t.id === id) {
          const nextCompleted = !t.isCompleted;
          if (nextCompleted) {
            addExp(t.tuViReward, t.linhThachReward);
            updateDailyLog(0, 0, 1);
            updateChallengeValue('TASKS_COMPLETED', 1);
            setCultState(c => ({ ...c, tasksCompletedCount: c.tasksCompletedCount + 1 }));
          } else {
            addExp(-t.tuViReward, -t.linhThachReward); // Deduct reward if unchecked
            updateDailyLog(0, 0, -1);
            updateChallengeValue('TASKS_COMPLETED', -1);
            setCultState(c => ({ ...c, tasksCompletedCount: Math.max(0, c.tasksCompletedCount - 1) }));
          }

          // Instantly sync to Google Tasks if linked and logged in
          if (t.googleTaskId) {
            const token = getAccessToken();
            if (token) {
              patchTaskOnGoogle(token, t.googleTaskId, {
                isCompleted: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : undefined
              }).catch(err => {
                console.warn('Instant Google Task toggle patch failed:', err);
              });
            }
          }

          return {
            ...t,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined
          };
        }
        return t;
      });
    });
  };

  const handleDeleteTodo = (id: string) => {
    const todoToDelete = todoItems.find(t => t.id === id);
    if (todoToDelete?.googleTaskId) {
      setDeletedGoogleTaskIds(prev => {
        if (prev.includes(todoToDelete.googleTaskId!)) return prev;
        return [...prev, todoToDelete.googleTaskId!];
      });

      // Instantly delete from Google Tasks in background if logged in
      const token = getAccessToken();
      if (token) {
        deleteTaskOnGoogle(token, todoToDelete.googleTaskId).catch(err => {
          console.warn('Instant Google Task delete failed, will retry on sync:', err);
        });
      }
    }
    setTodoItems(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTodo = (updatedTodo: TodoItem) => {
    let tuViReward = 15;
    let linhThachReward = 5;

    if (updatedTodo.difficulty === 'TRUNG_CAP') {
      tuViReward = 30;
      linhThachReward = 15;
    } else if (updatedTodo.difficulty === 'CAO_CAP') {
      tuViReward = 60;
      linhThachReward = 35;
    } else if (updatedTodo.difficulty === 'THAN_CAP') {
      tuViReward = 120;
      linhThachReward = 75;
    }

    const finalTodo = {
      ...updatedTodo,
      tuViReward,
      linhThachReward
    };

    setTodoItems(prev => prev.map(t => t.id === updatedTodo.id ? finalTodo : t));

    if (finalTodo.googleTaskId) {
      const token = getAccessToken();
      if (token) {
        patchTaskOnGoogle(token, finalTodo.googleTaskId, {
          title: finalTodo.title,
          dueDate: finalTodo.dueDate
        }).catch(err => {
          console.warn('Instant Google Task update patch failed:', err);
        });
      }
    }
  };

  // Shop & Consumables
  const handleBuyItem = (item: StoreItem) => {
    if (cultState.linhThach < item.cost) return;
    setCultState(prev => {
      const inventory = [...prev.inventory];
      const existing = inventory.find(i => i.itemId === item.id);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        inventory.push({ itemId: item.id, quantity: 1 });
      }

      return {
        ...prev,
        linhThach: prev.linhThach - item.cost,
        itemsBoughtCount: (prev.itemsBoughtCount || 0) + 1,
        inventory
      };
    });
  };

  const handleUseConsumable = (itemId: string) => {
    const hasItem = cultState.inventory.some(i => i.itemId === itemId && i.quantity > 0);
    if (!hasItem) return;

    const storeItem = STORE_ITEMS.find(s => s.id === itemId);
    if (!storeItem) return;

    if (storeItem.type === 'PERMANENT') {
      // Toggle equip/unequip spell
      setCultState(prev => {
        const activeSpells = prev.activeSpells || [];
        const isEquipped = activeSpells.includes(itemId);
        let newSpells = [...activeSpells];
        if (isEquipped) {
          newSpells = newSpells.filter(id => id !== itemId);
        } else {
          if (newSpells.length >= 2) {
            alert('Đạo hữu chỉ có thể trang bị tối đa 2 phép thuật chủ động cùng lúc!');
            return prev;
          }
          newSpells.push(itemId);
        }
        return { ...prev, activeSpells: newSpells };
      });
      return;
    }

    if (itemId === 'linh_chi_duoc') {
      // Consume, grant 100 Exp instantly
      addExp(100, 0);
      consumeItemFromInventory(itemId);
    } else if (itemId === 'ho_tam_kinh') {
      // Activate breakthrough safeguard shield
      setCultState(prev => ({
        ...prev,
        shieldActive: true
      }));
      consumeItemFromInventory(itemId);
    } else if (itemId === 'dao_tam_phu') {
      // Heal cultivation gaps and habit gaps to restore streaks
      healCultivationGaps();
      setHabits(prev => prev.map(h => healHabitGaps(h)));
      alert('⚡ Đạo Tâm Phù đã kích hoạt! Toàn bộ ngày chưa hoàn thành trong quá khứ đã được bồi đắp linh khí, hoàn trả lại chuỗi ngày tu luyện (Cultivation) và thói quen tông môn (Habit Streak) trước khi mất!');
      consumeItemFromInventory(itemId);
    } else if (itemId === 'thanh_tam_phu') {
      // Activate Tam Ma suppression
      setCultState(prev => ({
        ...prev,
        tamMaSuppressedDate: getLocalDateString()
      }));
      consumeItemFromInventory(itemId);
      alert('☯️ Đạo hữu đã kích hoạt Thanh Tâm Phù! Tâm cảnh ngay lập tức được tịnh hóa, tà khí tiêu tan, khôi phục hiệu suất hấp thụ Tu Vi 100% trong ngày hôm nay.');
    } else if (itemId === 'tu_khi_dan' || itemId === 'tu_linh_tran') {
      // Activating passive arrays/pills is done automatically during pomodoro when owned!
      // Display advice or let them use it to get instant message confirmation
      alert(`Đan dược ${itemId === 'tu_khi_dan' ? 'Tụ Khí Đan' : 'Tụ Linh Trận'} đã có sẵn trong đạo phủ. Tác dụng phụ trợ sẽ tự động được kích hoạt khi bạn bế quan thiền định (Pomodoro)!`);
    }
  };

  const consumeItemFromInventory = (itemId: string) => {
    setCultState(prev => {
      const inventory = prev.inventory.map(i => {
        if (i.itemId === itemId) {
          return { ...i, quantity: i.quantity - 1 };
        }
        return i;
      }).filter(i => i.quantity > 0);

      return {
        ...prev,
        inventory
      };
    });
  };

  // Challenges
  const handleAddChallenge = (title: string, targetValue: number, tuViReward: number, linhThachReward: number) => {
    const newChallenge: WeeklyChallenge = {
      id: `challenge_${Date.now()}`,
      title,
      targetType: 'TASKS_COMPLETED',
      currentValue: 0,
      targetValue,
      tuViReward,
      linhThachReward,
      isClaimed: false
    };
    setChallenges(prev => [newChallenge, ...prev]);
  };

  const handleProgressChallenge = (id: string, amount: number = 1) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === id && !ch.isClaimed) {
        return { ...ch, currentValue: Math.min(ch.currentValue + amount, ch.targetValue) };
      }
      return ch;
    }));
  };

  const handleClaimChallenge = (id: string) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === id && ch.currentValue >= ch.targetValue && !ch.isClaimed) {
        addExp(ch.tuViReward, ch.linhThachReward);
        return { ...ch, isClaimed: true };
      }
      return ch;
    }));
  };

  const handleDeleteChallenge = (id: string) => {
    setChallenges(prev => prev.filter(ch => ch.id !== id));
  };

  const handleFetchLeaderboard = async () => {
    setIsFetchingLeaderboard(true);
    try {
      const data = await fetchLeaderboardFromCloud();
      // Sort: 1. Level descending, 2. TotalExp descending, 3. Streak descending
      const sorted = data.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.totalExp !== a.totalExp) return b.totalExp - a.totalExp;
        return b.currentStreak - a.currentStreak;
      });
      setLeaderboard(sorted);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setIsFetchingLeaderboard(false);
    }
  };

  // Meditation Complete callback
  const handleMeditationComplete = (
    minutes: number,
    xpGained = 50,
    linhThachGained = 30,
    plantName?: string,
    plantStatus?: 'HARVESTED' | 'WITHERED'
  ) => {
    // If withered plant, just add to garden and return (no rewards)
    if (plantStatus === 'WITHERED') {
      const newPlant: GardenPlant = {
        id: `plant_${Date.now()}`,
        name: plantName || 'Ngọc Linh Chi',
        duration: 25,
        status: 'WITHERED',
        harvestedAt: getLocalDateString(),
        xpGained: 0,
        linhThachGained: 0
      };
      setGardenPlants(prev => [newPlant, ...prev]);
      return;
    }

    addExp(xpGained, linhThachGained);
    updateDailyLog(0, minutes, 0);
    updateChallengeValue('MEDITATION_MINUTES', minutes);
    setCultState(prev => ({ ...prev, meditationMinutes: prev.meditationMinutes + minutes }));

    // Consume Tu Khi Dan pill if active
    const pillActive = cultState.inventory.some(i => i.itemId === 'tu_khi_dan');
    if (pillActive) {
      consumeItemFromInventory('tu_khi_dan');
    }

    // Add harvested plant to garden list
    if (plantName) {
      const newPlant: GardenPlant = {
        id: `plant_${Date.now()}`,
        name: plantName,
        duration: minutes,
        status: 'HARVESTED',
        harvestedAt: getLocalDateString(),
        xpGained,
        linhThachGained
      };
      setGardenPlants(prev => [newPlant, ...prev]);
    }
  };

  // Passive Qi Meditation Tick
  const handlePassiveQiTick = (tuViGained: number) => {
    addExp(tuViGained, 0);
  };

  // --- IELTS MOCK TEST SCORE LOGGER ---
  const handleAddIeltsLog = (
    testName: string,
    listening: number,
    reading: number,
    writing: number,
    speaking: number,
    date: string,
    notes?: string
  ) => {
    const overall = (listening + reading + writing + speaking) / 4;
    // Exactly round overall
    const base = Math.floor(overall);
    const decimal = overall - base;
    let roundedOverall = base;
    if (decimal >= 0.25 && decimal < 0.75) roundedOverall = base + 0.5;
    else if (decimal >= 0.75) roundedOverall = base + 1;

    const newLog: IeltsTestLog = {
      id: `ielts_${Date.now()}`,
      testName,
      listening,
      reading,
      writing,
      speaking,
      overall: roundedOverall,
      date,
      notes
    };
    setIeltsLogs(prev => [newLog, ...prev]);

    // Logging IELTS Mock test grants great spiritual Tu Vi! (150 Tu Vi & 100 Linh Thach)
    addExp(150, 100);
  };

  const handleDeleteIeltsLog = (id: string) => {
    setIeltsLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateIeltsLog = (updatedLog: IeltsTestLog) => {
    setIeltsLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
  };

  // --- GRADE SYSTEM HANDLERS ---
  // 2-Way Sync: If Web has unsaved local modifications (isDirty), PUSH to sheet first, then PULL. Otherwise, only PULL from sheet.
  const handleSyncGrades = async () => {
    if (!spreadsheetId) {
      alert('Đạo hữu vui lòng cấu hình Spreadsheet ID trước khi đồng bộ!');
      return;
    }
    const token = getAccessToken();
    if (!token) {
      alert('Không tìm thấy Token xác thực Google. Vui lòng nhấn Đăng Nhập Google ở góc trên để cấp quyền.');
      return;
    }
    setIsSyncingGrades(true);
    try {
      // 1. If Web has local modifications, push them to the Google Sheet first
      if (isDirty && gradeSubjects.length > 0) {
        await saveGradesToGoogle(spreadsheetId, token, gradeSubjects);
      }

      // 2. Pull the latest data from the Google Sheet (updates Web local data)
      const data = await fetchGradesFromGoogle(spreadsheetId, token);
      setGradeSubjects(data.subjects);
      setSemesterGpaList(data.semesterGpaList);
      setCpaOverall(data.cpaOverall);
      
      // Reset dirty state since everything is in sync now
      setIsDirty(false);
      alert('⚡ Đồng bộ bảng điểm 2 chiều thành công!');
    } catch (e: any) {
      console.error(e);
      const is401 = e.status === 401 || 
                    e.message === 'GOOGLE_AUTH_401' ||
                    (e.message && (e.message.includes('401') || e.message.toLowerCase().includes('unauthorized') || e.message.toLowerCase().includes('invalid credential')));
      if (is401) {
        if (confirm('⚠️ Phiên đăng nhập Google của đạo hữu đã hết hạn (Token 60 phút).\n\nĐạo hữu có muốn đăng nhập lại để cấp Token mới cho cả 3 dịch vụ (Tasks, Sheets, Calendar) và đồng bộ lại ngay không?')) {
          try {
            const res = await googleSignIn();
            if (res?.accessToken) {
              handleSyncGrades();
            }
          } catch (loginErr) {
            alert('❌ Đăng nhập cấp lại Token thất bại!');
          }
        }
      } else {
        alert(`❌ Đồng bộ thất bại: ${e.message || e}`);
      }
    } finally {
      setIsSyncingGrades(false);
    }
  };

  const handleAddSubject = (subj: Omit<GradeSubject, 'id'>) => {
    const newSubj: GradeSubject = {
      ...subj,
      id: `grade_subj_local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    setGradeSubjects(prev => [...prev, newSubj]);
    setIsDirty(true);
  };

  const handleUpdateSubject = (id: string, updates: Partial<GradeSubject>) => {
    setGradeSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    setIsDirty(true);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Đạo hữu có chắc chắn muốn xóa môn học này?')) {
      setGradeSubjects(prev => prev.filter(s => s.id !== id));
      setIsDirty(true);
    }
  };



  // Focus Mode checkbox completion
  const handleFocusTaskComplete = (taskId: string) => {
    if (todoItems.some(t => t.id === taskId)) {
      handleToggleTodo(taskId);
    } else if (tasks.some(t => t.id === taskId)) {
      handleToggleTask(taskId);
    }
    setFocusSelectedTaskId('');
  };

  // Calculations for Cultivation Profile stats
  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 18 || currentHour < 6;

  return (
    <div className="min-h-screen text-slate-300 relative selection:bg-amber-500/20 selection:text-amber-300" id="main-applet-container">
      {/* ── Dynamic Galaxy Nebulae, Full-Screen Starfield & Meteor Shower Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20">
        {/* Deep Galaxy Space Background Base */}
        <div className="absolute inset-0 bg-[#05080e]" />

        {/* VIVID GALAXY NEBULAE (Khối Tinh Vân Galaxy Rực Rỡ) */}
        <div className="absolute -top-32 -left-32 w-[750px] h-[750px] bg-gradient-to-br from-purple-600/35 via-fuchsia-800/25 to-transparent rounded-full blur-[110px] animate-vivid-nebula-1" />
        <div className="absolute -bottom-40 -right-40 w-[850px] h-[850px] bg-gradient-to-tl from-cyan-500/30 via-indigo-900/25 to-transparent rounded-full blur-[120px] animate-vivid-nebula-2" />
        <div className="absolute top-[25%] left-[20%] w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/25 via-yellow-900/20 to-transparent rounded-full blur-[130px] animate-vivid-nebula-1" />

        {/* PERMANENT FULL-SCREEN TWINKLING STARFIELD (Hệ Thống 60 Ngôi Sao Phát Sáng Trải Đều Màn Hình) */}
        <div className="absolute inset-0">
          {Array.from({ length: 60 }).map((_, i) => {
            const top = (i * 1.65) % 100;
            const left = (i * 13.7) % 100;
            const size = 1 + (i % 3) * 0.8;
            const delay = (i * 0.25) % 4;
            return (
              <div
                key={`galaxy-star-${i}`}
                className="absolute bg-white rounded-full animate-twinkle"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${delay}s`,
                  boxShadow: '0 0 5px rgba(255, 255, 255, 0.9)',
                }}
              />
            );
          })}
        </div>

        {/* METEOR SHOWER (Mưa Sao Băng Đa Sắc Trải Đều Khắp Màn Hình - Negative Delay Instant Flight) */}
        {Array.from({ length: 22 }).map((_, i) => {
          // Spread meteors evenly across top & right coordinates so they fall everywhere on screen!
          const top = -15 + ((i % 6) * 20) + (Math.floor(i / 6) * 5);
          const right = -15 + (Math.floor(i / 3) * 15) + ((i % 3) * 10);
          const duration = 2.4 + (i % 5) * 0.5;
          // Negative delay makes animation start immediately in mid-flight on page load without any initial pause!
          const negativeDelay = -((i * 0.75) % duration).toFixed(2);
          const width = 110 + (i % 4) * 35;
          const colorClass = i % 3 === 0 ? 'shooting-star-cyan' : (i % 3 === 1 ? 'shooting-star-violet' : 'shooting-star-emerald');
          return (
            <div
              key={`meteor-${i}`}
              className={`shooting-star-item ${colorClass}`}
              style={{
                top: `${top}%`,
                right: `${right}%`,
                width: `${width}px`,
                animationDelay: `${negativeDelay}s`,
                animationDuration: `${duration}s`
              }}
            />
          );
        })}

        {/* Subtle Sacred Geometry Bagua Array Watermark Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-dashed border-amber-500/10 animate-spin-slow pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full border border-purple-500/10 border-dashed" />
        </div>
      </div>

      {/* ── Dynamic Weather Overlays ── */}

      {/* Rain falling particles */}
      {(soundscape === 'RAIN' || soundscape === 'THUNDER') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {Array.from({ length: 40 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = 0.6 + Math.random() * 0.5;
            return (
              <div
                key={`rain-${i}`}
                className="absolute w-[1px] h-[35px] bg-sky-300/20 animate-rain"
                style={{
                  left: `${left}%`,
                  top: `-40px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Campfire ember rising particles */}
      {soundscape === 'CAMPFIRE' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {Array.from({ length: 25 }).map((_, i) => {
            const left = 10 + Math.random() * 80;
            const delay = Math.random() * 4;
            const duration = 3.5 + Math.random() * 2.0;
            const size = 2 + Math.random() * 3;
            return (
              <div
                key={`ember-${i}`}
                className="absolute bg-amber-500/40 rounded-full animate-ember"
                style={{
                  left: `${left}%`,
                  bottom: `-10px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  boxShadow: '0 0 6px rgba(245, 158, 11, 0.7)',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Lightning Flash overlay */}
      {soundscape === 'THUNDER' && (
        <div className="fixed inset-0 bg-white pointer-events-none animate-lightning z-50 mix-blend-screen" />
      )}

      {/* Immersive background stars pattern */}
      <div className="absolute inset-0 bg-[#070a0f]/80 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 -z-10" />

      {/* Immersive purple vignette tà khí overlay if Tam Ma is active */}
      {checkTamMaActive() && cultState.tamMaSuppressedDate !== getLocalDateString() && (
        <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(168,85,247,0.18)] z-50 animate-pulse border-2 border-purple-500/10" />
      )}

      {/* MAIN HUB VIEW */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            {/* Top Navigation Bar / Metadata Backup Row */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 neo-card px-5 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <CompassIcon className="w-5 h-5 text-amber-500 animate-spin-slow" />
                <h1 className="text-sm font-extrabold uppercase tracking-widest text-slate-100 font-sans">
                  HUSTFlow <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded border-2 border-slate-950 font-bold ml-1.5 pixel-label">v1.1</span>
                </h1>
              </div>

              {/* Google Sign-in / Cloud Status Profile Widget */}
                {currentUser ? (
                  <div className="flex items-center gap-2 bg-slate-950 border-2 border-slate-950 p-1.5 rounded-lg text-[10px] font-sans shadow-[1px_1px_0px_#000]">
                    {/* User Google Avatar */}
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || 'Avatar'} 
                        className="w-4 h-4 rounded-full border border-amber-500/50" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                        {(currentUser.displayName || 'Đ').charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* User display name & Cloud Sync indicator */}
                    <div className="flex flex-col text-left max-w-28 shrink-0">
                      <span className="font-bold text-slate-200 truncate">{currentUser.displayName || 'Đạo Hữu'}</span>
                      <span className="text-[7.5px] text-emerald-400 font-mono flex items-center gap-0.5 leading-none">
                        {isCloudSyncing ? (
                          <span className="w-1.5 h-1.5 rounded-full border border-t-transparent border-emerald-400 animate-spin" />
                        ) : (
                          <Cloud className="w-2 h-2 animate-pulse" />
                        )}
                        Đám Mây
                      </span>
                    </div>

                    {/* Logout button */}
                    <button
                      onClick={async () => {
                        if (confirm('Đạo hữu có chắc chắn muốn đăng xuất và ngắt kết nối với đám mây?')) {
                          await firebaseLogout();
                          alert('Đã đăng xuất thành công.');
                        }
                      }}
                      className="ml-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/40 text-rose-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-[9px] rounded-lg border-2 border-slate-950 uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000]"
                  >
                    <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                    Đăng Nhập Google
                  </button>
                )}
            </header>

            {/* Profile Cultivation level banner */}
            <CultivationHeader
              state={cultState}
              onRename={setUserName}
              onBreakthrough={handleBreakthrough}
              userName={userName}
              onOpenAchievements={() => setIsAchievementsModalOpen(true)}
            />

            {/* Cảnh báo Tâm Ma Xâm Nhập */}
            {checkTamMaActive() && cultState.tamMaSuppressedDate !== getLocalDateString() && (
              <div className="bg-purple-950/25 border border-purple-900/60 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4 font-sans text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/15 border border-purple-500/25 rounded-xl text-purple-400 animate-bounce">
                    💀
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-purple-300 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      Tâm Ma Xâm Nhập Đạo Phủ!
                      <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full uppercase font-bold tracking-normal font-mono animate-pulse">
                        Hiệu suất Tu Vi -30%
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Đan điền đang bị tà khí bủa vây do trì hoãn đại nguyện quá hạn hoặc lười thiền định. Hãy hoàn thành các việc trễ hạn ngay, hoặc vào Tàng Bảo Các đổi Linh Thạch lấy <strong>Thanh Tâm Phù</strong> để giải trừ tà khí.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Tabs switcher */}
            <nav className="flex flex-wrap pb-3 text-[11px] font-bold gap-2 items-center select-none">
              {tabOrder.map(tabId => {
                const config = getTabConfig(tabId);
                if (!config.label) return null;
                const isSelected = activeTab === tabId;
                
                return (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={`py-2.5 px-4 border-2 border-slate-950 rounded-xl font-black cursor-pointer shrink-0 flex items-center gap-1.5 transition-all active:translate-y-[1.5px] active:translate-x-[1.5px] active:shadow-none ${
                      isSelected
                        ? `${config.colorClass}`
                        : 'bg-[#131924] text-slate-400 hover:text-slate-250 hover:bg-[#18202e]'
                    }`}
                    id={`tab-${tabId.toLowerCase().replace('_', '-')}`}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                );
              })}

              {/* Customize Tab Order trigger button */}
              <button
                type="button"
                onClick={() => setShowTabCustomizeModal(true)}
                className="py-2.5 px-4 border-2 border-slate-950 bg-[#0f141c]/80 hover:bg-[#17202e] text-slate-400 hover:text-slate-200 rounded-xl font-black cursor-pointer shrink-0 flex items-center gap-1.5 transition-all shadow-[2.5px_2.5px_0px_#000] active:translate-y-[1.5px] active:shadow-none border-dashed border-slate-750"
                title="Tùy chỉnh thứ tự các tab"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                Sắp xếp Tab
              </button>
            </nav>

            {/* Main Tabs contents rendering */}
            <main>
              <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${activeTab !== 'MEDITATION' ? 'hidden' : ''}`} id="meditation-tab-view">
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      <div className={isFocusMode ? "fixed inset-0 bg-[#05070a] z-50 flex flex-col items-center justify-center p-4 overflow-y-auto" : "w-full h-full flex flex-col"}>
                        {isFocusMode && (
                          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-5 -z-10" />
                        )}
                        <div className={isFocusMode ? "max-w-xl w-full flex flex-col items-center space-y-6 my-auto z-10" : "w-full h-full flex flex-col"}>
                          {isFocusMode && (
                            <div className="text-center space-y-1">
                              <span className="text-[10px] font-bold font-mono tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-3 py-1 rounded-full uppercase">
                                Cảnh Giới Bế Quan Tập Trung
                              </span>
                              <h1 className="text-xl font-bold text-slate-200 uppercase tracking-widest mt-2">Đạo Tâm Nhất Thống</h1>
                              <p className="text-xs text-slate-500">Giảm bớt xao nhãng, toàn lực khắc chế tâm ma học tập.</p>
                            </div>
                          )}

                          <MeditationTimer
                            state={cultState}
                            onMeditationComplete={handleMeditationComplete}
                            onPassiveQiTick={handlePassiveQiTick}
                            isFocusMode={isFocusMode}
                            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                            soundscape={soundscape}
                            onSoundscapeChange={setSoundscape}
                          />

                          {isFocusMode && (
                            <>
                              {/* Focusing task panel */}
                              <div className="bg-[#0f141c] border border-slate-800/80 p-5 rounded-2xl w-full text-center space-y-3 shadow-xl">
                                <h3 className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 uppercase">
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  Nhiệm Vụ Đang Khắc Chế
                                </h3>

                                {(() => {
                                  const pendingFocusTasks = [
                                    ...todoItems.filter(t => !t.isCompleted).map(t => ({ id: t.id, title: t.title })),
                                    ...tasks.filter(t => !t.isCompleted).map(t => ({ id: t.id, title: t.title }))
                                  ];
                                  const selectedTask = pendingFocusTasks.find(t => t.id === focusSelectedTaskId);

                                  return pendingFocusTasks.length > 0 ? (
                                    <div className="space-y-3">
                                      <select
                                        value={focusSelectedTaskId}
                                        onChange={(e) => setFocusSelectedTaskId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                      >
                                        <option value="">-- Chọn nhiệm vụ muốn tập trung làm --</option>
                                        {pendingFocusTasks.map(t => (
                                          <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                      </select>

                                      {selectedTask && (
                                        <div className="p-3 bg-emerald-950/10 border border-emerald-900/30 rounded-xl flex items-center justify-between gap-3 text-left">
                                          <span className="text-xs font-semibold text-slate-200">
                                            {selectedTask.title}
                                          </span>
                                          <button
                                            onClick={() => handleFocusTaskComplete(selectedTask.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                          >
                                            HOÀN THÀNH
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">Đạo phủ hiện không có nhiệm vụ tồn đọng nào!</p>
                                  );
                                })()}
                              </div>

                              {/* Exit button */}
                              <button
                                onClick={() => setIsFocusMode(false)}
                                className="text-[10px] text-slate-500 hover:text-rose-400 font-bold border border-slate-900 hover:border-rose-900/40 bg-slate-950/60 px-5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                XUẤT QUAN (QUAY LẠI TÔNG MÔN)
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <TaskSection
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onToggleTask={handleToggleTask}
                        onDeleteTask={handleDeleteTask}
                      />
                    </div>

                    <HabitSection
                      habits={habits}
                      onAddHabit={handleAddHabit}
                      onToggleHabitDay={handleToggleHabitDay}
                      onDeleteHabit={handleDeleteHabit}
                    />
                  </div>

                  <div className="space-y-6">
                    <StreakGrid dailyLogs={dailyLogs} todoItems={todoItems} />

                    <SpiritualGarden
                      plants={gardenPlants}
                      onClearGarden={() => setGardenPlants([])}
                    />
                  </div>
                </div>

              <div className={activeTab !== 'TODOS' ? 'hidden' : ''} id="todos-tab-view">
                <TodoSection
                  todoItems={todoItems}
                  onAddTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onSyncTodos={handleSyncTodos}
                  deletedGoogleTaskIds={deletedGoogleTaskIds}
                  onClearDeletedGoogleTaskIds={() => setDeletedGoogleTaskIds([])}
                />
              </div>

              <div className={activeTab !== 'SCHEDULE' ? 'hidden' : ''} id="schedule-tab-view">
                <ScheduleSection
                  manuals={manuals}
                  onUpdateManuals={setManuals}
                  calendarGroups={calendarGroups}
                  onUpdateCalendarGroups={setCalendarGroups}
                  calendarEvents={calendarEvents}
                  onUpdateCalendarEvents={setCalendarEvents}
                  todoItems={todoItems}
                />
              </div>

              <div className={activeTab !== 'STORE' ? 'hidden' : ''}>
                <TreasureStore
                  state={cultState}
                  onBuyItem={handleBuyItem}
                  onUseConsumable={handleUseConsumable}
                />
              </div>

              <div className={activeTab !== 'CAM_DIA' ? 'hidden' : ''}>
                <ForbiddenNotes notes={notes} onUpdateNotes={setNotes} />
              </div>

              <div className={activeTab !== 'IELTS_ARENA' ? 'hidden' : ''}>
                <IeltsMockTestLog
                  logs={ieltsLogs}
                  onAddLog={handleAddIeltsLog}
                  onDeleteLog={handleDeleteIeltsLog}
                  onUpdateLog={handleUpdateIeltsLog}
                  targets={ieltsTargets}
                  onUpdateTargets={setIeltsTargets}
                  camBooks={camBooksList}
                  onUpdateCamBooks={setCamBooksList}
                  onAddExp={addExp}
                />
              </div>

              <div className={activeTab !== 'CULT_PATH' ? 'hidden' : ''}>
                <CultivationManualsSection
                  manuals={manuals}
                  onAddManual={(newManual) => setManuals(prev => [newManual, ...prev])}
                  onUpdateManuals={setManuals}
                  onAddExp={addExp}
                  onAddTodo={handleAddTodo}
                />
              </div>

              <div className={activeTab !== 'ANALYTICS' ? 'hidden' : ''}>
                <PerformanceStats
                  challenges={challenges}
                  dailyLogs={dailyLogs}
                  onClaimChallenge={handleClaimChallenge}
                  onAddChallenge={handleAddChallenge}
                  onProgressChallenge={handleProgressChallenge}
                  onDeleteChallenge={handleDeleteChallenge}
                  tasks={tasks}
                  todoItems={todoItems}
                  currentUser={currentUser}
                  leaderboard={leaderboard}
                  isFetchingLeaderboard={isFetchingLeaderboard}
                  onRefreshLeaderboard={handleFetchLeaderboard}
                  state={cultState}
                />
              </div>

              <div className={activeTab !== 'GRADES' ? 'hidden' : ''}>
                <GradeSection
                  subjects={gradeSubjects}
                  semesterGpaList={semesterGpaList}
                  cpaOverall={cpaOverall}
                  spreadsheetId={spreadsheetId}
                  isSyncing={isSyncingGrades}
                  onSaveSpreadsheetId={setSpreadsheetId}
                  onSync={handleSyncGrades}
                  onAddSubject={handleAddSubject}
                  onUpdateSubject={handleUpdateSubject}
                  onDeleteSubject={handleDeleteSubject}
                />
              </div>
            </main>
          </div>

          {/* 🔮 Thiên Cơ Các (AI Planner) */}
          <AIPanel
            todoItems={todoItems}
            tasks={tasks}
            habits={habits}
            manuals={manuals}
            cultState={cultState}
            gradeSubjects={gradeSubjects}
            cpaOverall={cpaOverall}
            semesterGpaList={semesterGpaList}
            calendarEvents={calendarEvents}
            calendarGroups={calendarGroups}
            ieltsLogs={ieltsLogs}
            notes={notes}
            onAddTodo={handleAddTodo}
            onUpdateTodo={handleUpdateTodo}
            onAddCalendarEvent={(summary, startDate, endDate, calendarGroupId) => {
              const matchedGroup = calendarGroupId && calendarGroups.some(g => g.id === calendarGroupId)
                ? calendarGroupId
                : (calendarGroups.find(g => g.isPrimary) || calendarGroups[0])?.id || 'group_tasks';
              const newEvent: CalendarEvent = {
                id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                calendarId: matchedGroup,
                summary,
                start: { dateTime: startDate },
                end: { dateTime: endDate }
              };
              setCalendarEvents(prev => [...prev, newEvent]);
            }}
            onUpdateCalendarEvent={(eventId, summary, startDate, endDate) => {
              setCalendarEvents(prev => prev.map(evt => {
                if (evt.id === eventId) {
                  return {
                    ...evt,
                    summary,
                    start: { dateTime: startDate },
                    end: { dateTime: endDate }
                  };
                }
                return evt;
              }));
            }}
            onDeleteCalendarEvent={(eventId) => {
              setCalendarEvents(prev => prev.filter(evt => evt.id !== eventId));
            }}
            onCreateManual={(name, category, stages) => {
              const newManual: CultivationManual = {
                id: `manual_${Date.now()}`,
                name,
                category: (category as any) || 'Bách Khoa',
                tier: 'HUYEN',
                status: 'DANG_TU_LUYEN',
                createdAt: getLocalDateString(),
                stages: stages.map((title, idx) => ({
                  id: `stage_${Date.now()}_${idx}`,
                  title,
                  isCompleted: false,
                  tuViReward: 35
                }))
              };
              setManuals(prev => [newManual, ...prev]);
            }}
          />
          {/* ==================== CUSTOMIZE TAB ORDER MODAL ==================== */}
          {showTabCustomizeModal && (
            <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
              <div className="bg-[#0f141c] border-2 border-slate-950 p-6 rounded-2xl w-full max-w-md shadow-[6px_6px_0px_#000] relative flex flex-col max-h-[85vh]">
                <button
                  onClick={() => setShowTabCustomizeModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-400 animate-spin-slow" />
                    Sắp Xếp Vị Trí Tab Chức Năng
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Thay đổi thứ tự hiển thị các tab theo ý muốn. Sử dụng mũi tên lên/xuống để chuyển vị trí.</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
                  {tabOrder.map((tabId, idx) => {
                    const config = getTabConfig(tabId);
                    if (!config.label) return null;

                    const moveUp = () => {
                      if (idx === 0) return;
                      const nextOrder = [...tabOrder];
                      const temp = nextOrder[idx];
                      nextOrder[idx] = nextOrder[idx - 1];
                      nextOrder[idx - 1] = temp;
                      setTabOrder(nextOrder);
                    };

                    const moveDown = () => {
                      if (idx === tabOrder.length - 1) return;
                      const nextOrder = [...tabOrder];
                      const temp = nextOrder[idx];
                      nextOrder[idx] = nextOrder[idx + 1];
                      nextOrder[idx + 1] = temp;
                      setTabOrder(nextOrder);
                    };

                    return (
                      <div 
                        key={tabId}
                        className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] text-slate-600 font-mono font-bold w-4">#{idx + 1}</span>
                          <span className="shrink-0">{config.icon}</span>
                          <span className="font-extrabold text-slate-250 truncate">{config.label}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={moveUp}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-lg border border-slate-900 flex items-center justify-center transition-colors ${
                              idx === 0
                                ? 'bg-slate-950 text-slate-700 cursor-not-allowed opacity-40'
                                : 'bg-[#131924] text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer'
                            }`}
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={moveDown}
                            disabled={idx === tabOrder.length - 1}
                            className={`p-1.5 rounded-lg border border-slate-900 flex items-center justify-center transition-colors ${
                              idx === tabOrder.length - 1
                                ? 'bg-slate-950 text-slate-700 cursor-not-allowed opacity-40'
                                : 'bg-[#131924] text-slate-400 hover:text-slate-200 hover:bg-slate-900 cursor-pointer'
                            }`}
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-900 shrink-0 mt-4">
                  <button
                    onClick={() => setShowTabCustomizeModal(false)}
                    className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl border-2 border-slate-950 uppercase tracking-wider text-[11px] transition-all shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  >
                    Hoàn Tất Sắp Xếp
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Proactive Ritual Notification Bubble floating at bottom-right */}
          {(() => {
            const todayStr = getLocalDateString();
            const isPlanningPending = planningCompletedDate !== todayStr;
            const isReflectionPending = reflectionCompletedDate !== todayStr && new Date().getHours() >= 16;
            const isBubbleDismissed = dismissedAIBubbleDate === todayStr;
            const persona = (localStorage.getItem('tlk_ai_persona') as string) || 'MO_UYEN';

            if (isBubbleDismissed || (!isPlanningPending && !isReflectionPending)) return null;

            return (
              <div className="fixed bottom-24 right-6 z-40 max-w-xs sm:max-w-sm bg-[#0e131d] border-2 border-slate-950 p-3.5 rounded-2xl shadow-[6px_6px_0px_#000] animate-bounce-slow font-sans text-xs space-y-2 select-none">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold font-sans text-[12px] text-rose-300">
                    <span>
                      {persona === 'MO_UYEN' ? '🌸 UYỂN NHI:' : persona === 'TU_DO_NAM' ? '👺 TƯ ĐỒ NAM:' : '📜 TÔNG CHỦ THIÊN CƠ CÁC:'}
                    </span>
                  </div>
                  <button
                    onClick={() => setDismissedAIBubbleDate(todayStr)}
                    className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                    title="Ẩn thông báo hôm nay"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-200 leading-normal font-sans">
                  {persona === 'MO_UYEN' ? (
                    isPlanningPending
                      ? 'Sư huynh, Uyển Nhi thấy huynh chưa lập kế hoạch Vấn Đạo (Planning) hôm nay! Huynh hãy cùng Uyển Nhi định hình tâm cảnh nhé...'
                      : 'Sư huynh, đã đến canh tối rồi! Huynh hãy cùng Uyển Nhi tổng kết Kết Nhật (Reflection) đúc kết đạo quả hôm nay...'
                  ) : persona === 'TU_DO_NAM' ? (
                    isPlanningPending
                      ? 'Thiết Trụ! Ngươi chưa làm Nghi Thức Vấn Đạo hôm nay đấy! Mau lập kế hoạch 3 việc trọng tâm cho lão phu!'
                      : 'Thiết Trụ! Đã đến canh tối rồi, mau tổng kết Kết Nhật đúc kết đạo quả cho lão phu xem!'
                  ) : (
                    isPlanningPending
                      ? 'Đạo hữu chưa thực hiện Nghi Thức Vấn Đạo (Planning) hôm nay! Hãy định hình 3 việc trọng tâm để dẫn dắt đạo tâm.'
                      : 'Đã đến canh tối! Hãy thực hiện Nghi Thức Kết Nhật (Reflection) để đúc kết đạo quả hôm nay.'
                  )}
                </p>

                <div className="pt-1 flex items-center gap-2">
                  {isPlanningPending ? (
                    <button
                      onClick={() => setActiveRitualModal('PLANNING')}
                      className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl border border-slate-950 uppercase text-[10px] tracking-wider transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                    >
                      {persona === 'MO_UYEN' ? '🌸 CÙNG UYỂN NHI LẬP KẾ HOẠCH (+30 Tu Vi)' : '☀️ LẬP KẾ HOẠCH NGAY (+30 Tu Vi)'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveRitualModal('REFLECTION')}
                      className="w-full py-1.5 bg-purple-400 hover:bg-purple-300 text-slate-950 font-black rounded-xl border border-slate-950 uppercase text-[10px] tracking-wider transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
                    >
                      {persona === 'MO_UYEN' ? '🌙 CÙNG UYỂN NHI TỔNG KẾT (+30 Tu Vi)' : '🌙 TỔNG KẾT NGAY (+30 Tu Vi)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Daily Rituals Dedicated Modal */}
          <DailyRitualsModal
            isOpen={activeRitualModal !== 'NONE'}
            onClose={() => setActiveRitualModal('NONE')}
            initialType={activeRitualModal === 'REFLECTION' ? 'REFLECTION' : 'PLANNING'}
            todoItems={todoItems}
            dailyLogs={dailyLogs}
            onSyncTodos={setTodoItems}
            onAddExp={addExp}
            onCompletePlanning={setPlanningCompletedDate}
            onCompleteReflection={setReflectionCompletedDate}
          />

          {/* Achievements Modal */}
          <AchievementsModal
            isOpen={isAchievementsModalOpen}
            onClose={() => setIsAchievementsModalOpen(false)}
            state={cultState}
            currentStreak={getStreakFromLogs(dailyLogs)}
            gardenPlantsCount={gardenPlants.length}
            notesCount={notes.length}
            timeBlocksCount={timeBlocks.length}
            manualsCount={manuals.length}
            cpaScore={cpaOverall}
            onClaimAchievement={handleClaimAchievement}
            onEquipTitle={handleEquipTitle}
          />

          {/* Floating YouTube Lofi Player */}
          <FloatingLofiPlayer
            isOpen={soundscape === 'LOFI_YT'}
            onClose={() => setSoundscape('NONE')}
          />
        </div>
      );
    }
