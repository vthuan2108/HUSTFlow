/**
 * TangKinhCacSection.tsx
 * Ultra-minimal Studocu Downloader Section for HUSTFlow
 */

import React, { useState, useEffect } from 'react';
import { StudocuDocument } from '../types';
import {
  decodeStudocuDocument,
  parseStudocuHtmlContent,
  printDocumentAsPdf,
  parsePageRange
} from '../services/StudocuDecoderService';
import {
  BookOpen,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TangKinhCacSectionProps {
  onGainTuVi?: (exp: number, stones: number) => void;
}

export default function TangKinhCacSection({ onGainTuVi }: TangKinhCacSectionProps) {
  // Input State
  const [inputUrl, setInputUrl] = useState('');
  
  // Decoding State
  const [isDecoding, setIsDecoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeDecodedDoc, setActiveDecodedDoc] = useState<StudocuDocument | null>(null);
  
  // Viewer & Print State
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageRangeInput, setPageRangeInput] = useState('all');
  const [isExtensionDetected, setIsExtensionDetected] = useState(false);

  // Check URL params for ?doc= or ?raw= from Bookmarklet/Auto-sync redirect
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const docParam = urlParams.get('doc');
      const rawParam = urlParams.get('raw');

      if (docParam) {
        const jsonStr = decodeURIComponent(escape(atob(docParam)));
        const data = JSON.parse(jsonStr);
        const pageCount = data.pageCount || 0;
        const objectKey = data.objectKey;
        const pngParams = data.pngParams;
        const title = data.title || 'Cổ Kinh Studocu (Đã Giải Mã)';

        const pageImages: string[] = [];
        for (let i = 1; i <= pageCount; i++) {
          const hex = i.toString(16);
          pageImages.push(`https://doc-assets.studocu.com/${objectKey}/html/bg${hex}.png${pngParams}`);
        }

        const newDoc: StudocuDocument = {
          id: `doc_${Date.now()}`,
          url: 'https://www.studocu.com',
          title,
          pageCount,
          pageImages,
          subjectTag: 'Tài Liệu',
          savedAt: new Date().toLocaleDateString('vi-VN')
        };

        setActiveDecodedDoc(newDoc);
        if (onGainTuVi) onGainTuVi(50, 20);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (rawParam) {
        const decodedString = decodeURIComponent(escape(atob(rawParam)));
        const result = parseStudocuHtmlContent(decodedString);
        if (result.success) {
          const newDoc: StudocuDocument = {
            id: `doc_${Date.now()}`,
            url: 'https://www.studocu.com',
            title: result.title,
            pageCount: result.pageCount,
            pageImages: result.pageImages,
            subjectTag: 'Tài Liệu',
            savedAt: new Date().toLocaleDateString('vi-VN')
          };
          setActiveDecodedDoc(newDoc);
          if (onGainTuVi) onGainTuVi(50, 20);
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.warn('Lỗi đọc tham số URL raw/doc:', e);
    }
  }, [onGainTuVi]);

  // Check extension presence
  useEffect(() => {
    const checkExt = () => {
      if (document.documentElement.getAttribute('data-hustflow-extension') === 'installed' || (window as any).HUSTFLOW_STUDOCU_EXTENSION_INSTALLED) {
        setIsExtensionDetected(true);
      }
    };
    checkExt();
    const interval = setInterval(checkExt, 1000);
    return () => clearInterval(interval);
  }, []);

  // Primary Decode action handler
  const handleDecode = async () => {
    setErrorMsg('');
    setIsDecoding(true);

    if (inputUrl.trim()) {
      let cleanUrl = inputUrl.trim();
      const hasParam = cleanUrl.includes('?');
      const targetUrl = cleanUrl + (hasParam ? '&autodownload=true' : '?autodownload=true');

      // 1. Send decode request message to extension
      window.postMessage({ type: 'HUSTFLOW_DECODE_REQUEST', url: targetUrl }, '*');
      
      // 2. Open tab directly to Studocu page with ?autodownload=true so extension triggers print directly!
      window.open(targetUrl, '_blank');

      // 3. Fallback parallel proxy decode for HUSTFlow local reader
      const result = await decodeStudocuDocument(cleanUrl);
      if (result.success && result.pageImages.length > 0) {
        const newDoc: StudocuDocument = {
          id: `doc_${Date.now()}`,
          url: cleanUrl,
          title: result.title,
          pageCount: result.pageCount,
          pageImages: result.pageImages,
          subjectTag: 'Tài Liệu',
          savedAt: new Date().toLocaleDateString('vi-VN')
        };
        setActiveDecodedDoc(newDoc);
        setIsDecoding(false);
        if (onGainTuVi) onGainTuVi(50, 20);
      } else {
        setTimeout(() => {
          setIsDecoding(false);
        }, 2000);
      }
    } else {
      setIsDecoding(false);
    }
  };

  // Compute printed page indices
  const pageIndicesToPrint = activeDecodedDoc
    ? parsePageRange(pageRangeInput, activeDecodedDoc.pageCount)
    : [];

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto pb-12 font-sans">
      {/* Hidden Print Area */}
      {activeDecodedDoc && (
        <div id="tang-kinh-cac-print-area" className="hidden print:block font-sans">
          {pageIndicesToPrint.map((pageIdx) => {
            const imgUrl = activeDecodedDoc.pageImages[pageIdx];
            if (!imgUrl) return null;
            return (
              <div key={pageIdx} className="page-break w-full mb-4 text-center">
                <img
                  src={imgUrl}
                  alt={`Page ${pageIdx + 1}`}
                  className="w-full max-w-[210mm] mx-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Clean Header Banner */}
      <div className="neo-card p-6 bg-gradient-to-r from-indigo-950/80 via-[#0b101c] to-slate-950 border-2 border-indigo-500/40 rounded-2xl shadow-[6px_6px_0px_#000] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                Thư Viện Tiên Gia
              </span>
              {isExtensionDetected && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-md text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Extension Cầu Nối: ĐÃ BẬT
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2.5 font-mono">
              <BookOpen className="w-7 h-7 text-indigo-400" /> TÀNG KINH CÁC
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Kho giải mã & tải về tài liệu Studocu HD chất lượng cao.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: DECODER INPUT PANEL ── */}
      <div className="neo-card p-5 bg-[#0e131d] border-2 border-slate-950 rounded-2xl shadow-[6px_6px_0px_#000] space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Dán đường link Studocu tại đây..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-[#080b12] border-2 border-slate-950 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 shadow-[2px_2px_0px_#000]"
          />
          <button
            type="button"
            onClick={() => handleDecode()}
            disabled={isDecoding || !inputUrl.trim()}
            className={`px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-950 transition-all cursor-pointer shadow-[3px_3px_0px_#000] flex items-center gap-2 font-mono ${
              isDecoding || !inputUrl.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isDecoding ? 'animate-spin' : ''}`} />
            <span>{isDecoding ? 'Đang Giải Mã...' : '⚡ GIẢI MÃ CỔ KINH'}</span>
          </button>
        </div>

        {/* Extension Not Installed Warning & Drive Link */}
        {!isExtensionDetected && (
          <div className="p-3.5 bg-indigo-950/40 border-2 border-indigo-500/50 rounded-xl text-xs text-indigo-200 font-sans space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap font-mono">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                ⚠️ Yêu cầu cài đặt Extension Cầu Nối để gỡ mờ & tải PDF Studocu tự động!
              </span>
              <a
                href="https://drive.google.com/drive/folders/1WBc5Pu_-CT2JUFIFMmfkbK7YvN13bkmA?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10.5px] uppercase cursor-pointer shadow-[2px_2px_0px_#000] flex items-center gap-1"
              >
                🔗 Tải Extension Trên Google Drive
              </a>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/40 border-2 border-rose-500/50 rounded-xl text-xs text-rose-300 font-sans space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-rose-400">⚠️ Thông Báo:</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: ACTIVE DOCUMENT HD READER & TOOLBAR ── */}
      <AnimatePresence>
        {activeDecodedDoc && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="neo-card p-5 bg-[#0e131d] border-2 border-slate-950 rounded-2xl shadow-[6px_6px_0px_#000] space-y-4"
          >
            {/* Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-950 font-mono">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-indigo-400 font-bold">
                    {activeDecodedDoc.pageCount} Trang HD
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 truncate">{activeDecodedDoc.title}</h3>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Custom Page Range Printing */}
                <div className="flex items-center gap-1 bg-[#080b12] border border-slate-800 rounded-xl px-2 py-1">
                  <span className="text-[10px] text-slate-400">Trang:</span>
                  <input
                    type="text"
                    value={pageRangeInput}
                    onChange={(e) => setPageRangeInput(e.target.value)}
                    placeholder="all hoặc 1-5, 8"
                    className="w-20 bg-transparent text-[11px] font-bold text-indigo-300 focus:outline-none"
                    title="Ví dụ: all, hoặc 1-5, 8, 11-15"
                  />
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center bg-[#080b12] border border-slate-800 rounded-xl p-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                    className="p-1 hover:text-slate-100 cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-[11px] font-bold text-indigo-400 min-w-[45px] text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.min(180, zoomLevel + 15))}
                    className="p-1 hover:text-slate-100 cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Print PDF Button */}
                <button
                  type="button"
                  onClick={() => printDocumentAsPdf(activeDecodedDoc.title, activeDecodedDoc.pageImages)}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-slate-950 transition-all cursor-pointer shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải về</span>
                </button>
              </div>
            </div>

            {/* Document Image Scroll Viewport */}
            <div className="max-h-[680px] overflow-y-auto p-4 bg-[#080b12] rounded-xl border-2 border-slate-950 space-y-4 shadow-inner custom-scrollbar">
              {activeDecodedDoc.pageImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="mx-auto bg-white rounded-lg p-2 shadow-md transition-all duration-200"
                  style={{ width: `${zoomLevel}%`, maxWidth: '1000px' }}
                >
                  <div className="text-[10px] text-slate-400 font-mono mb-1 text-right">Trang {idx + 1} / {activeDecodedDoc.pageCount}</div>
                  <img
                    src={imgUrl}
                    alt={`Trang ${idx + 1}`}
                    className="w-full h-auto object-contain rounded"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
