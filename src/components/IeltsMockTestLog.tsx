/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { IeltsTestLog, IeltsTargets } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Sparkles,
  Edit3,
  Bookmark,
  Grid,
  Clock,
  Play,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Award as AwardIcon
} from 'lucide-react';

interface IeltsMockTestLogProps {
  logs: IeltsTestLog[];
  onAddLog: (testName: string, listening: number, reading: number, writing: number, speaking: number, date: string, notes?: string) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (updatedLog: IeltsTestLog) => void;
  targets: IeltsTargets;
  onUpdateTargets: (targets: IeltsTargets) => void;
  camBooks: number[];
  onUpdateCamBooks: (list: number[]) => void;
  onAddExp: (tuVi: number, linhThach: number) => void;
}

// Exact IELTS rounding helper
export const calculateIeltsOverall = (l: number, r: number, w: number, s: number): number => {
  const avg = (l + r + w + s) / 4;
  const base = Math.floor(avg);
  const decimal = avg - base;
  if (decimal < 0.25) return base;
  if (decimal < 0.75) return base + 0.5;
  return base + 1;
};

// Word counter helper
const countWords = (text: string): number => {
  if (!text) return 0;
  const cleaned = text.trim().replace(/\s+/g, ' ');
  return cleaned === '' ? 0 : cleaned.split(' ').length;
};

export default function IeltsMockTestLog({
  logs,
  onAddLog,
  onDeleteLog,
  onUpdateLog,
  targets,
  onUpdateTargets,
  camBooks,
  onUpdateCamBooks,
  onAddExp
}: IeltsMockTestLogProps) {
  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // IELTS bands list
  const ieltsBands = [
    1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0
  ];

  // Inputs for the quick-fill score matrix table row
  const [testName, setTestName] = useState('');
  const [listening, setListening] = useState<number>(6.5);
  const [reading, setReading] = useState<number>(6.5);
  const [writing, setWriting] = useState<number>(6.0);
  const [speaking, setSpeaking] = useState<number>(6.0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Live overall average for current quick-add row
  const currentOverallLive = calculateIeltsOverall(listening, reading, writing, speaking);

  // Helper to compute average bands across all logs
  const getAverages = () => {
    if (logs.length === 0) return { listening: 0, reading: 0, writing: 0, speaking: 0, overall: 0 };
    const listeningAvg = logs.reduce((sum, l) => sum + l.listening, 0) / logs.length;
    const readingAvg = logs.reduce((sum, l) => sum + l.reading, 0) / logs.length;
    const writingAvg = logs.reduce((sum, l) => sum + l.writing, 0) / logs.length;
    const speakingAvg = logs.reduce((sum, l) => sum + l.speaking, 0) / logs.length;
    const overallAvg = calculateIeltsOverall(listeningAvg, readingAvg, writingAvg, speakingAvg);
    return {
      listening: listeningAvg,
      reading: readingAvg,
      writing: writingAvg,
      speaking: speakingAvg,
      overall: overallAvg
    };
  };

  // Sorted logs list for the historical spreadsheet table
  const sortedLogs = [...logs].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.testName.localeCompare(b.testName) 
        : b.testName.localeCompare(a.testName);
    } else {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }
  });

  // Data formatted for the Recharts line graph
  const chartData = [...logs]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      ...log,
      formattedDate: new Date(log.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    }));


  // Editing Target state
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [targetListening, setTargetListening] = useState(targets.listening);
  const [targetReading, setTargetReading] = useState(targets.reading);
  const [targetWriting, setTargetWriting] = useState(targets.writing);
  const [targetSpeaking, setTargetSpeaking] = useState(targets.speaking);

  // Custom Cambridge book input state
  const [newCamBook, setNewCamBook] = useState('');

  // IMMERSIVE EXAM WORKSPACE STATE
  const [activeEssayLog, setActiveEssayLog] = useState<IeltsTestLog | null>(null);
  const [activeTask, setActiveTask] = useState<1 | 2>(1);
  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');
  const [promptImgUrl, setPromptImgUrl] = useState('');
  const [promptText, setPromptText] = useState('');
  const [selfReview, setSelfReview] = useState('');

  // Countdown timer states
  const [examMode, setExamMode] = useState<'FREE' | 'TIMED'>('FREE');
  const [examDuration, setExamDuration] = useState<number>(20); // in minutes
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isExamStarted, setIsExamStarted] = useState(false);

  // Local validation warning for adding test log
  const [warning, setWarning] = useState('');

  // Countdown Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (activeEssayLog && isExamStarted && examMode === 'TIMED' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (activeEssayLog && isExamStarted && examMode === 'TIMED' && timeLeft === 0) {
      handleTimeOut();
    }
    return () => clearInterval(interval);
  }, [activeEssayLog, isExamStarted, examMode, timeLeft]);

  // Handle countdown time out
  const handleTimeOut = () => {
    setIsExamStarted(false);
    
    // Evaluate word count based on active task
    const words = activeTask === 1 ? countWords(task1Text) : countWords(task2Text);
    const minRequired = activeTask === 1 ? 150 : 250;

    if (activeEssayLog) {
      const updatedLog: IeltsTestLog = {
        ...activeEssayLog,
        essayTask1: task1Text,
        essayTask2: task2Text,
        promptImageUrl: promptImgUrl,
        promptText: promptText,
        notes: selfReview
      };
      
      onUpdateLog(updatedLog);

      if (words >= minRequired) {
        // Success!
        onAddExp(50, 20); // +50 Tu Vi, +20 Linh Thach
        alert(`⌛ TIME IS UP!\n\nYour essay achieved ${words}/${minRequired} words minimum.\nExamination completed successfully! Received +50 Exp and +20 Spirit Stones.`);
      } else {
        // Failure!
        onAddExp(-10, 0); // penalize -10 EXP
        alert(`⌛ TIME IS UP!\n\nYou only wrote ${words}/${minRequired} words, which does not meet the minimum requirement.\nExamination failed! Penalized -10 Exp as a warning.`);
      }
    }
    setActiveEssayLog(null);
  };

  const handleQuickAdd = () => {
    if (!testName.trim()) {
      setWarning('Please enter a test or mock name!');
      return;
    }
    setWarning('');
    onAddLog(testName.trim(), listening, reading, writing, speaking, date, notes.trim());

    // Reset fields except date for faster repeated logging
    setTestName('');
    setNotes('');
  };

  // Save Target bands
  const handleSaveTargets = () => {
    const overall = calculateIeltsOverall(targetListening, targetReading, targetWriting, targetSpeaking);
    onUpdateTargets({
      listening: targetListening,
      reading: targetReading,
      writing: targetWriting,
      speaking: targetSpeaking,
      overall
    });
    setIsEditingTargets(false);
  };

  // Trigger opening the full-screen IELTScdt workspace modal
  const handleOpenEssayEditor = (log: IeltsTestLog) => {
    setActiveEssayLog(log);
    setTask1Text(log.essayTask1 || '');
    setTask2Text(log.essayTask2 || '');
    setPromptImgUrl(log.promptImageUrl || '');
    setPromptText(log.promptText || '');
    setSelfReview(log.notes || '');
    setIsExamStarted(false);
    setExamMode('FREE');
    setTimeLeft(0);
    setActiveTask(1);
  };

  // Trigger manual submit of the timed exam
  const handleManualSubmit = () => {
    if (!activeEssayLog) return;

    const words = activeTask === 1 ? countWords(task1Text) : countWords(task2Text);
    const minRequired = activeTask === 1 ? 150 : 250;

    if (words < minRequired) {
      alert(`⚠️ Not enough words to submit!\n(Required: ${minRequired} words. Current: ${words} words)`);
      return;
    }

    if (examMode === 'TIMED' && !confirm('Are you sure you want to submit before the time limit expires?')) {
      return;
    }

    setIsExamStarted(false);
    
    const updatedLog: IeltsTestLog = {
      ...activeEssayLog,
      essayTask1: task1Text,
      essayTask2: task2Text,
      promptImageUrl: promptImgUrl,
      promptText: promptText,
      notes: selfReview
    };
    
    onUpdateLog(updatedLog);
    onAddExp(50, 20); // Reward for successful completion
    
    alert(`🎉 SUBMISSION SUCCESS!\n\nYou completed the essay meeting the required word count (${words} words) on time.\nReceived +50 Exp and +20 Spirit Stones!`);
    setActiveEssayLog(null);
  };

  // Save draft without exiting or triggering rewards/penalties
  const handleSaveDraft = () => {
    if (!activeEssayLog) return;
    const updatedLog: IeltsTestLog = {
      ...activeEssayLog,
      essayTask1: task1Text,
      essayTask2: task2Text,
      promptImageUrl: promptImgUrl,
      promptText: promptText,
      notes: selfReview
    };
    onUpdateLog(updatedLog);
    alert('💾 Draft saved successfully!');
  };

  // Auto-compress local image upload using canvas to prevent localStorage overflow
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Auto-resize long width to 800px to maintain proportion and save size
        if (width > 800) {
          height = Math.round((height * 800) / width);
          width = 800;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress quality to 60% JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setPromptImgUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Custom Cambridge Book add/delete handlers
  const handleAddCamBook = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newCamBook);
    if (isNaN(num) || num <= 0 || num > 99) {
      alert('⚠️ Cambridge book number must be a valid integer (1 - 99)!');
      return;
    }
    if (camBooks.includes(num)) {
      alert(`⚠️ Cambridge book ${num} already exists in the matrix!`);
      return;
    }
    const updatedList = [...camBooks, num].sort((a, b) => b - a);
    onUpdateCamBooks(updatedList);
    setNewCamBook('');
  };

  const handleDeleteCamBook = (book: number) => {
    if (confirm(`Are you sure you want to hide Cambridge ${book} from the matrix? Your test scores below will still be preserved.`)) {
      const updatedList = camBooks.filter(b => b !== book);
      onUpdateCamBooks(updatedList);
    }
  };

  // Smart Regex Parser to identify Cambridge book and test
  const parseBookAndTest = (testName: string): { book: number; test: number } | null => {
    const name = testName.toLowerCase().replace(/\s+/g, '');
    const match = name.match(/(?:cambridge|cam|c)(\d+)\D*(\d+)/);
    if (match) {
      return { book: parseInt(match[1]), test: parseInt(match[2]) };
    }
    return null;
  };

  const camTests = [1, 2, 3, 4];

  // Helper to find log for Cambridge test
  const findCamLog = (book: number, test: number) => {
    return logs.find(log => {
      const parsed = parseBookAndTest(log.testName);
      return parsed !== null && parsed.book === book && parsed.test === test;
    });
  };

  // Color mapping based on score
  const getScoreColorClass = (score?: number) => {
    if (score === undefined) return 'bg-[#0b0f19] border-slate-900/80 text-slate-600 hover:border-amber-500/30 hover:text-slate-300';
    if (score >= 7.5) return 'bg-amber-950/20 border-amber-500/40 text-amber-300';
    if (score >= 6.5) return 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300';
    if (score >= 5.5) return 'bg-blue-950/20 border-blue-500/40 text-blue-300';
    return 'bg-rose-950/20 border-rose-500/40 text-rose-300';
  };

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStrengthsAndWeaknesses = () => {
    if (logs.length === 0) return null;
    const lSum = logs.reduce((sum, l) => sum + l.listening, 0);
    const rSum = logs.reduce((sum, l) => sum + l.reading, 0);
    const wSum = logs.reduce((sum, l) => sum + l.writing, 0);
    const sSum = logs.reduce((sum, l) => sum + l.speaking, 0);
    const count = logs.length;
    
    const skills = [
      { name: 'Listening', score: Number((lSum / count).toFixed(2)), icon: '🎧' },
      { name: 'Reading', score: Number((rSum / count).toFixed(2)), icon: '📖' },
      { name: 'Writing', score: Number((wSum / count).toFixed(2)), icon: '✍️' },
      { name: 'Speaking', score: Number((sSum / count).toFixed(2)), icon: '🗣️' }
    ];

    const sorted = [...skills].sort((a, b) => b.score - a.score);
    return {
      strongest: sorted[0],
      weakest: sorted[sorted.length - 1]
    };
  };

  const avgs = getAverages();
  const analysis = getStrengthsAndWeaknesses();

  // Word count dynamic progress bar calculation
  const getWordProgress = (): { percent: number; colorClass: string; statusText: string } => {
    const words = activeTask === 1 ? countWords(task1Text) : countWords(task2Text);
    const minVal = activeTask === 1 ? 150 : 250;
    const sweetMin = activeTask === 1 ? 170 : 260;
    const sweetMax = activeTask === 1 ? 190 : 290;

    if (words === 0) {
      return { percent: 0, colorClass: 'bg-slate-700', statusText: 'Waiting for your input...' };
    }

    const percent = Math.min(100, Math.round((words / sweetMax) * 100));

    if (words < minVal) {
      return { 
        percent, 
        colorClass: 'bg-rose-500', 
        statusText: `Below minimum word count (${minVal - words} words left)` 
      };
    } else if (words < sweetMin) {
      return { 
        percent, 
        colorClass: 'bg-emerald-500', 
        statusText: `Minimum reached! Aim for optimal sweet spot (${sweetMin}-${sweetMax} words)` 
      };
    } else if (words <= sweetMax) {
      return { 
        percent, 
        colorClass: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse', 
        statusText: `🌟 Excellent! In optimal sweet spot (${words} words)` 
      };
    } else {
      return { 
        percent, 
        colorClass: 'bg-amber-500', 
        statusText: `⚠️ Too long (${words} words) - Keep it concise to save time!` 
      };
    }
  };

  const wordProgress = activeEssayLog ? getWordProgress() : { percent: 0, colorClass: '', statusText: '' };

  return (
    <div className="space-y-6" id="ielts-mock-test-log">
      {/* 1. Upper Grid: Target Score & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Target vs Current Average Band Card */}
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950/40 border border-indigo-800/30 rounded-2xl p-5 shadow-xl col-span-2 relative overflow-hidden flex flex-col justify-between h-44">
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 font-mono text-5xl font-black">
            IELTS
          </div>
          
          <div className="space-y-1 z-10">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-indigo-400 uppercase font-black tracking-widest font-mono">IELTS TARGET BAND</span>
              <button
                onClick={() => setIsEditingTargets(!isEditingTargets)}
                className="text-[9.5px] text-slate-400 hover:text-amber-400 font-bold underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> {isEditingTargets ? 'Editing' : 'Set Targets'}
              </button>
            </div>
            
            {isEditingTargets ? (
              <div className="grid grid-cols-4 gap-1.5 pt-2 text-[10px] font-mono">
                <div>
                  <label className="text-[7.5px] text-slate-500 block">LIST</label>
                  <select value={targetListening} onChange={e => setTargetListening(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[7.5px] text-slate-500 block">READ</label>
                  <select value={targetReading} onChange={e => setTargetReading(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[7.5px] text-slate-500 block">WRIT</label>
                  <select value={targetWriting} onChange={e => setTargetWriting(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[7.5px] text-slate-500 block">SPEA</label>
                  <select value={targetSpeaking} onChange={e => setTargetSpeaking(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleSaveTargets}
                  className="col-span-4 mt-1 bg-indigo-600 hover:bg-indigo-700 text-slate-100 py-1.5 rounded-lg text-[9px] font-bold tracking-wider cursor-pointer"
                >
                  CONFIRM TARGETS
                </button>
              </div>
            ) : (
              <div className="flex items-end justify-between pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-sans">Target Band:</span>
                  <h4 className="text-3xl font-extrabold text-indigo-300 font-mono">
                    {targets.overall.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">Band</span>
                  </h4>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">Current Average:</span>
                  <h4 className="text-xl font-bold text-amber-400 font-mono">
                    {avgs.overall > 0 ? avgs.overall.toFixed(1) : '0.0'}
                  </h4>
                </div>
              </div>
            )}
          </div>

          {!isEditingTargets && (
            <div className="mt-2.5 pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-sans">Gap to Target:</span>
              {avgs.overall === 0 ? (
                <span className="text-slate-400 italic">No tests recorded</span>
              ) : avgs.overall >= targets.overall ? (
                <span className="text-emerald-400 font-black flex items-center gap-0.5">
                  🎉 TARGET REACHED
                </span>
              ) : (
                <span className="text-amber-500 font-mono font-bold">
                  Missing {(targets.overall - avgs.overall).toFixed(1)} band
                </span>
              )}
            </div>
          )}
        </div>

        {/* Individual Skills Averages & Progress Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 col-span-4 gap-3">
          {/* Listening */}
          <div className="bg-[#0f141c]/50 border border-slate-900 rounded-xl p-3 flex flex-col justify-between h-20">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">🎧 Listening</span>
              <span className="text-[8.5px] text-slate-400 font-mono">Target: {targets.listening.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-black text-slate-100 font-mono">
                {avgs.listening > 0 ? avgs.listening.toFixed(2) : '0.00'}
              </h5>
              {avgs.listening > 0 && (
                <span className={`text-[8.5px] font-bold font-mono px-1 rounded ${
                  avgs.listening >= targets.listening ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-500'
                }`}>
                  {avgs.listening >= targets.listening ? '✓ Met' : `-${(targets.listening - avgs.listening).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>

          {/* Reading */}
          <div className="bg-[#0f141c]/50 border border-slate-900 rounded-xl p-3 flex flex-col justify-between h-20">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">📖 Reading</span>
              <span className="text-[8.5px] text-slate-400 font-mono">Target: {targets.reading.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-black text-slate-100 font-mono">
                {avgs.reading > 0 ? avgs.reading.toFixed(2) : '0.00'}
              </h5>
              {avgs.reading > 0 && (
                <span className={`text-[8.5px] font-bold font-mono px-1 rounded ${
                  avgs.reading >= targets.reading ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-500'
                }`}>
                  {avgs.reading >= targets.reading ? '✓ Met' : `-${(targets.reading - avgs.reading).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>

          {/* Writing */}
          <div className="bg-[#0f141c]/50 border border-slate-900 rounded-xl p-3 flex flex-col justify-between h-20">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">✍️ Writing</span>
              <span className="text-[8.5px] text-slate-400 font-mono">Target: {targets.writing.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-black text-slate-100 font-mono">
                {avgs.writing > 0 ? avgs.writing.toFixed(2) : '0.00'}
              </h5>
              {avgs.writing > 0 && (
                <span className={`text-[8.5px] font-bold font-mono px-1 rounded ${
                  avgs.writing >= targets.writing ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-500'
                }`}>
                  {avgs.writing >= targets.writing ? '✓ Met' : `-${(targets.writing - avgs.writing).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>

          {/* Speaking */}
          <div className="bg-[#0f141c]/50 border border-slate-900 rounded-xl p-3 flex flex-col justify-between h-20">
            <div className="flex justify-between items-start">
              <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">🗣️ Speaking</span>
              <span className="text-[8.5px] text-slate-400 font-mono">Target: {targets.speaking.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-black text-slate-100 font-mono">
                {avgs.speaking > 0 ? avgs.speaking.toFixed(2) : '0.00'}
              </h5>
              {avgs.speaking > 0 && (
                <span className={`text-[8.5px] font-bold font-mono px-1 rounded ${
                  avgs.speaking >= targets.speaking ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-500'
                }`}>
                  {avgs.speaking >= targets.speaking ? '✓ Met' : `-${(targets.speaking - avgs.speaking).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAMBRIDGE MATRIX QUEST GRID */}
      <div className="bg-[#0f141c]/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-emerald-500" />
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Cambridge Mock-Test Matrix</h4>
              <p className="text-[9px] text-slate-500">Conquer Cambridge practice tests to build proficiency. Click an empty slot to quick-add a test!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Cam Book form */}
            <form onSubmit={handleAddCamBook} className="flex items-center gap-1 shrink-0 bg-slate-950/50 p-1 border border-slate-900 rounded-lg">
              <input
                type="number"
                min="1"
                max="99"
                placeholder="Book #"
                value={newCamBook}
                onChange={(e) => setNewCamBook(e.target.value)}
                className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-slate-300 focus:outline-none font-mono text-center"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-slate-100 font-bold text-[8.5px] px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                + Add
              </button>
            </form>

            {/* Score color indicators legend */}
            <div className="hidden sm:flex gap-2.5 text-[8px] font-mono text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/20 border border-amber-500/40"></span> &gt;= 7.5</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/40"></span> &gt;= 6.5</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500/20 border border-blue-500/40"></span> &gt;= 5.5</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500/20 border border-rose-500/40"></span> &lt; 5.5</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {camBooks.map(book => (
            <div key={book} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2 relative group/card">
              <div className="flex justify-between items-center border-b border-slate-900/60 pb-1">
                <span className="text-[10px] font-black text-indigo-400 font-mono uppercase tracking-widest">
                  CAMBRIDGE {book}
                </span>
                <button
                  onClick={() => handleDeleteCamBook(book)}
                  className="opacity-0 group-hover/card:opacity-100 text-slate-500 hover:text-rose-400 font-bold text-xs transition-opacity cursor-pointer leading-none"
                  title={`Hide Cambridge ${book}`}
                >
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {camTests.map(test => {
                  const log = findCamLog(book, test);
                  const score = log?.overall;
                  const colorClass = getScoreColorClass(score);

                  return (
                    <button
                      key={test}
                      onClick={() => {
                        if (!log) {
                          setTestName(`Cambridge ${book} Test ${test}`);
                        } else {
                          handleOpenEssayEditor(log);
                        }
                      }}
                      className={`h-9 rounded-lg border text-center flex flex-col items-center justify-center font-mono transition-all cursor-pointer ${colorClass}`}
                      title={log ? `${log.testName} (Overall: ${log.overall.toFixed(1)})` : `Click to start Cambridge ${book} Test ${test}`}
                    >
                      <span className="text-[8px] text-slate-500 font-bold">T{test}</span>
                      <span className="text-[9.5px] font-black">{score !== undefined ? score.toFixed(1) : '—'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SPREADSHEET-STYLE SCORE MATRIX TABLE */}
      <div className="bg-[#0f141c]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-950/40 border border-amber-900/60 rounded-lg text-amber-500">
              <AwardIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                IELTS Test History & Essay Log
              </h3>
              <p className="text-[10px] text-slate-500">Record mock test scores and compose exam essays</p>
            </div>
          </div>
        </div>

        {warning && (
          <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* The spreadsheet entry grid form */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono select-none">
                <th 
                  className="py-2.5 px-3 w-1/4 cursor-pointer hover:text-amber-500 transition-colors"
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  Test / Practice Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  className="py-2.5 px-3 w-1/6 cursor-pointer hover:text-amber-500 transition-colors"
                  onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                >
                  Test Date {sortBy === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </th>
                <th className="py-2.5 px-3 text-center">Listening</th>
                <th className="py-2.5 px-3 text-center">Reading</th>
                <th className="py-2.5 px-3 text-center">Writing</th>
                <th className="py-2.5 px-3 text-center">Speaking</th>
                <th className="py-2.5 px-3 text-center">Overall</th>
                <th className="py-2.5 px-3 w-1/5">Notes</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Permanent inputs row */}
              <tr className="bg-slate-950/50 border-b border-slate-900/80">
                <td className="py-3 px-2">
                  <input
                    type="text"
                    required
                    placeholder="E.g., Cambridge 19 Test 2"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={listening}
                    onChange={(e) => setListening(parseFloat(e.target.value))}
                    className="bg-slate-950 border border-slate-900 rounded-lg p-1.5 text-xs text-blue-400 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={reading}
                    onChange={(e) => setReading(parseFloat(e.target.value))}
                    className="bg-slate-950 border border-slate-900 rounded-lg p-1.5 text-xs text-emerald-400 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={writing}
                    onChange={(e) => setWriting(parseFloat(e.target.value))}
                    className="bg-slate-950 border border-slate-900 rounded-lg p-1.5 text-xs text-purple-400 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={speaking}
                    onChange={(e) => setSpeaking(parseFloat(e.target.value))}
                    className="bg-slate-950 border border-slate-900 rounded-lg p-1.5 text-xs text-amber-500 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="text-xs font-black text-slate-100 bg-amber-950/60 border border-amber-900/60 px-2.5 py-1 rounded-lg font-mono">
                    {currentOverallLive.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <input
                    type="text"
                    placeholder="E.g., Made mistakes in Map, Writing..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </td>
              </tr>

              {/* Render Existing Logs */}
              {logs.length > 0 ? (
                sortedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-900/80 hover:bg-slate-950/20 transition-colors text-xs font-medium text-slate-300"
                  >
                    <td className="py-2.5 px-3 text-slate-200 font-semibold truncate max-w-[200px]">
                      {log.testName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {log.date}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <select
                        value={log.listening}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const overall = calculateIeltsOverall(val, log.reading, log.writing, log.speaking);
                          onUpdateLog({ ...log, listening: val, overall });
                        }}
                        className="bg-slate-950 border border-slate-900 rounded p-1 text-xs text-blue-400 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-slate-950 text-slate-300">{b.toFixed(1)}</option>)}
                      </select>
                    </td>
                    <td className="py-1 px-2 text-center">
                      <select
                        value={log.reading}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const overall = calculateIeltsOverall(log.listening, val, log.writing, log.speaking);
                          onUpdateLog({ ...log, reading: val, overall });
                        }}
                        className="bg-slate-950 border border-slate-900 rounded p-1 text-xs text-emerald-400 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-slate-950 text-slate-300">{b.toFixed(1)}</option>)}
                      </select>
                    </td>
                    <td className="py-1 px-2 text-center">
                      <select
                        value={log.writing}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const overall = calculateIeltsOverall(log.listening, log.reading, val, log.speaking);
                          onUpdateLog({ ...log, writing: val, overall });
                        }}
                        className="bg-slate-950 border border-slate-900 rounded p-1 text-xs text-purple-400 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-slate-950 text-slate-300">{b.toFixed(1)}</option>)}
                      </select>
                    </td>
                    <td className="py-1 px-2 text-center">
                      <select
                        value={log.speaking}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const overall = calculateIeltsOverall(log.listening, log.reading, log.writing, val);
                          onUpdateLog({ ...log, speaking: val, overall });
                        }}
                        className="bg-slate-950 border border-slate-900 rounded p-1 text-xs text-amber-500 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-slate-950 text-slate-300">{b.toFixed(1)}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-xs bg-amber-950/30 text-amber-400 border border-amber-900 px-2 py-0.5 rounded font-black font-mono">
                        {log.overall.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 italic truncate max-w-[160px]" title={log.notes}>
                      {log.notes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mx-auto">
                        <button
                          onClick={() => handleOpenEssayEditor(log)}
                          className="bg-slate-950 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 border border-slate-900 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md"
                        >
                          <FileText className="w-2.5 h-2.5 text-amber-500" />
                          Essay
                        </button>
                        
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-slate-950 rounded transition-colors cursor-pointer"
                          title="Delete test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 italic">
                    No mock tests recorded yet. Fill the row above or click the Cambridge matrix to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Visual Chart & Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Chart Column (2/3 span) */}
        <div className="lg:col-span-2 bg-[#0f141c]/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Band Score Progression
            </h3>
            <p className="text-[10px] text-slate-500">Visual representation of your IELTS band scores over time</p>
          </div>

          <div className="h-64 w-full text-xs font-mono">
            {logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="formattedDate" stroke="#64748b" />
                  <YAxis domain={[4.0, 9.0]} stroke="#64748b" ticks={[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a0d14', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
                  />
                  <Legend iconSize={8} />
                  <Line type="monotone" dataKey="listening" name="Listening" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="reading" name="Reading" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="writing" name="Writing" stroke="#a855f7" strokeWidth={2} />
                  <Line type="monotone" dataKey="speaking" name="Speaking" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 border border-dashed border-slate-800 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-600 animate-pulse" />
                <span>No test data recorded yet to render progression graph!</span>
              </div>
            )}
          </div>
        </div>

        {/* Advice Column (1/3 span) */}
        <div>
          {analysis ? (
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Mentor's Feedback (Strengths & Weaknesses Analysis)
              </h4>

              <div className="space-y-4">
                {/* Strength */}
                <div className="bg-[#0c1613] border border-emerald-900/40 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analysis.strongest.icon}</span>
                    <div>
                      <p className="text-[9px] text-emerald-500 font-mono uppercase tracking-widest font-bold">TOP SKILL</p>
                      <h5 className="text-xs font-bold text-slate-200">{analysis.strongest.name}</h5>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed pt-1.5 border-t border-emerald-950">
                    Outstanding proficiency with an average of <strong className="text-emerald-400 font-mono">{analysis.strongest.score}</strong>. This skill is your solid foundation; keep maintaining and refining it!
                  </div>
                </div>

                {/* Weakness */}
                <div className="bg-[#1a1012] border border-rose-950/40 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analysis.weakest.icon}</span>
                    <div>
                      <p className="text-[9px] text-rose-500 font-mono uppercase tracking-widest font-bold">AREAS FOR IMPROVEMENT</p>
                      <h5 className="text-xs font-bold text-slate-200">{analysis.weakest.name}</h5>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed pt-1.5 border-t border-rose-950">
                    Bottleneck at <strong className="text-rose-400 font-mono">{analysis.weakest.score}</strong>. Needs dedicated focus:
                    {analysis.weakest.name.includes('Writing') && ' Focus on complex sentence variety, coherent Task 2 argumentation, and timing.'}
                    {analysis.weakest.name.includes('Speaking') && ' Record speaking practice, correct pronunciation, and train fast Part 2/3 responses.'}
                    {analysis.weakest.name.includes('Listening') && ' Practice dictation and passive listening, paying close attention to transitions and word stress.'}
                    {analysis.weakest.name.includes('Reading') && ' Apply Skimming & Scanning, and expand your Academic vocabulary daily.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-2">
              <FileText className="w-8 h-8 text-slate-700 mx-auto" />
              <p>Not enough data for analysis. Record at least 1 mock test to unlock personalized mentor insights!</p>
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN IMMERSIVE IELTScdt WRITING WORKSPACE MODAL */}
      {activeEssayLog && (
        <div className="fixed inset-0 z-50 bg-[#0c0e14] flex flex-col font-sans text-slate-200 select-none">
          {/* Header Bar */}
          <div className="bg-[#181c26] border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isExamStarted) {
                    if (!confirm('⚠️ You are currently in a timed exam! Exiting now will count as an incomplete exam and penalize -10 Exp. Do you still wish to exit?')) {
                      return;
                    }
                    onAddExp(-10, 0);
                  }
                  setActiveEssayLog(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> EXIT
              </button>
              <div className="h-4 w-px bg-slate-700"></div>
              <span className="text-[11px] font-black tracking-widest text-amber-500 uppercase">
                📖 EXAM WORKSPACE: {activeEssayLog.testName}
              </span>
            </div>

            {/* Timed configurations vs Active Timer display */}
            <div className="flex items-center gap-4">
              {!isExamStarted ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex bg-[#0f121a] border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setExamMode('FREE')}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        examMode === 'FREE' ? 'bg-indigo-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Free Practice
                    </button>
                    <button
                      onClick={() => {
                        setExamMode('TIMED');
                        setExamDuration(activeTask === 1 ? 20 : 40);
                      }}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        examMode === 'TIMED' ? 'bg-indigo-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Timed Exam
                    </button>
                  </div>

                  {examMode === 'TIMED' && (
                    <select
                      value={examDuration}
                      onChange={(e) => setExamDuration(parseInt(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                    >
                      <option value={1}>1 min (Quick test)</option>
                      <option value={10}>10 mins</option>
                      <option value={20}>20 mins (Standard Task 1)</option>
                      <option value={40}>40 mins (Standard Task 2)</option>
                      <option value={60}>60 mins (Both Tasks)</option>
                    </select>
                  )}

                  <button
                    onClick={() => {
                      setIsExamStarted(true);
                      if (examMode === 'TIMED') {
                        setTimeLeft(examDuration * 60);
                      }
                    }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black px-4.5 py-1.5 rounded-lg flex items-center gap-1 hover:from-amber-600 hover:to-yellow-600 cursor-pointer shadow-lg tracking-wider"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> START EXAM
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Countdown Timer Clock */}
                  {examMode === 'TIMED' ? (
                    <div className={`px-4 py-1.5 border rounded-xl flex items-center gap-2 font-mono font-bold text-sm tracking-wider ${
                      timeLeft < 300 
                        ? 'border-rose-600 bg-rose-950/20 text-rose-400 animate-pulse' 
                        : 'border-slate-800 bg-[#0f121a] text-slate-300'
                    }`}>
                      <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-400' : 'text-indigo-400'}`} />
                      <span>{formatTime(timeLeft)}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black font-mono">Mode: Free Practice</span>
                  )}

                  <button
                    onClick={handleSaveDraft}
                    className="bg-[#0f121a] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    Save Draft
                  </button>

                  <button
                    onClick={handleManualSubmit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-slate-100 font-bold px-4 py-1.5 rounded-lg text-xs shadow-md transition-all cursor-pointer"
                  >
                    SUBMIT EXAM
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Workspace Split Body */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left Panel: Prompt Questions & Prompt Image (Academic Chart) */}
            <div className="w-[42%] bg-[#0e1017] border-r border-slate-900 flex flex-col overflow-y-auto p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-[9px] text-indigo-400 font-black tracking-widest uppercase font-mono block">EXAM PROMPT</span>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{activeEssayLog.testName}</h4>
              </div>

              {/* Prompt Text / Notes Editor */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Prompt details:</label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Paste or type the writing prompt here..."
                  disabled={isExamStarted && examMode === 'TIMED'}
                  className="w-full bg-[#0a0d14] border border-slate-900 focus:border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-sans focus:outline-none h-28 resize-none leading-relaxed"
                />
              </div>

              {/* Prompt Image Manager */}
              <div className="space-y-3.5 border-t border-slate-900/60 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Task 1 Prompt Image (Graph/Chart)
                  </label>
                  {promptImgUrl && (
                    <button
                      onClick={() => {
                        if (confirm('Delete current prompt image?')) setPromptImgUrl('');
                      }}
                      className="text-[9.5px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Delete image
                    </button>
                  )}
                </div>

                {promptImgUrl ? (
                  <div className="border border-slate-900 bg-slate-950 p-2 rounded-2xl flex items-center justify-center relative overflow-hidden group/image max-h-[220px]">
                    <img 
                      src={promptImgUrl} 
                      alt="Prompt Diagram" 
                      className="max-h-[200px] object-contain rounded-lg transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-900 bg-slate-950/20 hover:bg-slate-950/40 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isExamStarted && examMode === 'TIMED'}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Upload chart/graph image file</span>
                      <span className="text-[8.5px] text-slate-600 block mt-0.5">System will automatically compress image size before saving</span>
                    </div>
                  </div>
                )}
                
                {/* Paste direct link option */}
                {!promptImgUrl && (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Or paste direct image URL from internet..."
                      value={promptImgUrl}
                      onChange={(e) => setPromptImgUrl(e.target.value)}
                      disabled={isExamStarted && examMode === 'TIMED'}
                      className="flex-1 bg-[#0a0d14] border border-slate-900 rounded-lg px-2.5 py-1.5 text-[9.5px] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Notes / Remarks */}
              <div className="space-y-2 border-t border-slate-900/60 pt-4">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  📝 Notes, Teacher Feedback & Self-Review:
                </label>
                <textarea
                  value={selfReview}
                  onChange={(e) => setSelfReview(e.target.value)}
                  placeholder="After finishing, record common mistakes (e.g. grammar errors, lack of development, repetitive vocabulary) or feedback from instructors here for later review..."
                  className="w-full bg-[#0a0d14] border border-slate-900 focus:border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-sans focus:outline-none h-28 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right Panel: Exam CDT Textarea Workspace */}
            <div className="flex-1 bg-[#0f1118] flex flex-col overflow-hidden min-h-0">
              {/* Task Tabs switcher */}
              <div className="bg-[#12151d] border-b border-slate-900 flex justify-between items-center px-6 py-2 shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isExamStarted) setActiveTask(1);
                      else alert('⚠️ Cannot switch tasks while a timed exam is running!');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTask === 1
                        ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Task 1 (Report - 150 Words)
                  </button>
                  <button
                    onClick={() => {
                      if (!isExamStarted) setActiveTask(2);
                      else alert('⚠️ Cannot switch tasks while a timed exam is running!');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTask === 2
                        ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Task 2 (Essay - 250 Words)
                  </button>
                </div>

                <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">
                  Standard CDT: QWERTY Keyboard
                </div>
              </div>

              {/* Textarea Workspace */}
              <div className="flex-1 p-6 flex flex-col min-h-0 relative">
                {!isExamStarted && (
                  <div className="absolute inset-0 bg-[#0f1118]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center text-indigo-400 animate-pulse">
                      <Bookmark className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Exam Workspace Not Started</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                        Choose your mode (Free practice or Timed test) on the top bar, then click **START EXAM** to begin writing!
                      </p>
                    </div>
                  </div>
                )}

                <textarea
                  value={activeTask === 1 ? task1Text : task2Text}
                  onChange={(e) => activeTask === 1 ? setTask1Text(e.target.value) : setTask2Text(e.target.value)}
                  placeholder={
                    activeTask === 1
                      ? "Write your Writing Task 1 essay here (Summarize visual information, describe data trend, flow charts, maps... Minimum 150 words)..."
                      : "Write your Writing Task 2 essay here (Present your opinion on a social topic, explain reasons and examples... Minimum 250 words)..."
                  }
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full flex-1 bg-[#0a0c12] border border-slate-900/80 rounded-2xl p-5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed overflow-y-auto shadow-inner"
                />
              </div>

              {/* Progress & Live Word Count Footer */}
              <div className="bg-[#12151d] border-t border-slate-900 px-6 py-4 space-y-2.5 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black font-mono">Writing Progress:</span>
                    <span className="text-[10.5px] font-sans text-slate-300">
                      {wordProgress.statusText}
                    </span>
                  </div>
                  <div className="font-mono font-bold flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase">Word count:</span>
                    <span className="text-slate-100 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs">
                      {activeTask === 1 ? countWords(task1Text) : countWords(task2Text)} words
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#0a0c12] rounded-full h-2.5 overflow-hidden border border-slate-900 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${wordProgress.colorClass}`}
                    style={{ width: `${wordProgress.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
