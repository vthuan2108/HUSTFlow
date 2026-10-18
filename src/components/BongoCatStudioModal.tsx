/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Bongo Cat Music Studio Modal
 * Full-featured interactive studio based on bongo.cat
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Music, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { bongoAudio } from '../services/bongoAudio';

interface BongoCatStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  bopCount: number;
  onBop: () => void;
}

export type InstrumentType = 'bongo' | 'keyboard' | 'marimba' | 'cymbal' | 'cowbell' | 'tambourine';

interface SongSheet {
  id: string;
  title: string;
  icon: string;
  instrument: InstrumentType;
  notes: string[];
  keys: string[];
}

const SAMPLE_SONGS: SongSheet[] = [
  {
    id: 'hbd',
    title: 'Happy Birthday',
    icon: '🎂',
    instrument: 'keyboard',
    notes: ['1', '1', '2', '1', '4', '3', '•', '1', '1', '2', '1', '5', '4', '•', '1', '1', '8', '6', '4', '3', '2'],
    keys: ['1', '1', '2', '1', '4', '3', '1', '1', '2', '1', '5', '4', '1', '1', '8', '6', '4', '3', '2']
  },
  {
    id: 'tetris',
    title: 'Tetris Theme (Korobeiniki)',
    icon: '🕹️',
    instrument: 'keyboard',
    notes: ['3', '7', '8', '9', '8', '7', '6', '•', '6', '8', '0', '9', '8', '7'],
    keys: ['3', '7', '8', '9', '8', '7', '6', '6', '8', '0', '9', '8', '7']
  },
  {
    id: 'megalovania',
    title: 'Megalovania (Sans)',
    icon: '💀',
    instrument: 'marimba',
    notes: ['D', 'D', 'O', 'T', 'R', 'E', '•', 'W', 'E', 'R'],
    keys: ['D', 'D', 'O', 'T', 'R', 'E', 'W', 'E', 'R']
  },
  {
    id: 'coffin',
    title: 'Astronomia (Coffin Dance)',
    icon: '⚰️',
    instrument: 'keyboard',
    notes: ['4', '4', '4', '4', '6', '5', '5', '5', '5', '7', '6', '6', '6', '6', '5', '4'],
    keys: ['4', '4', '4', '4', '6', '5', '5', '5', '5', '7', '6', '6', '6', '6', '5', '4']
  },
  {
    id: 'bongo_beat',
    title: 'Bongo Funk Rhythm',
    icon: '🪘',
    instrument: 'bongo',
    notes: ['A', 'A', 'D', 'A', 'D', 'D', '•', 'A', 'D', 'A', 'D'],
    keys: ['A', 'A', 'D', 'A', 'D', 'D', 'A', 'D', 'A', 'D']
  }
];

export default function BongoCatStudioModal({
  isOpen,
  onClose,
  bopCount,
  onBop
}: BongoCatStudioModalProps) {
  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>('marimba');
  const [leftPawDown, setLeftPawDown] = useState(false);
  const [rightPawDown, setRightPawDown] = useState(false);
  const [isMuted, setIsMuted] = useState(bongoAudio.isMuted());
  const [volume, setVolume] = useState(bongoAudio.getVolume());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongSheet>(SAMPLE_SONGS[0]);
  const [songStep, setSongStep] = useState(0);

  // Keyboard handler for the Studio Modal (Supports both e.code and e.key)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

      const code = e.code || '';
      const key = (e.key || '').toUpperCase();
      setActiveKey(key || code);
      onBop();

      // 1. Bongos: A, D
      if (code === 'KeyA' || key === 'A') {
        setCurrentInstrument('bongo');
        triggerAction('left', () => bongoAudio.playBongo(1));
      } else if (code === 'KeyD' || key === 'D') {
        setCurrentInstrument('bongo');
        triggerAction('right', () => bongoAudio.playBongo(0));
      } 
      // 2. Piano: 1 - 0
      else if (code.match(/^(?:Digit|Numpad)([0-9])$/) || /^[0-9]$/.test(key)) {
        setCurrentInstrument('keyboard');
        const digitMatch = code.match(/^(?:Digit|Numpad)([0-9])$/);
        const numChar = digitMatch ? digitMatch[1] : key;
        const note = parseInt(numChar === '0' ? '0' : numChar, 10);
        const paw = note <= 5 && note !== 0 ? 'left' : 'right';
        triggerAction(paw, () => bongoAudio.playKeyboard(note));
      } 
      // 3. Marimba: Q - P
      else if (['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyZ','KeyU','KeyI','KeyO','KeyP'].includes(code) ||
               ['Q','W','E','R','T','Y','Z','U','I','O','P'].includes(key)) {
        setCurrentInstrument('marimba');
        const map: Record<string, number> = {
          KeyQ: 1, Q: 1, KeyW: 2, W: 2, KeyE: 3, E: 3, KeyR: 4, R: 4, KeyT: 5, T: 5,
          KeyY: 6, Y: 6, KeyZ: 6, Z: 6, KeyU: 7, U: 7, KeyI: 8, I: 8, KeyO: 9, O: 9, KeyP: 0, P: 0
        };
        const note = map[code] ?? map[key] ?? 1;
        const paw = note <= 5 && note !== 0 ? 'left' : 'right';
        triggerAction(paw, () => bongoAudio.playMarimba(note));
      } 
      // 4. Cymbal: C
      else if (code === 'KeyC' || key === 'C') {
        setCurrentInstrument('cymbal');
        triggerAction('right', () => bongoAudio.playCymbal());
      } 
      // 5. Cowbell: F
      else if (code === 'KeyF' || key === 'F') {
        setCurrentInstrument('cowbell');
        triggerAction('right', () => bongoAudio.playCowbell());
      } 
      // 6. Tambourine: B
      else if (code === 'KeyB' || key === 'B') {
        setCurrentInstrument('tambourine');
        triggerAction('right', () => bongoAudio.playTambourine());
      } 
      // 7. Space = Rhythmic double beat (No meow!)
      else if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerBeat();
      } else {
        // Fallback generic tap
        triggerAction('alternate', () => {
          if (currentInstrument === 'bongo') bongoAudio.playBongo(0);
          else if (currentInstrument === 'keyboard') bongoAudio.playKeyboard(1);
          else if (currentInstrument === 'marimba') bongoAudio.playMarimba(1);
          else if (currentInstrument === 'cymbal') bongoAudio.playCymbal();
          else if (currentInstrument === 'cowbell') bongoAudio.playCowbell();
          else if (currentInstrument === 'tambourine') bongoAudio.playTambourine();
        });
      }

      // Song progress check
      if (selectedSong) {
        const expected = selectedSong.keys[songStep];
        if (expected && (key === expected || code === `Key${expected}` || code === `Digit${expected}`)) {
          setSongStep(prev => (prev + 1) % selectedSong.keys.length);
        }
      }
    };

    const handleKeyUp = () => {
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, currentInstrument, selectedSong, songStep]);

  const triggerAction = (paw: 'left' | 'right' | 'alternate', playSound: () => void) => {
    playSound();
    if (paw === 'left') {
      setLeftPawDown(true);
      setTimeout(() => setLeftPawDown(false), 140);
    } else if (paw === 'right') {
      setRightPawDown(true);
      setTimeout(() => setRightPawDown(false), 140);
    } else {
      setLeftPawDown(prev => !prev);
      setRightPawDown(prev => !prev);
      setTimeout(() => {
        setLeftPawDown(false);
        setRightPawDown(false);
      }, 140);
    }
  };

  const triggerBeat = () => {
    bongoAudio.playBeat();
    setLeftPawDown(true);
    setRightPawDown(true);
    setTimeout(() => {
      setLeftPawDown(false);
      setRightPawDown(false);
    }, 150);
  };

  const playKeyDirectly = (key: string, instrument: InstrumentType, paw: 'left' | 'right', soundFn: () => void) => {
    setCurrentInstrument(instrument);
    setActiveKey(key);
    onBop();
    triggerAction(paw, soundFn);
    setTimeout(() => setActiveKey(null), 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-2xl bg-[#FAF8F5] border border-[#E7E1D7] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E7E1D7] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF5EE] border border-[#D2E5D2] flex items-center justify-center text-xl shadow-xs">
              🐱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2C2825]">Bongo Cat Music Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] text-[#2E6930] border border-[#E7E1D7]">
                  Bản gốc bongo.cat
                </span>
              </div>
              <p className="text-xs text-[#797268]">
                Đầy đủ 6 nhạc cụ, phím bấm piano, marimba, bongo & sheet nhạc biểu diễn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E7E1D7] text-xs">
              <Volume2 className="w-4 h-4 text-[#2E6930]" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  bongoAudio.setVolume(v);
                  if (isMuted && v > 0) {
                    setIsMuted(false);
                    bongoAudio.setMuted(false);
                  }
                }}
                className="w-20 h-1.5 accent-[#2E6930] cursor-pointer"
                title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
              <span className="font-mono text-[10.5px] font-bold text-[#2E6930] w-9 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                bongoAudio.setMuted(nextMuted);
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                isMuted 
                  ? 'bg-[#F5F2EC] text-[#9E9689] border-[#E7E1D7]' 
                  : 'bg-white text-[#2E6930] border-[#D2E5D2] shadow-xs'
              }`}
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="font-semibold">{isMuted ? 'Mute' : 'ON'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#797268] hover:text-[#2C2825] hover:bg-[#F2ECE4] transition-colors cursor-pointer"
              title="Đóng studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Instrument Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#E7E1D7] rounded-2xl shadow-2xs">
            {[
              { id: 'bongo', label: 'Bongos', icon: '🪘', shortcut: 'A / D' },
              { id: 'keyboard', label: 'Piano', icon: '🎹', shortcut: '1 - 0' },
              { id: 'marimba', label: 'Marimba', icon: '🎶', shortcut: 'Q - P' },
              { id: 'cymbal', label: 'Cymbal', icon: '🥁', shortcut: 'C' },
              { id: 'cowbell', label: 'Cowbell', icon: '🔔', shortcut: 'F' },
              { id: 'tambourine', label: 'Tambourine', icon: '🪇', shortcut: 'B' }
            ].map(inst => {
              const isActive = currentInstrument === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setCurrentInstrument(inst.id as InstrumentType)}
                  className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2E6930] text-white shadow-xs'
                      : 'text-[#5C5549] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>{inst.icon}</span>
                  <span>{inst.label}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F2ECE4] text-[#8C8479]'
                  }`}>
                    {inst.shortcut}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Large Bongo Cat Stage (16:9) */}
          <div className="relative w-full aspect-[16/9] max-h-[280px] mx-auto bg-gradient-to-b from-[#FAF8F5] to-white border-2 border-[#E7E1D7] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {/* Layer 1: Base Cat Body */}
            <img
              src="/bongo-cat/cat_body.png"
              alt="Bongo Cat"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />

            {/* Layer 2: Active Instrument */}
            <img
              src={`/bongo-cat/${currentInstrument}.png`}
              alt={currentInstrument}
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

            {/* Floating stats badge */}
            <div className="absolute top-3 left-3 z-40 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-[#E7E1D7] text-[11px] font-mono font-bold text-[#2E6930] shadow-xs">
              🐾 {bopCount} Bops
            </div>

            {/* Quick Beat button in corner */}
            <button
              onClick={triggerBeat}
              className="absolute top-3 right-3 z-40 bg-white hover:bg-[#EEF5EE] active:scale-95 text-[#2E6930] px-3 py-1.5 rounded-xl border border-[#D2E5D2] text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>🥁 Space: Gõ nhịp!</span>
            </button>
          </div>

          {/* Interactive Virtual Pads / Keys */}
          <div className="bg-white border border-[#E7E1D7] rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#4A443C] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#2E6930]" />
                Bàn phím tương tác (Click chuột hoặc gõ bàn phím):
              </span>
              <span className="text-[10px] font-mono text-[#8C8479]">
                Đang chọn: {currentInstrument.toUpperCase()}
              </span>
            </div>

            {/* Instrument-specific key pads */}
            {currentInstrument === 'bongo' && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => playKeyDirectly('A', 'bongo', 'left', () => bongoAudio.playBongo(1))}
                  className={`py-3 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    activeKey === 'A'
                      ? 'bg-[#2E6930] text-white border-[#2E6930] scale-95 shadow-inner'
                      : 'bg-[#FAF8F5] text-[#2C2825] border-[#E7E1D7] hover:bg-[#EEF5EE]'
                  }`}
                >
                  <div className="text-sm">Trống Trái</div>
                  <div className="text-xs font-mono opacity-80">[ A ]</div>
                </button>

                <button
                  onClick={triggerBeat}
                  className="py-3 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold bg-[#EEF5EE] text-[#2E6930] border-[#D2E5D2] hover:bg-[#DDF0DD]"
                >
                  <div className="text-sm">Gõ Cặp Trống</div>
                  <div className="text-xs font-mono opacity-80">[ Space ]</div>
                </button>

                <button
                  onClick={() => playKeyDirectly('D', 'bongo', 'right', () => bongoAudio.playBongo(0))}
                  className={`py-3 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    activeKey === 'D'
                      ? 'bg-[#2E6930] text-white border-[#2E6930] scale-95 shadow-inner'
                      : 'bg-[#FAF8F5] text-[#2C2825] border-[#E7E1D7] hover:bg-[#EEF5EE]'
                  }`}
                >
                  <div className="text-sm">Trống Phải</div>
                  <div className="text-xs font-mono opacity-80">[ D ]</div>
                </button>
              </div>
            )}

            {currentInstrument === 'keyboard' && (
              <div className="grid grid-cols-10 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => {
                  const note = parseInt(num === '0' ? '0' : num, 10);
                  const isLeft = note <= 5 && note !== 0;
                  const isActive = activeKey === num;
                  return (
                    <button
                      key={num}
                      onClick={() => playKeyDirectly(num, 'keyboard', isLeft ? 'left' : 'right', () => bongoAudio.playKeyboard(note))}
                      className={`py-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        isActive
                          ? 'bg-[#2E6930] text-white border-[#2E6930] scale-95 shadow-inner'
                          : 'bg-[#FAF8F5] text-[#2C2825] border-[#E7E1D7] hover:bg-[#EEF5EE]'
                      }`}
                    >
                      <div className="text-xs">{num}</div>
                      <div className="text-[9px] opacity-60 font-mono">{isLeft ? 'L' : 'R'}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentInstrument === 'marimba' && (
              <div className="grid grid-cols-10 gap-1.5">
                {[
                  { k: 'Q', n: 1 }, { k: 'W', n: 2 }, { k: 'E', n: 3 }, { k: 'R', n: 4 }, { k: 'T', n: 5 },
                  { k: 'Y', n: 6 }, { k: 'U', n: 7 }, { k: 'I', n: 8 }, { k: 'O', n: 9 }, { k: 'P', n: 0 }
                ].map(item => {
                  const isLeft = item.n <= 5 && item.n !== 0;
                  const isActive = activeKey === item.k;
                  return (
                    <button
                      key={item.k}
                      onClick={() => playKeyDirectly(item.k, 'marimba', isLeft ? 'left' : 'right', () => bongoAudio.playMarimba(item.n))}
                      className={`py-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        isActive
                          ? 'bg-[#2E6930] text-white border-[#2E6930] scale-95 shadow-inner'
                          : 'bg-[#FAF8F5] text-[#2C2825] border-[#E7E1D7] hover:bg-[#EEF5EE]'
                      }`}
                    >
                      <div className="text-xs">{item.k}</div>
                      <div className="text-[9px] opacity-60 font-mono">{item.n}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {(currentInstrument === 'cymbal' || currentInstrument === 'cowbell' || currentInstrument === 'tambourine') && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (currentInstrument === 'cymbal') playKeyDirectly('C', 'cymbal', 'right', () => bongoAudio.playCymbal());
                    if (currentInstrument === 'cowbell') playKeyDirectly('F', 'cowbell', 'right', () => bongoAudio.playCowbell());
                    if (currentInstrument === 'tambourine') playKeyDirectly('B', 'tambourine', 'right', () => bongoAudio.playTambourine());
                  }}
                  className="py-4 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold bg-[#2E6930] text-white border-[#2E6930] active:scale-98 shadow-sm"
                >
                  <div className="text-sm">
                    {currentInstrument === 'cymbal' ? 'Đập Chũm Chọe' : currentInstrument === 'cowbell' ? 'Gõ Chuông Bò' : 'Rung Lắc Trống'}
                  </div>
                  <div className="text-xs font-mono opacity-80 mt-0.5">
                    Phím [ {currentInstrument === 'cymbal' ? 'C' : currentInstrument === 'cowbell' ? 'F' : 'B'} ]
                  </div>
                </button>

                <button
                  onClick={triggerBeat}
                  className="py-4 px-4 rounded-xl border text-center transition-all cursor-pointer font-bold bg-[#FAF8F5] text-[#2C2825] border-[#E7E1D7] active:scale-98 hover:bg-[#EEF5EE]"
                >
                  <div className="text-sm">Gõ Nhịp Chung</div>
                  <div className="text-xs font-mono opacity-80 mt-0.5">Phím [ Space ]</div>
                </button>
              </div>
            )}
          </div>

          {/* Sheet Music / Song Book */}
          <div className="bg-white border border-[#E7E1D7] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2E6930]" />
                <h3 className="text-xs font-bold text-[#2C2825]">Sheet nhạc Bongo Cat mẫu (Tự gõ theo)</h3>
              </div>
              <button
                onClick={() => setSongStep(0)}
                className="text-[10px] text-[#797268] hover:text-[#2C2825] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Chơi lại từ đầu
              </button>
            </div>

            {/* Song pills */}
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SONGS.map(song => (
                <button
                  key={song.id}
                  onClick={() => {
                    setSelectedSong(song);
                    setCurrentInstrument(song.instrument);
                    setSongStep(0);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedSong.id === song.id
                      ? 'bg-[#EEF5EE] text-[#2E6930] border-[#D2E5D2] font-bold'
                      : 'bg-white text-[#5C5549] border-[#E7E1D7] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span>{song.icon}</span>
                  <span>{song.title}</span>
                </button>
              ))}
            </div>

            {/* Current Song Sheet Notes Display */}
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E7E1D7] flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-[#8C8479] tracking-wider shrink-0">
                Sheet:
              </span>
              {selectedSong.notes.map((note, idx) => {
                const isCurrent = idx === songStep;
                const isPassed = idx < songStep;
                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      note === '•'
                        ? 'text-[#C5BCB0] px-0.5'
                        : isCurrent
                        ? 'bg-[#2E6930] text-white scale-110 shadow-xs ring-2 ring-[#2E6930]/30'
                        : isPassed
                        ? 'bg-[#EEF5EE] text-[#2E6930] border border-[#D2E5D2]'
                        : 'bg-white text-[#797268] border border-[#E7E1D7]'
                    }`}
                  >
                    {note}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
