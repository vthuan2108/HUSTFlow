/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { CultivationState } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPIRITUAL_SEEDS } from '../data';
declare const chrome: any;

export type SoundscapeType = 'NONE' | 'LOFI' | 'ZEN' | 'RAIN' | 'STREAM' | 'CHIMES' | 'THUNDER' | 'CAMPFIRE';

interface MeditationTimerProps {
  state: CultivationState;
  onMeditationComplete: (
    minutes: number,
    xpGained?: number,
    linhThachGained?: number,
    plantName?: string,
    plantStatus?: 'HARVESTED' | 'WITHERED'
  ) => void;
  onPassiveQiTick: (tuViGained: number) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  soundscape: SoundscapeType;
  onSoundscapeChange: (val: SoundscapeType) => void;
}

// --- WEB AUDIO API PROCEDURAL SOUNDSCAPES SYNTHESIS ---

function createNoiseBuffer(ctx: AudioContext, durationSeconds = 2): AudioBuffer {
  const bufferSize = ctx.sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startZenChords(ctx: AudioContext, destination: AudioNode) {
  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  const freqs = [110.00, 165.00, 220.00, 277.18, 329.63]; // A major pentatonic drone

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, ctx.currentTime);
  filter.connect(destination);

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Volume LFO modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.04 + idx * 0.015, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

    oscGain.gain.setValueAtTime(0.05 / freqs.length, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);

    osc.connect(oscGain);
    oscGain.connect(filter);

    osc.start();
    lfo.start();

    oscs.push(osc, lfo);
    gains.push(oscGain, lfoGain);
  });

  return {
    stop: () => {
      oscs.forEach(o => {
        try { o.stop(); } catch (e) {}
        try { o.disconnect(); } catch (e) {}
      });
      gains.forEach(g => {
        try { g.disconnect(); } catch (e) {}
      });
      try { filter.disconnect(); } catch (e) {}
    }
  };
}

function startRain(ctx: AudioContext, destination: AudioNode) {
  const noiseBuffer = createNoiseBuffer(ctx, 2);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(1000, ctx.currentTime);
  bandpass.Q.setValueAtTime(0.4, ctx.currentTime);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1500, ctx.currentTime);

  source.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(destination);

  source.start();

  const raindropGains: GainNode[] = [];
  const raindropOscs: OscillatorNode[] = [];
  const intervalId = setInterval(() => {
    if (Math.random() > 0.45) {
      try {
        const osc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        osc.type = 'sine';
        
        const startTime = ctx.currentTime;
        const endTime = startTime + 0.05;

        osc.frequency.setValueAtTime(1200 + Math.random() * 1500, startTime);
        osc.frequency.exponentialRampToValueAtTime(150, endTime);

        dropGain.gain.setValueAtTime(0.003 + Math.random() * 0.006, startTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(dropGain);
        dropGain.connect(destination);

        osc.start(startTime);
        osc.stop(endTime);

        raindropOscs.push(osc);
        raindropGains.push(dropGain);

        if (raindropOscs.length > 20) {
          raindropOscs.shift();
          raindropGains.shift();
        }
      } catch (e) {}
    }
  }, 180);

  return {
    stop: () => {
      clearInterval(intervalId);
      try { source.stop(); } catch (e) {}
      try { source.disconnect(); } catch (e) {}
      try { bandpass.disconnect(); } catch (e) {}
      try { lowpass.disconnect(); } catch (e) {}
      raindropOscs.forEach(o => { try { o.disconnect(); } catch (e) {} });
      raindropGains.forEach(g => { try { g.disconnect(); } catch (e) {} });
    }
  };
}

function startStream(ctx: AudioContext, destination: AudioNode) {
  const noiseBuffer = createNoiseBuffer(ctx, 2);
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(500, ctx.currentTime);
  filter.Q.setValueAtTime(1.2, ctx.currentTime);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
  lfoGain.gain.setValueAtTime(120, ctx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  source.connect(filter);
  filter.connect(destination);

  source.start();
  lfo.start();

  return {
    stop: () => {
      try { source.stop(); } catch (e) {}
      try { lfo.stop(); } catch (e) {}
      try { source.disconnect(); } catch (e) {}
      try { lfo.disconnect(); } catch (e) {}
      try { lfoGain.disconnect(); } catch (e) {}
      try { filter.disconnect(); } catch (e) {}
    }
  };
}

function startWindChimes(ctx: AudioContext, destination: AudioNode) {
  const chimesScale = [880.00, 987.77, 1109.73, 1318.51, 1479.98, 1760.00];
  const activeOscs: OscillatorNode[] = [];
  const activeGains: GainNode[] = [];

  const playChime = () => {
    try {
      const freq = chimesScale[Math.floor(Math.random() * chimesScale.length)];
      const duration = 2.5 + Math.random() * 2.5;
      const startTime = ctx.currentTime;
      const endTime = startTime + duration;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, startTime);

      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0, startTime);
      chimeGain.gain.linearRampToValueAtTime(0.025, startTime + 0.015);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc1.connect(chimeGain);
      osc2.connect(chimeGain);
      chimeGain.connect(destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(endTime);
      osc2.stop(endTime);

      activeOscs.push(osc1, osc2);
      activeGains.push(chimeGain);

      if (activeOscs.length > 20) {
        activeOscs.splice(0, 4);
        activeGains.splice(0, 2);
      }
    } catch (e) {}
  };

  const intervalId = setInterval(() => {
    if (Math.random() > 0.45) {
      playChime();
      if (Math.random() > 0.5) {
        setTimeout(playChime, 300 + Math.random() * 500);
      }
    }
  }, 3500);

  return {
    stop: () => {
      clearInterval(intervalId);
      activeOscs.forEach(o => { try { o.disconnect(); } catch (e) {} });
      activeGains.forEach(g => { try { g.disconnect(); } catch (e) {} });
    }
  };
}

function startCampfire(ctx: AudioContext, destination: AudioNode) {
  // 1. Warm flame roar
  const noiseBuffer = createNoiseBuffer(ctx, 2);
  const flameSource = ctx.createBufferSource();
  flameSource.buffer = noiseBuffer;
  flameSource.loop = true;

  const flameFilter = ctx.createBiquadFilter();
  flameFilter.type = 'lowpass';
  flameFilter.frequency.setValueAtTime(80, ctx.currentTime);

  const flameGain = ctx.createGain();
  flameGain.gain.setValueAtTime(0.3, ctx.currentTime);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(1.5, ctx.currentTime);
  lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

  lfo.connect(lfoGain);
  lfoGain.connect(flameGain.gain);

  flameSource.connect(flameFilter);
  flameFilter.connect(flameGain);
  flameGain.connect(destination);

  flameSource.start();
  lfo.start();

  // 2. Crackling sparks
  const activeOscs: OscillatorNode[] = [];
  const activeGains: GainNode[] = [];
  
  const playCrackle = () => {
    try {
      const osc = ctx.createOscillator();
      const crackleGain = ctx.createGain();
      osc.type = 'triangle';
      
      const startTime = ctx.currentTime;
      const duration = 0.005 + Math.random() * 0.015;
      const endTime = startTime + duration;

      osc.frequency.setValueAtTime(800 + Math.random() * 2500, startTime);
      crackleGain.gain.setValueAtTime(0.008 + Math.random() * 0.012, startTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(crackleGain);
      crackleGain.connect(destination);

      osc.start(startTime);
      osc.stop(endTime);

      activeOscs.push(osc);
      activeGains.push(crackleGain);

      if (activeOscs.length > 30) {
        activeOscs.shift();
        activeGains.shift();
      }
    } catch (e) {}
  };

  const intervalId = setInterval(() => {
    const rolls = Math.floor(Math.random() * 3) + 1;
    for (let r = 0; r < rolls; r++) {
      if (Math.random() > 0.4) {
        setTimeout(playCrackle, Math.random() * 400);
      }
    }
  }, 300);

  return {
    stop: () => {
      clearInterval(intervalId);
      try { flameSource.stop(); } catch (e) {}
      try { lfo.stop(); } catch (e) {}
      try { flameSource.disconnect(); } catch (e) {}
      try { lfo.disconnect(); } catch (e) {}
      try { lfoGain.disconnect(); } catch (e) {}
      try { flameFilter.disconnect(); } catch (e) {}
      try { flameGain.disconnect(); } catch (e) {}
      activeOscs.forEach(o => { try { o.disconnect(); } catch (e) {} });
      activeGains.forEach(g => { try { g.disconnect(); } catch (e) {} });
    }
  };
}

function startThunderStorm(ctx: AudioContext, destination: AudioNode) {
  const rain = startRain(ctx, destination);
  let thunderSource: AudioBufferSourceNode | null = null;
  let thunderGain: GainNode | null = null;

  const playThunderRoll = () => {
    try {
      const duration = 4 + Math.random() * 4;
      const startTime = ctx.currentTime;
      const endTime = startTime + duration;

      const buffer = createNoiseBuffer(ctx, duration);
      thunderSource = ctx.createBufferSource();
      thunderSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, startTime);
      filter.frequency.exponentialRampToValueAtTime(30, startTime + duration * 0.8);

      thunderGain = ctx.createGain();
      thunderGain.gain.setValueAtTime(0, startTime);
      thunderGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.05, startTime + 0.3);
      thunderGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      thunderSource.connect(filter);
      filter.connect(thunderGain);
      thunderGain.connect(destination);

      thunderSource.start(startTime);
    } catch (e) {}
  };

  const intervalId = setInterval(() => {
    if (Math.random() > 0.4) {
      playThunderRoll();
    }
  }, 12000);

  return {
    stop: () => {
      clearInterval(intervalId);
      rain.stop();
      try {
        if (thunderSource) {
          thunderSource.stop();
          thunderSource.disconnect();
        }
        if (thunderGain) {
          thunderGain.disconnect();
        }
      } catch (e) {}
    }
  };
}

function startLofiBeat(ctx: AudioContext, destination: AudioNode) {
  const oscs: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const gains: GainNode[] = [];

  // 1. Vinyl Crackle Background Noise
  const noiseBuffer = createNoiseBuffer(ctx, 3);
  const vinylSource = ctx.createBufferSource();
  vinylSource.buffer = noiseBuffer;
  vinylSource.loop = true;

  const vinylFilter = ctx.createBiquadFilter();
  vinylFilter.type = 'bandpass';
  vinylFilter.frequency.setValueAtTime(1100, ctx.currentTime);
  vinylFilter.Q.setValueAtTime(0.7, ctx.currentTime);

  const vinylGain = ctx.createGain();
  vinylGain.gain.setValueAtTime(0.012, ctx.currentTime);

  vinylSource.connect(vinylFilter);
  vinylFilter.connect(vinylGain);
  vinylGain.connect(destination);
  vinylSource.start();

  oscs.push(vinylSource);
  gains.push(vinylGain);

  // 2. Warm Lofi 7th Chords Progression
  // Fmaj7 (F3, A3, C4, E4), Em7 (E3, G3, B3, D4), Dm7 (D3, F3, A3, C4), Cmaj7 (C3, E3, G3, B3)
  const chordProgression = [
    [174.61, 220.00, 261.63, 329.63],
    [164.81, 196.00, 246.94, 293.66],
    [146.83, 174.61, 220.00, 261.63],
    [130.81, 164.81, 196.00, 246.94],
  ];

  const chordMasterGain = ctx.createGain();
  chordMasterGain.gain.setValueAtTime(0.15, ctx.currentTime);

  const lofiFilter = ctx.createBiquadFilter();
  lofiFilter.type = 'lowpass';
  lofiFilter.frequency.setValueAtTime(450, ctx.currentTime);

  // Tape flutter pitch vibrato
  const vibratoLfo = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibratoLfo.frequency.setValueAtTime(0.2, ctx.currentTime);
  vibratoGain.gain.setValueAtTime(2.0, ctx.currentTime);
  vibratoLfo.start();
  vibratoLfo.connect(vibratoGain);

  let currentChordIndex = 0;
  const activeChordOscs: OscillatorNode[] = [];
  const activeChordGains: GainNode[] = [];

  const playChord = (chordFreqs: number[]) => {
    activeChordGains.forEach(g => {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      } catch (e) {}
    });

    chordFreqs.forEach(freq => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const startTime = ctx.currentTime;
        try {
          vibratoGain.connect(osc.frequency);
        } catch (e) {}

        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.05, startTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.01, startTime + 3.8);

        osc.connect(gain);
        gain.connect(lofiFilter);

        osc.start(startTime);
        activeChordOscs.push(osc);
        activeChordGains.push(gain);
      } catch (e) {}
    });
  };

  lofiFilter.connect(chordMasterGain);
  chordMasterGain.connect(destination);

  playChord(chordProgression[0]);

  const chordIntervalId = setInterval(() => {
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;
    playChord(chordProgression[currentChordIndex]);
  }, 4000);

  // 3. Relaxed Lofi Soft Kick Drum
  const beatIntervalId = setInterval(() => {
    try {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(80, ctx.currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.12);

      kickGain.gain.setValueAtTime(0.10, ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      kickOsc.connect(kickGain);
      kickGain.connect(destination);
      kickOsc.start();
      kickOsc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }, 2000);

  return {
    stop: () => {
      clearInterval(chordIntervalId);
      clearInterval(beatIntervalId);
      try { vibratoLfo.stop(); } catch (e) {}
      try { vibratoLfo.disconnect(); } catch (e) {}
      oscs.forEach(o => { try { (o as any).stop(); o.disconnect(); } catch (e) {} });
      activeChordOscs.forEach(o => { try { o.stop(); o.disconnect(); } catch (e) {} });
      activeChordGains.forEach(g => { try { g.disconnect(); } catch (e) {} });
      gains.forEach(g => { try { g.disconnect(); } catch (e) {} });
      try { lofiFilter.disconnect(); } catch (e) {}
      try { chordMasterGain.disconnect(); } catch (e) {}
    }
  };
}

const SPIRITUAL_QUOTES = [
  'Lòng không tạp niệm, linh khí tự động hội tụ...',
  'Đạo tâm kiên định, phá vỡ vạn trùng bình cảnh.',
  'Thiền định tập trung, nhất niệm thông thiên địa.',
  'Mài giũa ý chí, ngưng tụ nguyên anh thần hồn.',
  'Hơi thở nhẹ nhàng, vạn vật giai không.',
  'Mỗi giây bế quan, kinh mạch lại được củng cố một phần.',
  'Ý chí sắt đá, xua tan tâm ma xâm nhập.',
  'Trời đất bao la, đạo hằng ở trong tim ta.',
];

export default function MeditationTimer({
  state,
  onMeditationComplete,
  onPassiveQiTick,
  isFocusMode,
  onToggleFocusMode,
  soundscape,
  onSoundscapeChange
}: MeditationTimerProps) {
  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'FREE'>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSeedId, setSelectedSeedId] = useState<string>(() => {
    return localStorage.getItem('tlk_selected_seed_id') || 'ngoc_linh_chi';
  });

  const [completedCycles, setCompletedCycles] = useState<number>(() => {
    return Number(localStorage.getItem('tlk_completed_cycles') || '0');
  });

  useEffect(() => {
    localStorage.setItem('tlk_selected_seed_id', selectedSeedId);
  }, [selectedSeedId]);

  useEffect(() => {
    localStorage.setItem('tlk_completed_cycles', completedCycles.toString());
  }, [completedCycles]);

  const [showBlockerSettings, setShowBlockerSettings] = useState<boolean>(false);
  const [blockedDomains, setBlockedDomains] = useState<string[]>(() => {
    const saved = localStorage.getItem('tlk_blocked_domains');
    return saved ? JSON.parse(saved) : ['facebook.com', 'youtube.com', 'tiktok.com', 'twitter.com'];
  });
  const [isBlockerEnabled, setIsBlockerEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tlk_blocker_enabled') !== 'false';
  });
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [isExtensionInstalled, setIsExtensionInstalled] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('tlk_blocked_domains', JSON.stringify(blockedDomains));
  }, [blockedDomains]);

  useEffect(() => {
    localStorage.setItem('tlk_blocker_enabled', String(isBlockerEnabled));
  }, [isBlockerEnabled]);

  useEffect(() => {
    const checkExt = () => {
      const isExtensionUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
      if (isExtensionUrl || document.documentElement.dataset.tlkExtensionInstalled === "true") {
        setIsExtensionInstalled(true);
      }
    };
    checkExt();
    const intervalId = setInterval(checkExt, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const detail = (isBlockerEnabled && isRunning && mode === 'FOCUS')
      ? { action: 'START_BLOCKING', blocklist: blockedDomains }
      : { action: 'STOP_BLOCKING' };

    window.dispatchEvent(
      new CustomEvent('TLK_BLOCKER_SYNC', { detail })
    );

    window.postMessage(
      { type: 'TLK_BLOCKER_SYNC', detail },
      '*'
    );
  }, [isRunning, mode, isBlockerEnabled, blockedDomains]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const passiveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundscapePlayerRef = useRef<{ stop: () => void } | null>(null);
  const tickStartRef = useRef<number>(Date.now());
  const wallClockStartRef = useRef<number>(Date.now());
  const wallClockStartSecondsRef = useRef<number>(0);
  const lastRewardedFreeCycleRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [smoothProgress, setSmoothProgress] = useState(0);

  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    return audioContextRef.current;
  };

  // 60fps smooth progress animation
  const maxTimeDep = (() => {
    if (mode === 'FOCUS') return 25 * 60;
    if (mode === 'SHORT_BREAK') return 5 * 60;
    return 25 * 60; // For FREE mode, the ring fills up every 25 minutes (1500 seconds)
  })();

  useEffect(() => {
    const animate = () => {
      if (isRunning) {
        const msSinceTick = Date.now() - tickStartRef.current;
        if (mode === 'FREE') {
          const currentProgressSeconds = timeLeft % 1500;
          const elapsedSecs = currentProgressSeconds + Math.min(msSinceTick / 1000, 0.999);
          setSmoothProgress(Math.min(elapsedSecs / 1500, 1));
        } else {
          const elapsedSecs = (maxTimeDep - timeLeft) + Math.min(msSinceTick / 1000, 0.999);
          setSmoothProgress(Math.min(elapsedSecs / maxTimeDep, 1));
        }
      } else {
        if (mode === 'FREE') {
          setSmoothProgress((timeLeft % 1500) / 1500);
        } else {
          setSmoothProgress((maxTimeDep - timeLeft) / maxTimeDep);
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, timeLeft, maxTimeDep, mode]);


  useEffect(() => {
    if (isRunning && soundscape !== 'NONE') {
      try {
        const ctx = getAudioContext();
        if (ctx) {
          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          if (soundscapePlayerRef.current) {
            soundscapePlayerRef.current.stop();
            soundscapePlayerRef.current = null;
          }

          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
          masterGain.connect(ctx.destination);

          let player: { stop: () => void } | null = null;
          if (soundscape === 'LOFI') {
            player = startLofiBeat(ctx, masterGain);
          } else if (soundscape === 'ZEN') {
            player = startZenChords(ctx, masterGain);
          } else if (soundscape === 'RAIN') {
            player = startRain(ctx, masterGain);
          } else if (soundscape === 'STREAM') {
            player = startStream(ctx, masterGain);
          } else if (soundscape === 'CHIMES') {
            player = startWindChimes(ctx, masterGain);
          } else if (soundscape === 'THUNDER') {
            player = startThunderStorm(ctx, masterGain);
          } else if (soundscape === 'CAMPFIRE') {
            player = startCampfire(ctx, masterGain);
          }

          soundscapePlayerRef.current = player;
        }
      } catch (e) {
        console.warn('Failed to start soundscape player:', e);
      }
    } else {
      if (soundscapePlayerRef.current) {
        soundscapePlayerRef.current.stop();
        soundscapePlayerRef.current = null;
      }
    }

    return () => {
      if (soundscapePlayerRef.current) {
        soundscapePlayerRef.current.stop();
        soundscapePlayerRef.current = null;
      }
    };
  }, [isRunning, soundscape]);

  // Play completion sound using Web Audio API
  const playCompletionSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const playBell = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      playBell(now, 523.25, 1.5); // C5
      playBell(now + 0.3, 659.25, 1.5); // E5
      playBell(now + 0.6, 783.99, 2.0); // G5
    } catch (e) {
      console.warn('Audio play blocked or failed', e);
    }
  };

  const selectedSeed = SPIRITUAL_SEEDS.find(s => s.id === selectedSeedId) || SPIRITUAL_SEEDS[0];

  const getRequiredCycles = (rarity: string) => {
    if (rarity === 'SO_CAP') return 1;
    if (rarity === 'TRUNG_CAP') return 2;
    if (rarity === 'CAO_CAP') return 3;
    return 4; // THAN_CAP
  };

  const getModeDuration = (m: typeof mode) => {
    if (m === 'FOCUS') return 25 * 60; // Always 25 minutes for all seeds
    if (m === 'SHORT_BREAK') return 5 * 60;
    return 0; // FREE mode starts at 0 and counts up
  };

  const isSeedUnlocked = (seedId: string): boolean => {
    const level = state.level;
    if (seedId === 'ngo_dao_tra' || seedId === 'phuong_hoang_hoa') return level >= 10;
    if (seedId === 'tuyet_lien' || seedId === 'hoa_long_qua') return level >= 19;
    if (seedId === 'ngu_sac_linh_truc' || seedId === 'hon_don_dao_qua') return level >= 28;
    return true;
  };

  const getSeedRewards = (rarity: string) => {
    if (rarity === 'SO_CAP') return { xp: 50, coins: 50 };
    if (rarity === 'TRUNG_CAP') return { xp: 100, coins: 100 }; // doubled
    if (rarity === 'CAO_CAP') return { xp: 200, coins: 200 }; // doubled
    return { xp: 400, coins: 400 }; // doubled (THAN_CAP)
  };

  const seedRewards = getSeedRewards(selectedSeed.rarity);
  const gatheringPill = state.inventory.find(i => i.itemId === 'tu_khi_dan');
  const pillBonusMultiplier = gatheringPill ? 0.25 : 0;
  const actualExpGained = Math.round(seedRewards.xp * (1 + pillBonusMultiplier));
  const actualCoinsGained = seedRewards.coins;

  const handleModeChange = (newMode: typeof mode) => {
    if (newMode === mode) return;
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getModeDuration(newMode));
  };

  useEffect(() => {
    let quoteInterval: NodeJS.Timeout;
    if (isRunning) {
      quoteInterval = setInterval(() => {
        setQuoteIndex(prev => (prev + 1) % SPIRITUAL_QUOTES.length);
      }, 30000);
    }
    return () => clearInterval(quoteInterval);
  }, [isRunning]);

  // Main wall-clock countdown/countup logic with background tab precision
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const processTimerTick = () => {
      const now = Date.now();
      tickStartRef.current = now;
      const elapsedSecs = Math.floor((now - wallClockStartRef.current) / 1000);

      if (mode === 'FREE') {
        const calculatedSeconds = wallClockStartSecondsRef.current + elapsedSecs;
        const currentFreeCycle = Math.floor(calculatedSeconds / 1500);

        // Check if crossed one or multiple 25-minute (1500s) milestones while backgrounded
        if (currentFreeCycle > lastRewardedFreeCycleRef.current) {
          const cyclesCompleted = currentFreeCycle - lastRewardedFreeCycleRef.current;
          lastRewardedFreeCycleRef.current = currentFreeCycle;

          playCompletionSound();

          const cycle1Plants = [
            { name: 'Ngọc Linh Chi', icon: '🍄' },
            { name: 'Cửu Diệp Thảo', icon: '🌿' },
            { name: 'Bạch Ngọc Liên', icon: '🪷' },
            { name: 'Thanh Long Thảo', icon: '🌵' }
          ];

          const spellingQi = state.activeSpells?.includes('spell_tu_khi_quyet');
          const spellingTamMa = state.activeSpells?.includes('spell_tam_ma_tram');
          const activeSpellMultiplier = spellingQi ? 0.30 : 0;
          const coinSpellMultiplier = spellingTamMa ? 1.0 : 0;
          const pillBonus = state.inventory.some(i => i.itemId === 'tu_khi_dan') ? 0.25 : 0;

          const baseXP = 50 * cyclesCompleted;
          const baseCoins = 50 * cyclesCompleted;
          const finalXp = Math.round(baseXP * (1 + pillBonus + activeSpellMultiplier));
          const finalCoins = Math.round(baseCoins * (1 + coinSpellMultiplier));

          const randomPlant = cycle1Plants[Math.floor(Math.random() * cycle1Plants.length)];

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🧘 Tự Do Bế Quan Đắc Đạo!', {
              body: `Đạo hữu thiền định tự do đạt ${25 * cyclesCompleted} phút! Nhận linh thảo [${randomPlant.name}]. Nhận +${finalXp} Tu Vi và +${finalCoins} Linh Thạch.`,
              icon: '/icon.png'
            });
          }
          onMeditationComplete(25 * cyclesCompleted, finalXp, finalCoins, randomPlant.name, 'HARVESTED');
        }

        setTimeLeft(calculatedSeconds);
      } else {
        // COUNTDOWN MODE (FOCUS or SHORT_BREAK)
        const calculatedSeconds = Math.max(0, wallClockStartSecondsRef.current - elapsedSecs);
        setTimeLeft(calculatedSeconds);

        if (calculatedSeconds <= 0) {
          clearInterval(timerRef.current!);
          setIsRunning(false);
          playCompletionSound();

          if (mode === 'FOCUS') {
            const reqCycles = getRequiredCycles(selectedSeed.rarity);
            const nextCycles = completedCycles + 1;

            if (nextCycles >= reqCycles) {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🧘 Cảnh Giới Bế Quan Viên Mãn!', {
                  body: `Chúc mừng đạo hữu! Thu hoạch thành công [${selectedSeed.name}]. Nhận ngay +${actualExpGained} Tu Vi và +${actualCoinsGained} Linh Thạch.`,
                  icon: '/icon.png'
                });
              }
              const sessionMins = 25 * reqCycles;
              onMeditationComplete(sessionMins, actualExpGained, actualCoinsGained, selectedSeed.name, 'HARVESTED');
              setCompletedCycles(0);
              setMode('SHORT_BREAK');
              setTimeLeft(5 * 60);
            } else {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🌱 Chu Kỳ Bế Quan Hoàn Thành!', {
                  body: `Đạo hữu đã hoàn thành chu kỳ ${nextCycles}/${reqCycles} để nuôi trồng [${selectedSeed.name}]. Hãy nghỉ ngơi trước khi bắt đầu chu kỳ tiếp theo!`,
                  icon: '/icon.png'
                });
              }
              setCompletedCycles(nextCycles);
              setMode('SHORT_BREAK');
              setTimeLeft(5 * 60);
            }
          } else {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⚡ Thời Gian Thần Tức Kết Thúc!', {
                body: 'Tinh thần đạo hữu đã sảng khoái, hãy chuẩn bị quay lại bế quan tu luyện!',
                icon: '/icon.png'
              });
            }
            setMode('FOCUS');
            setTimeLeft(25 * 60);
          }
        }
      }
    };

    processTimerTick();
    timerRef.current = setInterval(processTimerTick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processTimerTick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, mode, actualExpGained, actualCoinsGained, selectedSeed, completedCycles, state.activeSpells, state.inventory]);

  // Passive Qi Ticks (Exp gain)
  const hasQiArray = state.inventory.some(i => i.itemId === 'tu_linh_tran');
  useEffect(() => {
    if (isRunning && mode === 'FOCUS' && hasQiArray) {
      passiveTimerRef.current = setInterval(() => {
        onPassiveQiTick(2);
      }, 5000);
    } else {
      if (passiveTimerRef.current) clearInterval(passiveTimerRef.current);
    }

    return () => {
      if (passiveTimerRef.current) clearInterval(passiveTimerRef.current);
    };
  }, [isRunning, mode, hasQiArray]);

  const toggleTimer = () => {
    if (!isRunning) {
      wallClockStartRef.current = Date.now();
      wallClockStartSecondsRef.current = timeLeft;
      if (mode === 'FREE') {
        lastRewardedFreeCycleRef.current = Math.floor(timeLeft / 1500);
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (isRunning && mode === 'FOCUS') {
      if (confirm(`☠️ ĐẠO TÂM LUNG LAY?\n\nNếu tự ý phá trận pháp bế quan lúc này, Linh Thảo [${selectedSeed.name}] đang gieo trồng sẽ bị héo úa (chết).\nĐạo hữu có chắc chắn muốn hủy bỏ?`)) {
        clearInterval(timerRef.current!);
        if (passiveTimerRef.current) clearInterval(passiveTimerRef.current);
        setIsRunning(false);
        setCompletedCycles(0); // reset progress entirely
        onMeditationComplete(0, 0, 0, selectedSeed.name, 'WITHERED');
        setTimeLeft(getModeDuration(mode));
      }
    } else {
      setIsRunning(false);
      setTimeLeft(getModeDuration(mode));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Cycle seed left/right
  const unlockedSeeds = SPIRITUAL_SEEDS.filter(s => isSeedUnlocked(s.id));
  const currentSeedIdxInUnlocked = unlockedSeeds.findIndex(s => s.id === selectedSeedId);

  const handlePrevSeed = () => {
    if (unlockedSeeds.length === 0) return;
    const newIdx = (currentSeedIdxInUnlocked - 1 + unlockedSeeds.length) % unlockedSeeds.length;
    const newSeed = unlockedSeeds[newIdx];
    setSelectedSeedId(newSeed.id);
    setCompletedCycles(0); // reset progress on cycle change
    if (!isRunning && mode === 'FOCUS') {
      setTimeLeft(25 * 60);
    }
  };

  const handleNextSeed = () => {
    if (unlockedSeeds.length === 0) return;
    const newIdx = (currentSeedIdxInUnlocked + 1) % unlockedSeeds.length;
    const newSeed = unlockedSeeds[newIdx];
    setSelectedSeedId(newSeed.id);
    setCompletedCycles(0); // reset progress on cycle change
    if (!isRunning && mode === 'FOCUS') {
      setTimeLeft(25 * 60);
    }
  };

  // Always show the selected seed icon when focus timer is active
  const plantStageEmoji = selectedSeed.icon || '🌿';

  return (
    <div className="neo-card flex flex-col items-center justify-between relative overflow-hidden h-[590px] max-h-[590px] w-full" id="meditation-timer">

      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-4 pt-4 pb-2">
        {/* Mode Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-950 border-2 border-slate-950 rounded-xl shadow-[1px_1px_0px_#000]">
          <button
            onClick={() => handleModeChange('FOCUS')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
              mode === 'FOCUS'
                ? 'bg-emerald-400 text-slate-950 border border-slate-950 shadow-[1px_1px_0px_#000]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Bế Quan
          </button>
          <button
            onClick={() => handleModeChange('SHORT_BREAK')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
              mode === 'SHORT_BREAK'
                ? 'bg-blue-400 text-slate-950 border border-slate-950 shadow-[1px_1px_0px_#000]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Tiểu Đốn
          </button>
          <button
            onClick={() => handleModeChange('FREE')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
              mode === 'FREE'
                ? 'bg-purple-400 text-slate-950 border border-slate-950 shadow-[1px_1px_0px_#000]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Tự Do
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-950 border-2 border-slate-950 text-slate-400 hover:text-slate-200 cursor-pointer shadow-[1px_1px_0px_#000]"
            title={soundEnabled ? 'Tắt tiếng' : 'Bật tiếng'}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
          <button
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-lg border-2 cursor-pointer transition-all ${
              isFocusMode
                ? 'bg-amber-400 text-slate-950 border-slate-950 shadow-[1px_1px_0px_#000]'
                : 'bg-slate-950 text-slate-400 border-slate-950 hover:text-amber-400 shadow-[1px_1px_0px_#000]'
            }`}
            title="Cảnh giới Focus"
          >
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ─── MAIN FOREST-STYLE DISPLAY ─── */}
      <div className="flex flex-col items-center px-6 pb-4 w-full">

        {/* Large circular timer with plant inside */}
        <div className="relative flex items-center justify-center my-4">
          {/* Outer SVG ring */}
          <svg width="220" height="220" className="-rotate-90">
            <defs>
              <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="breakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <style>{`
                @keyframes pulse-ring {
                  0%, 100% { filter: drop-shadow(0 0 4px #10b981); }
                  50% { filter: drop-shadow(0 0 14px #10b981) drop-shadow(0 0 24px #10b981); }
                }
                @keyframes pulse-ring-break {
                  0%, 100% { filter: drop-shadow(0 0 4px #3b82f6); }
                  50% { filter: drop-shadow(0 0 14px #3b82f6) drop-shadow(0 0 24px #3b82f6); }
                }
              `}</style>
            </defs>

            {/* Background track (remaining portion — dim) */}
            <circle
              cx="110" cy="110" r="96"
              fill="none"
              stroke="#000000"
              strokeWidth="12"
            />

            {/* Elapsed progress arc — fills clockwise, smooth 60fps */}
            <circle
              cx="110" cy="110" r="96"
              fill="none"
              stroke={mode === 'FOCUS' ? 'url(#focusGrad)' : 'url(#breakGrad)'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 96}`}
              strokeDashoffset={2 * Math.PI * 96 * (1 - smoothProgress)}
              style={{
                animation: isRunning && smoothProgress > 0.85
                  ? (mode === 'FOCUS' ? 'pulse-ring 1.4s ease-in-out infinite' : 'pulse-ring-break 1.4s ease-in-out infinite')
                  : undefined,
              }}
            />

          </svg>

          {/* Inner circle content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Inner cream-colored circle (like Forest app) */}
            <div
              className="w-44 h-44 rounded-full border-[3px] border-slate-950 flex flex-col items-center justify-end pb-4 relative overflow-hidden"
              style={{ background: 'radial-gradient(circle, #1a2a1f 0%, #0d1a11 100%)' }}
            >
              {mode === 'FOCUS' && (
                <div className="absolute top-4 text-[9px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 border-2 border-slate-950 z-10 select-none shadow-[1px_1px_0px_#000] pixel-label">
                  Chu kỳ: {completedCycles}/{getRequiredCycles(selectedSeed.rarity)}
                </div>
              )}
              {/* Dirt mound half-circle at bottom */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 rounded-t-full border-t-2 border-slate-950"
                style={{ background: 'linear-gradient(to top, #5c3317, #7a4520)' }}
              />

              {/* Plant growing from dirt */}
              <div className="absolute bottom-6 flex items-end justify-center w-full z-10">
                {isRunning && mode === 'FOCUS' ? (
                  <motion.span
                    key={plantStageEmoji}
                    initial={{ scale: 0.6, y: 10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="select-none drop-shadow-lg"
                    style={{ fontSize: `${2 + smoothProgress * 2}rem`, lineHeight: 1 }}
                  >
                    {plantStageEmoji}
                  </motion.span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="select-none drop-shadow-lg"
                    style={{ fontSize: '2.4rem', lineHeight: 1 }}
                  >
                    {selectedSeed.icon}
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seed name row with arrow navigation */}
        {mode === 'FOCUS' && (
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handlePrevSeed}
              disabled={isRunning}
              className={`w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-950 text-slate-400 hover:text-emerald-400 hover:border-emerald-800 transition-all cursor-pointer flex items-center justify-center text-xs font-black shadow-[1px_1px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                isRunning ? 'opacity-0 pointer-events-none' : ''
              }`}
              title="Linh thảo trước"
            >
              ‹
            </button>
            <div className="text-center min-w-[120px]">
              <p className="text-xs font-bold text-slate-200">{selectedSeed.icon} {selectedSeed.name}</p>
              <p className="text-[9px] text-slate-500 font-mono">
                {selectedSeed.rarity === 'SO_CAP' ? 'Sơ Cấp' :
                 selectedSeed.rarity === 'TRUNG_CAP' ? 'Trung Cấp' :
                 selectedSeed.rarity === 'CAO_CAP' ? 'Cao Cấp' : 'Thần Cấp'} •
                +{seedRewards.xp} Tu Vi
              </p>
            </div>
            <button
              onClick={handleNextSeed}
              disabled={isRunning}
              className={`w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-950 text-slate-400 hover:text-emerald-400 hover:border-emerald-800 transition-all cursor-pointer flex items-center justify-center text-xs font-black shadow-[1px_1px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                isRunning ? 'opacity-0 pointer-events-none' : ''
              }`}
              title="Linh thảo tiếp theo"
            >
              ›
            </button>
          </div>
        )}

        {mode === 'FREE' && (
          <div className="text-center min-w-[200px] mb-3 flex flex-col items-center">
            <p className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
              ✨ Trận Pháp Tự Do Tu Luyện ✨
            </p>
            <p className="text-[8.5px] text-slate-500 font-mono mt-0.5 max-w-[210px] leading-relaxed">
              Thiền định đếm giờ tự do. Đủ mỗi 25 phút sẽ ngẫu nhiên nhận được 1 linh thảo Sơ Cấp.
            </p>
          </div>
        )}

        {mode === 'SHORT_BREAK' && (
          <div className="text-center min-w-[200px] mb-3 flex flex-col items-center opacity-0 pointer-events-none select-none">
            <p className="text-[10px] font-bold text-blue-400">✨ Nghỉ ngơi dưỡng thần ✨</p>
            <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">Tạm dừng bế quan, xả hơi định thần.</p>
          </div>
        )}

        {/* Timer digits */}
        <div className="text-5xl font-black font-mono tracking-widest text-slate-100 mb-1 pixel-label pixel-shadow">
          {formatTime(timeLeft)}
        </div>

        {/* Quote or seed description */}
        <div className="text-center px-3 mb-4 h-8 flex items-center justify-center">
          <p className="text-[10px] text-slate-500 italic font-sans">
            {isRunning
              ? `"${SPIRITUAL_QUOTES[quoteIndex]}"`
              : `"${selectedSeed.description}"`}
          </p>
        </div>

        {/* Soundscape selector (compact) */}
        <div className="w-full mb-4">
          <select
            value={soundscape}
            onChange={(e) => {
              const val = e.target.value as SoundscapeType;
              onSoundscapeChange(val);
              getAudioContext();
            }}
            className="w-full bg-slate-950 border-2 border-slate-950 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer font-bold shadow-[2px_2px_0px_#000] text-center"
          >
            <option value="NONE">🔇 Tắt nhạc nền</option>
            <option value="LOFI">🎧 Nhạc Lofi Chill (Châm Trà Thưởng Nguyệt)</option>
            <option value="ZEN">🧘 Hợp Âm Thiền (Zen)</option>
            <option value="RAIN">🌧️ Mưa Rơi Trúc Lâm</option>
            <option value="STREAM">🌊 Linh Tuyền Thủy Lưu</option>
            <option value="CHIMES">🎐 Đạo Quán Linh Chuông</option>
            <option value="THUNDER">⚡ Lôi Kiếp Sấm Sét</option>
            <option value="CAMPFIRE">🔥 Lửa Trại Dưỡng Thần</option>
          </select>
        </div>

        {/* Main action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={resetTimer}
            className="p-2.5 rounded-full bg-slate-950 border-2 border-slate-950 text-slate-400 hover:text-slate-200 transition-colors shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
            title="Thiết lập lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowBlockerSettings(true)}
            className={`p-2.5 rounded-full border-2 border-slate-950 transition-all shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer ${
              isBlockerEnabled && isExtensionInstalled
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                : 'bg-slate-950 text-slate-400 hover:text-slate-250'
            }`}
            title="Thiết lập Trận Pháp Chặn Tâm Ma"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-2.5 neo-btn text-[11px] font-black tracking-widest ${
              isRunning
                ? 'bg-slate-200 text-slate-950'
                : mode === 'FOCUS'
                ? 'neo-btn-primary'
                : mode === 'FREE'
                ? 'bg-purple-400 text-slate-950'
                : 'bg-blue-400 text-slate-950'
            }`}
            id="toggle-timer-btn"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                TẠM DỪNG
              </>
            ) : mode === 'FOCUS' ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                GIEO TRỒNG
              </>
            ) : mode === 'FREE' ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                TỰ DO TU LUYỆN
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                NGHỈ NGƠI
              </>
            )}
          </button>
        </div>

        {/* Rewards footer */}
        {mode === 'FOCUS' && (
          <div className="mt-4 pt-3 border-t-2 border-slate-950 w-full flex justify-around text-[9px] text-slate-500 font-mono">
            <span>Tu Vi: <strong className="text-emerald-400">+{actualExpGained}</strong></span>
            <span>Linh Thạch: <strong className="text-amber-400">+{actualCoinsGained}</strong></span>
            {gatheringPill && <span className="text-emerald-500">Tụ Khí Đan +25%</span>}
          </div>
        )}

        {/* Blocker Settings Modal */}
        <AnimatePresence>
          {showBlockerSettings && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="neo-card p-5 max-w-sm w-full text-center space-y-4 relative"
              >
                <button
                  onClick={() => setShowBlockerSettings(false)}
                  className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-350 font-bold"
                >
                  ✕
                </button>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide pixel-label flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-400" />
                    Trận Pháp Chặn Tâm Ma
                  </h3>
                  <p className="text-[10px] text-slate-550">Chặn trang web gây xao nhãng trong thời gian Bế Quan.</p>
                </div>

                {/* Extension status indicator */}
                <div className={`p-2.5 border-2 border-slate-950 rounded-xl text-[10px] font-bold text-left flex items-center gap-2 ${
                  isExtensionInstalled 
                    ? 'bg-emerald-950/40 text-emerald-400' 
                    : 'bg-amber-950/30 text-amber-455'
                }`}>
                  <span className="text-xs">{isExtensionInstalled ? '🛡️' : '⚠️'}</span>
                  <div>
                    <p className="font-extrabold m-0">Trạng thái Tiện ích mở rộng:</p>
                    <p className="font-mono text-[9px] mt-0.5 text-slate-500 m-0">
                      {isExtensionInstalled 
                        ? 'Đã kết nối thành công với Trận Pháp Hộ Thể.' 
                        : 'Chưa phát hiện Tiện ích mở rộng Chrome.'}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border-2 border-slate-950">
                  <span className="text-[11px] font-bold text-slate-300">Kích hoạt chặn web:</span>
                  <button
                     onClick={() => setIsBlockerEnabled(!isBlockerEnabled)}
                     className={`px-3 py-1 text-[9px] font-extrabold border-2 border-slate-950 rounded-lg shadow-[1.5px_1.5px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all ${
                       isBlockerEnabled 
                         ? 'bg-emerald-400 text-slate-950 font-black' 
                         : 'bg-slate-900 text-slate-500'
                     }`}
                  >
                    {isBlockerEnabled ? 'ĐANG MỞ' : 'ĐANG TẮT'}
                  </button>
                </div>

                {/* Domain Input Form */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ví dụ: facebook.com"
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const domain = newDomainInput.trim().toLowerCase();
                          if (domain && !blockedDomains.includes(domain)) {
                            setBlockedDomains(prev => [...prev, domain]);
                            setNewDomainInput('');
                          }
                        }
                      }}
                      className="flex-1 bg-slate-950 border-2 border-slate-950 rounded-xl px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        const domain = newDomainInput.trim().toLowerCase();
                        if (domain && !blockedDomains.includes(domain)) {
                          setBlockedDomains(prev => [...prev, domain]);
                          setNewDomainInput('');
                        }
                      }}
                      className="px-3 py-1.5 neo-btn neo-btn-success text-[10px] font-bold shrink-0"
                    >
                      THÊM
                    </button>
                  </div>

                  {/* Blocked list */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border-2 border-slate-950 text-left space-y-1.5 max-h-28 overflow-y-auto font-mono text-[10px] text-slate-350 shadow-[1.5px_1.5px_0px_#000]">
                    {blockedDomains.length > 0 ? (
                      blockedDomains.map(domain => (
                        <div key={domain} className="flex justify-between items-center bg-[#1e2638] px-2 py-1 rounded-md border border-slate-950">
                          <span>🚫 {domain}</span>
                           <button
                             onClick={() => setBlockedDomains(prev => prev.filter(d => d !== domain))}
                             className="text-rose-400 hover:text-rose-350 text-[9px] font-bold"
                           >
                             XÓA
                           </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-500 text-[9px] font-sans text-slate-550">Chưa chặn trang web nào.</div>
                    )}
                  </div>
                </div>

                {/* Help instructions */}
                {!isExtensionInstalled && (
                  <div className="bg-[#1e2638] p-3 rounded-xl border border-slate-800 text-[9.5px] leading-relaxed text-slate-400 text-left space-y-1">
                    <p className="font-extrabold text-amber-400 m-0">🛠️ Hướng dẫn cài đặt Trận Pháp:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 m-0 font-sans">
                      <li>Mở tab mới trong Chrome và truy cập: <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-500 select-all font-mono">chrome://extensions</code></li>
                      <li>Bật nút <strong>Chế độ cho nhà phát triển (Developer mode)</strong> ở góc trên bên phải.</li>
                      <li>Chọn <strong>Tải tiện ích đã giải nén (Load unpacked)</strong> ở góc trái.</li>
                      <li>Chọn thư mục <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-500 select-all font-mono">tien-lo-ky-extension</code> bên trong thư mục dự án này!</li>
                    </ol>
                  </div>
                )}

                <button
                  onClick={() => setShowBlockerSettings(false)}
                  className="w-full py-2 neo-btn neo-btn-primary text-[10px] font-bold"
                >
                  XÁC NHẬN PHÁP TRẬN
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


