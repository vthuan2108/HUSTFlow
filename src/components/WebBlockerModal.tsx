/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Web Blocker Management Modal
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  RotateCcw,
  Globe,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface WebBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBlocking: boolean;
  onToggleBlocking: (enabled: boolean, domains: string[]) => void;
}

const DEFAULT_BLOCKLIST = [
  'facebook.com',
  'youtube.com',
  'tiktok.com',
  'instagram.com',
  'x.com',
  'reddit.com',
  'netflix.com',
  'bilibili.com'
];

export default function WebBlockerModal({
  isOpen,
  onClose,
  isBlocking,
  onToggleBlocking
}: WebBlockerModalProps) {
  const [domains, setDomains] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tlk_web_blocker_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BLOCKLIST;
  });

  const [newDomain, setNewDomain] = useState('');
  const [hasExtension, setHasExtension] = useState(false);

  useEffect(() => {
    // Check if extension is installed and active
    const checkExt = () => {
      const detected = 
        document.documentElement.dataset.tlkExtensionInstalled === 'true' ||
        document.documentElement.getAttribute('data-hustflow-extension') === 'installed' ||
        !!(window as any).HUSTFLOW_STUDOCU_EXTENSION_INSTALLED;
      setHasExtension(detected);
    };

    checkExt();
    const timer = setTimeout(checkExt, 1000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = () => {
    const nextState = !isBlocking;
    onToggleBlocking(nextState, domains);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = newDomain.trim().toLowerCase();
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    if (!cleaned) return;

    if (!domains.includes(cleaned)) {
      const updated = [...domains, cleaned];
      setDomains(updated);
      localStorage.setItem('tlk_web_blocker_list', JSON.stringify(updated));
      if (isBlocking) {
        onToggleBlocking(true, updated);
      }
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const updated = domains.filter(d => d !== domainToRemove);
    setDomains(updated);
    localStorage.setItem('tlk_web_blocker_list', JSON.stringify(updated));
    if (isBlocking) {
      onToggleBlocking(true, updated);
    }
  };

  const handleResetDefault = () => {
    if (confirm('Khôi phục danh sách trang chặn mặc định?')) {
      setDomains(DEFAULT_BLOCKLIST);
      localStorage.setItem('tlk_web_blocker_list', JSON.stringify(DEFAULT_BLOCKLIST));
      if (isBlocking) {
        onToggleBlocking(true, DEFAULT_BLOCKLIST);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] border border-[#E7E1D7] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E7E1D7] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isBlocking ? 'bg-[#EBF3EB] text-[#2E6930]' : 'bg-stone-100 text-stone-500'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2825] flex items-center gap-2">
                Chế độ Focus (Web Blocker)
                {isBlocking && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3EB] text-[#2E6930] border border-[#C3DCC4]">
                    ĐANG BẬT
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#797268]">
                Ngăn chặn trang web gây xao nhãng để tập trung học tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[#2C2825]">
          {/* Extension Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            hasExtension 
              ? 'bg-[#EBF3EB] border-[#C3DCC4] text-[#2E6930]' 
              : 'bg-[#FCF5EB] border-[#F2DFC7] text-[#9E652A]'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasExtension ? 'bg-[#2E6930] animate-pulse' : 'bg-[#D97706]'}`} />
              <span className="font-medium">
                {hasExtension 
                  ? 'Extension HUSTFlow đã sẵn sàng' 
                  : 'Chưa phát hiện Extension (Cần bật Extension để chặn web)'}
              </span>
            </div>
            {!hasExtension && (
              <a
                href="https://drive.google.com/drive/folders/1WBc5Pu_-CT2JUFIFMmfkbK7YvN13bkmA?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] underline font-semibold text-[#B85D38] hover:text-[#9A4C2B] cursor-pointer"
              >
                Tải Extension
              </a>
            )}
          </div>

          {/* Toggle Switch Card */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E1D7] flex items-center justify-between shadow-xs">
            <div>
              <div className="text-sm font-semibold text-[#2C2825]">
                {isBlocking ? 'Chế độ chặn đang hoạt động' : 'Chế độ chặn đang tắt'}
              </div>
              <div className="text-xs text-[#797268]">
                {isBlocking 
                  ? `Đang bảo vệ bạn khỏi ${domains.length} trang web trong danh sách.`
                  : 'Bật công tắc để chặn truy cập vào các trang xao nhãng.'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                isBlocking ? 'bg-[#2E6930]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isBlocking ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Add Domain Input */}
          <form onSubmit={handleAddDomain} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                placeholder="Ví dụ: shopee.vn, twitch.tv..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E7E1D7] rounded-xl text-xs focus:outline-none focus:border-[#2E6930] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!newDomain.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#2E6930] hover:bg-[#255427] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </form>

          {/* Domain List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#797268] px-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Danh sách trang web bị chặn ({domains.length})
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="hover:text-[#2C2825] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            </div>

            <div className="bg-white border border-[#E7E1D7] rounded-xl divide-y divide-[#F0ECE4] max-h-56 overflow-y-auto">
              {domains.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400">
                  Chưa có trang web nào trong danh sách chặn.
                </div>
              ) : (
                domains.map(d => (
                  <div key={d} className="px-3.5 py-2.5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#B85D38]" />
                      <span className="text-xs font-mono font-medium text-[#2C2825]">{d}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(d)}
                      className="p-1 text-stone-300 hover:text-rose-500 rounded transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                      title="Xóa khỏi danh sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7E1D7] bg-[#F7F4EE] flex items-center justify-between text-xs">
          <span className="text-[#9C948A]">
            Tự động đồng bộ với Chrome Extension
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-[#E7E1D7] rounded-xl font-semibold text-[#2C2825] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
