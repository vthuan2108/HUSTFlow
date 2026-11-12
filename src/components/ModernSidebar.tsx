/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Calendar,
  BarChart2,
  Flame,
  GraduationCap,
  BookOpen,
  Scroll,
  Cloud,
  LogIn,
  LogOut,
  Bot,
  ChevronLeft,
  ChevronRight,
  Database,
  Sparkles,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import BongoCatWidget from './BongoCatWidget';

interface ModernSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isCloudSyncing: boolean;
  onOpenAI: () => void;
  isAIOpen: boolean;
  todoCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export default function ModernSidebar({
  activeTab,
  onTabChange,
  currentUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isCloudSyncing,
  onOpenAI,
  isAIOpen,
  todoCount,
  isMobileOpen = false,
  onCloseMobile
}: ModernSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const navItems: NavItem[] = [
    {
      id: 'TODOS',
      label: 'Kế hoạch tuần',
      sublabel: 'Lưới tuần & việc cần làm',
      icon: ListTodo,
      badge: todoCount && todoCount > 0 ? todoCount : undefined
    },
    {
      id: 'ANALYTICS',
      label: 'Thống kê',
      sublabel: 'Hiệu suất & phân tích tuần',
      icon: BarChart2
    },
    {
      id: 'SCHEDULE',
      label: 'Lịch biểu',
      sublabel: 'Thời khóa biểu & sự kiện',
      icon: Calendar
    },
    {
      id: 'HABITS',
      label: 'Thói quen',
      sublabel: 'Rèn luyện & chuỗi ngày',
      icon: Flame
    },
    {
      id: 'GRADES',
      label: 'Điểm số HUST',
      sublabel: 'GPA, CPA & tín chỉ',
      icon: GraduationCap
    },
    {
      id: 'IELTS_ARENA',
      label: 'IELTS Tracker',
      sublabel: 'Luyện đề Cam & band score',
      icon: BookOpen
    },
    {
      id: 'CULT_PATH',
      label: 'Lộ trình học',
      sublabel: 'Kỹ năng & tài liệu',
      icon: Scroll
    }
  ];

  const renderBranding = () => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-[#2E6930] text-white flex items-center justify-center font-bold text-sm shadow-sm">
        hf
      </div>
      <div>
        <h1 className="font-serif font-black text-lg text-[#2C2825] tracking-tight leading-none">
          planner<span className="text-[#2E6930]">.</span>
        </h1>
        <p className="text-[10px] text-[#797268] font-medium tracking-wide mt-0.5">
          HUSTFlow Study OS
        </p>
      </div>
    </div>
  );

  const renderNavAndTools = (collapsed: boolean, isMobile: boolean) => (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <div>
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8C8479]">
            DANH MỤC
          </p>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (isMobile) onCloseMobile?.();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#2C2825] shadow-xs border border-[#E7E1D7] font-semibold'
                    : 'text-[#797268] hover:text-[#2C2825] hover:bg-[#EFECE6]'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#EEF5EE] text-[#2E6930]'
                      : 'text-[#797268]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-tight truncate">
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#EEF5EE] text-[#2E6930] border border-[#D2E5D2]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8C8479] truncate mt-0.5 font-normal">
                      {item.sublabel}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Quick Launcher */}
      <div className="pt-2 border-t border-[#E7E1D7]">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8C8479]">
            CÔNG CỤ
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            onOpenAI();
            if (isMobile) onCloseMobile?.();
          }}
          title={collapsed ? 'Trợ lý AI' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-[0.98] ${
            isAIOpen
              ? 'bg-white text-[#2C2825] shadow-xs border border-[#2E6930]/40 font-semibold ring-1 ring-[#2E6930]/20'
              : 'text-[#797268] hover:text-[#2C2825] hover:bg-[#EFECE6]'
          }`}
        >
          <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
            isAIOpen ? 'bg-[#EEF5EE] text-[#2E6930]' : 'bg-[#FCF0EB] text-[#B85D38]'
          }`}>
            <Bot className="w-4 h-4" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold leading-tight">Trợ lý AI</span>
                <span className={`text-[9px] px-1 rounded font-bold border transition-colors ${
                  isAIOpen 
                    ? 'bg-[#EEF5EE] text-[#2E6930] border-[#D2E5D2]' 
                    : 'bg-[#FCF0EB] text-[#B85D38] border-[#F2D3C7]'
                }`}>
                  {isAIOpen ? 'ĐANG MỞ' : 'PRO'}
                </span>
              </div>
              <p className="text-[10px] text-[#8C8479] truncate mt-0.5 font-normal">
                Cố vấn học tập & kế hoạch
              </p>
            </div>
          )}
        </button>

        {/* Bongo Cat Pet Companion */}
        <BongoCatWidget isCollapsed={collapsed} />
      </div>
    </div>
  );

  const renderFooter = (collapsed: boolean) => (
    <div className="p-3 border-t border-[#E7E1D7] bg-[#FAF8F3]">
      {currentUser ? (
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-[#E7E1D7] shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Avatar'}
                className="w-7 h-7 rounded-full border border-[#E7E1D7] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#2E6930] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#2C2825] truncate leading-tight">
                  {currentUser.displayName || 'User'}
                </p>
                <p className="text-[9px] text-[#797268] font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E6930]" />
                  {isCloudSyncing ? 'Đang sync...' : 'Đã kết nối'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onGoogleSignOut}
            className="text-[#8C8479] hover:text-[#B85D38] p-1 rounded-lg hover:bg-[#F7F4EE] transition-colors cursor-pointer shrink-0"
            title="Đăng xuất tài khoản Google"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={onGoogleSignIn}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-[#FAF8F3] border border-[#E7E1D7] text-[#2C2825] font-bold text-xs transition-all shadow-xs cursor-pointer ${
            collapsed ? 'p-2' : ''
          }`}
          title="Đăng nhập Google Tasks"
        >
          <LogIn className="w-4 h-4 text-[#2E6930]" />
          {!collapsed && <span>Đăng nhập Google</span>}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (>= md) */}
      <aside
        className={`hidden md:flex h-screen sticky top-0 bg-[#F7F4EE] border-r border-[#E7E1D7] flex-col justify-between transition-all duration-300 z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64 sm:w-72'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-3.5 border-b border-[#E7E1D7] flex items-center justify-between">
          {!isCollapsed && renderBranding()}

          {isCollapsed && (
            <div className="mx-auto w-8 h-8 rounded-xl bg-[#2E6930] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              hf
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#797268] hover:text-[#2C2825] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu & Tools */}
        {renderNavAndTools(isCollapsed, false)}

        {/* Bottom Profile & Google Sync Footer */}
        {renderFooter(isCollapsed)}
      </aside>

      {/* Mobile Slide-Over Drawer (< md) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#2C2825]/40 backdrop-blur-[2px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            className="relative w-72 max-w-[85vw] h-dvh bg-[#F7F4EE] border-r border-[#E7E1D7] flex flex-col justify-between z-10 shadow-2xl select-none pt-safe pb-safe"
            aria-label="Menu điều hướng"
          >
            {/* Top Header / Branding + Close */}
            <div className="p-3.5 border-b border-[#E7E1D7] flex items-center justify-between">
              {renderBranding()}
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-[#797268] hover:text-[#2C2825] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Menu & Tools */}
            {renderNavAndTools(false, true)}

            {/* Bottom Profile & Google Sync Footer */}
            {renderFooter(false)}
          </aside>
        </div>
      )}
    </>
  );
}
