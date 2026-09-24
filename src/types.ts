/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'SO_CAP' | 'TRUNG_CAP' | 'CAO_CAP' | 'THAN_CAP';

/**
 * Normalizes any string, number, or variant to a valid Priority enum.
 * Supports Vietnamese ('Sơ Cấp', 'Trung Cấp', 'Cao Cấp', 'Thần Cấp', 'Khẩn Cấp', 'Cao', 'Thấp', etc.),
 * English ('Low', 'Medium', 'High', 'Urgent', 'Novice', 'Adept', 'Earth', 'Heaven'),
 * and XP/tuVi numbers (120 -> THAN_CAP, 60 -> CAO_CAP, 30 -> TRUNG_CAP, 15 -> SO_CAP).
 */
export function normalizePriority(val?: any): Priority {
  if (!val) return 'SO_CAP';

  if (typeof val === 'number') {
    if (val >= 120) return 'THAN_CAP';
    if (val >= 60) return 'CAO_CAP';
    if (val >= 30) return 'TRUNG_CAP';
    return 'SO_CAP';
  }

  if (typeof val !== 'string') return 'SO_CAP';

  const raw = val.trim().toUpperCase();

  // Exact matching for enum keys
  if (raw === 'SO_CAP' || raw === 'SO-CAP' || raw === 'SOCAP') return 'SO_CAP';
  if (raw === 'TRUNG_CAP' || raw === 'TRUNG-CAP' || raw === 'TRUNGCAP') return 'TRUNG_CAP';
  if (raw === 'CAO_CAP' || raw === 'CAO-CAP' || raw === 'CAOCAP') return 'CAO_CAP';
  if (raw === 'THAN_CAP' || raw === 'THAN-CAP' || raw === 'THANCAP') return 'THAN_CAP';

  // Normalize diacritics and spacing
  const nonAccent = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_\s]+/g, ' ');

  // 1. THAN_CAP / HEAVEN / URGENT / CRITICAL / DIVINE
  if (
    nonAccent.includes('THAN') ||
    nonAccent.includes('HEAVEN') ||
    nonAccent.includes('URGENT') ||
    nonAccent.includes('CRITICAL') ||
    nonAccent.includes('DIVINE') ||
    nonAccent.includes('HIGHEST') ||
    nonAccent.includes('MAX')
  ) {
    return 'THAN_CAP';
  }

  // 2. CAO_CAP / HIGH / EARTH / HARD / ADVANCED / KHAN CAP
  if (
    nonAccent.includes('CAO') ||
    nonAccent.includes('HIGH') ||
    nonAccent.includes('EARTH') ||
    nonAccent.includes('HARD') ||
    nonAccent.includes('ADVANCED') ||
    nonAccent.includes('KHAN')
  ) {
    return 'CAO_CAP';
  }

  // 3. TRUNG_CAP / MEDIUM / ADEPT / MODERATE / INTERMEDIATE / NORMAL
  if (
    nonAccent.includes('TRUNG') ||
    nonAccent.includes('MEDIUM') ||
    nonAccent.includes('ADEPT') ||
    nonAccent.includes('MODERATE') ||
    nonAccent.includes('INTERMEDIATE') ||
    nonAccent.includes('NORMAL') ||
    nonAccent.includes('MID')
  ) {
    return 'TRUNG_CAP';
  }

  // 4. SO_CAP / LOW / NOVICE / EASY / BASIC / THAP
  if (
    nonAccent.includes('SO') ||
    nonAccent.includes('LOW') ||
    nonAccent.includes('NOVICE') ||
    nonAccent.includes('EASY') ||
    nonAccent.includes('BASIC') ||
    nonAccent.includes('THAP')
  ) {
    return 'SO_CAP';
  }

  return 'SO_CAP';
}

/**
 * Returns canonical cultivation rewards (Tu Vi XP and Linh Thach Spirit Stones) for a given priority.
 */
export function getPriorityRewards(priority: Priority): { tuViReward: number; linhThachReward: number } {
  const norm = normalizePriority(priority);
  switch (norm) {
    case 'THAN_CAP':
      return { tuViReward: 120, linhThachReward: 75 };
    case 'CAO_CAP':
      return { tuViReward: 60, linhThachReward: 35 };
    case 'TRUNG_CAP':
      return { tuViReward: 30, linhThachReward: 15 };
    case 'SO_CAP':
    default:
      return { tuViReward: 15, linhThachReward: 5 };
  }
}

/**
 * Resolves the actual priority of a task or todo item, falling back to tuViReward if difficulty is undefined.
 */
export function getTodoPriority(todo?: { difficulty?: Priority; tuViReward?: number }): Priority {
  if (!todo) return 'SO_CAP';
  if (todo.difficulty) return normalizePriority(todo.difficulty);
  if (typeof todo.tuViReward === 'number') {
    if (todo.tuViReward >= 120) return 'THAN_CAP';
    if (todo.tuViReward >= 60) return 'CAO_CAP';
    if (todo.tuViReward >= 30) return 'TRUNG_CAP';
  }
  return 'SO_CAP';
}

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
  bottleneckStartStats?: {
    level: number;
    meditationMinutes: number;
    tasksCompletedCount: number;
  };
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  tuViGained: number;
  meditationMinutes: number;
  tasksCompleted: number;
  isStreakProtected?: boolean;
}

export interface StudocuDocument {
  id: string;
  url: string;
  title: string;
  pageCount: number;
  pageImages: string[];
  subjectTag: string;
  savedAt: string;
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
  credits?: number;
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
