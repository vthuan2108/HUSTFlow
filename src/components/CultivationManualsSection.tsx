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

  // Tier metadata mapping (Cấp độ môn học/kỹ năng)
  const tierMeta: Record<ManualTier, { name: string; color: string; border: string; bg: string; text: string; reward: number }> = {
    HOANG: { 
      name: 'Cơ bản', 
      color: 'from-stone-500 to-stone-600', 
      border: 'border-stone-200', 
      bg: 'bg-stone-50', 
      text: 'text-stone-700',
      reward: 10
    },
    HUYEN: { 
      name: 'Trung cấp', 
      color: 'from-sky-500 to-sky-600', 
      border: 'border-sky-200', 
      bg: 'bg-sky-50', 
      text: 'text-sky-700',
      reward: 15
    },
    DIA: { 
      name: 'Nâng cao', 
      color: 'from-indigo-500 to-indigo-600', 
      border: 'border-indigo-200', 
      bg: 'bg-indigo-50', 
      text: 'text-indigo-700',
      reward: 25
    },
    THIEN: { 
      name: 'Chuyên sâu', 
      color: 'from-amber-500 to-amber-600', 
      border: 'border-amber-200', 
      bg: 'bg-amber-50', 
      text: 'text-amber-800',
      reward: 35
    },
    THAN: { 
      name: 'Đỉnh cao', 
      color: 'from-rose-500 to-rose-600', 
      border: 'border-rose-200', 
      bg: 'bg-rose-50', 
      text: 'text-rose-700 font-bold',
      reward: 50
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên môn học hoặc kỹ năng!');
      return;
    }
    if (!stagesText.trim()) {
      setFormError('Vui lòng nhập ít nhất một giai đoạn cho lộ trình!');
      return;
    }
    setFormError('');

    const lines = stagesText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setFormError('Lộ trình trống. Vui lòng nhập danh sách các chương hoặc giai đoạn.');
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
      category: category.trim() || 'Học phần',
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
      alert('⚠️ Chưa kết nối hệ thống nhiệm vụ!');
      return;
    }
    
    const difficulty = mapTierToPriority(manual.tier);
    const todoTitle = `[Lộ trình] ${manual.name} - Học: ${stage.title}`;
    
    onAddTodo(todoTitle, difficulty, undefined, undefined);
    
    alert(`✅ Đã thêm giai đoạn "${stage.title}" từ môn "${manual.name}" vào danh sách công việc!`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa lộ trình này? Mọi tiến độ học tập sẽ bị xóa.')) {
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
        
        onAddExp(s.tuViReward, 0);
        return { ...s, isCompleted: true };
      });

      const allCompleted = updatedStages.every(s => s.isCompleted);
      const prevStatus = m.status;
      const nextStatus = allCompleted ? 'DAI_VIEN_MAN' : 'DANG_TU_LUYEN';

      if (nextStatus === 'DAI_VIEN_MAN' && prevStatus !== 'DAI_VIEN_MAN') {
        onAddExp(150, 50);
        setTimeout(() => {
          alert(`🎉 XUẤT SẮC!\n\nChúc mừng bạn đã hoàn thành 100% lộ trình môn học:\n👉 ${m.name}`);
        }, 100);
      } else {
        const completedStage = m.stages.find(s => s.id === stageId);
        if (completedStage) {
          setTimeout(() => {
            alert(`✅ Đã hoàn thành giai đoạn: ${completedStage.title}`);
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
        <div className="bg-white border border-[#E7E1D7] p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-[#7A7268] uppercase tracking-wider font-semibold font-mono">LỘ TRÌNH ĐANG HỌC</p>
            <h4 className="text-2xl font-bold text-[#2C2825] font-mono mt-0.5">{activeManualsCount}</h4>
            <p className="text-xs text-[#7A7268] mt-0.5">Lộ trình đang thực hiện</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[#2E6930]">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E7E1D7] p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-[#7A7268] uppercase tracking-wider font-semibold font-mono">HOÀN THÀNH XUẤT SẮC</p>
            <h4 className="text-2xl font-bold text-[#2C2825] font-mono mt-0.5">{completedManualsCount}</h4>
            <p className="text-xs text-[#7A7268] mt-0.5">Lộ trình hoàn thành 100%</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[#B85D38]">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E7E1D7] p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] text-[#7A7268] uppercase tracking-wider font-semibold font-mono">TỶ LỆ TIẾN ĐỘ</p>
            <h4 className="text-2xl font-bold text-[#2C2825] font-mono mt-0.5">
              {comprehensionRate}%
            </h4>
            <p className="text-xs text-[#7A7268] mt-0.5">Đã nắm vững {completedStagesCount}/{totalStagesCount} giai đoạn</p>
          </div>
          <div className="p-3 bg-stone-100 border border-[#E7E1D7] rounded-xl text-[#2C2825]">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Header & Dashboard Banner */}
      <div className="bg-white border border-[#E7E1D7] p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[#2E6930]">
            <Scroll className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2C2825] tracking-tight">Lộ trình học tập & Cây kỹ năng</h2>
            <p className="text-xs text-[#7A7268]">Tạo lộ trình phát triển kỹ năng, chia nhỏ các chặng để theo dõi tiến độ học tập bài bản.</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-[#2E6930] hover:bg-[#245226] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> {isCreating ? 'Đang soạn thảo' : 'Thêm lộ trình mới'}
        </button>
      </div>

      {/* Creation Form Block */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white border border-[#E7E1D7] p-6 rounded-2xl shadow-xs space-y-4 font-sans text-xs text-[#2C2825]">
          <h3 className="text-sm font-bold text-[#2C2825] flex items-center gap-2 border-b border-[#F0EDE6] pb-3">
            <Sparkles className="w-4 h-4 text-[#B85D38]" />
            Thêm mới lộ trình học tập & kỹ năng
          </h3>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#7A7268]">Tên kỹ năng / Môn học:</label>
              <input
                type="text"
                placeholder="VD: Cấu trúc dữ liệu & Giải thuật"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] placeholder-[#7A7268]/60 focus:outline-none focus:border-[#2E6930] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#7A7268]">Phân loại / Lĩnh vực:</label>
              <input
                type="text"
                placeholder="VD: Lập trình, Ngoại ngữ, Kỹ năng mềm..."
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] placeholder-[#7A7268]/60 focus:outline-none focus:border-[#2E6930] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#7A7268]">Cấp độ (Độ khó):</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as ManualTier)}
                className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] focus:bg-white cursor-pointer transition-all"
              >
                <option value="HOANG">Cơ bản (+10 EXP/chặng)</option>
                <option value="HUYEN">Trung cấp (+15 EXP/chặng)</option>
                <option value="DIA">Nâng cao (+25 EXP/chặng)</option>
                <option value="THIEN">Chuyên sâu (+35 EXP/chặng)</option>
                <option value="THAN">Đỉnh cao (+50 EXP/chặng)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#7A7268]">
              Lộ trình các giai đoạn (Nhập mỗi giai đoạn trên một dòng):
            </label>
            <textarea
              placeholder="VD:&#10;Giai đoạn 1: Nắm vững mảng và danh sách liên kết&#10;Giai đoạn 2: Cài đặt và ứng dụng Stack, Queue&#10;Giai đoạn 3: Cây nhị phân tìm kiếm và Heap"
              value={stagesText}
              onChange={e => setStagesText(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl p-3 text-xs text-[#2C2825] placeholder-[#7A7268]/60 focus:outline-none focus:border-[#2E6930] focus:bg-white h-28 leading-relaxed transition-all"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="bg-white border border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825] hover:bg-[#FAF8F5] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-[#2E6930] hover:bg-[#245226] text-white font-semibold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
            >
              Tạo lộ trình
            </button>
          </div>
        </form>
      )}

      {/* Filtering & Searching Controls */}
      <div className="bg-white border border-[#E7E1D7] p-3 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7A7268] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm kiếm môn học, phân loại..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2C2825] placeholder-[#7A7268]/60 focus:outline-none focus:border-[#2E6930] focus:bg-white transition-all"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-[#FAF8F5] border border-[#E7E1D7] p-1 rounded-xl text-xs gap-1">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-[#2C2825] font-semibold shadow-xs' : 'text-[#7A7268] hover:text-[#2C2825]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('DANG_TU_LUYEN')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'DANG_TU_LUYEN' ? 'bg-white text-[#2C2825] font-semibold shadow-xs' : 'text-[#7A7268] hover:text-[#2C2825]'
            }`}
          >
            Đang học
          </button>
          <button
            onClick={() => setStatusFilter('DAI_VIEN_MAN')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'DAI_VIEN_MAN' ? 'bg-white text-[#2C2825] font-semibold shadow-xs' : 'text-[#7A7268] hover:text-[#2C2825]'
            }`}
          >
            Hoàn thành ✨
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
                className={`bg-white border rounded-2xl p-5 space-y-3 cursor-pointer hover:border-[#2E6930]/40 hover:shadow-sm transition-all relative flex flex-col justify-between ${
                  manual.status === 'DAI_VIEN_MAN' ? 'border-[#E7E1D7] bg-[#FAF8F5]/60' : 'border-[#E7E1D7]'
                }`}
              >
                <div className="space-y-2 z-10">
                  {/* Category & Action Icons */}
                  <div className="flex justify-between items-center text-[10px] font-semibold font-mono">
                    <span className="bg-[#FAF8F5] border border-[#E7E1D7] px-2 py-0.5 rounded-lg text-[#7A7268] uppercase tracking-wider">
                      📂 {manual.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${meta.border} ${meta.text} ${meta.bg}`}>
                        {meta.name}
                      </span>
                      <button
                        onClick={(e) => handleOpenEdit(manual, e)}
                        className="text-[#7A7268] hover:text-[#2E6930] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                        title="Chỉnh sửa lộ trình"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(manual.id, e)}
                        className="text-[#7A7268] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa lộ trình"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Manual Title */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#2C2825] tracking-tight line-clamp-2">
                      {manual.name}
                    </h4>
                    <span className="text-[10px] text-[#7A7268] font-mono block">
                      Khởi tạo ngày: {manual.createdAt}
                    </span>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="space-y-2 mt-2 z-10">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#7A7268]">Tiến độ học tập:</span>
                    <span className={`font-bold ${manual.status === 'DAI_VIEN_MAN' ? 'text-[#2E6930]' : 'text-[#B85D38]'}`}>
                      {manual.status === 'DAI_VIEN_MAN' ? 'Đã hoàn thành' : `${completedCount}/${totalCount} Chặng`}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-[#FAF8F5] rounded-full h-2 overflow-hidden border border-[#E7E1D7]">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        manual.status === 'DAI_VIEN_MAN' ? 'bg-[#2E6930]' : 'bg-[#B85D38]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Expand Indicators */}
                  <div className="flex justify-center pt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#7A7268]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#7A7268]" />
                    )}
                  </div>
                </div>

                {/* Expanded Stages List */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="pt-3 border-t border-[#F0EDE6] mt-2 space-y-3.5 text-xs w-full text-left"
                  >
                    {/* View mode toggle */}
                    <div className="flex justify-between items-center border-b border-[#F0EDE6] pb-2">
                      <p className="text-[10px] text-[#7A7268] uppercase tracking-wider font-semibold font-mono">Danh sách các chặng:</p>
                      <div className="flex bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E7E1D7] text-[10px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setManualViewModes(prev => ({ ...prev, [manual.id]: 'LIST' }))}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            (manualViewModes[manual.id] || 'LIST') === 'LIST'
                              ? 'bg-white text-[#2C2825] font-bold shadow-xs'
                              : 'text-[#7A7268] hover:text-[#2C2825]'
                          }`}
                        >
                          📑 Danh sách
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualViewModes(prev => ({ ...prev, [manual.id]: 'FLOW' }))}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            manualViewModes[manual.id] === 'FLOW'
                              ? 'bg-white text-[#2C2825] font-bold shadow-xs'
                              : 'text-[#7A7268] hover:text-[#2C2825]'
                          }`}
                        >
                          🗺️ Dòng tiến độ
                        </button>
                      </div>
                    </div>

                    {(manualViewModes[manual.id] || 'LIST') === 'LIST' ? (
                      // 1. STANDARD LIST VIEW
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {manual.stages.map((stage) => (
                          <div 
                            key={stage.id} 
                            className="flex items-center justify-between p-2.5 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl hover:bg-white hover:border-[#D5CEBF] transition-colors"
                          >
                            <span className={`text-xs font-medium line-clamp-1 flex-1 pr-3 ${
                              stage.isCompleted ? 'text-[#7A7268] line-through' : 'text-[#2C2825]'
                            }`}>
                              {stage.title}
                            </span>
                            
                            {/* Midterm limit pin button */}
                            <button
                              onClick={() => handleToggleMidtermLimit(manual.id, stage.id)}
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer mr-1.5 flex items-center gap-1 shrink-0 ${
                                manual.midtermLimitStageId === stage.id
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                  : 'bg-white border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825] hover:border-[#D5CEBF]'
                              }`}
                              title={manual.midtermLimitStageId === stage.id ? 'Bỏ chọn mục tiêu giữa kỳ' : 'Đánh dấu mục tiêu ôn thi giữa kỳ'}
                            >
                              📌 {manual.midtermLimitStageId === stage.id ? 'Mục tiêu GK' : 'Chọn mốc GK'}
                            </button>

                            {stage.isCompleted ? (
                              <span className="text-[#2E6930] font-semibold text-[10px] flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                                <CheckCircle className="w-3 h-3" /> Hoàn thành
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 shrink-0">
                                {onAddTodo && (
                                  <button
                                    onClick={() => handleLinkStageToTodo(manual, stage)}
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#B85D38] font-semibold text-[10px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    title="Thêm vào danh sách nhiệm vụ hôm nay"
                                  >
                                    🎯 Ôn tập
                                  </button>
                                )}
                                <button
                                  onClick={() => handleComprehendStage(manual.id, stage.id)}
                                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#2E6930] font-semibold text-[10px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" /> Hoàn thành
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
                        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-[#E7E1D7] rounded-full" />
                        
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
                              className="absolute left-2.5 top-0 w-0.5 bg-[#2E6930] rounded-full transition-all duration-500" 
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
                                  <div className="w-4 h-4 rounded-full bg-emerald-50 border-2 border-[#2E6930] flex items-center justify-center text-[#2E6930]">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                  </div>
                                ) : isActive ? (
                                  <div className="w-4 h-4 rounded-full bg-amber-50 border-2 border-[#B85D38] flex items-center justify-center text-[#B85D38]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#B85D38]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-[#FAF8F5] border border-[#E7E1D7] flex items-center justify-center text-[#7A7268]">
                                    <Lock className="w-2 h-2" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 bg-white border border-[#E7E1D7] p-3 rounded-xl hover:border-[#D5CEBF] transition-colors flex items-center justify-between gap-3 shadow-xs">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] text-[#7A7268] font-mono font-semibold">CHẶNG {sIdx + 1}</span>
                                    {isCompleted && (
                                      <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-[#2E6930] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                        HOÀN THÀNH
                                      </span>
                                    )}
                                    {isActive && (
                                      <span className="text-[8px] bg-amber-50 border border-amber-200 text-[#B85D38] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                        ĐANG HỌC
                                      </span>
                                    )}
                                    {isLocked && (
                                      <span className="text-[8px] bg-stone-100 border border-[#E7E1D7] text-[#7A7268] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                        CHƯA MỞ
                                      </span>
                                    )}
                                  </div>
                                  <p className={`font-semibold text-xs mt-0.5 ${isCompleted ? 'text-[#7A7268] line-through' : isActive ? 'text-[#2C2825] font-bold' : 'text-[#7A7268]'}`}>
                                    {stage.title}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Midterm limit pin button */}
                                  <button
                                    onClick={() => handleToggleMidtermLimit(manual.id, stage.id)}
                                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                                      manual.midtermLimitStageId === stage.id
                                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                        : 'bg-white border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825] hover:border-[#D5CEBF]'
                                    }`}
                                    title={manual.midtermLimitStageId === stage.id ? 'Bỏ chọn mốc giữa kỳ' : 'Đánh dấu mục tiêu thi giữa kỳ'}
                                  >
                                    📌 {manual.midtermLimitStageId === stage.id ? 'Mục tiêu GK' : 'Chọn mốc GK'}
                                  </button>

                                  {isActive && (
                                    <>
                                      {onAddTodo && (
                                        <button
                                          type="button"
                                          onClick={() => handleLinkStageToTodo(manual, stage)}
                                          className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#B85D38] font-semibold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                          title="Thêm vào danh sách nhiệm vụ hôm nay"
                                        >
                                          🎯 Ôn tập
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleComprehendStage(manual.id, stage.id)}
                                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#2E6930] font-semibold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" /> Hoàn thành
                                      </button>
                                    </>
                                  )}
                                  {isLocked && (
                                    <span className="text-[9px] text-[#7A7268] font-mono italic pr-1">Chưa mở</span>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[10px] text-[#2E6930] font-mono font-semibold pr-1">+{stage.tuViReward} EXP</span>
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
        <div className="bg-white border border-dashed border-[#E7E1D7] rounded-2xl py-16 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-[#7A7268] mx-auto opacity-40" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#2C2825]">Chưa có lộ trình học tập nào</h4>
            <p className="text-xs text-[#7A7268] max-w-xs mx-auto leading-normal">
              Chưa có lộ trình nào được tạo. Hãy bấm "Thêm lộ trình mới" ở trên để xây dựng lộ trình rèn luyện kỹ năng của bạn!
            </p>
          </div>
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {editingManual && (
        <div className="fixed inset-0 z-50 bg-[#2C2825]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E1D7] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl p-6 space-y-4 font-sans text-xs text-[#2C2825]">
            <div className="flex justify-between items-center border-b border-[#F0EDE6] pb-3">
              <h3 className="text-sm font-bold text-[#2C2825] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2E6930]" />
                Chỉnh sửa lộ trình: {editingManual.name}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingManual(null)}
                className="text-[#7A7268] hover:text-[#2C2825] text-xl font-bold cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 overflow-y-auto flex-1 pr-1.5 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7A7268]">Tên lộ trình:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7A7268]">Phân loại:</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#7A7268]">Cấp độ (Độ khó):</label>
                  <select
                    value={editTier}
                    onChange={e => setEditTier(e.target.value as ManualTier)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] focus:bg-white cursor-pointer transition-all"
                  >
                    <option value="HOANG">Cơ bản (+10 EXP/chặng)</option>
                    <option value="HUYEN">Trung cấp (+15 EXP/chặng)</option>
                    <option value="DIA">Nâng cao (+25 EXP/chặng)</option>
                    <option value="THIEN">Chuyên sâu (+35 EXP/chặng)</option>
                    <option value="THAN">Đỉnh cao (+50 EXP/chặng)</option>
                  </select>
                </div>
              </div>

              {/* Stages List Manager */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#7A7268] block">Quản lý các giai đoạn:</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-[#E7E1D7] p-2.5 bg-[#FAF8F5] rounded-xl pr-1.5">
                  {editStages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-2 bg-white border border-[#E7E1D7] rounded-lg p-2 shadow-xs">
                      {/* Completion Checkbox */}
                      <input
                        type="checkbox"
                        checked={stage.isCompleted}
                        onChange={() => handleToggleEditStageComplete(stage.id)}
                        className="w-4 h-4 rounded border-[#E7E1D7] text-[#2E6930] focus:ring-[#2E6930] cursor-pointer"
                        title="Đánh dấu trạng thái hoàn thành"
                      />
                      
                      {/* In-place title edit */}
                      <input
                        type="text"
                        value={stage.title}
                        onChange={e => handleUpdateEditStageText(stage.id, e.target.value)}
                        className="flex-1 bg-transparent border-none p-0 text-xs text-[#2C2825] focus:outline-none focus:ring-0"
                      />

                      {/* Remove stage button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditStage(stage.id)}
                        className="text-[#7A7268] hover:text-rose-600 p-1 rounded transition-colors"
                        title="Xóa giai đoạn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {editStages.length === 0 && (
                    <p className="text-center text-[#7A7268] italic py-4">Chưa có giai đoạn nào. Lộ trình đang trống!</p>
                  )}
                </div>
              </div>

              {/* Add Stage Form inline */}
              <div className="space-y-1 bg-[#FAF8F5] p-3 border border-[#E7E1D7] rounded-xl">
                <label className="text-xs font-semibold text-[#7A7268] block">Thêm giai đoạn mới:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: Giai đoạn 4: Thực hành bài tập tổng hợp..."
                    value={editNewStageTitle}
                    onChange={e => setEditNewStageTitle(e.target.value)}
                    className="flex-1 bg-white border border-[#E7E1D7] rounded-xl px-3 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
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
                    className="bg-[#2E6930] hover:bg-[#245226] text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#F0EDE6]">
                <button
                  type="button"
                  onClick={() => setEditingManual(null)}
                  className="bg-white border border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825] hover:bg-[#FAF8F5] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="bg-[#2E6930] hover:bg-[#245226] text-white font-semibold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
