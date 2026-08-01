/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
declare const chrome: any;

import { 
  TodoItem, 
  Habit, 
  GardenPlant, 
  CultivationState, 
  DailyLog,
  Task,
  Priority
} from '../types';
import MeditationTimer, { SoundscapeType } from './MeditationTimer';
import TaskSection from './TaskSection';
import HabitSection from './HabitSection';
import SpiritualGarden from './SpiritualGarden';
import { 
  ExternalLink,
  Flame
} from 'lucide-react';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NewTabApp() {
  // --- STATE SYSTEM (Mirrors App.tsx but synced via chrome.storage.local) ---
  const [userName, setUserName] = useState<string>('Tiêu Đạo Hữu');
  
  // Default values matching App.tsx to ensure rendering works even if storage is blank
  const [todoItems, setTodoItems] = useState<TodoItem[]>(() => {
    return [
      {
        id: 'todo_def_1',
        title: 'Tập trung luyện đề IELTS Listening Cam 18 Test 2',
        type: 'DAY',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        tuViReward: 30,
        linhThachReward: 10,
        dueDate: getLocalDateString()
      },
      {
        id: 'todo_def_2',
        title: 'Học 20 từ vựng chủ đề Environment qua Flashcard',
        type: 'DAY',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        tuViReward: 15,
        linhThachReward: 5,
        dueDate: getLocalDateString()
      },
      {
        id: 'todo_def_3',
        title: 'Hoàn thành bứt phá mục tiêu IELTS Overall tăng 0.5 band',
        type: 'MONTH',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        tuViReward: 120,
        linhThachReward: 40,
        dueDate: getLocalDateString()
      }
    ];
  });
  
  const [habits, setHabits] = useState<Habit[]>(() => {
    return [
      {
        id: 'default_habit_1',
        title: 'Tập phát âm IPA chuẩn IELTS Speaking',
        description: 'Luyện 15 phút gương mặt & cơ miệng',
        createdAt: new Date().toISOString(),
        streak: 0,
        history: {}
      },
      {
        id: 'default_habit_2',
        title: 'Viết nhật ký Tiếng Anh',
        description: 'Viết 5 câu kể về ngày hôm nay',
        createdAt: new Date().toISOString(),
        streak: 0,
        history: {}
      }
    ];
  });

  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [soundscape, setSoundscape] = useState<SoundscapeType>('NONE');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [hours, setHours] = useState<string>('00');
  const [minutes, setMinutes] = useState<string>('00');
  const [blink, setBlink] = useState<boolean>(true);
  const [greeting, setGreeting] = useState<string>('');

  const [cultState, setCultState] = useState<CultivationState>({
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
    unlockedRealms: ['Luyện Khí Kỳ']
  });

  // Derived tasks list
  const tasks: Task[] = useMemo(() => {
    return todoItems.map(todo => {
      let priority: Priority = 'SO_CAP';
      if (todo.tuViReward >= 120) priority = 'THAN_CAP';
      else if (todo.tuViReward >= 60) priority = 'CAO_CAP';
      else if (todo.tuViReward >= 30) priority = 'TRUNG_CAP';

      return {
        id: todo.id,
        title: todo.title,
        description: todo.type === 'WEEK' ? 'Nhiệm Vụ Hàng Tuần' : todo.type === 'MONTH' ? 'Nhiệm Vụ Hàng Tháng' : 'Nhiệm Vụ Hằng Ngày',
        priority,
        isCompleted: todo.isCompleted,
        dueDate: todo.dueDate || getLocalDateString(new Date(todo.createdAt)),
        createdAt: todo.createdAt,
        completedAt: todo.completedAt,
        tuViReward: todo.tuViReward,
        linhThachReward: todo.linhThachReward
      };
    });
  }, [todoItems]);

  // --- DIGITAL CLOCK & GREETINGS SYSTEM ---
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hr = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setHours(hr);
      setMinutes(min);
      setBlink(now.getSeconds() % 2 === 0);

      // Set greeting based on time of day
      const hourNum = now.getHours();
      if (hourNum >= 5 && hourNum < 11) {
        setGreeting('Chào buổi sáng, đạo hữu! Hãy bắt đầu một ngày tu luyện mới tinh tấn.');
      } else if (hourNum >= 11 && hourNum < 14) {
        setGreeting('Đã đến giờ ngọ, chúc đạo hữu tịnh tâm nghỉ ngơi dưỡng thần.');
      } else if (hourNum >= 14 && hourNum < 18) {
        setGreeting('Chào buổi chiều, chúc đạo hữu tu luyện hanh thông.');
      } else {
        setGreeting('Đêm đã sâu, hãy bế quan thiền định, củng cố đạo tâm.');
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSyncingFromStorage = useRef(false);

  // --- REAL-TIME CHROME STORAGE LOCAL SYNC ---
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      // 1. Initial read on load
      chrome.storage.local.get(['tlk_state'], (result: any) => {
        if (result.tlk_state) {
          const s = result.tlk_state;
          isSyncingFromStorage.current = true;
          if (s.userName !== undefined) setUserName(s.userName);
          if (s.todoItems !== undefined) setTodoItems(s.todoItems);
          if (s.habits !== undefined) setHabits(s.habits);
          if (s.cultState !== undefined) setCultState(s.cultState);
          if (s.gardenPlants !== undefined) setGardenPlants(s.gardenPlants);
          if (s.dailyLogs !== undefined) setDailyLogs(s.dailyLogs);
          setTimeout(() => {
            isSyncingFromStorage.current = false;
          }, 50);
        }
      });

      // 2. Real-time listener for changes from other pages (e.g. Web App)
      const listener = (changes: any) => {
        if (changes.tlk_state && changes.tlk_state.newValue) {
          const s = changes.tlk_state.newValue;
          if (s.sender === 'extension') return; // Skip updates we made ourselves

          isSyncingFromStorage.current = true;
          if (s.userName !== undefined) setUserName(s.userName);
          if (s.todoItems !== undefined) setTodoItems(s.todoItems);
          if (s.habits !== undefined) setHabits(s.habits);
          if (s.cultState !== undefined) setCultState(s.cultState);
          if (s.gardenPlants !== undefined) setGardenPlants(s.gardenPlants);
          if (s.dailyLogs !== undefined) setDailyLogs(s.dailyLogs);
          setTimeout(() => {
            isSyncingFromStorage.current = false;
          }, 50);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => {
        chrome.storage.onChanged.removeListener(listener);
      };
    }
  }, []);

  // Blocker listener for shared MeditationTimer component inside the extension
  useEffect(() => {
    const handleBlockerSync = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(customEvent.detail, (_response: any) => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.log("HUSTFlow NewTab Blocker: status:", err.message);
          }
        });
      }
    };

    window.addEventListener('TLK_BLOCKER_SYNC', handleBlockerSync);
    return () => {
      window.removeEventListener('TLK_BLOCKER_SYNC', handleBlockerSync);
    };
  }, []);

  // 3. Automatically save state to storage on changes (Extension -> Web App)
  useEffect(() => {
    if (isSyncingFromStorage.current) return;

    const timeoutId = setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stateToSave = {
          userName,
          todoItems,
          habits,
          cultState,
          gardenPlants,
          dailyLogs,
          lastUpdated: Date.now(),
          sender: 'extension'
        };

        chrome.storage.local.set({ tlk_state: stateToSave }, () => {
          // Broadcast update to open Web tabs
          if (chrome.tabs) {
            chrome.tabs.query({}, (tabs: any[]) => {
              tabs.forEach((tab: any) => {
                if (tab.id) {
                  chrome.tabs.sendMessage(tab.id, { action: 'EXTENSION_STATE_UPDATED', state: stateToSave }, () => {
                    chrome.runtime.lastError; // Suppress console warn of tabs without content scripts
                  });
                }
              });
            });
          }
        });
      }
    }, 150); // 150ms debounce to batch concurrent state updates cleanly

    return () => clearTimeout(timeoutId);
  }, [userName, todoItems, habits, cultState, gardenPlants, dailyLogs]);

  // --- XP & CULTIVATION LEVEL UP SYSTEM ---
  const addExp = (xpGained: number, linhThachGained: number) => {
    setCultState(prev => {
      let newLevel = prev.level;
      let newExp = prev.currentExp + xpGained;
      const expNeeded = newLevel * 100;

      if (newExp >= expNeeded) {
        newExp -= expNeeded;
        newLevel += 1;
      } else if (newExp < 0 && newLevel > 1) {
        newLevel -= 1;
        newExp += newLevel * 100;
      }

      const updated = {
        ...prev,
        level: newLevel,
        currentExp: Math.max(0, newExp),
        totalExp: Math.max(0, prev.totalExp + xpGained),
        linhThach: Math.max(0, prev.linhThach + linhThachGained),
        spiritStonesEarned: Math.max(0, prev.spiritStonesEarned + (linhThachGained > 0 ? linhThachGained : 0))
      };
      return updated;
    });
  };

  // --- DAILY LOGS TRACKING ---
  const updateDailyLog = (xp: number, minutes: number, completedCount: number) => {
    const today = getLocalDateString();
    setDailyLogs(prev => {
      const logs = [...prev];
      const existing = logs.find(l => l.date === today);
      if (existing) {
        existing.tuViGained += xp;
        existing.meditationMinutes += minutes;
        existing.tasksCompleted += completedCount;
      } else {
        logs.push({
          date: today,
          tuViGained: xp,
          meditationMinutes: minutes,
          tasksCompleted: completedCount
        });
      }
      return logs;
    });
  };

  // --- TASK SECTION HANDLERS ---
  const handleAddTask = (title: string, priority: Priority, dueDate: string, _description?: string) => {
    let tuViReward = 15;
    let linhThachReward = 5;
    if (priority === 'TRUNG_CAP') {
      tuViReward = 30;
      linhThachReward = 15;
    } else if (priority === 'CAO_CAP') {
      tuViReward = 60;
      linhThachReward = 35;
    } else if (priority === 'THAN_CAP') {
      tuViReward = 120;
      linhThachReward = 75;
    }

    const newTodo: TodoItem = {
      id: `todo_${Date.now()}`,
      title,
      type: 'DAY',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      tuViReward,
      linhThachReward,
      dueDate,
      difficulty: priority === 'THAN_CAP' ? 'THAN_CAP' : priority === 'CAO_CAP' ? 'CAO_CAP' : priority === 'TRUNG_CAP' ? 'TRUNG_CAP' : 'SO_CAP'
    };

    const nextTodos = [newTodo, ...todoItems];
    setTodoItems(nextTodos);
  };

  const handleToggleTask = (id: string) => {
    const nextTodos = todoItems.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.isCompleted;
        // Compute rewards
        let tuViReward = 15;
        let linhThachReward = 5;
        if (t.difficulty === 'TRUNG_CAP') {
          tuViReward = 30;
          linhThachReward = 15;
        } else if (t.difficulty === 'CAO_CAP') {
          tuViReward = 60;
          linhThachReward = 35;
        } else if (t.difficulty === 'THAN_CAP') {
          tuViReward = 120;
          linhThachReward = 75;
        }

        if (nextCompleted) {
          addExp(tuViReward, linhThachReward);
          updateDailyLog(tuViReward, 0, 1);
        } else {
          addExp(-tuViReward, -linhThachReward);
          updateDailyLog(-tuViReward, 0, -1);
        }

        return {
          ...t,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return t;
    });

    setTodoItems(nextTodos);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Đạo hữu có chắc chắn muốn xóa nhiệm vụ này?')) {
      const nextTodos = todoItems.filter(t => t.id !== id);
      setTodoItems(nextTodos);
    }
  };

  // --- HABIT SECTION HANDLERS ---
  const handleAddHabit = (title: string, description?: string) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      title,
      description,
      createdAt: new Date().toISOString(),
      streak: 0,
      history: {}
    };

    const nextHabits = [...habits, newHabit];
    setHabits(nextHabits);
  };

  const handleToggleHabitDay = (id: string, dateStr: string) => {
    const nextHabits = habits.map(h => {
      if (h.id === id) {
        const history = { ...h.history };
        const isChecked = !history[dateStr];
        history[dateStr] = isChecked;

        // Recalculate streak
        let streak = h.streak;
        if (dateStr === getLocalDateString()) {
          streak = isChecked ? streak + 1 : Math.max(0, streak - 1);
        }

        // Grant daily habit reward (10 XP & 3 Linh Thach)
        if (isChecked) {
          addExp(10, 3);
          updateDailyLog(10, 0, 0);
        } else {
          addExp(-10, -3);
          updateDailyLog(-10, 0, 0);
        }

        return { ...h, streak, history };
      }
      return h;
    });

    setHabits(nextHabits);
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Đạo hữu có chắc chắn muốn xóa thói quen này?')) {
      const nextHabits = habits.filter(h => h.id !== id);
      setHabits(nextHabits);
    }
  };

  // --- MEDITATION / POMODORO TIMER HANDLERS ---
  const handleMeditationComplete = (
    minutes: number,
    xpGained = 50,
    linhThachGained = 30,
    plantName?: string,
    plantStatus?: 'HARVESTED' | 'WITHERED'
  ) => {
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
      const nextPlants = [newPlant, ...gardenPlants];
      setGardenPlants(nextPlants);
      return;
    }

    addExp(xpGained, linhThachGained);
    updateDailyLog(xpGained, minutes, 0);

    // Update local state for meditation minutes
    setCultState(prev => {
      return { ...prev, meditationMinutes: prev.meditationMinutes + minutes };
    });

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
      const nextPlants = [newPlant, ...gardenPlants];
      setGardenPlants(nextPlants);
    }
  };

  const handlePassiveQiTick = (tuViGained: number) => {
    addExp(tuViGained, 0);
  };

  const handleClearGarden = () => {
    if (confirm('Đạo hữu có chắc muốn quy hoạch lại toàn bộ linh điền? Cây thuốc đã thu hoạch sẽ bị dọn dẹp.')) {
      setGardenPlants([]);
    }
  };

  // Retrieve app home URL (saved in localStorage or default to localhost:3000)
  const appHomeUrl = localStorage.getItem('hustflow_app_url') || localStorage.getItem('zenflow_app_url') || 'http://localhost:3000/';

  return (
    <div className="min-h-screen w-screen text-slate-300 relative flex flex-col justify-between p-6 bg-[#070a0f] overflow-y-auto">
      
      {/* Extension Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-100 font-mono">
            HUSTFlow Hộ Pháp
          </span>
        </div>
        <a 
          href={appHomeUrl} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] rounded-lg border border-slate-950 uppercase transition-all shadow-[1.5px_1.5px_0px_#000] active:translate-y-[1px] active:shadow-none cursor-pointer"
        >
          Trang Chủ Tông Môn
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Main Momentum Dashboard Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-start items-center z-10 space-y-6 mb-6">
        
        {/* A. DIGITAL CLOCK & GREETINGS PANEL */}
        <div className="text-center space-y-1 select-none shrink-0 mb-2">
          <h1 className="text-7xl md:text-8xl font-retro text-amber-400 leading-none tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] select-text flex items-center justify-center gap-1.5">
            <span>{hours}</span>
            <span className={blink ? 'opacity-100' : 'opacity-15'} style={{ transition: 'opacity 0.2s' }}>:</span>
            <span>{minutes}</span>
          </h1>
          <p className="text-[11px] font-medium text-slate-400/90 italic drop-shadow max-w-xl mx-auto select-text pt-2.5">
            {greeting}
          </p>
        </div>

        {/* C. MAIN WIDGETS GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full">
          
          {/* Column 1: MeditationTimer */}
          <MeditationTimer
            state={cultState}
            onMeditationComplete={handleMeditationComplete}
            onPassiveQiTick={handlePassiveQiTick}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            soundscape={soundscape}
            onSoundscapeChange={setSoundscape}
          />
          
          {/* Column 2: TaskSection */}
          <TaskSection
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />

          {/* Column 3: Spiritual Garden + Habit Section */}
          <div className="flex flex-col gap-6">
            <SpiritualGarden
              plants={gardenPlants}
              onClearGarden={handleClearGarden}
            />
            <HabitSection
              habits={habits}
              onAddHabit={handleAddHabit}
              onToggleHabitDay={handleToggleHabitDay}
              onDeleteHabit={handleDeleteHabit}
            />
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-[8px] text-slate-700 font-mono z-10 uppercase select-none shrink-0 border-t border-slate-900 mt-4 pt-4">
        HUSTFlow Hộ Pháp © 2026 • Đồng Bộ Cảnh Giới 2 Chiều
        {dailyLogs.length === -1 && <span>{userName}</span>}
      </footer>

    </div>
  );
}
