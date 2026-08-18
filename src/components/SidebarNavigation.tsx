/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CultivationState } from '../types';
import { getRealmInfo, RealmInfo, STORE_ITEMS } from '../data';
import { 
  Flame, 
  ListTodo, 
  Calendar, 
  BookOpen, 
  Scroll, 
  Compass as CompassIcon, 
  GraduationCap, 
  Sparkles, 
  Lock, 
  SlidersHorizontal,
  Gem,
  Shield,
  Award,
  Trophy,
  Edit3,
  X,
  Zap,
  Music,
  Link as LinkIcon,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Play,
  ChevronRight,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function getYouTubeId(url: string): string {
  if (!url) return 'sF80I-TQiW0';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : (url.length === 11 ? url : 'sF80I-TQiW0');
}

interface SidebarNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  cultivationState: CultivationState;
  userName: string;
  onRename: (newName: string) => void;
  onBreakthrough: (success: boolean) => void;
  onOpenAchievements?: () => void;
  onOpenTabCustomize?: () => void;
  tabOrder?: string[];
  getTabConfig?: (id: string) => { label: string; icon: React.ReactNode; colorClass: string };
  isLofiActive?: boolean;
  onCloseLofi?: () => void;
  isPomodoroRunning?: boolean;
}

interface RealmStyle {
  text: string;
  glow: string;
  gradient: string;
  glowBorder: string;
  particle: string;
  badgeBg: string;
}

const REALM_STYLES: Record<string, RealmStyle> = {
  'Ngưng Khí Kỳ': { 
    text: 'text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]', 
    glow: 'from-slate-500/10 to-transparent',
    gradient: 'from-slate-500 via-slate-400 to-slate-500',
    glowBorder: 'border-slate-800/80 shadow-[0_0_20px_rgba(148,163,184,0.05)]',
    particle: 'bg-slate-400',
    badgeBg: 'bg-slate-950/80 border-slate-800/80 text-slate-400'
  },
  'Trúc Cơ Kỳ': { 
    text: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]', 
    glow: 'from-blue-500/15 to-transparent',
    gradient: 'from-blue-500 via-cyan-400 to-blue-500',
    glowBorder: 'border-blue-900/40 shadow-[0_0_25px_rgba(59,130,246,0.1)]',
    particle: 'bg-blue-400',
    badgeBg: 'bg-blue-950/60 border-blue-900/40 text-blue-400'
  },
  'Kết Đan Kỳ': { 
    text: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]', 
    glow: 'from-emerald-500/15 to-transparent',
    gradient: 'from-emerald-500 via-teal-400 to-emerald-500',
    glowBorder: 'border-emerald-900/40 shadow-[0_0_25px_rgba(16,185,129,0.1)]',
    particle: 'bg-emerald-400',
    badgeBg: 'bg-emerald-950/60 border-emerald-900/40 text-emerald-400'
  },
  'Nguyên Anh Kỳ': { 
    text: 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]', 
    glow: 'from-purple-500/15 to-transparent',
    gradient: 'from-purple-500 via-fuchsia-400 to-purple-500',
    glowBorder: 'border-purple-900/40 shadow-[0_0_30px_rgba(168,85,247,0.12)]',
    particle: 'bg-purple-400',
    badgeBg: 'bg-purple-950/60 border-purple-900/40 text-purple-400'
  },
  'Hóa Thần Kỳ': { 
    text: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]', 
    glow: 'from-amber-500/15 to-transparent',
    gradient: 'from-amber-500 via-yellow-400 to-amber-500',
    glowBorder: 'border-amber-900/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    particle: 'bg-amber-400',
    badgeBg: 'bg-amber-950/60 border-amber-900/40 text-amber-400'
  },
  'Anh Biến Kỳ': { 
    text: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]', 
    glow: 'from-orange-500/15 to-transparent',
    gradient: 'from-orange-500 via-amber-400 to-orange-500',
    glowBorder: 'border-orange-900/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    particle: 'bg-orange-400',
    badgeBg: 'bg-orange-950/60 border-orange-900/40 text-orange-400'
  },
  'Vấn Đỉnh Kỳ': { 
    text: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]', 
    glow: 'from-rose-500/15 to-transparent',
    gradient: 'from-rose-500 via-pink-400 to-rose-500',
    glowBorder: 'border-rose-900/40 shadow-[0_0_35px_rgba(244,63,94,0.18)]',
    particle: 'bg-rose-400',
    badgeBg: 'bg-rose-950/60 border-rose-900/40 text-rose-400'
  },
  'Cảnh Giới Quá Độ': { 
    text: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]', 
    glow: 'from-pink-500/15 to-transparent',
    gradient: 'from-pink-500 via-rose-400 to-pink-500',
    glowBorder: 'border-pink-900/40 shadow-[0_0_30px_rgba(236,72,153,0.15)]',
    particle: 'bg-pink-400',
    badgeBg: 'bg-pink-950/60 border-pink-900/40 text-pink-400'
  },
  'Khuy Niết Kỳ': { 
    text: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]', 
    glow: 'from-cyan-500/20 to-transparent',
    gradient: 'from-cyan-500 via-sky-400 to-cyan-500',
    glowBorder: 'border-cyan-900/50 shadow-[0_0_35px_rgba(6,182,212,0.2)]',
    particle: 'bg-cyan-400',
    badgeBg: 'bg-cyan-950/70 border-cyan-800/60 text-cyan-300'
  },
  'Tịnh Niết Kỳ': { 
    text: 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]', 
    glow: 'from-sky-500/20 to-transparent',
    gradient: 'from-sky-500 via-blue-400 to-sky-500',
    glowBorder: 'border-sky-900/50 shadow-[0_0_35px_rgba(14,165,233,0.2)]',
    particle: 'bg-sky-400',
    badgeBg: 'bg-sky-950/70 border-sky-800/60 text-sky-300'
  },
  'Toái Niết Kỳ': { 
    text: 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]', 
    glow: 'from-indigo-500/20 to-transparent',
    gradient: 'from-indigo-500 via-violet-400 to-indigo-500',
    glowBorder: 'border-indigo-900/50 shadow-[0_0_35px_rgba(99,102,241,0.2)]',
    particle: 'bg-indigo-400',
    badgeBg: 'bg-indigo-950/70 border-indigo-800/60 text-indigo-300'
  },
  'Thiên Nhân Ngũ Suy': { 
    text: 'text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.7)]', 
    glow: 'from-violet-500/25 to-transparent',
    gradient: 'from-violet-500 via-purple-400 to-violet-500',
    glowBorder: 'border-violet-800/60 shadow-[0_0_40px_rgba(139,92,246,0.25)]',
    particle: 'bg-violet-400',
    badgeBg: 'bg-violet-950/80 border-violet-700/60 text-violet-300'
  },
  'Không Niết Cảnh': { 
    text: 'text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.7)]', 
    glow: 'from-fuchsia-500/25 to-transparent',
    gradient: 'from-fuchsia-500 via-pink-400 to-fuchsia-500',
    glowBorder: 'border-fuchsia-800/60 shadow-[0_0_40px_rgba(217,70,239,0.25)]',
    particle: 'bg-fuchsia-400',
    badgeBg: 'bg-fuchsia-950/80 border-fuchsia-700/60 text-fuchsia-300'
  },
  'Không Linh Cảnh': { 
    text: 'text-teal-300 drop-shadow-[0_0_10px_rgba(94,234,212,0.7)]', 
    glow: 'from-teal-500/25 to-transparent',
    gradient: 'from-teal-500 via-emerald-400 to-teal-500',
    glowBorder: 'border-teal-800/60 shadow-[0_0_40px_rgba(20,184,166,0.25)]',
    particle: 'bg-teal-400',
    badgeBg: 'bg-teal-950/80 border-teal-700/60 text-teal-300'
  },
  'Không Huyền Cảnh': { 
    text: 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]', 
    glow: 'from-yellow-500/25 to-transparent',
    gradient: 'from-yellow-500 via-amber-400 to-yellow-500',
    glowBorder: 'border-yellow-800/60 shadow-[0_0_40px_rgba(234,179,8,0.25)]',
    particle: 'bg-yellow-400',
    badgeBg: 'bg-yellow-950/80 border-yellow-700/60 text-yellow-300'
  },
  'Huyền Kiếp Cảnh (9 Kiếp)': { 
    text: 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.7)]', 
    glow: 'from-red-500/25 to-transparent',
    gradient: 'from-red-500 via-rose-500 to-red-500',
    glowBorder: 'border-red-800/60 shadow-[0_0_40px_rgba(239,68,68,0.25)]',
    particle: 'bg-red-400',
    badgeBg: 'bg-red-950/80 border-red-700/60 text-red-300'
  },
  'Không Kiếp Cảnh (Đại Tôn)': { 
    text: 'text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]', 
    glow: 'from-amber-500/30 to-transparent',
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    glowBorder: 'border-amber-600/70 shadow-[0_0_45px_rgba(245,158,11,0.3)]',
    particle: 'bg-amber-300',
    badgeBg: 'bg-amber-950/90 border-amber-600/70 text-amber-300'
  },
  'Bán Bộ Đạp Thiên': { 
    text: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(110,231,183,0.8)]', 
    glow: 'from-emerald-500/30 to-transparent',
    gradient: 'from-emerald-400 via-teal-300 to-emerald-500',
    glowBorder: 'border-emerald-500/70 shadow-[0_0_45px_rgba(16,185,129,0.3)]',
    particle: 'bg-emerald-300',
    badgeBg: 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300'
  },
  'Đạp Thiên Cảnh': { 
    text: 'text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]', 
    glow: 'from-amber-500/40 to-transparent',
    gradient: 'from-amber-400 via-rose-500 to-purple-500',
    glowBorder: 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)]',
    particle: 'bg-amber-200',
    badgeBg: 'bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-amber-950/80 border-amber-400 text-amber-200'
  },
};

const TAB_THEMES: Record<string, { 
  label: string; 
  icon: React.ReactNode; 
  activeBg: string; 
  activeText: string; 
  activeBorder: string; 
  iconColor: string; 
  arrowColor: string;
}> = {
  MEDITATION: {
    label: 'Thiền Định Pomodoro',
    icon: <Flame className="w-4 h-4" />,
    activeBg: 'bg-amber-950/40',
    activeText: 'text-amber-300 font-extrabold',
    activeBorder: 'border-amber-500/80 shadow-[2px_2px_0px_#f59e0b40]',
    iconColor: 'text-amber-400',
    arrowColor: 'text-amber-400'
  },
  TODOS: {
    label: 'Nhiệm Vụ Tông Môn',
    icon: <ListTodo className="w-4 h-4" />,
    activeBg: 'bg-emerald-950/40',
    activeText: 'text-emerald-300 font-extrabold',
    activeBorder: 'border-emerald-500/80 shadow-[2px_2px_0px_#10b98140]',
    iconColor: 'text-emerald-400',
    arrowColor: 'text-emerald-400'
  },
  SCHEDULE: {
    label: 'Lịch trình',
    icon: <Calendar className="w-4 h-4" />,
    activeBg: 'bg-sky-950/40',
    activeText: 'text-sky-300 font-extrabold',
    activeBorder: 'border-sky-500/80 shadow-[2px_2px_0px_#0ea5e940]',
    iconColor: 'text-sky-400',
    arrowColor: 'text-sky-400'
  },
  IELTS_ARENA: {
    label: 'Ielts logs',
    icon: <BookOpen className="w-4 h-4" />,
    activeBg: 'bg-indigo-950/40',
    activeText: 'text-indigo-300 font-extrabold',
    activeBorder: 'border-indigo-500/80 shadow-[2px_2px_0px_#6366f140]',
    iconColor: 'text-indigo-400',
    arrowColor: 'text-indigo-400'
  },
  CULT_PATH: {
    label: 'Tiên Lộ (Lộ Trình)',
    icon: <Scroll className="w-4 h-4" />,
    activeBg: 'bg-purple-950/40',
    activeText: 'text-purple-300 font-extrabold',
    activeBorder: 'border-purple-500/80 shadow-[2px_2px_0px_#a855f740]',
    iconColor: 'text-purple-400',
    arrowColor: 'text-purple-400'
  },
  ANALYTICS: {
    label: 'Đạo Nhãn Thống Kê',
    icon: <CompassIcon className="w-4 h-4" />,
    activeBg: 'bg-pink-950/40',
    activeText: 'text-pink-300 font-extrabold',
    activeBorder: 'border-pink-500/80 shadow-[2px_2px_0px_#ec489940]',
    iconColor: 'text-pink-400',
    arrowColor: 'text-pink-400'
  },
  GRADES: {
    label: 'Điểm số',
    icon: <GraduationCap className="w-4 h-4" />,
    activeBg: 'bg-blue-950/40',
    activeText: 'text-blue-300 font-extrabold',
    activeBorder: 'border-blue-500/80 shadow-[2px_2px_0px_#3b82f640]',
    iconColor: 'text-blue-400',
    arrowColor: 'text-blue-400'
  },
  STORE: {
    label: 'Tàng Bảo Các (Shop)',
    icon: <Sparkles className="w-4 h-4" />,
    activeBg: 'bg-rose-950/40',
    activeText: 'text-rose-300 font-extrabold',
    activeBorder: 'border-rose-500/80 shadow-[2px_2px_0px_#f43f5e40]',
    iconColor: 'text-rose-400',
    arrowColor: 'text-rose-400'
  },
  CAM_DIA: {
    label: 'Cấm Địa Tông Môn',
    icon: <Lock className="w-4 h-4" />,
    activeBg: 'bg-red-950/40',
    activeText: 'text-red-300 font-extrabold',
    activeBorder: 'border-red-500/80 shadow-[2px_2px_0px_#ef444440]',
    iconColor: 'text-red-500',
    arrowColor: 'text-red-500'
  },
  TANG_KINH_CAC: {
    label: 'Tàng Kinh Các (Studocu)',
    icon: <Library className="w-4 h-4" />,
    activeBg: 'bg-indigo-950/40',
    activeText: 'text-indigo-300 font-extrabold',
    activeBorder: 'border-indigo-500/80 shadow-[2px_2px_0px_#6366f140]',
    iconColor: 'text-indigo-400',
    arrowColor: 'text-indigo-400'
  },
};

export default function SidebarNavigation({
  activeTab,
  onTabChange,
  cultivationState,
  userName,
  onRename,
  onBreakthrough,
  onOpenAchievements,
  onOpenTabCustomize,
  tabOrder,
  getTabConfig,
  isLofiActive = false,
  onCloseLofi,
  isPomodoroRunning = false
}: SidebarNavigationProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isBreakthroughModalOpen, setIsBreakthroughModalOpen] = useState(false);
  const [breakthroughResult, setBreakthroughResult] = useState<'IDLE' | 'ANIMATING' | 'SUCCESS' | 'FAILED'>('IDLE');

  // Lofi Player custom URL & autoSync state
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => {
    return localStorage.getItem('tlk_lofi_yt_url') || 'https://www.youtube.com/watch?v=sF80I-TQiW0&list=RDsF80I-TQiW0&start_radio=1';
  });

  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('tlk_lofi_yt_sync') !== 'false';
  });

  const [inputUrl, setInputUrl] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [isLofiMinimized, setIsLofiMinimized] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('tlk_lofi_yt_url', youtubeUrl);
  }, [youtubeUrl]);

  useEffect(() => {
    localStorage.setItem('tlk_lofi_yt_sync', String(autoSync));
  }, [autoSync]);

  const currentVideoId = getYouTubeId(youtubeUrl);
  const shouldPlayLofi = !autoSync || isPomodoroRunning;

  const safeState = cultivationState || {};
  const safeInventory = Array.isArray(safeState.inventory) ? safeState.inventory : [];
  const level = safeState.level || 1;
  const currentExp = safeState.currentExp || 0;
  const linhThach = safeState.linhThach || 0;
  const shieldActive = safeState.shieldActive || false;
  const equippedTitle = safeState.equippedTitle || '';
  const realmInfo: RealmInfo = getRealmInfo(level);
  const realmStyle: RealmStyle = REALM_STYLES[realmInfo.name] || REALM_STYLES['Vấn Đỉnh Kỳ'];

  const xpNeeded = realmInfo.xpNeeded || 100;
  const rawPercentage = Math.round((currentExp / xpNeeded) * 100);
  const xpPercentage = Math.min(rawPercentage, 100);

  // Bottleneck requirements logic
  const isBottleneck = !!realmInfo.bottleneck;
  const bottleneckReq = realmInfo.bottleneck;
  const safeMeditationMinutes = safeState.meditationMinutes || 0;
  const safeTasksCompletedCount = safeState.tasksCompletedCount || 0;

  const bottleneckStartMeditation = (safeState.bottleneckStartStats?.level === level)
    ? (safeState.bottleneckStartStats.meditationMinutes || 0)
    : 0;
  const bottleneckStartTasks = (safeState.bottleneckStartStats?.level === level)
    ? (safeState.bottleneckStartStats.tasksCompletedCount || 0)
    : 0;

  const safeMeditationDiff = Math.max(0, safeMeditationMinutes - bottleneckStartMeditation);
  const safeTasksDiff = Math.max(0, safeTasksCompletedCount - bottleneckStartTasks);

  let bottleneckMet = true;
  if (isBottleneck && bottleneckReq) {
    if (bottleneckReq.minMeditationMinutes && safeMeditationDiff < bottleneckReq.minMeditationMinutes) {
      bottleneckMet = false;
    }
    if (bottleneckReq.minCompletedTasks && safeTasksDiff < bottleneckReq.minCompletedTasks) {
      bottleneckMet = false;
    }
    if (bottleneckReq.requiredItemId) {
      const hasItem = safeInventory.some(i => i && i.itemId === bottleneckReq.requiredItemId && i.quantity > 0);
      if (!hasItem) bottleneckMet = false;
    }
  }

  const canBreakthrough = currentExp >= xpNeeded && bottleneckMet;
  const successRate = isBottleneck ? 45 : Math.max(90 - (level * 1.5), 35);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRename(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setYoutubeUrl(inputUrl.trim());
    }
    setIsEditingUrl(false);
  };

  const startBreakthroughProcess = () => {
    setBreakthroughResult('ANIMATING');
    setTimeout(() => {
      const rolled = Math.random() * 100;
      if (rolled <= successRate) {
        setBreakthroughResult('SUCCESS');
        onBreakthrough(true);
      } else {
        setBreakthroughResult('FAILED');
        onBreakthrough(false);
      }
    }, 2200);
  };

  // Determine active tab order
  const effectiveTabOrder = (tabOrder && tabOrder.length > 0) 
    ? tabOrder 
    : Object.keys(TAB_THEMES);

  return (
    <aside className="w-80 sm:w-84 bg-[#0a0d14] border-r-2 border-slate-950 flex flex-col shrink-0 select-none relative z-30 h-full">
      {/* TOP SECTION: Banner Tu Vi or Original Styled Mini Player Overlay Card */}
      <div className="p-3.5 border-b-2 border-slate-950 bg-[#0d121c] space-y-3 overflow-hidden font-sans relative">
        {/* Background radial glow matching CultivationHeader.tsx */}
        {!isLofiActive && (
          <div className={`absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br ${realmStyle.glow} blur-2xl pointer-events-none rounded-full opacity-35`} />
        )}

        {isLofiActive ? (
          /* EXACT MATCH TO USER MOCKUP: LOFI YOUTUBE CARD OVERLAYING CULTIVATION BANNER */
          <div className="bg-[#0e131d] border-2 border-slate-950 rounded-2xl overflow-hidden shadow-[6px_6px_0px_#000] flex flex-col text-slate-200 animate-fadeIn relative z-10">
            {/* Header Bar */}
            <div className="bg-[#141a27] border-b-2 border-slate-950 px-2.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <GripHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-black text-rose-400 truncate tracking-wide">
                  <span className={`w-2 h-2 rounded-full ${shouldPlayLofi ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                  <span className="truncate">LOFI YOUTUBE</span>
                </div>
              </div>

              {/* Action buttons on header right */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoSync(!autoSync)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    autoSync ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={autoSync ? "Đang phát tự động khi bật Pomodoro" : "Phát độc lập không phụ thuộc Pomodoro"}
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputUrl(youtubeUrl);
                    setIsEditingUrl(!isEditingUrl);
                  }}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    isEditingUrl ? 'text-amber-400 bg-amber-400/15' : 'text-slate-400 hover:text-amber-400'
                  }`}
                  title="Đổi link YouTube"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsLofiMinimized(!isLofiMinimized)}
                  className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                  title={isLofiMinimized ? "Mở rộng Player" : "Thu gọn Player"}
                >
                  {isLofiMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>

                {onCloseLofi && (
                  <button
                    type="button"
                    onClick={onCloseLofi}
                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                    title="Tắt Lofi Stream (Về Banner Tu Vi)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom URL inline edit form */}
            {isEditingUrl && (
              <form onSubmit={handleSaveUrl} className="bg-[#121824] p-2 border-b border-slate-900 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Dán link YouTube vào đây..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-[9px] px-2.5 py-1 rounded-lg font-mono cursor-pointer shrink-0"
                >
                  Lưu
                </button>
              </form>
            )}

            {/* Embedded Video Player Container */}
            {!isLofiMinimized && (
              <div className="relative w-full aspect-video bg-slate-950 overflow-hidden">
                {shouldPlayLofi ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${currentVideoId}`}
                    title="YouTube Lofi Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950/80 space-y-1">
                    <Play className="w-6 h-6 text-slate-600 animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-mono">Tạm dừng (Chờ bật Pomodoro)</p>
                    <p className="text-[8px] text-slate-600 font-mono">Bấm ⚡ góc trên để phát độc lập</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 100% PERFECT FEATURE & VISUAL MATCH WITH CultivationHeader.tsx BANNER */
          <div className="space-y-3 relative z-10">
            {/* User Profile Header Line */}
            <div className="flex items-center gap-3">
              {/* RESTORED ANIMATED AURA PARTICLES & ROTATING SPINNER AROUND CIRCULAR AVATAR */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0 select-none">
                {/* Ambient rotating aura behind */}
                <div className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse ${realmStyle.particle}`} />
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/40 animate-spin-slow" />
                
                {/* Glowing orb center */}
                <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-950 flex items-center justify-center relative z-10 overflow-hidden select-none shadow-inner">
                  <img 
                    src="/default_avatar.jpg" 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Orbiting particles */}
                <span className={`absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full animate-ping ${realmStyle.particle} opacity-60`} />
                <span className={`absolute bottom-1.5 left-0.5 w-1 h-1 rounded-full animate-pulse ${realmStyle.particle} opacity-40`} />
              </div>

              {/* User Name & Equipped Title */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isEditingName ? (
                    <form onSubmit={handleSaveName} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-slate-950 border-2 border-slate-950 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-none font-mono"
                        maxLength={15}
                        autoFocus
                      />
                      <button type="submit" className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded font-mono">Lưu</button>
                    </form>
                  ) : (
                    <>
                      <span className="font-black text-sm text-slate-100 truncate font-mono">{userName || 'Đạo Hữu'}</span>
                      <button
                        onClick={() => { setTempName(userName); setIsEditingName(true); }}
                        className="text-[9px] text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
                      >
                        (Đổi Danh)
                      </button>
                      {equippedTitle && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-block shadow-[0_0_10px_rgba(245,158,11,0.2)] truncate max-w-[140px]">
                          🌻 {equippedTitle}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* EXACT REALM FULLNAME FORMATTING WITH PIXEL FONT GLOW TEXT + LEVEL PILL BADGE + ACTIVE SPELL BADGES */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className={`text-xs font-black tracking-[0.1em] uppercase pixel-label ${realmStyle.text}`}>
                    {realmInfo.name} ({realmInfo.subName})
                  </span>
                  <span className="text-[9px] font-bold border-2 border-slate-950 px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 pixel-label shadow-[1px_1px_0px_#000] shrink-0">
                    LV. {level}
                  </span>
                  {safeState.activeSpells && safeState.activeSpells.map(spellId => {
                    const spell = STORE_ITEMS.find(s => s.id === spellId);
                    if (!spell) return null;
                    return (
                      <span
                        key={spellId}
                        className="text-[9px] font-bold border-2 border-slate-950 px-1.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 pixel-label shadow-[1px_1px_0px_#000] flex items-center gap-1 shrink-0"
                        title={`${spell.name}: ${spell.description}`}
                      >
                        <span>{spell.icon}</span>
                        <span className="truncate">{spell.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Realm Card & EXP Bar Info */}
            <div className="bg-[#080b12] border-2 border-slate-950 p-3 rounded-xl space-y-2.5 shadow-[3px_3px_0px_#000]">
              {/* RESTORED REALM EXP PROGRESS BAR WITH REALM DYNAMIC GRADIENT & SHIMMER SWEEP ANIMATION */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span className="uppercase font-semibold flex items-center gap-1">
                    {isBottleneck && <span className="text-amber-400 font-bold">🔒 BÌNH CẢNH CẬN KỀ</span>}
                    {!isBottleneck && 'ĐẠO HẠNH TU VI TÍCH LŨY'}
                  </span>
                  <span className="text-amber-300 font-bold">
                    {currentExp} / {xpNeeded} Tu Vi ({rawPercentage}%) {rawPercentage > 100 && '⚡ NÉN LINH LỰC'}
                  </span>
                </div>
                <div className="relative w-full bg-slate-950 border-[3px] border-slate-950 rounded-xl h-4 overflow-hidden flex items-center shadow-none">
                  {/* Progress fill with realm gradient and shimmer animation */}
                  <motion.div
                    className={`h-full bg-gradient-to-r ${realmStyle.gradient} transition-all duration-700 relative`}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Shimmer sweep effect */}
                    <div 
                      className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)] -translate-x-full" 
                      style={{ animation: 'shimmer 2.5s infinite' }}
                    />
                  </motion.div>
                  {/* Breakthrough-available visual pulse */}
                  {canBreakthrough && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 animate-pulse pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Linh Thach, Shield & Achievements Trophy */}
              <div className="flex items-center justify-between pt-1 text-[10px] font-mono border-t border-slate-900">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Gem className="w-3.5 h-3.5 text-amber-400" />
                  <span>{linhThach} Linh Thạch</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {shieldActive && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-sky-400 bg-sky-950/40 border border-sky-800/40 px-1.5 py-0.5 rounded-md" title="Đã kích hoạt Hộ Tâm Kính">
                      <Shield className="w-3 h-3 text-sky-400" />
                      <span>Hộ Thân</span>
                    </div>
                  )}

                  {onOpenAchievements && (
                    <button
                      onClick={onOpenAchievements}
                      className="text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Mở bảng Huy Hiệu Đạo Tâm"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Huy hiệu</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Breakthrough Button Trigger */}
            <button
              onClick={() => {
                setIsBreakthroughModalOpen(true);
                setBreakthroughResult('IDLE');
              }}
              className={`w-full py-2 px-3 rounded-xl border-2 border-slate-950 text-xs font-black font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-1.5 ${
                canBreakthrough
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-950'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isBottleneck ? '⚡ XEM THỬ THÁCH BÌNH CẢNH' : 'ĐỘT PHÁ CẢNH GIỚI'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Breakthrough Modal */}
      <AnimatePresence>
        {isBreakthroughModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f141c] border-2 border-slate-950 p-6 max-w-md w-full text-center space-y-5 relative max-h-[90vh] overflow-y-auto rounded-2xl shadow-[6px_6px_0px_#000] font-sans"
            >
              {breakthroughResult !== 'ANIMATING' && (
                <button
                  onClick={() => setIsBreakthroughModalOpen(false)}
                  className="absolute top-4 right-4 text-xs text-slate-500 hover:text-slate-300 font-bold cursor-pointer"
                >
                  Đóng
                </button>
              )}

              {breakthroughResult === 'IDLE' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-amber-400">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-100 uppercase tracking-widest font-mono">
                      {isBottleneck ? `🔒 ${bottleneckReq?.title}` : 'ĐỘT PHÁ CẢNH GIỚI'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isBottleneck 
                        ? 'Hoàn thành các thử thách Độ Kiếp để khai phá bình cảnh và thăng tiến cấp bậc!'
                        : 'Tiến hành vượt qua lôi kiếp để đột phá tiến cấp danh hiệu mới.'}
                    </p>
                  </div>

                  {/* Bottleneck Checklist */}
                  {isBottleneck && bottleneckReq && (
                    <div className="bg-slate-950 p-3.5 rounded-xl space-y-2 border-2 border-slate-950 text-left font-mono text-[10px] shadow-[2px_2px_0px_#000]">
                      <div className="font-extrabold uppercase text-amber-400 tracking-wider pb-1 border-b border-slate-900 flex justify-between">
                        <span>📜 Thử Thách Độ Kiếp Cần Đạt:</span>
                        <span className={bottleneckMet ? 'text-emerald-400' : 'text-rose-400'}>
                          {bottleneckMet ? '✓ ĐỦ ĐIỀU KIỆN' : '✗ CHƯA ĐỦ'}
                        </span>
                      </div>

                      {bottleneckReq.minMeditationMinutes && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">🧘 Bế quan Thiền Định (từ bình cảnh):</span>
                          <span className={safeMeditationDiff >= bottleneckReq.minMeditationMinutes ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {safeMeditationDiff} / {bottleneckReq.minMeditationMinutes} phút
                          </span>
                        </div>
                      )}

                      {bottleneckReq.minCompletedTasks && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">⚔️ Hoàn thành Nhiệm Vụ (từ bình cảnh):</span>
                          <span className={safeTasksDiff >= bottleneckReq.minCompletedTasks ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {safeTasksDiff} / {bottleneckReq.minCompletedTasks} task
                          </span>
                        </div>
                      )}

                      {bottleneckReq.requiredItemName && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">💊 Mua {bottleneckReq.requiredItemName} (Shop):</span>
                          <span className={safeInventory.some(i => i && i.itemId === bottleneckReq.requiredItemId && i.quantity > 0) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {safeInventory.some(i => i && i.itemId === bottleneckReq.requiredItemId && i.quantity > 0) ? '✓ Đã có' : '✗ Chưa có'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-950 p-3 rounded-xl space-y-2 border-2 border-slate-950 text-left font-mono text-[10px] shadow-[2px_2px_0px_#000]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tỉ lệ thành công:</span>
                      <span className="text-amber-400 font-bold">{successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vật phẩm hộ pháp:</span>
                      <span className={shieldActive ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {shieldActive ? 'Hộ Tâm Kính (Hoạt động)' : 'Không có'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hình phạt thất bại:</span>
                      <span className="text-rose-400 font-bold">
                        {shieldActive
                          ? 'Bảo vệ nguyên vẹn (Hộ Tâm Kính)'
                          : 'Xóa sạch Tu Vi tích lũy (Cảnh giới giữ nguyên)'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={startBreakthroughProcess}
                    disabled={!canBreakthrough}
                    className={`w-full py-2.5 text-xs font-bold font-mono tracking-widest uppercase rounded-xl border-2 border-slate-950 cursor-pointer shadow-[3px_3px_0px_#000] ${
                      canBreakthrough
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-600 border-slate-950 cursor-not-allowed'
                    }`}
                  >
                    {canBreakthrough ? '⚡ CHÍNH THỨC ĐỘ KIẾP ĐỘT PHÁ' : '🔒 CHƯA ĐỦ ĐIỀU KIỆN ĐỘ KIẾP'}
                  </button>
                </div>
              )}

              {breakthroughResult === 'ANIMATING' && (
                <div className="space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-indigo-400 relative shadow-[2px_2px_0px_#000]">
                    <CompassIcon className="w-8 h-8 animate-spin text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Đang triệu hồi chân lôi...</h4>
                    <p className="text-[10px] text-slate-500 mt-1 italic font-mono">"Càn khôn xoay chuyển, đan điền hội khí tụ tâm..."</p>
                  </div>
                </div>
              )}

              {breakthroughResult === 'SUCCESS' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-emerald-400 shadow-[2px_2px_0px_#000]">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-emerald-400 uppercase tracking-widest font-mono">ĐỘT PHÁ THÀNH CÔNG!</h3>
                    <p className="text-xs text-slate-300 mt-2">
                      Chúc mừng bạn đã độ kiếp viên mãn, chính thức thăng tiến danh hiệu cao quý mới!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBreakthroughModalOpen(false)}
                    className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs font-mono uppercase tracking-widest rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_#000] cursor-pointer"
                  >
                    XÁC NHẬN SỰ KIỆN
                  </button>
                </div>
              )}

              {breakthroughResult === 'FAILED' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-rose-400 shadow-[2px_2px_0px_#000]">
                    <Shield className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-rose-400 uppercase tracking-widest font-mono">ĐỘT PHÁ THẤT BẠI</h3>
                    <p className="text-xs text-slate-300 mt-2">
                      {shieldActive
                        ? 'Lôi kiếp giáng xuống nhưng Hộ Tâm Kính đã cản phá toàn bộ đòn đánh. Tu vi nguyên vẹn!'
                        : 'Kiếp vỡ đan điền, tu vi tiêu tan một phần. Hãy nỗ lực tu hành bồi dưỡng lại đạo tâm!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBreakthroughModalOpen(false)}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs font-mono uppercase tracking-widest rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_#000] cursor-pointer"
                  >
                    CHẤP NHẬN SỰ THẬT
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTTOM SECTION: 10 Navigation Tabs with EACH TAB HAVING ITS OWN DISTINCT COLOR PALETTE */}
      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto font-mono">
        <span className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-mono">
          DANH MỤC CHỨC NĂNG:
        </span>
        
        {effectiveTabOrder.map((tabId) => {
          const isSelected = activeTab === tabId;
          const config = getTabConfig ? getTabConfig(tabId) : null;
          const theme = TAB_THEMES[tabId] || {
            label: tabId,
            icon: <Flame className="w-4 h-4" />,
            activeBg: 'bg-amber-950/40',
            activeText: 'text-amber-300 font-extrabold',
            activeBorder: 'border-amber-500/80 shadow-[2px_2px_0px_#f59e0b40]',
            iconColor: 'text-amber-400',
            arrowColor: 'text-amber-400'
          };

          const label = config?.label || theme.label;
          const icon = config?.icon || theme.icon;

          return (
            <button
              key={tabId}
              onClick={() => onTabChange(tabId)}
              className={`w-full p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 font-mono font-bold text-xs ${
                isSelected
                  ? `${theme.activeBg} ${theme.activeText} ${theme.activeBorder} translate-x-1`
                  : 'bg-[#0e131c] hover:bg-[#151d2c] border-slate-950 text-slate-300 hover:text-slate-100 shadow-[2px_2px_0px_#000]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`shrink-0 ${theme.iconColor}`}>
                  {icon}
                </div>
                <span className="truncate">{label}</span>
              </div>
              
              {isSelected && (
                <ChevronRight className={`w-4 h-4 shrink-0 stroke-[3] ${theme.arrowColor}`} />
              )}
            </button>
          );
        })}

        {/* Tab Customize Trigger */}
        {onOpenTabCustomize && (
          <button
            onClick={onOpenTabCustomize}
            className="w-full p-2.5 rounded-xl border-2 border-dashed border-slate-800 bg-[#090d16] hover:bg-[#0f1624] text-slate-400 hover:text-amber-400 font-mono font-bold text-xs transition-all cursor-pointer flex items-center gap-3 shadow-[1px_1px_0px_#000] mt-2"
            title="Sắp xếp vị trí các Tab"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Sắp Xếp Tab</span>
          </button>
        )}
      </div>
    </aside>
  );
}
