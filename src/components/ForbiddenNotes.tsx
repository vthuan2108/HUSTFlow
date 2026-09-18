/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CultivationNote } from '../types';
import { 
  Pin, 
  Search, 
  Plus, 
  Trash2, 
  Palette, 
  Check, 
  X, 
  Lock, 
  BookOpen,
  Calendar,
  Sparkles,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLOR_THEMES = [
  { id: 'slate', name: 'Standard', bg: 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700', activeBg: 'bg-slate-950', iconColor: 'text-slate-400' },
  { id: 'amber', name: 'Divine Art', bg: 'bg-amber-950/20 border-amber-900/40 text-amber-200/90 hover:border-amber-800/60', activeBg: 'bg-amber-950/60', iconColor: 'text-amber-400' },
  { id: 'emerald', name: 'Formations', bg: 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200/90 hover:border-emerald-800/60', activeBg: 'bg-emerald-950/60', iconColor: 'text-emerald-400' },
  { id: 'rose', name: 'Forbidden Art', bg: 'bg-rose-950/20 border-rose-900/40 text-rose-200/90 hover:border-rose-800/60', activeBg: 'bg-rose-950/60', iconColor: 'text-rose-400' },
  { id: 'indigo', name: 'Ancient Script', bg: 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200/90 hover:border-indigo-800/60', activeBg: 'bg-indigo-950/60', iconColor: 'text-indigo-400' },
  { id: 'purple', name: 'Immortal Scroll', bg: 'bg-purple-950/20 border-purple-900/40 text-purple-200/90 hover:border-purple-800/60', activeBg: 'bg-purple-950/60', iconColor: 'text-purple-400' },
] as const;

interface ForbiddenNotesProps {
  notes: CultivationNote[];
  onUpdateNotes: (updatedNotes: CultivationNote[]) => void;
}

export default function ForbiddenNotes({ notes, onUpdateNotes }: ForbiddenNotesProps) {
  const setNotes = (newNotesOrFunc: CultivationNote[] | ((prev: CultivationNote[]) => CultivationNote[])) => {
    if (typeof newNotesOrFunc === 'function') {
      onUpdateNotes(newNotesOrFunc(notes));
    } else {
      onUpdateNotes(newNotesOrFunc);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Note formulation state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState<CultivationNote['color']>('slate');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Active edit state
  const [editingNote, setEditingNote] = useState<CultivationNote | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState<CultivationNote['color']>('slate');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);

  const createRef = useRef<HTMLFormElement>(null);

  // Click outside listener to close note creation (Google Keep style)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        // If has content, auto save
        if (newTitle.trim() || newContent.trim()) {
          saveNewNote();
        } else {
          setIsCreating(false);
          setShowColorPicker(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newTitle, newContent, newColor, newIsPinned]);

  const saveNewNote = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsCreating(false);
      return;
    }

    const newNote: CultivationNote = {
      id: `note_${Date.now()}`,
      title: newTitle.trim() || 'Untitled Secret Scroll',
      content: newContent,
      color: newColor,
      isPinned: newIsPinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => [newNote, ...prev]);
    
    // Reset state
    setNewTitle('');
    setNewContent('');
    setNewColor('slate');
    setNewIsPinned(false);
    setIsCreating(false);
    setShowColorPicker(false);
  };

  const handleOpenEdit = (note: CultivationNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
    setEditIsPinned(note.isPinned);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;

    setNotes(prev => prev.map(note => {
      if (note.id === editingNote.id) {
        return {
          ...note,
          title: editTitle.trim() || 'Untitled Secret Scroll',
          content: editContent,
          color: editColor,
          isPinned: editIsPinned,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    }));

    setEditingNote(null);
    setShowEditColorPicker(false);
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Quick confirmation in cultivation style
    if (confirm('Fellow Daoist, are you sure you want to destroy this secret scripture?')) {
      setNotes(prev => prev.filter(note => note.id !== id));
      if (editingNote?.id === id) {
        setEditingNote(null);
      }
    }
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        return { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
      }
      return note;
    }));

    // Sync editing modal if open
    if (editingNote?.id === id) {
      setEditIsPinned(!editIsPinned);
    }
  };

  const handleQuickColorChange = (id: string, color: CultivationNote['color'], e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        return { ...note, color, updatedAt: new Date().toISOString() };
      }
      return note;
    }));
  };

  // Filter & Search
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase().trim();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const otherNotes = filteredNotes.filter(note => !note.isPinned);

  const getTheme = (colorId: CultivationNote['color']) => {
    return COLOR_THEMES.find(t => t.id === colorId) || COLOR_THEMES[0];
  };

  return (
    <div className="space-y-6" id="forbidden-notes-container">
      {/* Search and Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f141c]/80 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Sect Forbidden Grounds 
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full lowercase font-normal tracking-normal">
                secret scriptures
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              Sanctuary to record cultivation methods, realizations, and sacred techniques
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search secret scrolls with divine sense..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-[11px] text-slate-300 focus:outline-none focus:border-rose-500 placeholder-slate-600 transition-colors font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Google Keep-like Note Creator */}
      <div className="flex justify-center px-4">
        <form 
          ref={createRef}
          onSubmit={(e) => { e.preventDefault(); saveNewNote(); }}
          className={`w-full max-w-xl bg-[#0f141c]/90 border rounded-2xl p-3.5 shadow-2xl transition-all duration-300 space-y-3 ${
            isCreating ? 'border-rose-500/40 ring-1 ring-rose-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {isCreating ? (
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="Scripture Title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-transparent text-slate-200 font-bold text-xs focus:outline-none placeholder-slate-600 font-sans"
              />
              <button
                type="button"
                onClick={() => setNewIsPinned(!newIsPinned)}
                className={`p-1.5 rounded-lg hover:bg-slate-900 transition-all cursor-pointer ${
                  newIsPinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={newIsPinned ? "Unpin scroll" : "Pin scroll"}
              >
                <Pin className={`w-4 h-4 ${newIsPinned ? 'fill-amber-400/20' : ''}`} />
              </button>
            </div>
          ) : null}

          <textarea
            placeholder="Inscribe a new scripture or record cultivation insights..."
            value={newContent}
            onClick={() => setIsCreating(true)}
            onChange={(e) => setNewContent(e.target.value)}
            rows={isCreating ? 4 : 1}
            className="w-full bg-transparent text-slate-300 text-[11px] leading-relaxed focus:outline-none placeholder-slate-500 resize-none font-sans"
          />

          {isCreating && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-sans">
              <div className="flex items-center gap-1.5 relative">
                {/* Color Palette Button */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1.5 bg-slate-950/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-900 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  title="Select Aura Tier"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">{getTheme(newColor).name}</span>
                </button>

                {/* Color Choices Popup */}
                {showColorPicker && (
                  <div className="absolute left-0 bottom-full mb-2 bg-[#090d13] border border-slate-800 p-2 rounded-xl shadow-2xl flex gap-1.5 z-50">
                    {COLOR_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setNewColor(theme.id);
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${theme.bg} ${
                          newColor === theme.id ? 'ring-2 ring-rose-500 border-transparent scale-110' : ''
                        }`}
                        title={theme.name}
                      >
                        {newColor === theme.id && <Check className="w-3 h-3 text-current" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle('');
                    setNewContent('');
                    setIsCreating(false);
                    setShowColorPicker(false);
                  }}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold transition-all flex items-center gap-1 shadow-lg shadow-rose-950/20 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  INSCRIBE
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Notes Grid Area */}
      {notes.length === 0 ? (
        <div className="text-center py-20 bg-[#0f141c]/40 border border-slate-900 rounded-2xl space-y-3">
          <BookOpen className="w-8 h-8 text-slate-700 mx-auto" />
          <h4 className="text-xs font-bold text-slate-400">Forbidden Grounds Are Empty</h4>
          <p className="text-[10px] text-slate-600 font-sans max-w-xs mx-auto leading-relaxed">
            No secret scriptures are sealed here yet. Inscribe a new manual or cultivation note above!
          </p>
        </div>
      ) : (
        <div className="space-y-8 font-sans">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3" id="pinned-notes-section">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 px-1">
                <Pin className="w-3 h-3 fill-amber-500/20 rotate-45" /> Pinned Scriptures ({pinnedNotes.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onColorChange={handleQuickColorChange}
                      getTheme={getTheme}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Other Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3" id="other-notes-section">
              {pinnedNotes.length > 0 && (
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 px-1">
                  Other Scriptures ({otherNotes.length})
                </h4>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onColorChange={handleQuickColorChange}
                      getTheme={getTheme}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {filteredNotes.length === 0 && searchQuery && (
            <div className="text-center py-16 text-slate-500 text-xs font-sans">
              No secret scrolls found matching divine sense: "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Edit Modal Dialogue */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-xl w-full rounded-2xl border p-6 shadow-2xl space-y-4 text-left transition-all relative ${
                getTheme(editColor).bg
              } ${getTheme(editColor).activeBg}`}
            >
              {/* Modal header/toolbar */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-slate-950/50 text-slate-400 border border-slate-800/80 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Scroll: {getTheme(editColor).name}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditIsPinned(!editIsPinned)}
                    className={`p-1.5 rounded-lg hover:bg-slate-950/40 transition-all cursor-pointer ${
                      editIsPinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={editIsPinned ? "Unpin scroll" : "Pin scroll"}
                  >
                    <Pin className={`w-4 h-4 ${editIsPinned ? 'fill-amber-400/20' : ''}`} />
                  </button>
                  <button
                    onClick={() => { setEditingNote(null); setShowEditColorPicker(false); }}
                    className="p-1.5 rounded-lg hover:bg-slate-950/40 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Input textfields */}
              <div className="space-y-3 font-sans">
                <input
                  type="text"
                  placeholder="Untitled scripture..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-transparent text-slate-100 font-extrabold text-sm focus:outline-none placeholder-slate-600"
                />
                
                <textarea
                  placeholder="Record cultivation insights..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full bg-transparent text-slate-300 text-[11px] leading-relaxed focus:outline-none placeholder-slate-500 resize-none"
                />
              </div>

              {/* Note Metadata */}
              <div className="flex items-center gap-1.5 text-[8px] text-slate-500 border-t border-slate-900 pt-3">
                <Calendar className="w-3 h-3 text-slate-600" />
                <span>Created: {new Date(editingNote.createdAt).toLocaleString('en-US')}</span>
                {editingNote.updatedAt !== editingNote.createdAt && (
                  <span className="italic text-slate-600">(Revised: {new Date(editingNote.updatedAt).toLocaleTimeString('en-US')})</span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1 text-[10px] font-sans">
                {/* Color Changer Popup button */}
                <div className="flex items-center gap-1.5 relative">
                  <button
                    type="button"
                    onClick={() => setShowEditColorPicker(!showEditColorPicker)}
                    className="p-1.5 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-900 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase">{getTheme(editColor).name}</span>
                  </button>

                  {showEditColorPicker && (
                    <div className="absolute left-0 bottom-full mb-2 bg-[#090d13] border border-slate-800 p-2 rounded-xl shadow-2xl flex gap-1.5 z-50">
                      {COLOR_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setEditColor(theme.id);
                            setShowEditColorPicker(false);
                          }}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${theme.bg} ${
                            editColor === theme.id ? 'ring-2 ring-rose-500 border-transparent scale-110' : ''
                          }`}
                          title={theme.name}
                        >
                          {editColor === theme.id && <Check className="w-3 h-3 text-current" />}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => { handleDeleteNote(editingNote.id, e); }}
                    className="p-1.5 bg-slate-950/40 hover:bg-rose-950/30 hover:text-rose-400 text-slate-500 border border-slate-900 hover:border-rose-900/40 rounded-lg cursor-pointer transition-all"
                    title="Destroy scripture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setEditingNote(null); setShowEditColorPicker(false); }}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-slate-950 font-black rounded-xl transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    SAVE CHANGES
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// NOTE CARD COMPONENT
interface NoteCardProps {
  note: CultivationNote;
  onEdit: (note: CultivationNote) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onColorChange: (id: string, color: CultivationNote['color'], e: React.MouseEvent) => void;
  getTheme: (color: CultivationNote['color']) => typeof COLOR_THEMES[number];
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onColorChange, getTheme }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const activeTheme = getTheme(note.color);

  return (
    <motion.div
      layoutId={note.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(note)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowPalette(false); }}
      className={`group border rounded-2xl p-4 flex flex-col justify-between h-48 cursor-pointer relative shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
        activeTheme.bg
      }`}
    >
      <div className="space-y-2 min-h-0">
        <div className="flex items-start justify-between gap-1.5">
          <h5 className="text-[11px] font-bold text-slate-100 truncate flex-1 leading-normal">
            {note.title}
          </h5>
          <button
            onClick={(e) => onTogglePin(note.id, e)}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-950/40 cursor-pointer ${
              note.isPinned ? 'opacity-100 text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={note.isPinned ? "Unpin" : "Pin to top"}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-400/20 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Content Preview */}
        <p className="text-[10px] text-slate-400 line-clamp-5 whitespace-pre-wrap leading-relaxed overflow-hidden">
          {note.content}
        </p>
      </div>

      {/* Note toolbar action bar at bottom (appears on hover) */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900/40 shrink-0">
        <span className="text-[8px] text-slate-500 font-mono flex items-center gap-0.5">
          <Calendar className="w-2.5 h-2.5" />
          {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
        </span>

        <div className={`flex items-center gap-1 transition-all duration-300 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}>
          {/* Quick Color Switcher Popup Trigger */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
              className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-950/40 cursor-pointer"
              title="Tier"
            >
              <Palette className="w-3 h-3" />
            </button>

            {showPalette && (
              <div className="absolute bottom-full right-0 mb-1.5 bg-[#090d13] border border-slate-800 p-1 rounded-lg shadow-2xl flex gap-1 z-40">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={(e) => {
                      onColorChange(note.id, theme.id, e);
                      setShowPalette(false);
                    }}
                    className={`w-4 h-4 rounded-full border ${theme.bg} ${
                      note.color === theme.id ? 'ring-1 ring-rose-500' : ''
                    }`}
                    title={theme.name}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onEdit(note)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-950/40 cursor-pointer"
            title="Edit scripture"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => onDelete(note.id, e)}
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-950/40 cursor-pointer"
            title="Destroy"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
