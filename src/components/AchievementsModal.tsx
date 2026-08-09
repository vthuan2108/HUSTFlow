/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CultivationState, Achievement } from '../types';
import { ACHIEVEMENTS } from '../data';
import { Trophy, Sparkles, Gem, Award, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CultivationState;
  currentStreak: number;
  gardenPlantsCount: number;
  notesCount: number;
  timeBlocksCount: number;
  manualsCount: number;
  cpaScore: number;
  onClaimAchievement: (achievementId: string, rewardStones: number) => void;
  onEquipTitle: (title: string) => void;
}

type CategoryTab = 'ALL' | 'MEDITATION' | 'TASKS' | 'STREAK' | 'ACADEMICS' | 'GARDEN' | 'WEALTH' | 'REALM' | 'SPECIAL';

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  state,
  currentStreak,
  gardenPlantsCount,
  notesCount,
  timeBlocksCount,
  manualsCount,
  cpaScore,
  onClaimAchievement,
  onEquipTitle,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('ALL');

  if (!isOpen) return null;

  const claimedList = state.claimedAchievements || [];
  const equippedTitle = state.equippedTitle || '';

  const getProgressValue = (ach: Achievement): number => {
    switch (ach.targetType) {
      case 'MEDITATION_MINUTES':
        return state.meditationMinutes || 0;
      case 'TASKS_COMPLETED':
        return state.tasksCompletedCount || 0;
      case 'STREAK_DAYS':
        return currentStreak || 0;
      case 'LINH_THACH':
        return state.linhThach || 0;
      case 'SHOP_ITEMS':
        return state.itemsBoughtCount || 0;
      case 'BREAKTHROUGHS':
        return state.breakthroughCount || 0;
      case 'GARDEN_PLANTS':
        return gardenPlantsCount || 0;
      case 'LEVEL':
        return state.level || 1;
      case 'HABITS_COMPLETED':
        return state.habitsCompletedCount || 0;
      case 'NOTES_COUNT':
        return notesCount || 0;
      case 'TIMEBLOCKS_COUNT':
        return timeBlocksCount || 0;
      case 'MANUALS_COUNT':
        return manualsCount || 0;
      case 'CPA_SCORE':
        return cpaScore || 0;
      case 'ACHIEVEMENTS_COUNT':
        return (state.claimedAchievements || []).length;
      default:
        return 0;
    }
  };

  const filteredAchievements = ACHIEVEMENTS.filter(ach => {
    if (activeCategory === 'ALL') return true;
    return ach.category === activeCategory;
  });

  const totalUnlocked = ACHIEVEMENTS.filter(ach => getProgressValue(ach) >= ach.targetValue).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="neo-card p-6 max-w-3xl w-full space-y-5 relative max-h-[90vh] overflow-y-auto text-left"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-xs text-slate-500 hover:text-slate-300 font-bold cursor-pointer"
          >
            Đóng
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border-2 border-slate-950 flex items-center justify-center text-amber-400 text-2xl shadow-[3px_3px_0px_#000]">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-md font-extrabold text-slate-100 uppercase tracking-widest pixel-label">
                HUY HIỆU ĐẠO TÂM (80 DANH HIỆU)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Đã mở khóa <span className="text-amber-400 font-bold">{totalUnlocked} / {ACHIEVEMENTS.length}</span> Thử thách Tu Hành
              </p>
            </div>
          </div>

          {/* Currently Equipped Title Display */}
          <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-950 flex items-center justify-between font-mono text-[10px] shadow-[2px_2px_0px_#000]">
            <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1 font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Danh Hiệu Đang Đeo:
            </span>
            {equippedTitle ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold tracking-wide text-[11px] shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  {equippedTitle}
                </span>
                <button
                  onClick={() => onEquipTitle('')}
                  className="text-slate-500 hover:text-rose-400 text-[9px] underline cursor-pointer"
                >
                  Tháo
                </button>
              </div>
            ) : (
              <span className="text-slate-600 italic">Chưa đeo danh hiệu</span>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold font-mono">
            {[
              { id: 'ALL', label: `TẤT CẢ (${ACHIEVEMENTS.length})` },
              { id: 'MEDITATION', label: '🧘 THIỀN ĐỊNH' },
              { id: 'TASKS', label: '⚔️ NHIỆM VỤ' },
              { id: 'STREAK', label: '⚡ CHUỖI' },
              { id: 'ACADEMICS', label: '🎓 HỌC TRỤ' },
              { id: 'GARDEN', label: '🍄 TIÊN DƯỢC' },
              { id: 'WEALTH', label: '💎 TÀI PHÚ' },
              { id: 'REALM', label: '🔥 CẢNH GIỚI' },
              { id: 'SPECIAL', label: '✨ ĐẶC BIỆT' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as CategoryTab)}
                className={`px-3 py-1.5 rounded-lg border-2 border-slate-950 transition-all font-black cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-amber-400 text-slate-950 shadow-[2px_2px_0px_#000]'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Achievement Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {filteredAchievements.map(ach => {
              const currentVal = getProgressValue(ach);
              const isCompleted = currentVal >= ach.targetValue;
              const isClaimed = claimedList.includes(ach.id);
              const isEquipped = equippedTitle === ach.titleToEquip;
              const percent = Math.min(Math.round((currentVal / ach.targetValue) * 100), 100);

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border-2 transition-all space-y-2.5 relative flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-slate-950 border-amber-500/40 shadow-[2px_2px_0px_#000]'
                      : 'bg-slate-950/60 border-slate-900 opacity-80'
                  }`}
                >
                  <div>
                    {/* Top title & icon */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{ach.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                            {ach.title}
                          </h4>
                          <span className="text-[9px] text-amber-400 font-mono font-semibold">
                            +{ach.rewardLinhThach} Linh Thạch
                          </span>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {!isCompleted && (
                        <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                      {ach.description}
                    </p>
                  </div>

                  {/* Progress bar & Action button */}
                  <div className="space-y-2 pt-1 border-t border-slate-900">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-500 uppercase font-semibold">Tiến độ tu hành:</span>
                      <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {currentVal} / {ach.targetValue} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="pt-1">
                      {!isCompleted && (
                        <button
                          disabled
                          className="w-full py-1.5 rounded-lg bg-slate-900 text-slate-600 border border-slate-800 text-[10px] font-bold cursor-not-allowed uppercase tracking-wider"
                        >
                          CHƯA HOÀN THÀNH
                        </button>
                      )}

                      {isCompleted && !isClaimed && (
                        <button
                          onClick={() => onClaimAchievement(ach.id, ach.rewardLinhThach)}
                          className="w-full py-1.5 rounded-lg neo-btn neo-btn-primary text-[10px] font-black uppercase tracking-widest animate-pulse cursor-pointer"
                        >
                          🎁 NHẬN THƯỞNG +{ach.rewardLinhThach} LINH THẠCH
                        </button>
                      )}

                      {isCompleted && isClaimed && (
                        <button
                          onClick={() => onEquipTitle(isEquipped ? '' : ach.titleToEquip)}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-950/60 text-emerald-300 border-2 border-emerald-500/50'
                              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-2 border-slate-800'
                          }`}
                        >
                          {isEquipped ? '✓ ĐANG ĐEO DANH HIỆU' : `⚡ ĐEO DANH HIỆU "${ach.titleToEquip}"`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
