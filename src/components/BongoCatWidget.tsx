/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Bongo Cat Interactive Desktop Pet Widget
 * Exclusively Marimba instrument, streamlined controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { bongoAudio } from '../services/bongoAudio';
import BongoCatStudioModal from './BongoCatStudioModal';

interface BongoCatWidgetProps {
  isCollapsed?: boolean;
}

export default function BongoCatWidget({ isCollapsed = false }: BongoCatWidgetProps) {
  const [isMuted, setIsMuted] = useState<boolean>(bongoAudio.isMuted());
  const [leftPawDown, setLeftPawDown] = useState(false);
  const [rightPawDown, setRightPawDown] = useState(false);
  const [bopCount, setBopCount] = useState(0);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const lastPawRef = useRef<'left' | 'right'>('right');
  const timeoutLeftRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRightRef = useRef<NodeJS.Timeout | null>(null);
  const bopCounterRef = useRef<number>(0);

  // Global key listener - Exclusively plays Marimba melodiously with every keystroke
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore standalone modifiers
      if (['Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

      const code = e.code || '';
      const key = (e.key || '').toUpperCase();

      bopCounterRef.current += 1;
      setBopCount(prev => prev + 1);

      // Direct Marimba mapping: Q, W, E, R, T, Y, U, I, O, P
      const marimbaMap: Record<string, number> = {
        KeyQ: 1, Q: 1,
        KeyW: 2, W: 2,
        KeyE: 3, E: 3,
        KeyR: 4, R: 4,
        KeyT: 5, T: 5,
        KeyY: 6, Y: 6, KeyZ: 6, Z: 6,
        KeyU: 7, U: 7,
        KeyI: 8, I: 8,
        KeyO: 9, O: 9,
        KeyP: 0, P: 0
      };

      // Also support digits 1 - 0
      const digitMatch = code.match(/^(?:Digit|Numpad)([0-9])$/);
      if (digitMatch || /^[0-9]$/.test(key)) {
        const numChar = digitMatch ? digitMatch[1] : key;
        const note = parseInt(numChar, 10);
        bongoAudio.playMarimba(note);
        if (note <= 5 && note !== 0) triggerLeftPaw();
        else triggerRightPaw();
        return;
      }

      if (marimbaMap[code] !== undefined || marimbaMap[key] !== undefined) {
        const note = marimbaMap[code] ?? marimbaMap[key] ?? 1;
        bongoAudio.playMarimba(note);
        if (note <= 5 && note !== 0) triggerLeftPaw();
        else triggerRightPaw();
        return;
      }

      // General typing: cycle notes or play pleasant notes on marimba
      const note = (bopCounterRef.current % 10);
      bongoAudio.playMarimba(note);
      alternatePaws();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerLeftPaw = () => {
    lastPawRef.current = 'left';
    setLeftPawDown(true);
    if (timeoutLeftRef.current) clearTimeout(timeoutLeftRef.current);
    timeoutLeftRef.current = setTimeout(() => setLeftPawDown(false), 130);
  };

  const triggerRightPaw = () => {
    lastPawRef.current = 'right';
    setRightPawDown(true);
    if (timeoutRightRef.current) clearTimeout(timeoutRightRef.current);
    timeoutRightRef.current = setTimeout(() => setRightPawDown(false), 130);
  };

  const alternatePaws = () => {
    if (lastPawRef.current === 'right') {
      triggerLeftPaw();
    } else {
      triggerRightPaw();
    }
  };

  const handleManualClick = () => {
    // Play marimba note on click
    const note = Math.floor(Math.random() * 10);
    bongoAudio.playMarimba(note);
    triggerLeftPaw();
    triggerRightPaw();
    setBopCount(prev => prev + 1);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    bongoAudio.setMuted(nextMuted);
  };

  if (isCollapsed) {
    return (
      <div 
        onClick={handleManualClick}
        className="pt-2 flex justify-center cursor-pointer group"
        title="Bongo Cat: Marimba"
      >
        <div className="w-9 h-9 rounded-xl bg-white border border-[#E7E1D7] flex items-center justify-center text-base shadow-xs group-hover:scale-110 transition-transform">
          🐱
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-2.5 pt-2.5 border-t border-[#E7E1D7] select-none relative">
        {/* Top Header with Controls (Only Title, Bop Count, Full Studio, Mute) */}
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold tracking-wider text-[#797268] uppercase whitespace-nowrap">
              🐾 BONGO CAT
            </span>
            {bopCount > 0 && (
              <span className="text-[9.5px] font-mono font-bold text-[#2E6930] bg-[#EEF5EE] px-1.5 py-0.2 rounded-full border border-[#D2E5D2]">
                {bopCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Open Full Studio Modal Button */}
            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="p-1 rounded-md bg-white border border-[#E7E1D7] text-[#797268] hover:text-[#2E6930] hover:bg-[#EEF5EE] transition-colors cursor-pointer shadow-2xs"
              title="Mở Bongo Cat Studio (Sheet nhạc & Bàn phím Marimba)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            {/* Mute/Unmute sound toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-1 rounded-md border transition-colors cursor-pointer text-xs ${
                isMuted
                  ? 'bg-[#F5F2EC] text-[#9E9689] border-[#E7E1D7]'
                  : 'bg-white text-[#2E6930] border-[#D2E5D2] shadow-2xs hover:bg-[#EEF5EE]'
              }`}
              title={isMuted ? 'Bật âm thanh gõ' : 'Tắt âm thanh gõ'}
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Main Interactive Stage Card (Exclusively Marimba) */}
        <div 
          onClick={handleManualClick}
          className="relative bg-gradient-to-b from-[#FAF8F5] to-white border border-[#E7E1D7] rounded-xl p-2 transition-all cursor-pointer group shadow-2xs hover:border-[#D5CDC0]"
          title="Click để gõ Marimba!"
        >
          {/* Bongo Cat Stage (16:9 Aspect Ratio) */}
          <div className="relative w-full aspect-[16/9] max-h-[110px] flex items-center justify-center overflow-hidden rounded-lg bg-[#FAF8F5]/60 border border-[#E7E1D7]/50">
            {/* Layer 1: Base Cat Body */}
            <img
              src="/bongo-cat/cat_body.png"
              alt="Bongo Cat"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />

            {/* Layer 2: Exclusively Marimba Instrument */}
            <img
              src="/bongo-cat/marimba.png"
              alt="Marimba"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
            />

            {/* Layer 3: Left Paw */}
            <img
              src={leftPawDown ? '/bongo-cat/paw_left_down.png' : '/bongo-cat/paw_left_up.png'}
              alt="Left Paw"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30 transition-transform duration-75"
            />

            {/* Layer 4: Right Paw */}
            <img
              src={rightPawDown ? '/bongo-cat/paw_right_down.png' : '/bongo-cat/paw_right_up.png'}
              alt="Right Paw"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30 transition-transform duration-75"
            />

            {/* Floating hover badge */}
            <div className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 px-1.5 py-0.5 rounded text-[8.5px] font-mono text-[#797268] border border-[#E7E1D7] shadow-2xs z-40">
              🎶 Marimba
            </div>
          </div>
        </div>
      </div>

      {/* Full Bongo Cat Music Studio Modal */}
      <BongoCatStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        bopCount={bopCount}
        onBop={() => setBopCount(prev => prev + 1)}
      />
    </>
  );
}
