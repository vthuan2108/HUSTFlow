/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CultivationState } from '../types';
import { getRealmInfo, RealmInfo, STORE_ITEMS } from '../data';
import { Shield, Sparkles, Gem, Trophy, Flame, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CultivationHeaderProps {
  state: CultivationState;
  onRename: (newName: string) => void;
  onBreakthrough: (success: boolean) => void;
  userName: string;
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
  'Luyện Khí Kỳ': { 
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
  'Kim Đan Kỳ': { 
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
  'Luyện Hư Kỳ': { 
    text: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]', 
    glow: 'from-rose-500/15 to-transparent',
    gradient: 'from-rose-500 via-pink-400 to-rose-500',
    glowBorder: 'border-rose-900/40 shadow-[0_0_35px_rgba(244,63,94,0.18)]',
    particle: 'bg-rose-400',
    badgeBg: 'bg-rose-950/60 border-rose-900/40 text-rose-400'
  }
};

export default function CultivationHeader({ state, onRename, onBreakthrough, userName }: CultivationHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isBreakthroughModalOpen, setIsBreakthroughModalOpen] = useState(false);
  const [breakthroughResult, setBreakthroughResult] = useState<'IDLE' | 'ANIMATING' | 'SUCCESS' | 'FAILED'>('IDLE');

  const realm: RealmInfo = getRealmInfo(state.level);
  const style = REALM_STYLES[realm.name] || REALM_STYLES['Luyện Khí Kỳ'];
  const xpNeeded = realm.xpNeeded;
  const xpPercentage = Math.min(Math.round((state.currentExp / xpNeeded) * 100), 100);
  const canBreakthrough = state.currentExp >= xpNeeded;

  // Breakthrough success rate drops as level increases, minimum 35%
  const successRate = Math.max(90 - (state.level * 1.5), 35);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRename(tempName);
      setIsEditingName(false);
    }
  };

  const startBreakthroughProcess = () => {
    setBreakthroughResult('ANIMATING');
    
    // Simulate lightning striking the cauldron (spiritual breakthrough animation!)
    setTimeout(() => {
      const rolled = Math.random() * 100;
      const success = rolled <= successRate;
      
      if (success) {
        setBreakthroughResult('SUCCESS');
        onBreakthrough(true);
      } else {
        setBreakthroughResult('FAILED');
        onBreakthrough(false);
      }
    }, 2500);
  };

  return (
    <div className="neo-card p-5 space-y-4 relative overflow-hidden" id="cultivation-header">
      {/* Background radial glow */}
      <div className={`absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br ${style.glow} blur-2xl pointer-events-none rounded-full opacity-35`} />

      {/* Upper info rows */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Cultivator Profile */}
        <div className="flex items-center gap-3.5">
          {/* Avatar core */}
          <div className="relative w-18 h-18 flex items-center justify-center shrink-0 select-none">
            {/* Ambient rotating aura behind */}
            <div className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse ${style.particle}`} />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/40 animate-spin-slow" />
            
            {/* Glowing orb center */}
            <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-slate-950 flex items-center justify-center relative z-10 overflow-hidden select-none shadow-inner">
              <img 
                src="/default_avatar.jpg" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Orbiting particles */}
            <span className={`absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full animate-ping ${style.particle} opacity-60`} />
            <span className={`absolute bottom-1.5 left-0.5 w-1 h-1 rounded-full animate-pulse ${style.particle} opacity-40`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-slate-950 border-2 border-slate-950 rounded-lg px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
                    maxLength={15}
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] neo-btn neo-btn-success px-2 py-0.5 rounded">Lưu</button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">{userName}</h2>
                  <button
                    onClick={() => { setTempName(userName); setIsEditingName(true); }}
                    className="text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    (Đổi Danh)
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-black font-sans tracking-[0.1em] uppercase pixel-label ${style.text}`}>
                {realm.fullName}
              </span>
              <span className="text-[9px] font-bold border-2 border-slate-950 px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 pixel-label shadow-[1px_1px_0px_#000] shrink-0">
                LV. {state.level}
              </span>
              {state.activeSpells && state.activeSpells.map(spellId => {
                const spell = STORE_ITEMS.find(s => s.id === spellId);
                if (!spell) return null;
                return (
                  <span
                    key={spellId}
                    className="text-[9px] font-bold border-2 border-slate-950 px-1.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 pixel-label shadow-[1px_1px_0px_#000] flex items-center gap-1 shrink-0"
                    title={`${spell.name}: ${spell.description}`}
                  >
                    <span>{spell.icon}</span>
                    <span className="hidden sm:inline">{spell.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spirit Stones Balance & Active Buffs info */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Shield status */}
          {state.shieldActive && (
            <div className="flex items-center gap-1 bg-indigo-950/20 border-2 border-slate-950 px-2.5 py-1 rounded-xl text-indigo-400 shadow-[2px_2px_0px_#000]">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">HỘ THÂN</span>
            </div>
          )}

          {/* Linh Thach Balance */}
          <div className="bg-slate-950 border-2 border-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[2px_2px_0px_#000]">
            <Gem className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[8px] text-slate-600 font-bold uppercase leading-none">Linh Thạch</p>
              <p className="text-xs font-bold text-slate-200 mt-0.5">{state.linhThach}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to next breakthrough */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-end text-[10px] font-mono">
          <span className="text-slate-500 font-semibold uppercase">Đạo Hạnh Tu Vi Tích Lũy</span>
          <span className="text-slate-400">
            {state.currentExp} / {xpNeeded} Tu Vi ({xpPercentage}%)
          </span>
        </div>

        <div className="relative w-full bg-slate-950 border-[3px] border-slate-950 rounded-xl h-5 overflow-hidden flex items-center shadow-none">
          {/* Progress fill */}
          <div
            className={`h-full bg-gradient-to-r ${style.gradient} transition-all duration-700 relative`}
            style={{ width: `${xpPercentage}%` }}
          >
            {/* Shimmer sweep effect */}
            <div 
              className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full" 
              style={{ animation: 'shimmer 2.5s infinite' }}
            />
          </div>
          {/* Breakthrough-available visual pulse */}
          {canBreakthrough && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 animate-pulse pointer-events-none" />
          )}
        </div>

        {/* Breakthrough controller action line */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 select-none">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            Khi tu vi tràn đầy, hãy tiến hành đột phá để thăng cảnh giới!
          </span>

          <button
            onClick={() => {
              setIsBreakthroughModalOpen(true);
              setBreakthroughResult('IDLE');
            }}
            disabled={!canBreakthrough}
            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest ${
              canBreakthrough
                ? 'neo-btn neo-btn-primary'
                : 'bg-slate-900 text-slate-600 border-2 border-slate-950 cursor-not-allowed'
            }`}
          >
            ĐỘT PHÁ CẢNH GIỚI
          </button>
        </div>
      </div>

      {/* Interactive breakthrough modal */}
      <AnimatePresence>
        {isBreakthroughModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="neo-card p-6 max-w-sm w-full text-center space-y-6 relative"
            >
              {/* Close Button if idle or complete */}
              {breakthroughResult !== 'ANIMATING' && (
                <button
                  onClick={() => setIsBreakthroughModalOpen(false)}
                  className="absolute top-4 right-4 text-xs text-slate-500 hover:text-slate-300 font-bold"
                >
                  Đóng
                </button>
              )}

              {breakthroughResult === 'IDLE' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-amber-400">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-100 uppercase tracking-widest pixel-label">ĐỘT PHÁ BÌNH CẢNH</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      Tiến hành vượt qua lôi kiếp để đột phá tiến cấp danh hiệu mới.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl space-y-2 border-2 border-slate-950 text-left font-mono text-[10px] shadow-[2px_2px_0px_#000]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tỉ lệ thành công:</span>
                      <span className="text-amber-400 font-bold">{successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vật phẩm hộ pháp:</span>
                      <span className={state.shieldActive ? 'text-emerald-400' : 'text-slate-600'}>
                        {state.shieldActive ? 'Hộ Tâm Kính (Hoạt động)' : 'Không có'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kiếp nạn thất bại:</span>
                      <span className="text-rose-500">
                        {state.shieldActive ? 'Không mất tu vi (Đoạt bảo)' : '-10% Tu Vi'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={startBreakthroughProcess}
                    className="w-full py-2.5 neo-btn neo-btn-primary text-xs font-bold tracking-widest"
                  >
                    BẮT ĐẦU ĐỘT PHÁ (KÍCH HOẠT)
                  </button>
                </div>
              )}

              {breakthroughResult === 'ANIMATING' && (
                <div className="space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-indigo-400 relative shadow-[2px_2px_0px_#000]">
                    <Compass className="w-8 h-8 animate-spin text-indigo-400" />
                    <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500 animate-ping opacity-30" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Đang triệu hồi chân lôi...</h4>
                    <p className="text-[10px] text-slate-500 mt-1 italic">"Càn khôn xoay chuyển, đan điền hội khí tụ tâm..."</p>
                  </div>
                </div>
              )}

              {breakthroughResult === 'SUCCESS' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/40 border-2 border-slate-950 flex items-center justify-center mx-auto text-emerald-400 shadow-[2px_2px_0px_#000]">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-emerald-400 uppercase tracking-widest pixel-label">ĐỘT PHÁ THÀNH CÔNG!</h3>
                    <p className="text-xs text-slate-300 mt-2">
                      Chúc mừng bạn đã độ kiếp viên mãn, chính thức thăng tiến danh hiệu cao quý mới!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBreakthroughModalOpen(false)}
                    className="w-full py-2 neo-btn neo-btn-success text-xs font-bold tracking-widest"
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
                    <h3 className="text-md font-bold text-rose-400 uppercase tracking-widest pixel-label">ĐỘT PHÁ THẤT BẠI</h3>
                    <p className="text-xs text-slate-300 mt-2">
                      {state.shieldActive
                        ? 'Lôi kiếp giáng xuống nhưng Hộ Tâm Kính đã cản phá toàn bộ đòn đánh. Tu vi nguyên vẹn!'
                        : 'Kiếp vỡ đan điền, tu vi tiêu tan một phần. Hãy nỗ lực tu hành bồi dưỡng lại đạo tâm!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBreakthroughModalOpen(false)}
                    className="w-full py-2 neo-btn neo-btn-danger text-xs font-bold tracking-widest text-white"
                  >
                    CHẤP NHẬN SỰ THẬT
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
