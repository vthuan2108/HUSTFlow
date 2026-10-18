/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Studocu Downloader Guide Modal
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Puzzle, 
  Sparkles,
  Download
} from 'lucide-react';

interface StudocuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudocuModal({
  isOpen,
  onClose
}: StudocuModalProps) {
  const [hasExtension, setHasExtension] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const checkExt = () => {
      const detected = 
        document.documentElement.dataset.tlkExtensionInstalled === 'true' ||
        document.documentElement.getAttribute('data-hustflow-extension') === 'installed' ||
        !!(window as any).HUSTFLOW_STUDOCU_EXTENSION_INSTALLED;
      setHasExtension(detected);
    };

    checkExt();
    const timer = setTimeout(checkExt, 600);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] border border-[#E7E1D7] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E7E1D7] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FCF0EB] text-[#B85D38] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2825] flex items-center gap-2">
                Studocu Downloader
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3EB] text-[#2E6930] border border-[#C3DCC4]">
                  HD Unblur
                </span>
              </h2>
              <p className="text-xs text-[#797268]">
                Hướng dẫn tải tài liệu Studocu không giới hạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-[#2C2825]">
          {/* Note Step 1 */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E1D7] space-y-3 transition-all shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#2C2825]">
                <div className="w-6 h-6 rounded-lg bg-[#B85D38]/10 text-[#B85D38] flex items-center justify-center text-xs font-bold">
                  B1
                </div>
                <span>Tải & nạp extension tích hợp</span>
              </div>
              {hasExtension ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#2E6930] bg-[#EBF3EB] px-2 py-0.5 rounded-full border border-[#C3DCC4]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã cài đặt
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8C6B2D] bg-[#FDF8EB] px-2 py-0.5 rounded-full border border-[#EFE2BF]">
                  <Puzzle className="w-3.5 h-3.5" />
                  Chưa nạp extension
                </span>
              )}
            </div>

            <p className="text-xs text-[#5C554B] leading-relaxed">
              Tải tiện ích HUSTFlow Extension cho trình duyệt (Chrome, Brave, Edge hoặc Cốc Cốc) để tự động unblur và tải tài liệu Studocu:
            </p>

            {/* Direct Google Drive Download Button */}
            <div>
              <a
                href="https://drive.google.com/drive/folders/1WBc5Pu_-CT2JUFIFMmfkbK7YvN13bkmA?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2E6930] hover:bg-[#255527] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Extension từ Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#E7E1D7] text-[11px] text-[#797268] space-y-1">
              <p>• <strong>Bước 1:</strong> Bấm nút trên để tải thư mục extension về máy (giải nén nếu tải dạng file .zip).</p>
              <p>• <strong>Bước 2:</strong> Mở trình duyệt, truy cập <code className="px-1.5 py-0.5 bg-white rounded border border-[#E7E1D7] text-[#2C2825] font-mono">chrome://extensions</code></p>
              <p>• <strong>Bước 3:</strong> Bật công tắc <strong>Developer mode</strong> (Chế độ cho nhà phát triển) ở góc phải trên.</p>
              <p>• <strong>Bước 4:</strong> Bấm <strong>Load unpacked</strong> (Tải tiện ích đã giải nén) và chọn thư mục extension vừa tải.</p>
            </div>
          </div>

          {/* Note Step 2 */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E1D7] space-y-2.5 transition-all shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2C2825]">
              <div className="w-6 h-6 rounded-lg bg-[#2E6930]/10 text-[#2E6930] flex items-center justify-center text-xs font-bold">
                B2
              </div>
              <span>Đi đến studocu và trực tiếp ấn nút tải tài liệu</span>
            </div>

            <p className="text-xs text-[#5C554B] leading-relaxed">
              Sau khi đã nạp extension, bạn chỉ cần mở bất kỳ tài liệu nào trên Studocu. Tiện ích sẽ tự động gỡ mờ (unblur) và gắn sẵn nút <strong>Tải tài liệu (Download PDF HD)</strong> trực tiếp ngay trên trang Studocu!
            </p>

            <a
              href="https://www.studocu.com/vn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#B85D38] hover:bg-[#A04F2F] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đi đến Studocu ngay</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7E1D7] bg-[#F7F4EE] flex items-center justify-between text-xs">
          <span className="text-[#9C948A]">
            Tự động gỡ mờ và trích xuất PDF gốc
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-[#E7E1D7] rounded-xl font-semibold text-[#2C2825] transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
