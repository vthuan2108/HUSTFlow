/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'SO_CAP' | 'TRUNG_CAP' | 'CAO_CAP' | 'THAN_CAP';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  isCompleted: boolean;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;
  tuViReward: number;
  linhThachReward: number;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: Record<string, boolean>; // key: YYYY-MM-DD, value: boolean
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'CONSUMABLE' | 'PERMANENT';
  effectType: 'POMODORO_XP' | 'TASK_XP' | 'HABIT_XP' | 'INSTANT_XP' | 'COIN_BUFF' | 'SUCCESS_RATE';
  effectValue: number;
  icon: string;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  targetType: 'MEDITATION_MINUTES' | 'TASKS_COMPLETED' | 'HABITS_COMPLETED';
  targetValue: number;
  currentValue: number;
  tuViReward: number;
  linhThachReward: number;
  isClaimed: boolean;
}

export interface BottleneckRequirement {
  title: string;
  minMeditationMinutes?: number;
  minCompletedTasks?: number;
  minStreakDays?: number;
  requiredItemId?: string;
  requiredItemName?: string;
}

export interface Achievement {
  id: string;
  category: 'MEDITATION' | 'TASKS' | 'STREAK' | 'ACADEMICS' | 'GARDEN' | 'WEALTH' | 'REALM' | 'SPECIAL';
  title: string;
  description: string;
  icon: string;
  targetType: 
    | 'MEDITATION_MINUTES' 
    | 'TASKS_COMPLETED' 
    | 'STREAK_DAYS' 
    | 'LINH_THACH' 
    | 'SHOP_ITEMS' 
    | 'BREAKTHROUGHS' 
    | 'GARDEN_PLANTS' 
    | 'LEVEL' 
    | 'HABITS_COMPLETED' 
    | 'NOTES_COUNT' 
    | 'TIMEBLOCKS_COUNT' 
    | 'MANUALS_COUNT' 
    | 'CPA_SCORE' 
    | 'ACHIEVEMENTS_COUNT';
  targetValue: number;
  rewardLinhThach: number;
  titleToEquip: string;
}

export interface CultivationState {
  totalExp: number;
  currentExp: number;
  level: number; // 1 to 100
  linhThach: number;
  spiritStonesEarned: number;
  meditationMinutes: number;
  tasksCompletedCount: number;
  habitsCompletedCount: number;
  shieldActive: boolean;
  inventory: InventoryItem[];
  unlockedRealms: string[];
  tamMaSuppressedDate?: string; // YYYY-MM-DD
  tonThuongDanDienDate?: string; // YYYY-MM-DD
  activeSpells?: string[];
  claimedAchievements?: string[];
  equippedTitle?: string;
  breakthroughCount?: number;
  itemsBoughtCount?: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  tuViGained: number;
  meditationMinutes: number;
  tasksCompleted: number;
}

export interface IeltsTestLog {
  id: string;
  testName: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  essayTask1?: string;
  essayTask2?: string;
  promptImageUrl?: string;
  promptText?: string;
}

export interface IeltsTargets {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
}

export interface TimeBlock {
  id: string;
  taskId?: string; // Associated task if any
  title: string;
  startHour: number; // 0 to 23
  startMinute: number; // 0 or 30
  durationMinutes: number; // e.g. 30, 60, 120
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  color?: string; // Hex or CSS color
}

export interface TodoItem {
  id: string;
  title: string;
  type: 'DAY' | 'WEEK' | 'MONTH';
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  tuViReward: number;
  linhThachReward: number;
  googleTaskId?: string;
  dueDate?: string; // YYYY-MM-DD
  isPriority?: boolean;
  estimatedMinutes?: number;
  difficulty?: Priority;
}

export interface CultivationNote {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  color: 'slate' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'purple';
  createdAt: string;
  updatedAt: string;
}

export type ManualTier = 'HOANG' | 'HUYEN' | 'DIA' | 'THIEN' | 'THAN';

export interface CultivationStage {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  tuViReward: number;
}

export interface CultivationManual {
  id: string;
  name: string;
  category: string;
  tier: ManualTier;
  stages: CultivationStage[];
  status: 'CHUA_NHAP_MON' | 'DANG_TU_LUYEN' | 'DAI_VIEN_MAN';
  createdAt: string;
  completedAt?: string;
  examDate?: string; // Keep for backward compatibility
  midtermExamDate?: string; // YYYY-MM-DD
  finalExamDate?: string; // YYYY-MM-DD
  midtermLimitStageId?: string; // Stage ID marking the limit of the midterm exam
}
export interface GardenPlant {
  id: string;
  name: string;
  duration: number; // in minutes
  status: 'HARVESTED' | 'WITHERED';
  harvestedAt: string; // YYYY-MM-DD
  xpGained: number;
  linhThachGained: number;
}

export interface GradeSubject {
  id: string;
  semester: string;       // Ví dụ: "2024.1"
  name: string;           // Tên môn học
  credits: number;        // Số tín chỉ
  processWeight: number;  // Trọng số quá trình
  processScore: number;   // Điểm quá trình
  finalScore: number;     // Điểm cuối kì
  letterGrade?: string;   // Điểm chữ (thang 4)
  gpaScale4?: number;     // Điểm quy đổi (thang 4)
}

export interface SemesterGPA {
  semester: string;
  gpa: number;
  cpa: number;
}

export interface CalendarGroup {
  id: string;
  summary: string;
  backgroundColor: string;
  color?: string;
  isSelected: boolean;
  isPrimary?: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  color?: string;
}
