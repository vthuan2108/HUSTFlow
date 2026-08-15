/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { GradeSubject, SemesterGPA } from '../types';
import { 
  BarChart3,
  RefreshCw, 
  Plus, 
  Trash2, 
  TrendingUp, 
  PieChart as PieIcon, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  LabelList,
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface GradeSectionProps {
  subjects: GradeSubject[];
  semesterGpaList: SemesterGPA[];
  cpaOverall: number;
  passedCredits?: number;
  totalCredits?: number;
  spreadsheetId: string;
  isSyncing: boolean;
  onSaveSpreadsheetId: (id: string) => void;
  onSync: () => Promise<void>;
  onAddSubject: (subject: Omit<GradeSubject, 'id'>) => void;
  onUpdateSubject: (id: string, updates: Partial<GradeSubject>) => void;
  onDeleteSubject: (id: string) => void;
}

// Available semesters in dropdown selector matching google sheet
const AVAILABLE_SEMESTERS = [
  '2024.1',
  '2024.2',
  '2025.1',
  '2025.2',
  '2026.1',
  '2026.2',
  '2026.3',
  '2027.1',
  '2027.2'
];

// Specific background and text color classes for Semester `<select>` capsule chips (Google Sheets style)
function getSemesterSelectStyle(sem: string): string {
  const s = String(sem || '').trim();
  switch (s) {
    case '2024.1': return 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
    case '2024.2': return 'bg-slate-500/15 text-slate-300 border border-slate-500/25';
    case '2025.1': return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
    case '2025.2': return 'bg-sky-500/15 text-sky-400 border border-sky-500/25';
    case '2026.1': return 'bg-purple-500/15 text-purple-400 border border-purple-500/25';
    case '2026.2': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
    case '2026.3': return 'bg-teal-500/15 text-teal-400 border border-teal-500/25';
    case '2027.1': return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25';
    case '2027.2': return 'bg-pink-500/15 text-pink-400 border border-pink-500/25';
    default: return 'bg-slate-800 text-slate-400 border border-slate-700';
  }
}

// Semester badges for timeline cards
function getSemesterBadgeStyle(sem: string): string {
  const s = String(sem || '').trim();
  switch (s) {
    case '2024.1': return 'bg-rose-500/15 text-rose-400 border-rose-500/25';
    case '2024.2': return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
    case '2025.1': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    case '2025.2': return 'bg-sky-500/15 text-sky-400 border-sky-500/25';
    case '2026.1': return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
    case '2026.2': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case '2026.3': return 'bg-teal-500/15 text-teal-400 border-teal-500/25';
    case '2027.1': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25';
    case '2027.2': return 'bg-pink-500/15 text-pink-400 border-pink-500/25';
    default: return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

// Custom wrapper input to support Vietnamese decimal comma separator typing (e.g. 8,5)
interface GradeInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}

function GradeInput({ value, onChange, placeholder, className }: GradeInputProps) {
  const [localVal, setLocalVal] = useState(() => {
    if (value === 0) return '0';
    return String(value).replace('.', ',');
  });

  // Sync state if value changes from external updates (like Pull sync)
  useEffect(() => {
    const parsedLocal = parseFloat(localVal.replace(',', '.'));
    if (value === 0) {
      if (parsedLocal !== 0 && !isNaN(parsedLocal)) {
        setLocalVal('0');
      }
    } else if (parsedLocal !== value) {
      setLocalVal(String(value).replace('.', ','));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow numbers, commas, and dots
    if (/^[0-9,.]*$/.test(input) || input === '') {
      setLocalVal(input);
      const parsed = parseFloat(input.replace(',', '.'));
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localVal.replace(',', '.'));
    if (isNaN(parsed) || parsed === 0) {
      setLocalVal('0');
      onChange(0);
    } else {
      setLocalVal(String(parsed).replace('.', ','));
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function GradeSection({
  subjects,
  semesterGpaList,
  cpaOverall,
  passedCredits,
  totalCredits,
  spreadsheetId,
  isSyncing,
  onSaveSpreadsheetId,
  onSync,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject
}: GradeSectionProps) {
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeSemesterGpaList = Array.isArray(semesterGpaList) ? semesterGpaList : [];
  const safeCpaOverall = typeof cpaOverall === 'number' && !isNaN(cpaOverall) ? cpaOverall : 0;

  const computedPassedCredits = useMemo(() => {
    if (typeof passedCredits === 'number' && passedCredits > 0) return passedCredits;
    return safeSubjects.filter(s => s.letterGrade !== 'F').reduce((acc, curr) => acc + (curr.credits || 0), 0);
  }, [passedCredits, safeSubjects]);

  const computedTotalCredits = useMemo(() => {
    if (typeof totalCredits === 'number' && totalCredits > 0) return totalCredits;
    return safeSubjects.reduce((acc, curr) => acc + (curr.credits || 0), 0);
  }, [totalCredits, safeSubjects]);

  const [sheetInput, setSheetInput] = useState(spreadsheetId);
  const [editingConfig, setEditingConfig] = useState(!spreadsheetId);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract Sheet ID
  const handleSaveConfig = () => {
    const input = sheetInput.trim();
    if (!input) {
      setErrorMsg('Vui lòng nhập Link hoặc ID Google Sheet');
      return;
    }
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const resolvedId = match ? match[1] : input;
    onSaveSpreadsheetId(resolvedId);
    setSheetInput(resolvedId);
    setEditingConfig(false);
    setErrorMsg('');
  };

  // Get unique semesters in the rendered order to alternate background colors
  const uniqueSemestersInTable = useMemo(() => {
    const list: string[] = [];
    safeSubjects.forEach(s => {
      if (s && s.semester && !list.includes(s.semester)) {
        list.push(s.semester);
      }
    });
    return list;
  }, [safeSubjects]);

  // Aggregate letter grades count from subjects for PieChart
  const letterGradeChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
    };
    safeSubjects.forEach(s => {
      const grade = s?.letterGrade?.trim().toUpperCase();
      if (grade && grade in counts) {
        counts[grade]++;
      }
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .filter(item => item.value > 0);
  }, [safeSubjects]);

  const PIE_COLORS: Record<string, string> = {
    'A+': '#fbbf24', // Amber
    'A': '#f59e0b',  // Gold
    'B+': '#10b981', // Emerald
    'B': '#34d399',  // Mint
    'C+': '#3b82f6', // Blue
    'C': '#60a5fa',  // Blue light
    'D+': '#f97316', // Orange
    'D': '#fb923c',  // Orange light
    'F': '#ef4444'   // Red
  };

  // Helper to verify valid semester name format (e.g. 2024.1, 2024.2)
  const isSemesterName = (sem: string) => /^\d{4}\.\d+$/.test((sem || '').trim());

  // Format Recharts Line Chart data (only chronologically sorted GPA list from Column L)
  const lineChartData = useMemo(() => {
    return [...safeSemesterGpaList]
      .filter(item => item && isSemesterName(item.semester) && item.gpa > 0)
      .sort((a, b) => (a.semester || '').localeCompare(b.semester || ''));
  }, [safeSemesterGpaList]);

  // Credits per semester chart data (Column K starting at K4 / local calculation)
  const creditsChartData = useMemo(() => {
    const localCreditsMap: Record<string, number> = {};
    safeSubjects.forEach(s => {
      if (s?.semester && isSemesterName(s.semester) && typeof s.credits === 'number') {
        localCreditsMap[s.semester] = (localCreditsMap[s.semester] || 0) + s.credits;
      }
    });

    return [...safeSemesterGpaList]
      .filter(item => item && isSemesterName(item.semester) && (item.credits! > 0 || item.gpa > 0))
      .sort((a, b) => (a.semester || '').localeCompare(b.semester || ''))
      .map(item => ({
        semester: item.semester,
        credits: typeof item.credits === 'number' && item.credits > 0 ? item.credits : (localCreditsMap[item.semester] || 0)
      }));
  }, [safeSemesterGpaList, safeSubjects]);

  // Add a blank new subject to the list (empty inputs)
  const handleAddNewRow = () => {
    let defaultSemester = '2024.1';
    if (safeSubjects.length > 0) {
      defaultSemester = safeSubjects[safeSubjects.length - 1].semester || '2024.1';
    }

    onAddSubject({
      semester: defaultSemester,
      name: '',
      credits: 0,
      processWeight: 0,
      processScore: 0,
      finalScore: 0
    });
  };

  // Winding Snake Path generator for Semester GPA Timeline
  const windingTimelineRows = useMemo(() => {
    const itemsPerRow = 4;
    const resultRows: { item: SemesterGPA | null; originalIndex: number }[][] = [];
    
    const sortedSemesters = [...safeSemesterGpaList]
      .filter(item => item && isSemesterName(item.semester) && item.gpa > 0)
      .sort((a, b) => (a.semester || '').localeCompare(b.semester || ''));

    for (let i = 0; i < sortedSemesters.length; i += itemsPerRow) {
      const chunk = sortedSemesters.slice(i, i + itemsPerRow);
      const rowIndex = Math.floor(i / itemsPerRow);
      const rowArray: { item: SemesterGPA | null; originalIndex: number }[] = [];

      if (rowIndex % 2 === 0) {
        for (let colIdx = 0; colIdx < itemsPerRow; colIdx++) {
          if (colIdx < chunk.length) {
            rowArray.push({ item: chunk[colIdx], originalIndex: i + colIdx });
          } else {
            rowArray.push({ item: null, originalIndex: -1 });
          }
        }
      } else {
        const tempPadded: { item: SemesterGPA | null; originalIndex: number }[] = Array(itemsPerRow)
          .fill(null)
          .map(() => ({ item: null, originalIndex: -1 }));

        for (let idx = 0; idx < chunk.length; idx++) {
          tempPadded[itemsPerRow - 1 - idx] = {
            item: chunk[idx],
            originalIndex: i + idx
          };
        }
        rowArray.push(...tempPadded);
      }
      
      resultRows.push(rowArray);
    }
    return { rows: resultRows, totalCount: sortedSemesters.length };
  }, [safeSemesterGpaList]);

  return (
    <div className="space-y-6" id="grade-section-view">
      
      {/* ── SECTION 1: HEADER & GOOGLE SHEETS SETUP ── */}
      <div className="neo-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider font-sans">
            <GraduationCap className="w-4 h-4 text-amber-400 animate-pulse" />
            Đồng Bộ Điểm Số Học Tập
          </h2>
          <p className="text-[10px] text-slate-500">
            Dữ liệu tự động đồng bộ 2 chiều với Google Sheets (Số tín chỉ từ Cột K4, GPA từ Cột L4).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {editingConfig ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={sheetInput}
                onChange={e => setSheetInput(e.target.value)}
                placeholder="Dán Link hoặc ID Google Sheet..."
                className="bg-slate-950 border-2 border-slate-950 rounded-xl px-3 py-1.5 text-xs text-slate-200 w-full sm:w-80 focus:outline-none focus:border-amber-400 font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase"
                >
                  Xác Nhận
                </button>
                {spreadsheetId && (
                  <button
                    onClick={() => { setSheetInput(spreadsheetId); setEditingConfig(false); }}
                    className="bg-slate-950 border-2 border-slate-950 text-slate-400 hover:text-slate-300 font-bold text-[10px] px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase"
                  >
                    Hủy
                  </button>
                )}
              </div>
              {errorMsg && <p className="text-rose-500 text-[10px] block mt-1 font-semibold">{errorMsg}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-950 border-2 border-slate-950 px-3.5 py-1.5 rounded-xl shadow-[1px_1px_0px_#000]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">ID: {spreadsheetId}</span>
              <button
                onClick={() => setEditingConfig(true)}
                className="text-[9px] text-[#fbbf24] hover:text-[#f59e0b] font-bold ml-2 underline cursor-pointer"
              >
                Thay Đổi
              </button>
            </div>
          )}

          {spreadsheetId && (
            <div className="flex items-center gap-2">
              <button
                onClick={onSync}
                disabled={isSyncing}
                className={`bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Đồng bộ 2 chiều thông minh giữa Web và Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ 2 Chiều'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Helper guide link */}
      {!spreadsheetId && (
        <div className="bg-amber-950/10 border border-amber-900/30 p-4 rounded-2xl flex gap-3 text-xs text-amber-300/80 leading-relaxed font-sans">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-amber-200">Đạo hữu chưa liên kết Google Sheet để quản lý điểm!</p>
            <p>
              1. Bấm vào đây để tạo bản sao từ mẫu: <a href="https://docs.google.com/spreadsheets/d/1In58O2CMig4yO6PpufTrDrbKIjyPXQDgVEV7XcAGk7U/copy" target="_blank" rel="noreferrer" className="underline text-amber-400 font-bold hover:text-amber-300">Nhân bản Google Sheet Bảng Điểm Mẫu ➔</a>
            </p>
            <p>
              2. Sau khi sao chép tệp mẫu về tài khoản Google Drive cá nhân, hãy dán liên kết của trang tính đó vào ô cấu hình phía trên và bấm <strong>Xác Nhận</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── SECTION 2: CPA DASHBOARD & WINDING GPA TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* CPA Large Dashboard Box */}
        <div className="lg:col-span-1 bg-[#0f141c] border-2 border-slate-950 p-6 flex flex-col justify-center items-center text-center shadow-[2px_2px_0px_#000] rounded-2xl select-none">
          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono mb-1">CPA Tích Lũy</span>
          <span className="text-5xl font-black font-mono text-red-500 leading-none tracking-tight">
            {safeCpaOverall.toFixed(2)}
          </span>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[8px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-900 font-semibold font-mono">
              Thang 4
            </span>
            <span className="text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-md font-bold font-mono">
              {computedPassedCredits}/{computedTotalCredits} tín chỉ
            </span>
          </div>
        </div>

        {/* GPA Semester Winding Timeline */}
        <div className="lg:col-span-3 neo-card p-5 flex flex-col justify-between">
          <div className="border-b-2 border-slate-950 pb-2.5 mb-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              GPA Học Kỳ (Winding Timeline)
            </h3>
            <p className="text-[10px] text-slate-500">Tiến trình thay đổi điểm trung bình học kỳ (Dữ liệu từ Cột L4 Sheet)</p>
          </div>

          {safeSemesterGpaList.filter(item => item && item.gpa > 0).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-500 text-xs italic">
              <span>Chưa có dữ liệu học kỳ. Nhấp "Đồng Bộ 2 Chiều" để nạp dữ liệu từ Google Sheet.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-10 p-2 relative">
              {windingTimelineRows.rows.map((row, rIdx) => {
                const isEvenRow = rIdx % 2 === 0;
                return (
                  <div key={`winding-row-${rIdx}`} className="relative">
                    <div className="grid grid-cols-4 gap-4 relative z-10">
                      {row.map((cell, cIdx) => {
                        if (!cell.item) {
                          return (
                            <div key={`empty-${cIdx}`} className="relative flex flex-col items-center opacity-0 pointer-events-none" />
                          );
                        }

                        const semesterBadgeStyle = getSemesterBadgeStyle(cell.item.semester);
                        
                        return (
                          <div key={cell.item.semester} className="relative flex flex-col items-center">
                            
                            {/* Semester Card */}
                            <div className="w-full bg-slate-950 border-2 border-slate-950 p-2 flex flex-col items-center justify-center text-center shadow-[1.5px_1.5px_0px_#000] relative z-10 rounded-xl">
                              <span className={`text-[8px] px-1.5 py-0.5 border rounded-md font-bold font-mono mb-1.5 uppercase ${semesterBadgeStyle}`}>
                                {cell.item.semester}
                              </span>
                              <span className="text-base font-bold font-mono text-slate-200 leading-none">
                                {cell.item.gpa ? Number(cell.item.gpa).toFixed(2) : '0.00'}
                              </span>
                            </div>

                            {/* L-to-R Connection Line */}
                            {isEvenRow && cIdx < row.length - 1 && row[cIdx + 1]?.item !== null && (
                              <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-white/80 -translate-y-1/2 z-0 pointer-events-none" />
                            )}
                            {/* R-to-L Connection Line */}
                            {!isEvenRow && cIdx > 0 && row[cIdx - 1]?.item !== null && (
                              <div className="absolute top-1/2 right-1/2 w-full h-0.5 bg-white/80 -translate-y-1/2 z-0 pointer-events-none" />
                            )}

                            {/* Curved right turn loop */}
                            {isEvenRow && cIdx === row.length - 1 && (windingTimelineRows.totalCount > cell.originalIndex + 1) && (
                              <div className="absolute top-1/2 left-1/2 w-[60%] h-[80px] border-t-2 border-r-2 border-b-2 border-white/80 rounded-r-2xl z-0 pointer-events-none" />
                            )}

                            {/* Curved left turn loop */}
                            {!isEvenRow && cIdx === 0 && (windingTimelineRows.totalCount > cell.originalIndex + 1) && (
                              <div className="absolute top-1/2 right-1/2 w-[60%] h-[80px] border-t-2 border-l-2 border-b-2 border-white/80 rounded-l-2xl z-0 pointer-events-none" />
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: ACADEMIC ANALYTICS ── */}
      {(lineChartData.length > 0 || creditsChartData.length > 0) && (
        <div className="space-y-6">
          {/* Row 1: Line Chart (GPA L4) + Pie Chart (Điểm chữ) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Line Chart - GPA Theo Kì (Cột L4) */}
            <div className="bg-[#0f141c] border-2 border-slate-950 p-5 shadow-[2px_2px_0px_#000] rounded-2xl">
              <div className="border-b-2 border-slate-950 pb-2 mb-4">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <TrendingUp className="w-4 h-4 text-sky-400 stroke-[2]" />
                  GPA Theo Kì (Cột L4)
                </h3>
              </div>
              
              <div className="h-64 text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="semester" stroke="#475569" tickLine={false} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} stroke="#475569" tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#070a0f',
                        border: '2px solid #0f172a',
                        borderRadius: '12px',
                        color: '#cbd5e1',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Line 
                      name="GPA Học Kỳ" 
                      type="monotone" 
                      dataKey="gpa" 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      dot={{ stroke: '#070a0f', strokeWidth: 1.5, r: 4, fill: '#38bdf8' }}
                      activeDot={{ stroke: '#070a0f', strokeWidth: 1.5, r: 6, fill: '#fbbf24' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pie Chart - Thống Kê Điểm Chữ */}
            <div className="bg-[#0f141c] border-2 border-slate-950 p-5 shadow-[2px_2px_0px_#000] rounded-2xl">
              <div className="border-b-2 border-slate-950 pb-2 mb-4">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <PieIcon className="w-4 h-4 text-amber-400 stroke-[2]" />
                  Thống Kê Điểm Chữ (Phân Bố Môn)
                </h3>
              </div>

              <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
                {letterGradeChartData.length === 0 ? (
                  <div className="text-slate-500 text-xs font-bold font-sans italic">Chưa có dữ liệu điểm chữ</div>
                ) : (
                  <>
                    <div className="w-full sm:w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={letterGradeChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {letterGradeChartData.map((entry, idx) => (
                              <Cell 
                                key={`cell-${idx}`} 
                                fill={PIE_COLORS[entry.name] || '#64748b'} 
                                stroke="#070a0f"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#070a0f',
                              border: '2px solid #0f172a',
                              borderRadius: '12px',
                              color: '#cbd5e1',
                              fontFamily: 'monospace'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legends list */}
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[9px] font-mono shrink-0">
                      {letterGradeChartData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1 bg-slate-950 border border-slate-900 p-1 rounded-lg">
                          <span 
                            className="w-2.5 h-2.5 rounded border border-slate-950 shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[entry.name] }}
                          />
                          <span className="text-slate-400 font-bold">{entry.name}:</span>
                          <span className="text-[#fbbf24] font-black">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Row 2 (Full Width): Bar Chart - Số Tín Chỉ Học Theo Kỳ (Cột J4 & K4) */}
          <div className="bg-[#0f141c] border-2 border-slate-950 p-5 shadow-[2px_2px_0px_#000] rounded-2xl">
            <div className="border-b-2 border-slate-950 pb-2 mb-4">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <BarChart3 className="w-4 h-4 text-emerald-400 stroke-[2]" />
                Số Tín Chỉ Học Theo Kỳ (Cột J4 & K4)
              </h3>
            </div>
            
            <div className="h-64 text-[10px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditsChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <XAxis dataKey="semester" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#070a0f',
                      border: '2px solid #0f172a',
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar 
                    name="Số Tín Chỉ" 
                    dataKey="credits" 
                    fill="#10b981" 
                    barSize={32}
                    radius={[6, 6, 0, 0]}
                  >
                    <LabelList 
                      dataKey="credits" 
                      position="top" 
                      fill="#34d399" 
                      fontSize={11} 
                      fontFamily="monospace" 
                      fontWeight="bold" 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ── SECTION 4: DETAILED SUBJECT GRADEBOOK TABLE ── */}
      <div className="bg-[#0f141c] border-2 border-slate-950 p-5 shadow-[2px_2px_0px_#000] rounded-2xl">
        <div className="flex items-center justify-between border-b-2 border-slate-950 pb-3 mb-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Sổ Điểm Chi Tiết (Gradebook)
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">Chọn kì học và điền điểm. Sử dụng dấu phẩy cho phần thập phân (Ví dụ: 8,5).</p>
          </div>
        </div>

        {safeSubjects.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950">
            Sổ điểm hiện đang trống. Nhấp "Thêm Môn Học Mới" ở dưới hoặc dán link Google Sheet để đồng bộ.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-950 rounded-xl bg-slate-950 shadow-[1px_1px_0px_#000]">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-[#0f141c] text-slate-400 font-mono text-[9px] uppercase border-b border-slate-950 select-none">
                <tr>
                  <th className="py-2.5 px-3 w-36">Kì học</th>
                  <th className="py-2.5 px-3">Tên môn học</th>
                  <th className="py-2.5 px-3 w-20 text-center">Tín chỉ</th>
                  <th className="py-2.5 px-3 w-24 text-center">Trọng số QTr</th>
                  <th className="py-2.5 px-3 w-20 text-center">Điểm QTr</th>
                  <th className="py-2.5 px-3 w-20 text-center">Điểm cuối kì</th>
                  <th className="py-2.5 px-3 w-20 text-center">Điểm chữ</th>
                  <th className="py-2.5 px-3 w-20 text-center">Điểm quy đổi</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 font-sans">
                {safeSubjects.map((s) => {
                  const semIdx = uniqueSemestersInTable.indexOf(s.semester);
                  const isAltSemester = semIdx % 2 === 1;

                  return (
                    <tr 
                      key={s.id} 
                      className={`transition-colors ${
                        isAltSemester ? 'bg-white/[0.03] hover:bg-white/[0.07]' : 'bg-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Semester Select Dropdown Cell */}
                      <td className="py-1.5 px-3">
                        <select
                          value={s.semester}
                          onChange={e => onUpdateSubject(s.id, { semester: e.target.value })}
                          className={`rounded-full px-3 py-1 text-xs font-mono text-center w-full focus:outline-none cursor-pointer appearance-none ${getSemesterSelectStyle(s.semester)}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.25em 1.25em',
                            backgroundRepeat: 'no-repeat',
                            paddingRight: '1.5rem'
                          }}
                        >
                          {AVAILABLE_SEMESTERS.map(sem => (
                            <option key={sem} value={sem} className="bg-slate-950 text-slate-300">{sem}</option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Subject Name field */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={s.name}
                          onChange={e => onUpdateSubject(s.id, { name: e.target.value })}
                          className="bg-slate-950 border border-white/30 focus:border-white rounded-xl px-3 py-1 text-xs text-slate-200 w-full focus:outline-none transition-colors"
                          placeholder="Tên môn học..."
                        />
                      </td>
                      
                      {/* Credits field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.credits}
                          onChange={val => onUpdateSubject(s.id, { credits: Math.floor(val) })}
                          className="bg-slate-950 border border-white/30 focus:border-white rounded-xl px-1 py-1 text-xs text-slate-200 text-center w-full focus:outline-none font-mono font-bold transition-colors"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Process Weight field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.processWeight}
                          onChange={val => onUpdateSubject(s.id, { processWeight: val })}
                          className="bg-slate-950 border border-white/30 focus:border-white rounded-xl px-1 py-1 text-xs text-slate-200 text-center w-full focus:outline-none font-mono font-semibold transition-colors"
                          placeholder="0,0"
                        />
                      </td>
                      
                      {/* Process Score field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.processScore}
                          onChange={val => onUpdateSubject(s.id, { processScore: val })}
                          className="bg-slate-950 border border-white/30 focus:border-white rounded-xl px-1 py-1 text-xs text-slate-200 text-center w-full focus:outline-none font-mono transition-colors"
                          placeholder="0,0"
                        />
                      </td>
                      
                      {/* Final Score field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.finalScore}
                          onChange={val => onUpdateSubject(s.id, { finalScore: val })}
                          className="bg-slate-950 border border-white/30 focus:border-white rounded-xl px-1 py-1 text-xs text-slate-200 text-center w-full focus:outline-none font-mono transition-colors"
                          placeholder="0,0"
                        />
                      </td>
                      
                      {/* Read-only Letter Grade */}
                      <td className="py-1.5 px-2 text-center select-none font-bold">
                        {s.letterGrade ? (
                          <span className={`text-[9px] px-2 py-0.5 rounded-md border font-mono ${
                            ['A+', 'A'].includes(s.letterGrade) ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                            ['B+', 'B'].includes(s.letterGrade) ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                            ['C+', 'C'].includes(s.letterGrade) ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                            s.letterGrade === 'F' ? 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/25' :
                            'bg-slate-800 text-slate-300 border-slate-800'
                          }`}>
                            {s.letterGrade}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                      
                      {/* Read-only Scale 4 score */}
                      <td className="py-1.5 px-2 text-center select-none font-mono text-slate-400 font-bold">
                        {s.gpaScale4 !== undefined && s.gpaScale4 !== null ? Number(s.gpaScale4).toFixed(1) : '-'}
                      </td>
                      
                      {/* Delete action button */}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          onClick={() => onDeleteSubject(s.id)}
                          className="p-1 text-slate-500 hover:text-[#ef4444] rounded transition-colors cursor-pointer"
                          title="Xóa môn học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add subject button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAddNewRow}
            className="bg-slate-950 border-2 border-slate-950 text-[#fbbf24] hover:text-[#f59e0b] font-bold text-[10px] px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none uppercase"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Thêm Môn Học Mới
          </button>
        </div>
      </div>

    </div>
  );
}
