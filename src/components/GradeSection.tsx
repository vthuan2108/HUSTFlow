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
  GraduationCap,
  ExternalLink,
  FileSpreadsheet
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
    case '2024.1': return 'bg-rose-50 text-rose-800 border border-rose-200';
    case '2024.2': return 'bg-stone-100 text-stone-800 border border-stone-200';
    case '2025.1': return 'bg-amber-50 text-amber-800 border border-amber-200';
    case '2025.2': return 'bg-sky-50 text-sky-800 border border-sky-200';
    case '2026.1': return 'bg-purple-50 text-purple-800 border border-purple-200';
    case '2026.2': return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    case '2026.3': return 'bg-teal-50 text-teal-800 border border-teal-200';
    case '2027.1': return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
    case '2027.2': return 'bg-pink-50 text-pink-800 border border-pink-200';
    default: return 'bg-stone-100 text-stone-800 border border-stone-200';
  }
}

// Semester badges for timeline cards
function getSemesterBadgeStyle(sem: string): string {
  const s = String(sem || '').trim();
  switch (s) {
    case '2024.1': return 'bg-rose-50 text-rose-800 border-rose-200';
    case '2024.2': return 'bg-stone-100 text-stone-800 border-stone-200';
    case '2025.1': return 'bg-amber-50 text-amber-800 border-amber-200';
    case '2025.2': return 'bg-sky-50 text-sky-800 border-sky-200';
    case '2026.1': return 'bg-purple-50 text-purple-800 border-purple-200';
    case '2026.2': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case '2026.3': return 'bg-teal-50 text-teal-800 border-teal-200';
    case '2027.1': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case '2027.2': return 'bg-pink-50 text-pink-800 border-pink-200';
    default: return 'bg-stone-100 text-stone-800 border-stone-200';
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
      setErrorMsg('Please enter Google Sheet Link or ID');
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
      <div className="bg-white border border-[#E7E1D7] p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[#2C2825] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#2E6930]" />
            Đồng bộ bảng điểm học tập
          </h2>
          <p className="text-xs text-[#7A7268]">
            Đồng bộ 2 chiều với Google Sheets (Tín chỉ từ cột K4, CPA từ cột L4).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {editingConfig ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={sheetInput}
                onChange={e => setSheetInput(e.target.value)}
                placeholder="Dán link hoặc ID Google Sheet..."
                className="bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] w-full sm:w-80 focus:outline-none focus:border-[#2E6930] font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  className="bg-[#2E6930] hover:bg-[#255527] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  Xác nhận
                </button>
                {spreadsheetId && (
                  <button
                    onClick={() => { setSheetInput(spreadsheetId); setEditingConfig(false); }}
                    className="bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#7A7268] border border-[#E7E1D7] font-medium text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
              {errorMsg && <p className="text-rose-600 text-[10px] block mt-1 font-semibold">{errorMsg}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E7E1D7] px-3.5 py-1.5 rounded-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#2E6930] shrink-0" />
              <span className="text-xs text-[#57534E] font-mono truncate max-w-[200px]">ID: {spreadsheetId}</span>
              <button
                onClick={() => setEditingConfig(true)}
                className="text-xs text-[#2E6930] hover:underline font-medium ml-2 cursor-pointer"
              >
                Đổi link
              </button>
            </div>
          )}

          {spreadsheetId && (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={
                  spreadsheetId.startsWith('http://') || spreadsheetId.startsWith('https://')
                    ? spreadsheetId
                    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
                }
                target="_blank"
                rel="noreferrer"
                className="bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#2C2825] border border-[#E7E1D7] font-medium text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs no-underline"
                title="Mở Google Sheet trên tab mới"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E6930]" />
                <span>Mở Google Sheet</span>
                <ExternalLink className="w-3 h-3 text-[#8C827A]" />
              </a>

              <button
                onClick={onSync}
                disabled={isSyncing}
                className={`bg-[#2E6930] hover:bg-[#255527] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Đồng bộ 2 chiều giữa Web và Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ 2 chiều'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Helper guide link */}
      {!spreadsheetId && (
        <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl flex gap-3 text-xs text-amber-900 leading-relaxed font-sans">
          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Bạn chưa liên kết Google Sheet để quản lý điểm!</p>
            <p>
              1. Nhấn vào đây để tạo bản sao mẫu: <a href="https://docs.google.com/spreadsheets/d/1In58O2CMig4yO6PpufTrDrbKIjyPXQDgVEV7XcAGk7U/copy" target="_blank" rel="noreferrer" className="underline text-[#2E6930] font-semibold hover:opacity-80">Sao chép mẫu bảng điểm Google Sheet ➔</a>
            </p>
            <p>
              2. Sau khi sao chép về Drive của bạn, dán link Google Sheet vào ô cấu hình phía trên và nhấn <strong>Xác nhận</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── SECTION 2: CPA DASHBOARD & WINDING GPA TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* CPA Large Dashboard Box */}
        <div className="lg:col-span-1 bg-white border border-[#E7E1D7] p-6 flex flex-col justify-center items-center text-center shadow-xs rounded-2xl select-none">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C827A] mb-1">CPA TÍCH LŨY</span>
          <span className="text-5xl font-black font-mono text-[#B85D38] leading-none tracking-tight">
            {safeCpaOverall.toFixed(2)}
          </span>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] bg-[#FAF8F5] text-[#7A7268] px-2 py-0.5 rounded-md border border-[#E7E1D7] font-semibold font-mono">
              Thang 4.0
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold font-mono">
              {computedPassedCredits}/{computedTotalCredits} tín chỉ
            </span>
          </div>
        </div>

        {/* GPA Semester Winding Timeline */}
        <div className="lg:col-span-3 bg-white border border-[#E7E1D7] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="border-b border-[#EFECE6] pb-2.5 mb-4">
            <h3 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider flex items-center gap-1.5">
              GPA từng kỳ (Tiến trình)
            </h3>
            <p className="text-xs text-[#7A7268]">Tiến trình điểm trung bình theo học kỳ (Dữ liệu từ cột L4)</p>
          </div>

          {safeSemesterGpaList.filter(item => item && item.gpa > 0).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-[#8C827A] text-xs italic">
              <span>Chưa có dữ liệu học kỳ. Nhấn "Đồng bộ 2 chiều" để tải điểm từ Google Sheets.</span>
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
                            <div className="w-full bg-[#FAF8F5] border border-[#E7E1D7] p-2 flex flex-col items-center justify-center text-center shadow-xs relative z-10 rounded-xl">
                              <span className={`text-[9px] px-2 py-0.5 border rounded-md font-semibold font-mono mb-1.5 uppercase ${semesterBadgeStyle}`}>
                                {cell.item.semester}
                              </span>
                              <span className="text-base font-bold font-mono text-[#2C2825] leading-none">
                                {cell.item.gpa ? Number(cell.item.gpa).toFixed(2) : '0.00'}
                              </span>
                            </div>

                            {/* L-to-R Connection Line */}
                            {isEvenRow && cIdx < row.length - 1 && row[cIdx + 1]?.item !== null && (
                              <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-[#E7E1D7] -translate-y-1/2 z-0 pointer-events-none" />
                            )}
                            {/* R-to-L Connection Line */}
                            {!isEvenRow && cIdx > 0 && row[cIdx - 1]?.item !== null && (
                              <div className="absolute top-1/2 right-1/2 w-full h-0.5 bg-[#E7E1D7] -translate-y-1/2 z-0 pointer-events-none" />
                            )}

                            {/* Curved right turn loop */}
                            {isEvenRow && cIdx === row.length - 1 && (windingTimelineRows.totalCount > cell.originalIndex + 1) && (
                              <div className="absolute top-1/2 left-1/2 w-[60%] h-[80px] border-t-2 border-r-2 border-b-2 border-[#E7E1D7] rounded-r-2xl z-0 pointer-events-none" />
                            )}

                            {/* Curved left turn loop */}
                            {!isEvenRow && cIdx === 0 && (windingTimelineRows.totalCount > cell.originalIndex + 1) && (
                              <div className="absolute top-1/2 right-1/2 w-[60%] h-[80px] border-t-2 border-l-2 border-b-2 border-[#E7E1D7] rounded-l-2xl z-0 pointer-events-none" />
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
            <div className="bg-white border border-[#E7E1D7] p-5 shadow-xs rounded-2xl">
              <div className="border-b border-[#EFECE6] pb-2 mb-4">
                <h3 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <TrendingUp className="w-4 h-4 text-[#2E6930] stroke-[2]" />
                  GPA theo học kỳ (Cột L4)
                </h3>
              </div>
              
              <div className="h-64 text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="semester" stroke="#A8A29E" tickLine={false} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} stroke="#A8A29E" tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E7E1D7',
                        borderRadius: '12px',
                        color: '#2C2825',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Line 
                      name="GPA học kỳ" 
                      type="monotone" 
                      dataKey="gpa" 
                      stroke="#2E6930" 
                      strokeWidth={3} 
                      dot={{ stroke: '#FFFFFF', strokeWidth: 2, r: 4, fill: '#2E6930' }}
                      activeDot={{ stroke: '#FFFFFF', strokeWidth: 2, r: 6, fill: '#B85D38' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pie Chart - Thống Kê Điểm Chữ */}
            <div className="bg-white border border-[#E7E1D7] p-5 shadow-xs rounded-2xl">
              <div className="border-b border-[#EFECE6] pb-2 mb-4">
                <h3 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <PieIcon className="w-4 h-4 text-[#B85D38] stroke-[2]" />
                  Phân bố điểm chữ
                </h3>
              </div>

              <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
                {letterGradeChartData.length === 0 ? (
                  <div className="text-[#8C827A] text-xs font-medium italic">Chưa có dữ liệu điểm chữ</div>
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
                                fill={PIE_COLORS[entry.name] || '#A8A29E'} 
                                stroke="#FFFFFF"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E7E1D7',
                              borderRadius: '12px',
                              color: '#2C2825',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                              fontFamily: 'monospace'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legends list */}
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[10px] font-mono shrink-0">
                      {letterGradeChartData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E7E1D7] px-2 py-1 rounded-lg">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[entry.name] }}
                          />
                          <span className="text-[#57534E] font-medium">{entry.name}:</span>
                          <span className="text-[#2C2825] font-bold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Row 2 (Full Width): Bar Chart - Số Tín Chỉ Học Theo Kỳ (Cột J4 & K4) */}
          <div className="bg-white border border-[#E7E1D7] p-5 shadow-xs rounded-2xl">
            <div className="border-b border-[#EFECE6] pb-2 mb-4">
              <h3 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <BarChart3 className="w-4 h-4 text-[#2E6930] stroke-[2]" />
                Số tín chỉ hoàn thành theo kỳ (Cột J4 & K4)
              </h3>
            </div>
            
            <div className="h-64 text-[10px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditsChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <XAxis dataKey="semester" stroke="#A8A29E" tickLine={false} />
                  <YAxis stroke="#A8A29E" tickLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E7E1D7',
                      borderRadius: '12px',
                      color: '#2C2825',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar 
                    name="Tín chỉ" 
                    dataKey="credits" 
                    fill="#2E6930" 
                    barSize={32}
                    radius={[6, 6, 0, 0]}
                  >
                    <LabelList 
                      dataKey="credits" 
                      position="top" 
                      fill="#2E6930" 
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
      <div className="bg-white border border-[#E7E1D7] p-5 shadow-xs rounded-2xl">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3 mb-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-[#2C2825] uppercase tracking-wider">
              Bảng điểm chi tiết
            </h3>
            <p className="text-xs text-[#7A7268]">Chọn học kỳ và nhập điểm số. Hỗ trợ cả dấu chấm hoặc phẩy (ví dụ: 8.5 hoặc 8,5).</p>
          </div>
        </div>

        {safeSubjects.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#8C827A] border border-dashed border-[#E7E1D7] rounded-xl bg-[#FAF8F5]">
            Bảng điểm hiện đang trống. Nhấn "Thêm môn học mới" bên dưới hoặc dán link Google Sheet để đồng bộ.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E7E1D7] rounded-xl bg-white shadow-xs">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-[#FAF8F5] text-[#7A7268] font-mono text-[10px] uppercase border-b border-[#E7E1D7] select-none">
                <tr>
                  <th className="py-2.5 px-3 w-36">Học kỳ</th>
                  <th className="py-2.5 px-3">Tên học phần</th>
                  <th className="py-2.5 px-3 w-20 text-center">Tín chỉ</th>
                  <th className="py-2.5 px-3 w-24 text-center">Trọng số (GK)</th>
                  <th className="py-2.5 px-3 w-20 text-center">Giữa kỳ</th>
                  <th className="py-2.5 px-3 w-20 text-center">Cuối kỳ</th>
                  <th className="py-2.5 px-3 w-20 text-center">Điểm chữ</th>
                  <th className="py-2.5 px-3 w-20 text-center">Thang 4</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6] font-sans">
                {safeSubjects.map((s) => {
                  const semIdx = uniqueSemestersInTable.indexOf(s.semester);
                  const isAltSemester = semIdx % 2 === 1;

                  return (
                    <tr 
                      key={s.id} 
                      className={`transition-colors ${
                        isAltSemester ? 'bg-[#FAF8F5]/60 hover:bg-[#FAF8F5]' : 'bg-transparent hover:bg-[#FAF8F5]/80'
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
                            <option key={sem} value={sem} className="bg-white text-[#2C2825]">{sem}</option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Subject Name field */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={s.name}
                          onChange={e => onUpdateSubject(s.id, { name: e.target.value })}
                          className="bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl px-3 py-1 text-xs text-[#2C2825] w-full focus:outline-none transition-colors"
                          placeholder="Tên học phần..."
                        />
                      </td>
                      
                      {/* Credits field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.credits}
                          onChange={val => onUpdateSubject(s.id, { credits: Math.floor(val) })}
                          className="bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl px-1 py-1 text-xs text-[#2C2825] text-center w-full focus:outline-none font-mono font-bold transition-colors"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Process Weight field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.processWeight}
                          onChange={val => onUpdateSubject(s.id, { processWeight: val })}
                          className="bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl px-1 py-1 text-xs text-[#2C2825] text-center w-full focus:outline-none font-mono font-semibold transition-colors"
                          placeholder="0,0"
                        />
                      </td>
                      
                      {/* Process Score field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.processScore}
                          onChange={val => onUpdateSubject(s.id, { processScore: val })}
                          className="bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl px-1 py-1 text-xs text-[#2C2825] text-center w-full focus:outline-none font-mono transition-colors"
                          placeholder="0,0"
                        />
                      </td>
                      
                      {/* Final Score field */}
                      <td className="py-1.5 px-2 text-center">
                        <GradeInput
                          value={s.finalScore}
                          onChange={val => onUpdateSubject(s.id, { finalScore: val })}
                          className="bg-[#FAF8F5] border border-[#E7E1D7] focus:border-[#2E6930] rounded-xl px-1 py-1 text-xs text-[#2C2825] text-center w-full focus:outline-none font-mono transition-colors"
                          placeholder="0,0"
                        />
                      </td>
                      
                      {/* Read-only Letter Grade */}
                      <td className="py-1.5 px-2 text-center select-none font-bold">
                        {s.letterGrade ? (
                          <span className={`text-[9px] px-2 py-0.5 rounded-md border font-mono ${
                            ['A+', 'A'].includes(s.letterGrade) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            ['B+', 'B'].includes(s.letterGrade) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ['C+', 'C'].includes(s.letterGrade) ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            s.letterGrade === 'F' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-stone-50 text-stone-700 border-stone-200'
                          }`}>
                            {s.letterGrade}
                          </span>
                        ) : (
                          <span className="text-[#A8A29E] font-mono">-</span>
                        )}
                      </td>
                      
                      {/* Read-only Scale 4 score */}
                      <td className="py-1.5 px-2 text-center select-none font-mono text-[#57534E] font-bold">
                        {s.gpaScale4 !== undefined && s.gpaScale4 !== null ? Number(s.gpaScale4).toFixed(1) : '-'}
                      </td>
                      
                      {/* Delete action button */}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          onClick={() => onDeleteSubject(s.id)}
                          className="p-1 text-[#8C827A] hover:text-rose-600 rounded transition-colors cursor-pointer"
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
            className="bg-[#2E6930] hover:bg-[#255527] text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Thêm học phần mới
          </button>
        </div>
      </div>

    </div>
  );
}
