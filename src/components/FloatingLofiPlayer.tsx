/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GripHorizontal, Link as LinkIcon, Minimize2, Maximize2, X, Zap, Play, Music } from 'lucide-react';

function getYouTubeId(url: string): string {
  if (!url) return 'sF80I-TQiW0';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : (url.length === 11 ? url : 'sF80I-TQiW0');
}

interface FloatingLofiPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  isRunning?: boolean;
}

export default function FloatingLofiPlayer({ isOpen, onClose, onOpen, isRunning = false }: FloatingLofiPlayerProps) {
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => {
    return localStorage.getItem('tlk_lofi_yt_url') || 'https://www.youtube.com/watch?v=sF80I-TQiW0&list=RDsF80I-TQiW0&start_radio=1';
  });

  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('tlk_lofi_yt_sync') !== 'false';
  });

  const [inputUrl, setInputUrl] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('tlk_lofi_yt_url', youtubeUrl);
  }, [youtubeUrl]);

  useEffect(() => {
    localStorage.setItem('tlk_lofi_yt_sync', String(autoSync));
  }, [autoSync]);

  if (!isOpen) {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onOpen}
        className="fixed bottom-6 left-6 z-40 bg-[#0e131d] hover:bg-[#141a27] border-2 border-slate-950 text-rose-400 font-black text-[11px] font-mono px-3.5 py-2 rounded-2xl shadow-[4px_4px_0px_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-2 select-none group transition-all"
        title="Bật nhanh Lofi YouTube Stream"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <Music className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform" />
        <span>🔴 LOFI STREAM</span>
      </motion.button>
    );
  }

  const currentVideoId = getYouTubeId(youtubeUrl);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setYoutubeUrl(inputUrl.trim());
    }
    setIsEditingUrl(false);
  };

  const shouldPlay = !autoSync || isRunning;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-6 left-6 z-50 select-none shadow-[6px_6px_0px_#000]"
    >
      <div className="bg-[#0e131d] border-2 border-slate-950 rounded-2xl overflow-hidden shadow-2xl flex flex-col w-56 sm:w-64 text-slate-200">
        {/* Header / Drag Bar */}
        <div className="bg-[#141a27] border-b-2 border-slate-950 px-2 py-1.5 flex items-center justify-between cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 shrink-0" />
            <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-rose-400 truncate">
              <span className={`w-1.5 h-1.5 rounded-full ${shouldPlay ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
              <span className="truncate">LOFI YOUTUBE</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Sync with Pomodoro Toggle */}
            <button
              type="button"
              onClick={() => setAutoSync(!autoSync)}
              className={`p-1 rounded cursor-pointer transition-colors ${
                autoSync ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={autoSync ? "Đồng bộ Pomodoro: BẬT (Tự bật/tắt theo đồng hồ)" : "Đồng bộ Pomodoro: TẮT (Phát liên tục)"}
            >
              <Zap className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                setInputUrl(youtubeUrl);
                setIsEditingUrl(!isEditingUrl);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
              title="Tùy chỉnh Link YouTube"
            >
              <LinkIcon className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              title={isMinimized ? "Mở rộng Player" : "Thu nhỏ Player"}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
              title="Tắt Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Custom URL Input Popover */}
        {isEditingUrl && (
          <form onSubmit={handleSaveUrl} className="p-2 bg-slate-950 border-b border-slate-900 flex gap-1 animate-fadeIn">
            <input
              type="text"
              placeholder="Dán link YouTube..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[9px] text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded text-[9px] uppercase cursor-pointer"
            >
              Lưu
            </button>
          </form>
        )}

        {/* Video Player Stream */}
        {!isMinimized && (
          <div className="relative w-full aspect-video bg-black overflow-hidden">
            {shouldPlay ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&controls=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="YouTube Lofi Stream Player"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center space-y-1">
                <Play className="w-5 h-5 text-amber-400 opacity-60" />
                <p className="text-[9px] font-bold text-slate-400">ĐÃ TẠM DỪNG THEO POMODORO</p>
                <p className="text-[8px] text-slate-600 font-mono">Bật đồng hồ hoặc tắt Đồng bộ (⚡) để nghe tiếp</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
