/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  Zap, 
  Bot,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  BarChart3,
  Calendar as CalendarIcon,
  CheckSquare,
  Music,
  BookOpen,
  Keyboard,
  ShieldAlert,
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideSectionId = 
  | 'AI_PLANNER'
  | 'TODO'
  | 'CULTIVATION'
  | 'POMODORO'
  | 'CALENDAR'
  | 'GRADES'
  | 'LOFI_PLAYER'
  | 'IELTS'
  | 'NOTES_SHORTCUTS';

interface GuideSectionConfig {
  id: GuideSectionId;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

const GUIDE_SECTIONS: GuideSectionConfig[] = [
  {
    id: 'AI_PLANNER',
    icon: '🔮',
    title: 'Thiên Cơ Các (Chatbot AI Smart)',
    desc: 'Phân tích tiến độ Công Pháp, lên lịch bế quan & quản lý tác vụ',
    badge: 'AI Smart'
  },
  {
    id: 'TODO',
    icon: '⚔️',
    title: 'Nhiệm Vụ (Todo List) & Ma Trận Eisenhower',
    desc: 'Phân loại công việc Theo Ngày / Tuần / Tháng & tích điểm',
    badge: 'Cốt lõi'
  },
  {
    id: 'CULTIVATION',
    icon: '🧘',
    title: 'Hệ Thống Cảnh Giới Tu Vi & Côn Lôn Huyễn Cảnh',
    desc: 'Chi tiết 15 Cảnh giới tu tiên, Đột phá & Tàng Bảo Các',
    badge: 'Gamify'
  },
  {
    id: 'POMODORO',
    icon: '⏳',
    title: 'Pomodoro & Soundscape Tập Trung',
    desc: 'Đồng hồ đếm ngược tu luyện & âm thanh tập trung',
  },
  {
    id: 'CALENDAR',
    icon: '📅',
    title: 'Lịch Trình & Thời Khóa Biểu',
    desc: 'Lịch tự động, kéo thả & nhóm màu sắc',
  },
  {
    id: 'GRADES',
    icon: '📊',
    title: 'Bảng Điểm & Google Sheet Sync',
    desc: 'Tính CPA/GPA & đồng bộ 2 chiều với Google Drive',
  },
  {
    id: 'LOFI_PLAYER',
    icon: '🔴',
    title: 'Mini Lofi Player Nổi',
    desc: 'Trình phát nhạc Lofi YouTube kéo thả góc dưới',
  },
  {
    id: 'IELTS',
    icon: '🇬🇧',
    title: 'Sổ Tay Luyện Thi IELTS',
    desc: 'Nhật ký luyện đề Reading/Listening & biểu đồ tiến độ',
  },
  {
    id: 'NOTES_SHORTCUTS',
    icon: '📝',
    title: 'Ghi Chú & Bàn Phím Tắt',
    desc: 'Tàng Kinh Các ghi chú & phím tắt tiện lợi',
  }
];

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeSection, setActiveSection] = useState<GuideSectionId>('AI_PLANNER');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0a0d14] border-2 border-slate-950 rounded-2xl w-full max-w-5xl h-[88vh] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col relative"
        >
          {/* Top Modal Header */}
          <div className="bg-[#0f141c] border-b-2 border-slate-950 px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black shadow-[2px_2px_0px_#000]">
                <HelpCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2">
                  📜 HƯỚNG DẪN SỬ DỤNG HUSTFLOW
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-bold font-mono">
                    User Guide
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  Cẩm nang hướng dẫn chi tiết toàn bộ các tính năng ứng dụng HUSTFlow
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-800"
              title="Đóng hướng dẫn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Main Body (2 Columns Layout) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Navigation Sidebar */}
            <div className="w-full md:w-80 border-b-2 md:border-b-0 md:border-r-2 border-slate-950 bg-[#0c1018] p-3 space-y-1.5 overflow-y-auto shrink-0">
              <span className="px-2 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Danh Mục Chức Năng:
              </span>
              {GUIDE_SECTIONS.map((sec) => {
                const isSelected = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-[#161c2a] border-amber-400 text-slate-100 shadow-[3px_3px_0px_#000]'
                        : 'bg-[#0f141c]/60 border-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-900'
                    }`}
                  >
                    <span className="text-xl shrink-0">{sec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-black text-[11px] truncate font-mono ${isSelected ? 'text-amber-400' : ''}`}>
                          {sec.title}
                        </span>
                        {sec.badge && (
                          <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono shrink-0">
                            {sec.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] opacity-75 truncate font-sans text-slate-400 mt-0.5">
                        {sec.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Detailed Guide Content Area */}
            <div className="flex-1 bg-[#07090f] p-5 sm:p-7 overflow-y-auto font-sans leading-relaxed text-slate-300 text-xs sm:text-sm space-y-6">
              
              {/* ================= SECTION 1: CHATBOT AI ================= */}
              {activeSection === 'AI_PLANNER' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🔮</span>
                    <div>
                      <h3 className="text-base font-extrabold text-purple-400 font-mono uppercase tracking-wide">
                        Thiên Cơ Các (Cán Bộ Quản Lý & Chatbot AI Smart)
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Hệ thống AI tự động phân tích 100% dữ liệu toàn web để hỗ trợ quản lý mọi tác vụ
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-100 text-xs uppercase font-mono text-amber-400 flex items-center gap-2">
                      ⚡ BỘ TÍNH NĂNG CHÍNH CỦA CHATBOT AI (DANH SÁCH DỌC):
                    </h4>

                    {/* Single Column Vertical List */}
                    <div className="space-y-3 font-sans">
                      {/* Feature 1 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-emerald-300 font-mono text-xs flex items-center gap-2">
                          <span>📌 1. Tạo / Sửa / Xóa Nhiệm Vụ (Task Management)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          AI có khả năng tự động tạo nhiệm vụ mới, sửa đổi mức độ ưu tiên/hạn chót của công việc đã có, hoặc xóa bỏ các nhiệm vụ trễ hạn trùng lặp khi được yêu cầu.
                        </p>
                      </div>

                      {/* Feature 2 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-sky-300 font-mono text-xs flex items-center gap-2">
                          <span>📅 2. Lập & Điều Chỉnh Thời Khóa Biểu (Calendar & Timetable)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          AI đọc toàn bộ lịch 30 ngày tới, tự động tìm khoảng thời gian rảnh, chèn khoảng nghỉ buffer 15–30 phút giữa các tiết học Bách Khoa và lên thời khóa biểu tối ưu.
                        </p>
                      </div>

                      {/* Feature 3 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-purple-300 font-mono text-xs flex items-center gap-2">
                          <span>🧘 3. Phân Tích Tiến Độ Công Pháp & Lên Kế Hoạch Bế Quan</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          AI tự động theo dõi các bộ Công Pháp môn học (Giải Tích, Đại Số, Triết Học...), phân tích các Tầng tu luyện chưa hoàn thành và lập kế hoạch số phiên bế quan thiền định Pomodoro cần thiết để vượt qua các kỳ thi giữa kỳ / cuối kỳ.
                        </p>
                      </div>

                      {/* Feature 4 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-amber-300 font-mono text-xs flex items-center gap-2">
                          <span>📊 4. Phân Tích Bảng Điểm CPA/GPA (Grade Analytics)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          Phân tích xu hướng điểm số từ Google Sheet, đưa ra cảnh báo các môn học nguy cơ và tư vấn mục tiêu GPA cần đạt để cải thiện bằng CPA.
                        </p>
                      </div>

                      {/* Feature 5 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-rose-300 font-mono text-xs flex items-center gap-2">
                          <span>🔮 5. Dò Tìm Thiên Cơ (Auto Daily Plan)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          Tự động tổng hợp danh sách công việc trễ hạn + thời khóa biểu ngày mai để tạo bản kế hoạch thiền định & học tập hoàn chỉnh nhất cho ngày mới.
                        </p>
                      </div>

                      {/* Feature 6 */}
                      <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-1.5 shadow-[2px_2px_0px_#000]">
                        <div className="font-bold text-teal-300 font-mono text-xs flex items-center gap-2">
                          <span>⚡ 6. Điều Hướng Lệnh Fast Targeting (/task, /calendar)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-5">
                          Sử dụng cú pháp <code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/task [nội dung]</code> để AI chỉ làm việc với Nhiệm Vụ, hoặc <code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/calendar [nội dung]</code> để tập trung vào Thời Khóa Biểu.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 2: TODO LIST ================= */}
              {activeSection === 'TODO' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">⚔️</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Nhiệm Vụ (Todo List) & Ma Trận Eisenhower
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Quản lý toàn bộ công việc học tập, phân loại theo chu kỳ Ngày / Tuần / Tháng & đồng bộ Cloud
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* 3 Categories / Types */}
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-amber-300">
                        🗓️ 3 Loại Nhiệm Vụ Theo Chu Kỳ:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
                        <div className="bg-[#141a27] p-3 rounded-lg border border-sky-500/30">
                          <span className="text-sky-300 font-bold block mb-1">📅 Nhiệm Vụ Theo Ngày (DAY)</span>
                          <span className="text-[10px] text-slate-300">Các công việc cần hoàn thành trong ngày hiện tại.</span>
                        </div>
                        <div className="bg-[#141a27] p-3 rounded-lg border border-amber-500/30">
                          <span className="text-amber-300 font-bold block mb-1">📆 Nhiệm Vụ Theo Tuần (WEEK)</span>
                          <span className="text-[10px] text-slate-300">Các mục tiêu cần hoàn tất trong tuần học.</span>
                        </div>
                        <div className="bg-[#141a27] p-3 rounded-lg border border-purple-500/30">
                          <span className="text-purple-300 font-bold block mb-1">🗓️ Nhiệm Vụ Theo Tháng (MONTH)</span>
                          <span className="text-[10px] text-slate-300">Dự án lớn & mốc thi cử quan trọng trong tháng.</span>
                        </div>
                      </div>
                    </div>

                    {/* Priority Levels */}
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-sky-400">
                        🎯 Các Cấp Độ Ưu Tiên Tu Luyện & Thưởng Tu Vi / Linh Thạch:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-amber-500/30">
                          <span className="text-amber-400 font-bold">🟡 THIÊN CẤP / ĐẠI NGUYỆN</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Khẩn cấp & quan trọng nhất. Thưởng <strong>+50 Tu Vi & +50 Linh Thạch</strong>.</div>
                        </div>
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-orange-500/30">
                          <span className="text-orange-400 font-bold">🟠 ĐỊA CẤP / TRỌNG YẾU</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Quan trọng. Thưởng <strong>+35 Tu Vi & +35 Linh Thạch</strong>.</div>
                        </div>
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-sky-500/30">
                          <span className="text-sky-400 font-bold">🔷 TRUNG CẤP / THƯỜNG NHẬT</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Công việc thường ngày. Thưởng <strong>+25 Tu Vi & +25 Linh Thạch</strong>.</div>
                        </div>
                        <div className="bg-[#141a27] p-2.5 rounded-lg border border-emerald-500/30">
                          <span className="text-emerald-400 font-bold">🌱 SƠ CẤP</span>
                          <div className="text-[10px] text-slate-300 mt-0.5">Việc nhỏ tùy nghi. Thưởng <strong>+15 Tu Vi & +15 Linh Thạch</strong>.</div>
                        </div>
                      </div>
                    </div>

                    {/* Anti-procrastination Tam Ma */}
                    <div className="bg-purple-950/20 border border-purple-500/40 p-4 rounded-xl space-y-2">
                      <h4 className="font-bold text-purple-300 text-xs uppercase font-mono flex items-center gap-1.5">
                        💀 Cơ Chế Chống Trì Hoãn (Cảnh Báo Tâm Ma Xâm Nhập):
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Khi có bất kỳ nhiệm vụ nào bị quá hạn chưa hoàn thành, đan điền sẽ bị tà khí xâm nhập làm <strong>giảm -30% hiệu suất tích lũy Tu Vi</strong>. Đạo hữu cần hoàn thành ngay các việc trễ hạn, hoặc dùng <strong>Thanh Tâm Phù</strong> trong Tàng Bảo Các để giải trừ tà khí!
                      </p>
                    </div>

                    {/* Google Tasks Sync */}
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-emerald-400">
                        🔄 Đồng Bộ Google Tasks 2 Chiều:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Tự động đồng bộ các nhiệm vụ với tài khoản Google Tasks của bạn sau khi đăng nhập Google. Mọi thao tác tích chọn hoàn thành hay xóa task sẽ được cập nhật đồng thời lên Đám mây.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 3: CULTIVATION REALMS ================= */}
              {activeSection === 'CULTIVATION' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🧘</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Hệ Thống 15 Cảnh Giới Tu Vi & Côn Lôn Huyễn Cảnh
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Biến hành trình học tập thành quá trình tu tiên đột phá cảnh giới (Chuẩn tác phẩm Tiên Nghịch)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h4 className="font-extrabold text-slate-100 text-xs uppercase font-mono text-amber-400">
                      🏆 DANH SÁCH 15 CẢNH GIỚI TU VI TỪ THẤP ĐẾN CAO:
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div className="bg-[#0f141c] border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-slate-300 font-bold">1. 🌫️ Ngưng Khí Kỳ</span> (Tầng 1 đến Tầng 15)
                      </div>
                      <div className="bg-[#0f141c] border border-blue-900/50 p-2.5 rounded-xl">
                        <span className="text-blue-400 font-bold">2. 💧 Trúc Cơ Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-emerald-900/50 p-2.5 rounded-xl">
                        <span className="text-emerald-400 font-bold">3. 🟢 Kết Đan Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-purple-900/50 p-2.5 rounded-xl">
                        <span className="text-purple-400 font-bold">4. 🟣 Nguyên Anh Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-amber-900/50 p-2.5 rounded-xl">
                        <span className="text-amber-400 font-bold">5. 🟡 Hóa Thần Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-orange-900/50 p-2.5 rounded-xl">
                        <span className="text-orange-400 font-bold">6. 🟠 Anh Biến Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-rose-900/50 p-2.5 rounded-xl">
                        <span className="text-rose-400 font-bold">7. 🔴 Vấn Đỉnh Kỳ</span> (Sơ - Trung - Hậu Kỳ - Viên Mãn)
                      </div>
                      <div className="bg-[#0f141c] border border-pink-900/50 p-2.5 rounded-xl">
                        <span className="text-pink-400 font-bold">8. 🌸 Cảnh Giới Quá Độ</span> (Âm Hư Cảnh, Dương Thực Cảnh)
                      </div>
                      <div className="bg-[#0f141c] border border-cyan-900/50 p-2.5 rounded-xl">
                        <span className="text-cyan-400 font-bold">9. ❄️ Khuy Niết / Tịnh Niết / Toái Niết</span>
                      </div>
                      <div className="bg-[#0f141c] border border-violet-900/50 p-2.5 rounded-xl">
                        <span className="text-violet-400 font-bold">10. ⚡ Thiên Nhân Ngũ Suy</span> (Đệ Nhất ➔ Đệ Ngũ Suy)
                      </div>
                      <div className="bg-[#0f141c] border border-teal-900/50 p-2.5 rounded-xl">
                        <span className="text-teal-300 font-bold">11. 🌌 Không Niết / Không Linh / Không Huyền</span>
                      </div>
                      <div className="bg-[#0f141c] border border-red-900/50 p-2.5 rounded-xl">
                        <span className="text-red-400 font-bold">12. 🔥 Huyền Kiếp Cảnh</span> (9 Kiếp Ngoại/Nội/Hồn Kiếp)
                      </div>
                      <div className="bg-[#0f141c] border border-amber-600/50 p-2.5 rounded-xl">
                        <span className="text-amber-300 font-bold">13. 👑 Không Kiếp Cảnh</span> (Đại Tôn - Thiên Tôn Chí Tôn)
                      </div>
                      <div className="bg-[#0f141c] border border-emerald-500/50 p-2.5 rounded-xl">
                        <span className="text-emerald-300 font-bold">14. 🏆 Bán Bộ Đạp Thiên</span> (9 Cầu Dung Nhập Quy Tắc)
                      </div>
                      <div className="bg-[#0f141c] border border-amber-400 p-2.5 rounded-xl col-span-1 sm:col-span-2 text-center">
                        <span className="text-amber-200 font-black">15. 🌟 ĐẠP THIÊN CẢNH (Siêu Thoát Vạn Giới - Đạo Tổ Vương Lâm)</span>
                      </div>
                    </div>

                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-emerald-400">
                        ⚡ Thần Dược Đột Phá Bình Cảnh (Tàng Bảo Các Shop):
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Tại các mốc bình cảnh quan trọng (Trúc Cơ, Kết Đan, Nguyên Anh, Huyền Kiếp...), Đạo hữu bắt buộc phải tích lũy đủ Linh Thạch để mua thần dược tương ứng trong Tàng Bảo Các (Trúc Cơ Đan, Kết Đan Hoàn, Nguyên Anh Đan, Độ Kiếp Phù) để đảm bảo 100% đột phá thành công!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 4: POMODORO ================= */}
              {activeSection === 'POMODORO' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">⏳</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Đồng Hồ Pomodoro & Soundscape Tập Trung
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Thiền định tập trung 25 phút tu luyện + 5 phút nghỉ ngơi
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase font-mono text-amber-300">
                        ⚡ Quy Trình Tu Luyện Pomodoro:
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-300">
                        <li><strong>Chế độ Tu Luyện (Focus)</strong>: Mặc định 25 phút. Nhấn <strong>Bắt đầu</strong> để kích hoạt.</li>
                        <li><strong>Chế độ Nghỉ Ngơi (Break)</strong>: Mặc định 5 phút nghỉ xả hơi sau mỗi phiên.</li>
                        <li><strong>Nhận Tu Vi & Linh Thạch</strong>: Mỗi phút thiền định đem lại <strong>+1 Tu Vi</strong> & <strong>+1 Linh Thạch</strong>.</li>
                      </ul>
                    </div>

                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase font-mono text-emerald-300">
                        🎵 Âm Thanh Nhập Định (Soundscape):
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-300">
                        <li>Hỗ trợ tiếng <strong>Mưa Rào 🌧️</strong>, <strong>Sóng Biển 🌊</strong>, <strong>Tiếng Rừng 🌲</strong>, <strong>Tiếng Ồn Trắng ⚪</strong>.</li>
                        <li>Tùy chọn <strong>🔴 Nhạc Lofi YouTube</strong> phát tự động hòa tấu âm thanh khi đồng hồ chạy.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 5: CALENDAR ================= */}
              {activeSection === 'CALENDAR' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">📅</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Lịch Trình Tự Động & Thời Khóa Biểu
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Quản lý toàn bộ lịch học, thi cử và nhiệm vụ theo dạng Tháng / Tuần / Ngày
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-sky-300">
                        🗓️ 3 Chế Độ Xem Lịch Trực Quan:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Chuyển đổi giữa chế độ <strong>Xem Theo Tháng (Month)</strong>, <strong>Xem Theo Tuần (Week)</strong>, và <strong>Xem Dạng Danh Sách (Agenda)</strong> ở thanh công cụ góc trên bên phải.
                      </p>
                    </div>

                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-purple-300">
                        📁 Nhóm Màu Lịch (Calendar Groups):
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Phân loại lịch theo màu sắc: <strong>Lịch Học Bách Khoa (Xanh Dương)</strong>, <strong>Thi Cử (Đỏ)</strong>, <strong>Luyện Thi IELTS (Vàng)</strong>...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 6: GRADES ================= */}
              {activeSection === 'GRADES' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">📊</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Bảng Điểm Số & Đồng Bộ Google Sheet 2 Chiều
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Theo dõi CPA, GPA từng học kỳ & tự động đồng bộ trực tiếp với Google Drive
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-emerald-400">
                        🔄 Đồng Bộ 2 Chiều Trực Tiếp Với Google Sheet:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                        <li>Dán liên kết trang tính (Spreadsheet Link) vào ô Cấu Hình và bấm <strong>Lưu & Kết Nối</strong>.</li>
                        <li>Bấm <strong>Đồng Bộ 2 Chiều</strong>: Mọi thay đổi điểm số trên web sẽ được lưu lên Google Sheet, và ngược lại!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 7: LOFI PLAYER ================= */}
              {activeSection === 'LOFI_PLAYER' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🔴</span>
                    <div>
                      <h3 className="text-base font-extrabold text-rose-400 font-mono uppercase tracking-wide">
                        Trình Phát Nhạc Mini Lofi Player YouTube Nổi
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Khung phát nhạc YouTube kéo thả tự do đặt ở góc dưới màn hình
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-rose-400">
                        🔴 Nút Lối Tắt Nổi `🔴 LOFI STREAM`:
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Nhấn nút lối tắt <strong>`🔴 LOFI STREAM`</strong> ở góc dưới bên trái để mở Player Lofi ngay lập tức.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION 8: IELTS ================= */}
              {activeSection === 'IELTS' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">🇬🇧</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Sổ Tay Luyện Thi IELTS Test Log
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Theo dõi Band Score Reading/Listening & biểu đồ tiến độ chuẩn bị du học / tốt nghiệp
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                    <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-amber-300">
                      📖 Quy Đổi Band Score Tự Động:
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Nhập số câu đúng (ví dụ: 35/40 câu Reading), hệ thống sẽ tự động quy đổi thành điểm Band chuẩn (Band 8.0) và lưu vào biểu đồ tiến độ.
                    </p>
                  </div>
                </div>
              )}

              {/* ================= SECTION 9: NOTES & SHORTCUTS ================= */}
              {activeSection === 'NOTES_SHORTCUTS' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
                    <span className="text-4xl">📝</span>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-400 font-mono uppercase tracking-wide">
                        Ghi Chú Tu Luyện & Phím Tắt Hệ Thống
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Lưu trữ kiến thức môn học & thao tác nhanh không cần chuột
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="bg-[#0f141c] border-2 border-slate-950 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#000]">
                      <h4 className="font-bold text-slate-100 text-xs uppercase font-mono text-amber-400">
                        ⌨️ Bàn Phím Tắt Tiện Lợi:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className="text-slate-300">Bắt đầu / Tạm dừng Pomodoro:</span>
                          <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Spacebar</span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between">
                          <span className="text-slate-300">Đóng các Pop-up Modal:</span>
                          <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Esc</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
