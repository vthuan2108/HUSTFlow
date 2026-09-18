/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CultivationManual, ManualTier, CultivationStage, Priority } from '../types';
import {
  Scroll,
  Plus,
  BookOpen,
  Sparkles,
  Trash2,
  CheckCircle,
  Play,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Edit3,
  Trophy,
  Lock,
  Activity
} from 'lucide-react';

interface CultivationManualsSectionProps {
  manuals: CultivationManual[];
  onAddManual: (manual: CultivationManual) => void;
  onUpdateManuals: (updatedList: CultivationManual[]) => void;
  onAddExp: (tuVi: number, linhThach: number) => void;
  onAddTodo?: (title: string, difficulty: Priority, dueDate?: string, googleTaskId?: string) => void;
}

export default function CultivationManualsSection({
  manuals,
  onAddManual,
  onUpdateManuals,
  onAddExp,
  onAddTodo
}: CultivationManualsSectionProps) {
  // Navigation & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DANG_TU_LUYEN' | 'DAI_VIEN_MAN'>('ALL');
  
  // Custom manual view modes: key = manualId, value = 'LIST' | 'FLOW'
  const [manualViewModes, setManualViewModes] = useState<Record<string, 'LIST' | 'FLOW'>>({});
  
  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [tier, setTier] = useState<ManualTier>('HUYEN');
  const [stagesText, setStagesText] = useState('');
  const [formError, setFormError] = useState('');

  // Expanded manual card ID
  const [expandedManualId, setExpandedManualId] = useState<string | null>(null);

  // EDIT ROADMAP STATES
  const [editingManual, setEditingManual] = useState<CultivationManual | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTier, setEditTier] = useState<ManualTier>('HUYEN');
  const [editStages, setEditStages] = useState<CultivationStage[]>([]);
  const [editNewStageTitle, setEditNewStageTitle] = useState('');

  const handleOpenEdit = (manual: CultivationManual, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingManual(manual);
    setEditName(manual.name);
    setEditCategory(manual.category);
    setEditTier(manual.tier);
    setEditStages([...manual.stages]);
    setEditNewStageTitle('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManual) return;
    if (!editName.trim()) {
      alert('⚠️ Manual name cannot be empty!');
      return;
    }
    if (editStages.length === 0) {
      alert('⚠️ Manual must have at least one stage for its roadmap!');
      return;
    }

    const allCompleted = editStages.every(s => s.isCompleted);
    const updatedList = manuals.map(m => {
      if (m.id !== editingManual.id) return m;
      return {
        ...m,
        name: editName.trim(),
        category: editCategory.trim() || 'Academics',
        tier: editTier,
        stages: editStages.map(s => ({
          ...s,
          tuViReward: tierMeta[editTier].reward
        })),
        status: (allCompleted ? 'DAI_VIEN_MAN' : 'DANG_TU_LUYEN') as 'CHUA_NHAP_MON' | 'DANG_TU_LUYEN' | 'DAI_VIEN_MAN',
        completedAt: allCompleted ? (m.completedAt || new Date().toISOString().split('T')[0]) : undefined
      };
    });

    onUpdateManuals(updatedList);
    setEditingManual(null);
  };

  const handleToggleMidtermLimit = (manualId: string, stageId: string) => {
    const updated = manuals.map(m => {
      if (m.id !== manualId) return m;
      const newLimit = m.midtermLimitStageId === stageId ? undefined : stageId;
      return {
        ...m,
        midtermLimitStageId: newLimit
      };
    });
    onUpdateManuals(updated);
  };

  const handleAddEditStage = () => {
    if (!editNewStageTitle.trim()) return;
    const newStage: CultivationStage = {
      id: `stage_edit_${Date.now()}`,
      title: editNewStageTitle.trim(),
      isCompleted: false,
      tuViReward: tierMeta[editTier].reward
    };
    setEditStages(prev => [...prev, newStage]);
    setEditNewStageTitle('');
  };

  const handleRemoveEditStage = (id: string) => {
    setEditStages(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateEditStageText = (id: string, text: string) => {
    setEditStages(prev => prev.map(s => s.id === id ? { ...s, title: text } : s));
  };

  const handleToggleEditStageComplete = (id: string) => {
    setEditStages(prev => prev.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  // Tier metadata mapping
  const tierMeta: Record<ManualTier, { name: string; color: string; border: string; bg: string; text: string; reward: number }> = {
    HOANG: { 
      name: 'Yellow Tier', 
      color: 'from-slate-700 to-slate-800', 
      border: 'border-slate-800', 
      bg: 'bg-slate-950/40', 
      text: 'text-slate-400',
      reward: 10
    },
    HUYEN: { 
      name: 'Mystic Tier', 
      color: 'from-blue-900 to-indigo-950', 
      border: 'border-blue-900/60', 
      bg: 'bg-blue-950/10', 
      text: 'text-blue-400',
      reward: 15
    },
    DIA: { 
      name: 'Earth Tier', 
      color: 'from-purple-900 to-fuchsia-950', 
      border: 'border-purple-800/40', 
      bg: 'bg-purple-950/10', 
      text: 'text-purple-400',
      reward: 25
    },
    THIEN: { 
      name: 'Heaven Tier', 
      color: 'from-amber-600 to-yellow-950', 
      border: 'border-amber-500/30', 
      bg: 'bg-amber-950/10', 
      text: 'text-amber-400',
      reward: 35
    },
    THAN: { 
      name: 'Divine Tier (Peak)', 
      color: 'from-rose-600 to-red-950', 
      border: 'border-rose-500/40', 
      bg: 'bg-rose-950/10', 
      text: 'text-rose-400 font-bold',
      reward: 50
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a manual name!');
      return;
    }
    if (!stagesText.trim()) {
      setFormError('Please enter at least one stage for your roadmap!');
      return;
    }
    setFormError('');

    const lines = stagesText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setFormError('Empty roadmap. Please enter a list of chapters or stages.');
      return;
    }

    const defaultReward = tierMeta[tier].reward;
    const stages: CultivationStage[] = lines.map((line, idx) => ({
      id: `stage_${Date.now()}_${idx}`,
      title: line,
      isCompleted: false,
      tuViReward: defaultReward
    }));

    const newManual: CultivationManual = {
      id: `manual_${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Academics',
      tier,
      stages,
      status: 'DANG_TU_LUYEN',
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddManual(newManual);
    
    // Reset form
    setName('');
    setCategory('');
    setTier('HUYEN');
    setStagesText('');
    setIsCreating(false);
  };

  const mapTierToPriority = (tier: ManualTier): Priority => {
    switch (tier) {
      case 'HOANG': return 'SO_CAP';
      case 'HUYEN': return 'TRUNG_CAP';
      case 'DIA': return 'CAO_CAP';
      case 'THIEN': return 'THAN_CAP';
      case 'THAN': return 'THAN_CAP';
      default: return 'SO_CAP';
    }
  };

  const handleLinkStageToTodo = (manual: CultivationManual, stage: CultivationStage) => {
    if (!onAddTodo) {
      alert('⚠️ Daily Quests system not connected!');
      return;
    }
    
    const difficulty = mapTierToPriority(manual.tier);
    const todoTitle = `[Roadmap] ${manual.name} - Practice: ${stage.title}`;
    
    onAddTodo(todoTitle, difficulty, undefined, undefined);
    
    alert(`⚔️ Quest inscribed successfully!\n\nAdded stage "${stage.title}" from manual "${manual.name}" to today's task list.`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this Cultivation Manual? All roadmap progress and uncomprehended rewards will be lost.')) {
      const updated = manuals.filter(m => m.id !== id);
      onUpdateManuals(updated);
      if (expandedManualId === id) setExpandedManualId(null);
    }
  };

  const handleComprehendStage = (manualId: string, stageId: string) => {
    const updated = manuals.map(m => {
      if (m.id !== manualId) return m;

      const updatedStages = m.stages.map(s => {
        if (s.id !== stageId) return s;
        if (s.isCompleted) return s; // already completed
        
        // Award EXP/Tu Vi
        onAddExp(s.tuViReward, 0);
        return { ...s, isCompleted: true };
      });

      const allCompleted = updatedStages.every(s => s.isCompleted);
      const prevStatus = m.status;
      const nextStatus = allCompleted ? 'DAI_VIEN_MAN' : 'DANG_TU_LUYEN';

      if (nextStatus === 'DAI_VIEN_MAN' && prevStatus !== 'DAI_VIEN_MAN') {
        // Grand mastery breakthrough bonus!
        onAddExp(150, 50); // +150 Tu Vi, +50 Linh Thach
        setTimeout(() => {
          alert(`🎉 GRAND MASTERY!\n\nCongratulations on completing 100% of the manual:\n👉 ${m.name}\n\nReceived breakthrough bonus: +150 Exp and +50 Spirit Stones!`);
        }, 100);
      } else {
        const completedStage = m.stages.find(s => s.id === stageId);
        if (completedStage) {
          setTimeout(() => {
            alert(`⚡ COMPREHENSION SUCCESS!\n\nMastered stage: ${completedStage.title}\nGained +${completedStage.tuViReward} Exp.`);
          }, 50);
        }
      }

      return {
        ...m,
        stages: updatedStages,
        status: nextStatus as 'CHUA_NHAP_MON' | 'DANG_TU_LUYEN' | 'DAI_VIEN_MAN',
        completedAt: allCompleted ? new Date().toISOString().split('T')[0] : m.completedAt
      };
    });

    onUpdateManuals(updated);
  };

  // Filter manuals
  const filteredManuals = manuals.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const activeManualsCount = manuals.filter(m => m.status === 'DANG_TU_LUYEN').length;
  const completedManualsCount = manuals.filter(m => m.status === 'DAI_VIEN_MAN').length;
  const totalStagesCount = manuals.reduce((sum, m) => sum + m.stages.length, 0);
  const completedStagesCount = manuals.reduce((sum, m) => sum + m.stages.filter(s => s.isCompleted).length, 0);
  const comprehensionRate = totalStagesCount > 0 ? Math.round((completedStagesCount / totalStagesCount) * 100) : 0;

  return (
    <div className="space-y-6" id="cultivation-manuals">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0f141c]/60 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">ACTIVE MANUALS</p>
            <h4 className="text-xl font-black text-slate-100 font-mono mt-0.5">{activeManualsCount}</h4>
            <p className="text-[8px] text-slate-400 mt-0.5">Manuals in progress</p>
          </div>
          <div className="p-2 bg-blue-950/40 border border-blue-900/40 rounded-xl text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f141c]/60 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">GRAND MASTERY</p>
            <h4 className="text-xl font-black text-slate-100 font-mono mt-0.5">{completedManualsCount}</h4>
            <p className="text-[8px] text-slate-400 mt-0.5">100% completed manuals</p>
          </div>
          <div className="p-2 bg-emerald-950/40 border border-emerald-900/40 rounded-xl text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f141c]/60 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">COMPREHENSION RATE</p>
            <h4 className="text-xl font-black text-slate-100 font-mono mt-0.5">
              {comprehensionRate}%
            </h4>
            <p className="text-[8px] text-slate-400 mt-0.5">Mastered {completedStagesCount}/{totalStagesCount} stages</p>
          </div>
          <div className="p-2 bg-amber-950/40 border border-amber-900/40 rounded-xl text-amber-500">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tab Header & Dashboard Banner */}
      <div className="bg-[#0f141c]/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-950/40 border border-amber-900/60 rounded-xl text-amber-500">
            <Scroll className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Cultivation Roadmap & Skill Manuals</h2>
            <p className="text-[10px] text-slate-500">Create skill manuals and break them down into stages to accumulate Exp and mastery.</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-950/20"
        >
          <Plus className="w-4 h-4" /> {isCreating ? 'Drafting Manual' : 'Create New Manual'}
        </button>
      </div>

      {/* Creation Form Block */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-[#0f141c]/80 border border-indigo-900/30 p-5 rounded-2xl shadow-xl space-y-4 font-sans text-xs">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Draft New Cultivation Manual
          </h3>

          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-400 rounded-xl text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Manual Name (Skill / Subject):</label>
              <input
                type="text"
                placeholder="E.g., Nine Heavens Thunder - React Hooks"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Category:</label>
              <input
                type="text"
                placeholder="E.g., Programming, Languages, Mindset..."
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Manual Tier (Difficulty):</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as ManualTier)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="HOANG">Yellow Tier (+10 EXP/Stage)</option>
                <option value="HUYEN">Mystic Tier (+15 EXP/Stage)</option>
                <option value="DIA">Earth Tier (+25 EXP/Stage)</option>
                <option value="THIEN">Heaven Tier (+35 EXP/Stage)</option>
                <option value="THAN">Divine Tier (Peak) (+50 EXP/Stage)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">
              Stage Roadmap (Enter one stage per line):
            </label>
            <textarea
              placeholder="E.g.:&#10;Stage 1: Understand useState and re-render mechanics&#10;Stage 2: Apply useEffect to manage side-effects&#10;Stage 3: Master useMemo and useCallback optimization"
              value={stagesText}
              onChange={e => setStagesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 h-28 font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="bg-slate-950 border border-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg"
            >
              CREATE MANUAL
            </button>
          </div>
        </form>
      )}

      {/* Filtering & Searching Controls */}
      <div className="bg-[#0f141c]/40 border border-slate-900/60 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search manuals, category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-950 border border-slate-900 p-0.5 rounded-lg text-[10.5px]">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-slate-900 text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('DANG_TU_LUYEN')}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              statusFilter === 'DANG_TU_LUYEN' ? 'bg-slate-900 text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('DAI_VIEN_MAN')}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              statusFilter === 'DAI_VIEN_MAN' ? 'bg-slate-900 text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Mastered 💮
          </button>
        </div>
      </div>

      {/* Manuals Grid Display */}
      {filteredManuals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredManuals.map(manual => {
            const meta = tierMeta[manual.tier];
            const completedCount = manual.stages.filter(s => s.isCompleted).length;
            const totalCount = manual.stages.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isExpanded = expandedManualId === manual.id;

            return (
              <div
                key={manual.id}
                onClick={() => setExpandedManualId(isExpanded ? null : manual.id)}
                className={`bg-slate-950/40 border border-slate-900 rounded-2xl p-4.5 space-y-3 cursor-pointer hover:border-slate-800 transition-all relative overflow-hidden flex flex-col justify-between ${
                  manual.status === 'DAI_VIEN_MAN' ? 'opacity-85 border-emerald-950/40' : ''
                }`}
              >
                <div className="space-y-2 z-10">
                  {/* Category & Delete Icon */}
                  <div className="flex justify-between items-center text-[9px] font-bold font-mono">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-500 uppercase tracking-widest">
                      📂 {manual.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md border ${meta.border} ${meta.text}`}>
                        {meta.name}
                      </span>
                      <button
                        onClick={(e) => handleOpenEdit(manual, e)}
                        className="text-slate-700 hover:text-amber-400 p-1 rounded hover:bg-slate-950/60 transition-colors cursor-pointer"
                        title="Edit manual"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(manual.id, e)}
                        className="text-slate-700 hover:text-rose-400 p-1 rounded hover:bg-slate-950/60 transition-colors cursor-pointer"
                        title="Delete manual"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Manual Title */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-100 tracking-wide line-clamp-2">
                      {manual.name}
                    </h4>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      Created on: {manual.createdAt}
                    </span>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-2 mt-2 z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Mastery progress:</span>
                    <span className={`font-bold ${manual.status === 'DAI_VIEN_MAN' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {manual.status === 'DAI_VIEN_MAN' ? 'Grand Mastery' : `${completedCount}/${totalCount} Stages`}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-[#0a0c12] rounded-full h-1.5 overflow-hidden border border-slate-900 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        manual.status === 'DAI_VIEN_MAN' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Expand Indicators */}
                  <div className="flex justify-center pt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Expanded Stages List */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="pt-3 border-t border-slate-900 mt-2 space-y-3.5 text-[10px] w-full text-left"
                  >
                    {/* View mode toggle */}
                    <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black font-mono">Stages Roadmap List:</p>
                      <div className="flex bg-slate-950 p-0.5 rounded-md border border-slate-900 text-[8px] font-bold">
                        <button
                          type="button"
                          onClick={() => setManualViewModes(prev => ({ ...prev, [manual.id]: 'LIST' }))}
                          className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                            (manualViewModes[manual.id] || 'LIST') === 'LIST'
                              ? 'bg-amber-600 text-slate-950 font-extrabold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          📑 List View
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualViewModes(prev => ({ ...prev, [manual.id]: 'FLOW' }))}
                          className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                            manualViewModes[manual.id] === 'FLOW'
                              ? 'bg-amber-600 text-slate-950 font-extrabold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🗺️ Stepper Flow
                        </button>
                      </div>
                    </div>

                    {(manualViewModes[manual.id] || 'LIST') === 'LIST' ? (
                      // 1. STANDARD LIST VIEW
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {manual.stages.map((stage) => (
                          <div 
                            key={stage.id} 
                            className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-900 rounded-lg hover:border-slate-800 transition-colors"
                          >
                            <span className={`font-semibold line-clamp-1 flex-1 pr-3 ${
                              stage.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'
                            }`}>
                              {stage.title}
                            </span>
                            
                            {/* Midterm limit pin button */}
                            <button
                              onClick={() => handleToggleMidtermLimit(manual.id, stage.id)}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer mr-1.5 flex items-center gap-0.5 shrink-0 ${
                                manual.midtermLimitStageId === stage.id
                                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-300 font-extrabold shadow-[0_0_6px_rgba(244,63,94,0.15)]'
                                  : 'bg-slate-900/60 border-slate-800/50 text-slate-500 hover:text-slate-350 hover:border-slate-700'
                              }`}
                              title={manual.midtermLimitStageId === stage.id ? 'Remove Midterm Exam Target' : 'Mark as Midterm Exam Target (study up to this stage)'}
                            >
                              📌 {manual.midtermLimitStageId === stage.id ? 'Midterm' : 'Set Midterm'}
                            </button>

                            {stage.isCompleted ? (
                              <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-0.5 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-md shrink-0">
                                <CheckCircle className="w-2.5 h-2.5" /> Mastered
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                {onAddTodo && (
                                  <button
                                    onClick={() => handleLinkStageToTodo(manual, stage)}
                                    className="bg-amber-950/40 hover:bg-amber-900 border border-amber-800/40 text-amber-300 font-bold text-[8.5px] px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-0.5 uppercase tracking-wider"
                                    title="Add to today's quest list"
                                  >
                                    ⚔️ Practice
                                  </button>
                                )}
                                <button
                                  onClick={() => handleComprehendStage(manual.id, stage.id)}
                                  className="bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-300 font-black text-[9px] px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-0.5"
                                >
                                  <Play className="w-2 h-2 fill-current" /> Comprehend
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 2. INTERACTIVE TIMELINE / STEPPER FLOW VIEW
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 relative pl-6 py-2">
                        {/* Central vertical track line */}
                        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-900 rounded-full" />
                        
                        {/* Active path glowing track line overlay (covers completed parts) */}
                        {(() => {
                          const firstUncompletedIdx = manual.stages.findIndex(s => !s.isCompleted);
                          const lastCompletedIdx = firstUncompletedIdx === -1 
                            ? manual.stages.length - 1 
                            : firstUncompletedIdx - 1;
                          
                          if (lastCompletedIdx < 0) return null;
                          const percent = Math.round((lastCompletedIdx / (manual.stages.length - 1)) * 100);
                          return (
                            <div 
                              className="absolute left-2 top-0 w-0.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" 
                              style={{ height: `${percent}%` }}
                            />
                          );
                        })()}

                        {manual.stages.map((stage, sIdx) => {
                          const isCompleted = stage.isCompleted;
                          const firstUncompletedIdx = manual.stages.findIndex(s => !s.isCompleted);
                          const isActive = sIdx === firstUncompletedIdx;
                          const isLocked = !isCompleted && !isActive;

                          return (
                            <div key={stage.id} className="relative pb-4 last:pb-0 flex items-start gap-3">
                              {/* Node indicator */}
                              <div className="absolute -left-6 mt-1 z-10">
                                {isCompleted ? (
                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_6px_#10b981]">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                  </div>
                                ) : isActive ? (
                                  <div className="w-3.5 h-3.5 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  </div>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-650">
                                    <Lock className="w-1.5 h-1.5" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-lg hover:border-slate-800 transition-colors flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[8px] text-slate-500 font-mono">STAGE {sIdx + 1}</span>
                                    {isCompleted && (
                                      <span className="text-[6.5px] bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                                        MASTERED
                                      </span>
                                    )}
                                    {isActive && (
                                      <span className="text-[6.5px] bg-amber-950/20 border border-amber-900/30 text-amber-400 px-1 py-0.2 rounded font-bold uppercase tracking-wider animate-pulse">
                                        IN PROGRESS
                                      </span>
                                    )}
                                    {isLocked && (
                                      <span className="text-[6.5px] bg-slate-900 border border-slate-800 text-slate-600 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                                        LOCKED
                                      </span>
                                    )}
                                  </div>
                                  <p className={`font-bold text-[10px] mt-0.5 ${isCompleted ? 'text-slate-500 line-through' : isActive ? 'text-amber-300 font-black' : 'text-slate-600'}`}>
                                    {stage.title}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Midterm limit pin button */}
                                  <button
                                    onClick={() => handleToggleMidtermLimit(manual.id, stage.id)}
                                    className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-0.5 ${
                                      manual.midtermLimitStageId === stage.id
                                        ? 'bg-rose-950/60 border-rose-800/80 text-rose-300 font-extrabold shadow-[0_0_6px_rgba(244,63,94,0.15)]'
                                        : 'bg-slate-900/60 border-slate-800/50 text-slate-500 hover:text-slate-350 hover:border-slate-700'
                                    }`}
                                    title={manual.midtermLimitStageId === stage.id ? 'Remove Midterm Exam Target' : 'Mark as Midterm Exam Target (study up to this stage)'}
                                  >
                                    📌 {manual.midtermLimitStageId === stage.id ? 'Midterm' : 'Set Midterm'}
                                  </button>

                                  {isActive && (
                                    <>
                                      {onAddTodo && (
                                        <button
                                          type="button"
                                          onClick={() => handleLinkStageToTodo(manual, stage)}
                                          className="bg-amber-950/40 hover:bg-amber-900 border border-amber-800/40 text-amber-300 font-bold text-[8.5px] px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-0.5 uppercase tracking-wider"
                                          title="Add to today's quest list"
                                        >
                                          ⚔️ Practice
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleComprehendStage(manual.id, stage.id)}
                                        className="bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-300 font-black text-[9px] px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-0.5"
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current animate-bounce" /> Comprehend
                                      </button>
                                    </>
                                  )}
                                  {isLocked && (
                                    <span className="text-[8px] text-slate-600 font-mono italic pr-1">Locked</span>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[8px] text-emerald-500 font-mono font-bold pr-1">+{stage.tuViReward} EXP</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-950/30 border border-dashed border-slate-900 rounded-2xl py-16 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Cultivation Roadmap is Empty</h4>
            <p className="text-[10px] text-slate-600 max-w-xs mx-auto leading-normal">
              No skill manuals created yet. Click "Create New Manual" above to build your progression roadmap!
            </p>
          </div>
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {editingManual && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141c] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl p-5 space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit Roadmap: {editingManual.name}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingManual(null)}
                className="text-slate-500 hover:text-slate-300 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 overflow-y-auto flex-1 pr-1.5 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">Manual Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">Category:</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono">Tier (Difficulty):</label>
                  <select
                    value={editTier}
                    onChange={e => setEditTier(e.target.value as ManualTier)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="HOANG">Yellow Tier (+10 EXP/Stage)</option>
                    <option value="HUYEN">Mystic Tier (+15 EXP/Stage)</option>
                    <option value="DIA">Earth Tier (+25 EXP/Stage)</option>
                    <option value="THIEN">Heaven Tier (+35 EXP/Stage)</option>
                    <option value="THAN">Divine Tier (Peak) (+50 EXP/Stage)</option>
                  </select>
                </div>
              </div>

              {/* Stages List Manager */}
              <div className="space-y-2">
                <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Manage Stages:</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-900 p-2 bg-slate-950/20 rounded-xl pr-1.5">
                  {editStages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-2 bg-slate-950/50 border border-slate-900 rounded-lg p-1.5">
                      {/* Completion Checkbox */}
                      <input
                        type="checkbox"
                        checked={stage.isCompleted}
                        onChange={() => handleToggleEditStageComplete(stage.id)}
                        className="w-3.5 h-3.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Toggle completed status"
                      />
                      
                      {/* In-place title edit */}
                      <input
                        type="text"
                        value={stage.title}
                        onChange={e => handleUpdateEditStageText(stage.id, e.target.value)}
                        className="flex-1 bg-transparent border-none p-0 text-[11px] text-slate-300 focus:outline-none focus:ring-0"
                      />

                      {/* Remove stage button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditStage(stage.id)}
                        className="text-slate-600 hover:text-rose-500 p-0.5 rounded transition-colors"
                        title="Delete this stage"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {editStages.length === 0 && (
                    <p className="text-center text-slate-600 italic py-4">No stages yet. Your roadmap is empty!</p>
                  )}
                </div>
              </div>

              {/* Add Stage Form inline */}
              <div className="space-y-1 bg-slate-950/30 p-2 border border-slate-900 rounded-xl">
                <label className="text-[9px] text-slate-600 font-bold uppercase font-mono block">Add New Stage:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g., Stage 4: Comprehensive practice..."
                    value={editNewStageTitle}
                    onChange={e => setEditNewStageTitle(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditStage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddEditStage}
                    className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-3 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingManual(null)}
                  className="bg-slate-950 border border-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg"
                >
                  UPDATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
