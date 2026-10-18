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
    
    alert(`🎉 NỘP BÀI THÀNH CÔNG!\n\nBạn đã hoàn thành bài viết đạt độ dài yêu cầu (${words} từ) đúng thời gian quy định.`);
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
    alert('💾 Đã lưu bản nháp thành công!');
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
      alert('⚠️ Số tập Cambridge phải là số nguyên hợp lệ (1 - 99)!');
      return;
    }
    if (camBooks.includes(num)) {
      alert(`⚠️ Cambridge tập ${num} đã tồn tại trong ma trận!`);
      return;
    }
    const updatedList = [...camBooks, num].sort((a, b) => b - a);
    onUpdateCamBooks(updatedList);
    setNewCamBook('');
  };

  const handleDeleteCamBook = (book: number) => {
    if (confirm(`Bạn có chắc muốn ẩn Cambridge tập ${book} khỏi ma trận? Các điểm số ghi nhận bên dưới vẫn được giữ nguyên.`)) {
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
    if (score === undefined) return 'bg-[#FAF8F5] border-[#E7E1D7] text-[#A8A29E] hover:border-[#2E6930] hover:text-[#2C2825]';
    if (score >= 7.5) return 'bg-amber-50 border-amber-300 text-amber-800';
    if (score >= 6.5) return 'bg-emerald-50 border-emerald-300 text-emerald-800';
    if (score >= 5.5) return 'bg-sky-50 border-sky-300 text-sky-800';
    return 'bg-rose-50 border-rose-300 text-rose-800';
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
        <div className="bg-white border border-[#E7E1D7] rounded-2xl p-5 shadow-xs col-span-2 relative overflow-hidden flex flex-col justify-between h-44">
          <div className="space-y-1 z-10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#2E6930] uppercase font-bold tracking-wider">MỤC TIÊU IELTS BAND</span>
              <button
                onClick={() => setIsEditingTargets(!isEditingTargets)}
                className="text-xs text-[#2E6930] hover:underline font-medium cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> {isEditingTargets ? 'Đang sửa' : 'Đặt mục tiêu'}
              </button>
            </div>
            
            {isEditingTargets ? (
              <div className="grid grid-cols-4 gap-1.5 pt-2 text-xs font-mono">
                <div>
                  <label className="text-[9px] text-[#7A7268] block">LIST</label>
                  <select value={targetListening} onChange={e => setTargetListening(parseFloat(e.target.value))} className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg p-1 text-xs text-[#2C2825]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#7A7268] block">READ</label>
                  <select value={targetReading} onChange={e => setTargetReading(parseFloat(e.target.value))} className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg p-1 text-xs text-[#2C2825]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#7A7268] block">WRIT</label>
                  <select value={targetWriting} onChange={e => setTargetWriting(parseFloat(e.target.value))} className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg p-1 text-xs text-[#2C2825]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#7A7268] block">SPEA</label>
                  <select value={targetSpeaking} onChange={e => setTargetSpeaking(parseFloat(e.target.value))} className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg p-1 text-xs text-[#2C2825]">
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleSaveTargets}
                  className="col-span-4 mt-2 bg-[#2E6930] hover:bg-[#255527] text-white py-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-xs"
                >
                  LƯU MỤC TIÊU
                </button>
              </div>
            ) : (
              <div className="flex items-end justify-between pt-2">
                <div className="space-y-1">
                  <span className="text-xs text-[#7A7268] block">Mục tiêu:</span>
                  <h4 className="text-3xl font-extrabold text-[#2E6930] font-mono">
                    {targets.overall.toFixed(1)} <span className="text-xs text-[#7A7268] font-normal">Band</span>
                  </h4>
                </div>
                
                <div className="text-right">
                  <span className="text-xs text-[#7A7268] block">Trung bình hiện tại:</span>
                  <h4 className="text-2xl font-bold text-[#B85D38] font-mono">
                    {avgs.overall > 0 ? avgs.overall.toFixed(1) : '0.0'}
                  </h4>
                </div>
              </div>
            )}
          </div>

          {!isEditingTargets && (
            <div className="mt-2.5 pt-2 border-t border-[#EFECE6] flex justify-between items-center text-xs">
              <span className="text-[#7A7268]">Khoảng cách tới mục tiêu:</span>
              {avgs.overall === 0 ? (
                <span className="text-[#8C827A] italic">Chưa có bài thi</span>
              ) : avgs.overall >= targets.overall ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  🎉 ĐÃ ĐẠT MỤC TIÊU
                </span>
              ) : (
                <span className="text-[#B85D38] font-mono font-semibold">
                  Còn thiếu {(targets.overall - avgs.overall).toFixed(1)} band
                </span>
              )}
            </div>
          )}
        </div>

        {/* Individual Skills Averages & Progress Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 col-span-4 gap-3">
          {/* Listening */}
          <div className="bg-white border border-[#E7E1D7] rounded-xl p-3 flex flex-col justify-between h-20 shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono">🎧 Listening</span>
              <span className="text-[10px] text-[#8C827A] font-mono">Mục tiêu: {targets.listening.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-bold text-[#2C2825] font-mono">
                {avgs.listening > 0 ? avgs.listening.toFixed(2) : '0.00'}
              </h5>
              {avgs.listening > 0 && (
                <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md ${
                  avgs.listening >= targets.listening ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {avgs.listening >= targets.listening ? '✓ Đạt' : `-${(targets.listening - avgs.listening).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>

          {/* Reading */}
          <div className="bg-white border border-[#E7E1D7] rounded-xl p-3 flex flex-col justify-between h-20 shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono">📖 Reading</span>
              <span className="text-[10px] text-[#8C827A] font-mono">Mục tiêu: {targets.reading.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-bold text-[#2C2825] font-mono">
                {avgs.reading > 0 ? avgs.reading.toFixed(2) : '0.00'}
              </h5>
              {avgs.reading > 0 && (
                <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md ${
                  avgs.reading >= targets.reading ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {avgs.reading >= targets.reading ? '✓ Đạt' : `-${(targets.reading - avgs.reading).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>

          {/* Writing */}
          <div className="bg-white border border-[#E7E1D7] rounded-xl p-3 flex flex-col justify-between h-20 shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono">✍️ Writing</span>
              <span className="text-[10px] text-[#8C827A] font-mono">Mục tiêu: {targets.writing.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-bold text-[#2C2825] font-mono">
                {avgs.writing > 0 ? avgs.writing.toFixed(2) : '0.00'}
              </h5>
              {avgs.writing > 0 && (
                <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md ${
                  avgs.writing >= targets.writing ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {avgs.writing >= targets.writing ? '✓ Đạt' : `-${(targets.writing - avgs.writing).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>

          {/* Speaking */}
          <div className="bg-white border border-[#E7E1D7] rounded-xl p-3 flex flex-col justify-between h-20 shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono">🗣️ Speaking</span>
              <span className="text-[10px] text-[#8C827A] font-mono">Mục tiêu: {targets.speaking.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-end mt-1">
              <h5 className="text-lg font-bold text-[#2C2825] font-mono">
                {avgs.speaking > 0 ? avgs.speaking.toFixed(2) : '0.00'}
              </h5>
              {avgs.speaking > 0 && (
                <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md ${
                  avgs.speaking >= targets.speaking ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {avgs.speaking >= targets.speaking ? '✓ Đạt' : `-${(targets.speaking - avgs.speaking).toFixed(1)}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAMBRIDGE MATRIX QUEST GRID */}
      <div className="bg-white border border-[#E7E1D7] p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EFECE6] pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[#2E6930]" />
            <div>
              <h4 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider">Ma trận luyện đề Cambridge</h4>
              <p className="text-xs text-[#7A7268]">Theo dõi tiến độ làm đề Cambridge. Nhấn vào ô bài thi để ghi điểm hoặc viết bài luận!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Cam Book form */}
            <form onSubmit={handleAddCamBook} className="flex items-center gap-1.5 shrink-0 bg-[#FAF8F5] p-1 border border-[#E7E1D7] rounded-xl">
              <input
                type="number"
                min="1"
                max="99"
                placeholder="Tập #"
                value={newCamBook}
                onChange={(e) => setNewCamBook(e.target.value)}
                className="w-14 bg-white border border-[#E7E1D7] rounded-lg px-2 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] font-mono text-center"
              />
              <button
                type="submit"
                className="bg-[#2E6930] hover:bg-[#255527] text-white font-medium text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                + Thêm
              </button>
            </form>

            {/* Score color indicators legend */}
            <div className="hidden sm:flex gap-3 text-[10px] font-mono text-[#7A7268]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300"></span> &gt;= 7.5</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300"></span> &gt;= 6.5</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sky-100 border border-sky-300"></span> &gt;= 5.5</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300"></span> &lt; 5.5</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {camBooks.map(book => (
            <div key={book} className="bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl p-3.5 space-y-2 relative group/card">
              <div className="flex justify-between items-center border-b border-[#EFECE6] pb-1.5">
                <span className="text-xs font-bold text-[#2C2825] font-mono uppercase tracking-wider">
                  CAMBRIDGE {book}
                </span>
                <button
                  onClick={() => handleDeleteCamBook(book)}
                  className="opacity-0 group-hover/card:opacity-100 text-[#8C827A] hover:text-rose-600 font-bold text-sm transition-opacity cursor-pointer leading-none"
                  title={`Ẩn Cambridge ${book}`}
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
                      className={`h-9 rounded-lg border text-center flex flex-col items-center justify-center font-mono transition-all cursor-pointer shadow-xs ${colorClass}`}
                      title={log ? `${log.testName} (Overall: ${log.overall.toFixed(1)})` : `Nhấn để tạo bài làm Cambridge ${book} Test ${test}`}
                    >
                      <span className="text-[9px] text-[#7A7268] font-medium">T{test}</span>
                      <span className="text-xs font-bold">{score !== undefined ? score.toFixed(1) : '—'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SPREADSHEET-STYLE SCORE MATRIX TABLE */}
      <div className="bg-white border border-[#E7E1D7] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg text-[#2E6930]">
              <AwardIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C2825]">
                Lịch sử thi thử & Bài viết IELTS
              </h3>
              <p className="text-xs text-[#7A7268]">Ghi nhận điểm thi từng kỹ năng và luyện viết bài luận</p>
            </div>
          </div>
        </div>

        {warning && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* The spreadsheet entry grid form */}
        <div className="overflow-x-auto border border-[#E7E1D7] rounded-xl bg-white shadow-xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#7A7268] text-[10px] font-semibold uppercase tracking-wider font-mono border-b border-[#E7E1D7] select-none">
                <th 
                  className="py-2.5 px-3 w-1/4 cursor-pointer hover:text-[#2C2825] transition-colors"
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  Tên đề thi / Bài luyện {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  className="py-2.5 px-3 w-1/6 cursor-pointer hover:text-[#2C2825] transition-colors"
                  onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                >
                  Ngày thi {sortBy === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </th>
                <th className="py-2.5 px-3 text-center">Listening</th>
                <th className="py-2.5 px-3 text-center">Reading</th>
                <th className="py-2.5 px-3 text-center">Writing</th>
                <th className="py-2.5 px-3 text-center">Speaking</th>
                <th className="py-2.5 px-3 text-center">Overall</th>
                <th className="py-2.5 px-3 w-1/5">Ghi chú</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* Permanent inputs row */}
              <tr className="bg-[#FAF8F5]/80 border-b border-[#E7E1D7]">
                <td className="py-3 px-2">
                  <input
                    type="text"
                    required
                    placeholder="VD: Cambridge 19 Test 2"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full bg-white border border-[#E7E1D7] rounded-lg px-2.5 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] font-semibold"
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-[#E7E1D7] rounded-lg px-2 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={listening}
                    onChange={(e) => setListening(parseFloat(e.target.value))}
                    className="bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-xs text-blue-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={reading}
                    onChange={(e) => setReading(parseFloat(e.target.value))}
                    className="bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-xs text-emerald-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={writing}
                    onChange={(e) => setWriting(parseFloat(e.target.value))}
                    className="bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-xs text-purple-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <select
                    value={speaking}
                    onChange={(e) => setSpeaking(parseFloat(e.target.value))}
                    className="bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-xs text-amber-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                  >
                    {ieltsBands.map(b => <option key={b} value={b}>{b.toFixed(1)}</option>)}
                  </select>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="text-xs font-bold text-[#B85D38] bg-white border border-[#E7E1D7] px-2.5 py-1 rounded-lg font-mono">
                    {currentOverallLive.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <input
                    type="text"
                    placeholder="VD: Sai phần Map, thiếu từ..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-[#E7E1D7] rounded-lg px-2.5 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    className="bg-[#2E6930] hover:bg-[#255527] text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </td>
              </tr>

              {/* Render Existing Logs */}
              {logs.length > 0 ? (
                sortedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#EFECE6] hover:bg-[#FAF8F5] transition-colors text-xs font-medium text-[#2C2825]"
                  >
                    <td className="py-2.5 px-3 font-semibold truncate max-w-[200px]">
                      {log.testName}
                    </td>
                    <td className="py-2.5 px-3 text-[#7A7268] font-mono">
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
                        className="bg-[#FAF8F5] border border-[#E7E1D7] rounded p-1 text-xs text-blue-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-white text-[#2C2825]">{b.toFixed(1)}</option>)}
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
                        className="bg-[#FAF8F5] border border-[#E7E1D7] rounded p-1 text-xs text-emerald-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-white text-[#2C2825]">{b.toFixed(1)}</option>)}
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
                        className="bg-[#FAF8F5] border border-[#E7E1D7] rounded p-1 text-xs text-purple-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-white text-[#2C2825]">{b.toFixed(1)}</option>)}
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
                        className="bg-[#FAF8F5] border border-[#E7E1D7] rounded p-1 text-xs text-amber-700 font-bold focus:outline-none font-mono mx-auto block cursor-pointer"
                      >
                        {ieltsBands.map(b => <option key={b} value={b} className="bg-white text-[#2C2825]">{b.toFixed(1)}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-xs bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md font-bold font-mono">
                        {log.overall.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#7A7268] italic truncate max-w-[160px]" title={log.notes}>
                      {log.notes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mx-auto">
                        <button
                          onClick={() => handleOpenEssayEditor(log)}
                          className="bg-[#FAF8F5] text-[#2C2825] hover:bg-[#F2EFE9] border border-[#E7E1D7] px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-[#2E6930]" />
                          Bài viết
                        </button>
                        
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1 text-[#8C827A] hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Xóa bài thi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8C827A] italic">
                    Chưa có bài thi thử nào được ghi nhận. Nhập vào hàng trên hoặc chọn từ ma trận Cambridge!
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
        <div className="lg:col-span-2 bg-white border border-[#E7E1D7] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#2C2825] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2E6930]" />
              Tiến trình Band điểm theo thời gian
            </h3>
            <p className="text-xs text-[#7A7268]">Biểu đồ thể hiện sự tiến bộ các kỹ năng IELTS qua các bài mock test</p>
          </div>

          <div className="h-64 w-full text-xs font-mono">
            {logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFECE6" />
                  <XAxis dataKey="formattedDate" stroke="#A8A29E" />
                  <YAxis domain={[4.0, 9.0]} stroke="#A8A29E" ticks={[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E7E1D7', borderRadius: '12px', color: '#2C2825', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#2C2825' }}
                  />
                  <Legend iconSize={8} />
                  <Line type="monotone" dataKey="listening" name="Listening" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="reading" name="Reading" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="writing" name="Writing" stroke="#a855f7" strokeWidth={2} />
                  <Line type="monotone" dataKey="speaking" name="Speaking" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8C827A] gap-1.5 border border-dashed border-[#E7E1D7] rounded-xl bg-[#FAF8F5]">
                <BookOpen className="w-8 h-8 text-[#A8A29E]" />
                <span>Chưa có dữ liệu bài thi để hiển thị biểu đồ tiến trình!</span>
              </div>
            )}
          </div>
        </div>

        {/* Advice Column (1/3 span) */}
        <div>
          {analysis ? (
            <div className="bg-white border border-[#E7E1D7] rounded-2xl p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#B85D38]" />
                Phân tích điểm mạnh & điểm yếu
              </h4>

              <div className="space-y-4">
                {/* Strength */}
                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analysis.strongest.icon}</span>
                    <div>
                      <p className="text-[10px] text-emerald-800 font-mono uppercase tracking-wider font-bold">KỸ NĂNG MẠNH NHẤT</p>
                      <h5 className="text-xs font-bold text-[#2C2825]">{analysis.strongest.name}</h5>
                    </div>
                  </div>
                  <div className="text-xs text-[#57534E] leading-relaxed pt-1.5 border-t border-emerald-200">
                    Điểm số ấn tượng với trung bình <strong className="text-emerald-800 font-mono">{analysis.strongest.score}</strong>. Đây là nền tảng vững chắc của bạn; hãy tiếp tục duy trì!
                  </div>
                </div>

                {/* Weakness */}
                <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analysis.weakest.icon}</span>
                    <div>
                      <p className="text-[10px] text-rose-800 font-mono uppercase tracking-wider font-bold">CẦN CẢI THIỆN</p>
                      <h5 className="text-xs font-bold text-[#2C2825]">{analysis.weakest.name}</h5>
                    </div>
                  </div>
                  <div className="text-xs text-[#57534E] leading-relaxed pt-1.5 border-t border-rose-200">
                    Điểm trung bình ở mức <strong className="text-rose-800 font-mono">{analysis.weakest.score}</strong>. Cần chú trọng rèn luyện thêm:
                    {analysis.weakest.name.includes('Writing') && ' Tập trung đa dạng cấu trúc câu, phát triển luận điểm Task 2 logic và kiểm soát thời gian.'}
                    {analysis.weakest.name.includes('Speaking') && ' Ghi âm bài nói, sửa phát âm và luyện phản xạ nhanh cho Part 2/3.'}
                    {analysis.weakest.name.includes('Listening') && ' Luyện nghe chép chính tả và nghe thụ động, chú ý các từ chuyển ý và trọng âm.'}
                    {analysis.weakest.name.includes('Reading') && ' Áp dụng kỹ thuật Skimming & Scanning, đồng thời mở rộng vốn từ Academic mỗi ngày.'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E7E1D7] rounded-2xl p-6 text-center text-xs text-[#8C827A] space-y-2 shadow-xs">
              <FileText className="w-8 h-8 text-[#A8A29E] mx-auto" />
              <p>Chưa đủ dữ liệu để phân tích. Hãy ghi nhận ít nhất 1 bài thi để mở khóa nhận xét chuyên sâu!</p>
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN IMMERSIVE IELTS WRITING WORKSPACE MODAL */}
      {activeEssayLog && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col font-sans text-[#2C2825] select-none">
          {/* Header Bar */}
          <div className="bg-white border-b border-[#E7E1D7] px-6 py-3 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isExamStarted) {
                    if (!confirm('⚠️ Bạn đang trong thời gian làm bài thi! Thoát ra bây giờ sẽ huỷ bài thi này. Bạn có chắc muốn thoát?')) {
                      return;
                    }
                  }
                  setActiveEssayLog(null);
                }}
                className="text-[#7A7268] hover:text-[#2C2825] transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> THOÁT
              </button>
              <div className="h-4 w-px bg-[#E7E1D7]"></div>
              <span className="text-xs font-bold text-[#2C2825] uppercase">
                📖 KHÔNG GIAN BÀI VIẾT: {activeEssayLog.testName}
              </span>
            </div>

            {/* Timed configurations vs Active Timer display */}
            <div className="flex items-center gap-4">
              {!isExamStarted ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl p-0.5">
                    <button
                      onClick={() => setExamMode('FREE')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        examMode === 'FREE' ? 'bg-[#2E6930] text-white shadow-xs' : 'text-[#7A7268] hover:text-[#2C2825]'
                      }`}
                    >
                      Luyện tự do
                    </button>
                    <button
                      onClick={() => {
                        setExamMode('TIMED');
                        setExamDuration(activeTask === 1 ? 20 : 40);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        examMode === 'TIMED' ? 'bg-[#2E6930] text-white shadow-xs' : 'text-[#7A7268] hover:text-[#2C2825]'
                      }`}
                    >
                      Bấm giờ thi
                    </button>
                  </div>

                  {examMode === 'TIMED' && (
                    <select
                      value={examDuration}
                      onChange={(e) => setExamDuration(parseInt(e.target.value))}
                      className="bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2 py-1 text-xs text-[#2C2825] focus:outline-none"
                    >
                      <option value={1}>1 phút (Thử nhanh)</option>
                      <option value={10}>10 phút</option>
                      <option value={20}>20 phút (Chuẩn Task 1)</option>
                      <option value={40}>40 phút (Chuẩn Task 2)</option>
                      <option value={60}>60 phút (Cả 2 Task)</option>
                    </select>
                  )}

                  <button
                    onClick={() => {
                      setIsExamStarted(true);
                      if (examMode === 'TIMED') {
                        setTimeLeft(examDuration * 60);
                      }
                    }}
                    className="bg-[#2E6930] hover:bg-[#255527] text-white font-medium px-4 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> BẮT ĐẦU LÀM BÀI
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Countdown Timer Clock */}
                  {examMode === 'TIMED' ? (
                    <div className={`px-4 py-1.5 border rounded-xl flex items-center gap-2 font-mono font-bold text-sm tracking-wider ${
                      timeLeft < 300 
                        ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse' 
                        : 'border-[#E7E1D7] bg-[#FAF8F5] text-[#2C2825]'
                    }`}>
                      <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-600' : 'text-[#2E6930]'}`} />
                      <span>{formatTime(timeLeft)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#7A7268] uppercase font-semibold font-mono">Chế độ: Luyện tự do</span>
                  )}

                  <button
                    onClick={handleSaveDraft}
                    className="bg-[#FAF8F5] border border-[#E7E1D7] hover:bg-[#F2EFE9] text-[#2C2825] px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  >
                    Lưu bản nháp
                  </button>

                  <button
                    onClick={handleManualSubmit}
                    className="bg-[#2E6930] hover:bg-[#255527] text-white font-medium px-4 py-1.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                  >
                    NỘP BÀI THI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Workspace Split Body */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left Panel: Prompt Questions & Prompt Image */}
            <div className="w-[42%] bg-white border-r border-[#E7E1D7] flex flex-col overflow-y-auto p-6 space-y-5 text-[#2C2825]">
              <div className="space-y-1">
                <span className="text-[10px] text-[#2E6930] font-bold tracking-wider uppercase font-mono block">ĐỀ BÀI THI</span>
                <h4 className="text-sm font-bold text-[#2C2825] uppercase tracking-wider">{activeEssayLog.testName}</h4>
              </div>

              {/* Prompt Text / Notes Editor */}
              <div className="space-y-2">
                <label className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono">Nội dung đề bài:</label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Dán hoặc gõ đề bài viết vào đây..."
                  disabled={isExamStarted && examMode === 'TIMED'}
                  className="w-full bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl p-3.5 text-xs text-[#2C2825] font-sans focus:outline-none h-28 resize-none leading-relaxed"
                />
              </div>

              {/* Prompt Image Manager */}
              <div className="space-y-3.5 border-t border-[#EFECE6] pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#2E6930]" />
                    Hình ảnh biểu đồ Task 1
                  </label>
                  {promptImgUrl && (
                    <button
                      onClick={() => {
                        if (confirm('Xóa hình ảnh đề bài hiện tại?')) setPromptImgUrl('');
                      }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {promptImgUrl ? (
                  <div className="border border-[#E7E1D7] bg-[#FAF8F5] p-2 rounded-2xl flex items-center justify-center relative overflow-hidden group/image max-h-[220px]">
                    <img 
                      src={promptImgUrl} 
                      alt="Prompt Diagram" 
                      className="max-h-[200px] object-contain rounded-lg transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#E7E1D7] bg-[#FAF8F5] hover:bg-[#F2EFE9] rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isExamStarted && examMode === 'TIMED'}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-[#8C827A]" />
                    <div>
                      <span className="text-xs text-[#2C2825] font-semibold block">Tải lên hình ảnh biểu đồ / đồ thị</span>
                      <span className="text-[10px] text-[#8C827A] block mt-0.5">Hệ thống sẽ tự động tối ưu hóa kích thước ảnh</span>
                    </div>
                  </div>
                )}
                
                {/* Paste direct link option */}
                {!promptImgUrl && (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Hoặc dán link ảnh trực tiếp từ internet..."
                      value={promptImgUrl}
                      onChange={(e) => setPromptImgUrl(e.target.value)}
                      disabled={isExamStarted && examMode === 'TIMED'}
                      className="flex-1 bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2.5 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
                    />
                  </div>
                )}
              </div>

              {/* Notes / Remarks */}
              <div className="space-y-2 border-t border-[#EFECE6] pt-4">
                <label className="text-[10px] text-[#7A7268] font-semibold uppercase tracking-wider font-mono flex items-center gap-1">
                  📝 Nhận xét của giáo viên & Tự rút kinh nghiệm:
                </label>
                <textarea
                  value={selfReview}
                  onChange={(e) => setSelfReview(e.target.value)}
                  placeholder="Sau khi làm xong, ghi lại lỗi hay mắc (ngữ pháp, từ vựng, cách diễn đạt) hoặc phản hồi từ thầy cô để ôn lại sau này..."
                  className="w-full bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl p-3.5 text-xs text-[#2C2825] font-sans focus:outline-none h-28 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right Panel: Exam CDT Textarea Workspace */}
            <div className="flex-1 bg-[#FAF8F5] flex flex-col overflow-hidden min-h-0">
              {/* Task Tabs switcher */}
              <div className="bg-white border-b border-[#E7E1D7] flex justify-between items-center px-6 py-2 shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isExamStarted) setActiveTask(1);
                      else alert('⚠️ Không thể chuyển task khi bài thi bấm giờ đang chạy!');
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTask === 1
                        ? 'bg-[#2E6930] text-white shadow-xs'
                        : 'text-[#7A7268] hover:text-[#2C2825]'
                    }`}
                  >
                    Task 1 (Report - 150 từ)
                  </button>
                  <button
                    onClick={() => {
                      if (!isExamStarted) setActiveTask(2);
                      else alert('⚠️ Không thể chuyển task khi bài thi bấm giờ đang chạy!');
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTask === 2
                        ? 'bg-[#2E6930] text-white shadow-xs'
                        : 'text-[#7A7268] hover:text-[#2C2825]'
                    }`}
                  >
                    Task 2 (Essay - 250 từ)
                  </button>
                </div>

                <div className="text-xs font-mono text-[#8C827A] font-medium">
                  Chuẩn CDT: Bàn phím QWERTY
                </div>
              </div>

              {/* Textarea Workspace */}
              <div className="flex-1 p-6 flex flex-col min-h-0 relative">
                {!isExamStarted && (
                  <div className="absolute inset-0 bg-[#FAF8F5]/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-white border border-[#E7E1D7] flex items-center justify-center text-[#2E6930] shadow-xs">
                      <Bookmark className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h4 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider">Không gian bài viết chưa bắt đầu</h4>
                      <p className="text-xs text-[#7A7268] leading-relaxed font-sans">
                        Chọn chế độ (Luyện tự do hoặc Bấm giờ thi) ở thanh trên, sau đó nhấn **BẮT ĐẦU LÀM BÀI**!
                      </p>
                    </div>
                  </div>
                )}

                <textarea
                  value={activeTask === 1 ? task1Text : task2Text}
                  onChange={(e) => activeTask === 1 ? setTask1Text(e.target.value) : setTask2Text(e.target.value)}
                  placeholder={
                    activeTask === 1
                      ? "Viết bài Writing Task 1 tại đây (Tóm tắt thông tin đồ thị, xu hướng số liệu, bản đồ... Tối thiểu 150 từ)..."
                      : "Viết bài Writing Task 2 tại đây (Trình bày quan điểm về chủ đề xã hội, nêu luận điểm và ví dụ... Tối thiểu 250 từ)..."
                  }
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full flex-1 bg-white border border-[#E7E1D7] rounded-2xl p-5 text-sm text-[#2C2825] focus:outline-none focus:border-[#2E6930] font-mono resize-none leading-relaxed overflow-y-auto shadow-xs"
                />
              </div>

              {/* Progress & Live Word Count Footer */}
              <div className="bg-white border-t border-[#E7E1D7] px-6 py-4 space-y-2.5 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#7A7268] uppercase tracking-wider font-semibold font-mono">Tiến độ bài viết:</span>
                    <span className="text-xs font-sans text-[#2C2825]">
                      {wordProgress.statusText}
                    </span>
                  </div>
                  <div className="font-mono font-bold flex items-center gap-1.5">
                    <span className="text-[10px] text-[#7A7268] uppercase">Số từ:</span>
                    <span className="text-[#2C2825] bg-[#FAF8F5] border border-[#E7E1D7] px-2.5 py-0.5 rounded-lg text-xs">
                      {activeTask === 1 ? countWords(task1Text) : countWords(task2Text)} từ
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#FAF8F5] rounded-full h-2.5 overflow-hidden border border-[#E7E1D7]">
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
