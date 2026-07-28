/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TodoItem, Task, Habit, CultivationState, Priority, CultivationManual } from '../types';
import { 
  Send, 
  Settings, 
  Check, 
  CheckSquare, 
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIPanelProps {
  todoItems: TodoItem[];
  tasks: Task[];
  habits: Habit[];
  manuals: CultivationManual[];
  cultState: CultivationState;
  onAddTodo: (title: string, priority: Priority, dueDate: string, description?: string) => void;
  onUpdateTodo: (updatedTodo: TodoItem) => void;
}

interface ProposedAction {
  id: string; // client-side rendering ID
  action: 'NEW' | 'MODIFY';
  taskId?: string;
  title: string;
  priority: Priority;
  dueDate: string;
  checked: boolean;
}

type ProviderType = 'gemini' | 'groq' | 'openrouter' | 'custom';

export default function AIPanel({
  todoItems,
  tasks,
  habits,
  manuals,
  cultState,
  onAddTodo,
  onUpdateTodo
}: AIPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Multi-provider settings
  const [provider, setProvider] = useState<ProviderType>(() => {
    return (localStorage.getItem('tlk_ai_provider') as ProviderType) || 'gemini';
  });

  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('tlk_gemini_api_key') || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('tlk_groq_api_key') || '');
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('tlk_openrouter_api_key') || '');
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('tlk_custom_api_key') || '');
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('tlk_custom_api_url') || 'https://api.openai.com/v1');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('tlk_custom_model') || 'gpt-4o-mini');

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('tlk_gemini_model');
    if (saved === 'gemini-2.5-flash') return 'gemini-1.5-flash';
    return saved || 'gemini-1.5-flash';
  });

  const [advice, setAdvice] = useState<string>(() => {
    const cached = localStorage.getItem('tlk_ai_advice');
    if (cached && (cached.includes('gặp trục trặc') || cached.includes('error') || cached.includes('Quota exceeded') || cached.includes('not found'))) {
      return 'Chào mừng đạo hữu đến với Thiên Cơ Các! Hãy cấu hình API Key để triệu hồi Tông chủ lên kế hoạch tu luyện.';
    }
    return cached || 'Chào mừng đạo hữu đến với Thiên Cơ Các! Hãy cấu hình API Key để triệu hồi Tông chủ lên kế hoạch tu luyện.';
  });

  const [proposals, setProposals] = useState<ProposedAction[]>(() => {
    try {
      const stored = localStorage.getItem('tlk_ai_proposals');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Local key inputs for settings UI
  const [inputKeyTemp, setInputKeyTemp] = useState('');

  // Auto-fill temp input on provider or keys change
  useEffect(() => {
    if (provider === 'gemini') setInputKeyTemp(geminiKey);
    else if (provider === 'groq') setInputKeyTemp(groqKey);
    else if (provider === 'openrouter') setInputKeyTemp(openRouterKey);
    else if (provider === 'custom') setInputKeyTemp(customKey);
  }, [provider, geminiKey, groqKey, openRouterKey, customKey]);

  const activeKey = provider === 'gemini' ? geminiKey 
                  : provider === 'groq' ? groqKey 
                  : provider === 'openrouter' ? openRouterKey 
                  : customKey;

  const [isConfiguringKey, setIsConfiguringKey] = useState(!activeKey);

  const [prompt, setPrompt] = useState('');

  // Persists settings
  useEffect(() => {
    localStorage.setItem('tlk_ai_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('tlk_gemini_api_key', geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    localStorage.setItem('tlk_groq_api_key', groqKey);
  }, [groqKey]);

  useEffect(() => {
    localStorage.setItem('tlk_openrouter_api_key', openRouterKey);
  }, [openRouterKey]);

  useEffect(() => {
    localStorage.setItem('tlk_custom_api_key', customKey);
  }, [customKey]);

  useEffect(() => {
    localStorage.setItem('tlk_custom_api_url', customUrl);
  }, [customUrl]);

  useEffect(() => {
    localStorage.setItem('tlk_custom_model', customModel);
  }, [customModel]);

  useEffect(() => {
    localStorage.setItem('tlk_gemini_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('tlk_ai_advice', advice);
  }, [advice]);

  useEffect(() => {
    localStorage.setItem('tlk_ai_proposals', JSON.stringify(proposals));
  }, [proposals]);

  const saveApiKey = () => {
    const key = inputKeyTemp.trim();
    if (provider === 'gemini') setGeminiKey(key);
    else if (provider === 'groq') setGroqKey(key);
    else if (provider === 'openrouter') setOpenRouterKey(key);
    else if (provider === 'custom') setCustomKey(key);
    setIsConfiguringKey(false);
  };

  const removeApiKey = () => {
    if (provider === 'gemini') setGeminiKey('');
    else if (provider === 'groq') setGroqKey('');
    else if (provider === 'openrouter') setOpenRouterKey('');
    else if (provider === 'custom') setCustomKey('');
    setInputKeyTemp('');
    setIsConfiguringKey(true);
  };

  const handleQuickSuggestion = (text: string) => {
    setPrompt(text);
  };

  const compileContext = () => {
    const formattedStats = {
      level: cultState.level,
      totalExp: cultState.totalExp,
      linhThach: cultState.linhThach,
      stats: {
        focus: 50 + (cultState.meditationMinutes / 10),
        willpower: 50 + (cultState.habitsCompletedCount * 2),
        mindset: 50 + (cultState.tasksCompletedCount * 3),
        wealth: 50 + (cultState.linhThach / 10),
        wisdom: 50 + (cultState.level * 2)
      }
    };

    const pendingTasks = todoItems
      .filter(t => !t.isCompleted)
      .map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate || 'No Date', priority: t.difficulty || 'SO_CAP' }));

    const completedTasks = todoItems
      .filter(t => t.isCompleted)
      .map(t => ({ title: t.title, completedAt: t.completedAt }));

    const formattedHabits = habits.map(h => ({
      title: h.title,
      streak: h.streak,
      completionRate: Object.values(h.history).filter(Boolean).length
    }));

    const pomodoroTasks = tasks.map(t => ({
      title: t.title,
      isCompleted: t.isCompleted,
      priority: t.priority
    }));

    const formattedManuals = manuals.map(m => {
      const totalStages = m.stages.length;
      const completedStages = m.stages.filter(s => s.isCompleted).length;
      const limitStage = m.midtermLimitStageId ? m.stages.find(s => s.id === m.midtermLimitStageId) : null;
      return {
        name: m.name,
        category: m.category,
        tier: m.tier,
        status: m.status,
        progress: `${completedStages}/${totalStages} stages completed`,
        midtermExamDate: m.midtermExamDate || 'Not set',
        finalExamDate: m.finalExamDate || 'Not set',
        midtermLimitStage: limitStage ? limitStage.title : 'None (Full contents for midterm)',
        stages: m.stages.map(s => ({
          title: s.title,
          isCompleted: s.isCompleted,
          isMidtermLimit: s.id === m.midtermLimitStageId
        }))
      };
    });

    return `
=== USER CULTIVATION CONTEXT ===
- Level: ${formattedStats.level}
- Linh Thach: ${formattedStats.linhThach}
- Core Attributes: Focus: ${Math.min(100, Math.round(formattedStats.stats.focus))}, Willpower: ${Math.min(100, Math.round(formattedStats.stats.willpower))}, Mindset: ${Math.min(100, Math.round(formattedStats.stats.mindset))}, Wealth: ${Math.min(100, Math.round(formattedStats.stats.wealth))}, Wisdom: ${Math.min(100, Math.round(formattedStats.stats.wisdom))}
- Active Tasks (Nhiệm Vụ): ${JSON.stringify(pendingTasks)}
- Completed Tasks: ${JSON.stringify(completedTasks.slice(0, 10))}
- Habits (Công Pháp): ${JSON.stringify(formattedHabits)}
- Pomodoro Day Tasks: ${JSON.stringify(pomodoroTasks)}
- Spells/Manuals (Môn Công Pháp Đang Học): ${JSON.stringify(formattedManuals)}
- Current Date (Hôm nay): ${new Date().toISOString().split('T')[0]}
`;
  };

  const executeAIPlanning = async () => {
    if (!activeKey) return;
    if (!prompt.trim()) return;

    setIsLoading(true);
    const context = compileContext();

    const systemInstruction = `
You are the "Tông chủ Thiên Cơ Các" (Sect Master of the Celestial Planning Sect), a wise, prestigious, and highly authoritative AI mentor guiding the user on their path to cultivation and high productivity (Zenflow).
You speak in a grand, mystical, and encouraging cultivation (tu tiên) tone. Address the user as "đạo hữu" and refer to yourself as "Bản Tông chủ".
Analyze the user's progress: level, stats, habits, and tasks. Suggest adjustments to their plans.

- If the user is just chatting, asking general questions, seeking advice, or discussing topics without explicitly requesting to plan, schedule, add, edit, or reschedule tasks, respond in a helpful, conversational tu-tiên tone in the "advice" field, and return "proposals": [] (an empty array). DO NOT suggest or create any task proposals in this case.
- Only populate the "proposals" array when the user explicitly requests to create, add, modify, schedule, reschedule, or organize tasks/activities.

You MUST respond strictly in the following JSON format. Do not return any other text, markdown blocks, or notes. Your output must be a single parsable JSON object.

Format:
{
  "advice": "Your response, feedback, or general conversation in tu-tiên style in Vietnamese.",
  "proposals": [
    {
      "action": "NEW" | "MODIFY",
      "taskId": "If action is MODIFY, provide the corresponding task id from Active Tasks",
      "title": "Title of the task",
      "priority": "SO_CAP" | "TRUNG_CAP" | "CAO_CAP" | "THAN_CAP",
      "dueDate": "YYYY-MM-DD"
    }
  ]
}

Note: For "action": "MODIFY", taskId must match one of the task IDs in the active tasks. Ensure dates are realistic and relative to the Current Date.
`;

    try {
      let rawText = '';

      if (provider === 'gemini') {
        // --- GOOGLE GEMINI PROVIDER ---
        let targetModel = selectedModel === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : selectedModel;
        let response;
        let url = `https://generativelanguage.googleapis.com/v1/models/${targetModel}:generateContent?key=${activeKey}`;
        
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemInstruction },
                    { text: context },
                    { text: `USER REQUEST: ${prompt}` }
                  ]
                }
              ],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!response.ok) {
            console.log("Zenflow AI: Stable v1 endpoint failed, trying v1beta endpoint...");
            url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${activeKey}`;
            response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: systemInstruction },
                      { text: context },
                      { text: `USER REQUEST: ${prompt}` }
                    ]
                  }
                ],
                generationConfig: { responseMimeType: "application/json" }
              })
            });
          }
        } catch (fetchErr) {
          console.warn("Zenflow AI: v1 fetch failed, falling back to v1beta...", fetchErr);
          url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${activeKey}`;
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemInstruction },
                    { text: context },
                    { text: `USER REQUEST: ${prompt}` }
                  ]
                }
              ],
              generationConfig: { responseMimeType: "application/json" }
            })
          });
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData?.error?.message || `HTTP error ${response.status}`;
          throw new Error(msg);
        }

        const data = await response.json();
        rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      } else {
        // --- OPENAI-COMPATIBLE PROVIDERS (Groq, OpenRouter, Custom) ---
        let endpoint = '';
        let modelName = '';
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        };

        if (provider === 'groq') {
          endpoint = 'https://api.groq.com/openai/v1/chat/completions';
          modelName = 'llama-3.3-70b-versatile';
        } else if (provider === 'openrouter') {
          endpoint = 'https://openrouter.ai/api/v1/chat/completions';
          modelName = 'google/gemini-2.0-flash-exp:free';
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'Zenflow';
        } else {
          endpoint = `${customUrl}/chat/completions`;
          modelName = customModel;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: `${context}\n\nUSER REQUEST: ${prompt}` }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData?.error?.message || errorData?.error || `HTTP error ${response.status}`;
          throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }

        const data = await response.json();
        rawText = data?.choices?.[0]?.message?.content || '';
      }

      // Parse JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAdvice(parsed.advice || '');
        
        const rawProposals = parsed.proposals || [];
        const mappedProposals: ProposedAction[] = rawProposals.map((p: any, idx: number) => {
          let finalDueDate = new Date().toISOString().split('T')[0];
          if (p.dueDate) {
            try {
              const parsedDate = new Date(p.dueDate);
              if (!isNaN(parsedDate.getTime())) {
                const y = parsedDate.getFullYear();
                const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const d = String(parsedDate.getDate()).padStart(2, '0');
                finalDueDate = `${y}-${m}-${d}`;
              }
            } catch (e) {
              console.warn("AI returned unparsable date:", p.dueDate);
            }
          }

          return {
            id: `proposal_${Date.now()}_${idx}`,
            action: p.action === 'MODIFY' ? 'MODIFY' : 'NEW',
            taskId: p.taskId || undefined,
            title: p.title || '',
            priority: p.priority || 'SO_CAP',
            dueDate: finalDueDate,
            checked: true
          };
        });
        
        setProposals(mappedProposals);
        setPrompt('');
      } else {
        throw new Error('AI output did not contain valid JSON.');
      }
    } catch (err: any) {
      console.error('AI Planning Error:', err);
      setAdvice(`Bản Tông chủ gặp trục trặc khi dò tìm thiên cơ cát hung. Có thể do linh thạch (API Key) không hợp lệ hoặc kết nối bị nhiễu loạn. Chi tiết: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProposal = (id: string, updates: Partial<ProposedAction>) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleApplyChanges = () => {
    const selectedProposals = proposals.filter(p => p.checked);
    if (selectedProposals.length === 0) return;

    let addedCount = 0;
    let modifiedCount = 0;

    selectedProposals.forEach(p => {
      if (p.action === 'NEW') {
        onAddTodo(p.title, p.priority, p.dueDate);
        addedCount++;
      } else if (p.action === 'MODIFY' && p.taskId) {
        const original = todoItems.find(item => item.id === p.taskId);
        if (original) {
          onUpdateTodo({
            ...original,
            title: p.title,
            difficulty: p.priority,
            dueDate: p.dueDate
          });
          modifiedCount++;
        }
      }
    });

    setProposals([]);
    setAdvice(`Khởi bẩm đạo hữu! Pháp trận Thiên Cơ đã vận hành hoàn chỉnh. Đã thêm mới thành công ${addedCount} nhiệm vụ, điều chỉnh ${modifiedCount} nhiệm vụ trên bảng chính!`);
  };

  return (
    <>
      {/* 📜 Floating Jade Slip Button */}
      <div 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-emerald-500 border-3 border-slate-950 text-slate-950 rounded-2xl shadow-[3px_3px_0px_#000] active:translate-y-[2px] active:shadow-none animate-float cursor-pointer flex flex-col items-center justify-center gap-0.5 hover:bg-emerald-450 group transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.55)]"
        title="Thiên Cơ Các (AI Planner)"
      >
        <span className="text-xl">📜</span>
        <span className="text-[7.5px] font-black tracking-wider uppercase font-mono group-hover:text-emerald-950">Thiên Cơ</span>
      </div>

      {/* Slide-out Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Main Side Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-[#0d1420] border-l-[3px] border-slate-950 shadow-[-5px_0_0_rgba(0,0,0,0.5)] z-50 p-5 flex flex-col justify-between overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-950 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔮</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest pixel-label">
                      Thiên Cơ Các
                    </h3>
                    <p className="text-[9px] text-slate-500 font-mono">Tông Chủ: AI Quân Sư Tu Luyện</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConfiguringKey(prev => !prev)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-slate-300 cursor-pointer"
                    title="Thiết lập Trận Pháp Key"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-rose-400 cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {/* 🔑 API Configurations */}
                {isConfiguringKey && (
                  <div className="neo-card p-4 bg-slate-950 space-y-3">
                    <h4 className="text-[11px] font-black text-amber-400 flex items-center gap-1.5 uppercase">
                      ⚙️ Cấu Hình Trận Pháp AI
                    </h4>
                    
                    {/* Provider Select */}
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] text-slate-550 block font-bold uppercase">Nhà Cung Cấp (Provider)</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as ProviderType)}
                        className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="gemini">Google Gemini (Miễn phí)</option>
                        <option value="groq">Groq (Miễn phí - Không giới hạn - Khuyên dùng)</option>
                        <option value="openrouter">OpenRouter (Nhiều mô hình miễn phí)</option>
                        <option value="custom">Custom (OpenAI-compatible)</option>
                      </select>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-1 text-left">
                      <label className="text-[8px] text-slate-550 block font-bold uppercase">
                        {provider === 'gemini' ? 'Gemini API Key (AIzaSy...)'
                         : provider === 'groq' ? 'Groq API Key (gsk_...)'
                         : provider === 'openrouter' ? 'OpenRouter API Key (sk-or-...)'
                         : 'Custom API Key'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder={
                            provider === 'gemini' ? 'AIzaSy...' 
                            : provider === 'groq' ? 'gsk_...' 
                            : provider === 'openrouter' ? 'sk-or-...' 
                            : 'sk-...'
                          }
                          value={inputKeyTemp}
                          onChange={(e) => setInputKeyTemp(e.target.value)}
                          className="flex-1 bg-slate-900 border-2 border-slate-950 rounded-lg px-2.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                        />
                        <button
                          onClick={saveApiKey}
                          className="px-3 py-1 neo-btn neo-btn-success text-[10px] font-bold"
                        >
                          LƯU
                        </button>
                      </div>
                    </div>

                    {/* Gemini Specific settings */}
                    {provider === 'gemini' && (
                      <div className="space-y-1 text-left">
                        <label className="text-[8.5px] text-slate-500 font-bold uppercase block">Mô Hình (Model)</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-[10px] text-slate-350 focus:outline-none focus:border-amber-400 font-mono font-bold cursor-pointer"
                        >
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Mặc định)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                          <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                        </select>
                      </div>
                    )}

                    {/* Custom Specific settings */}
                    {provider === 'custom' && (
                      <div className="space-y-2 text-left">
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-550 block font-bold uppercase">Endpoint URL</label>
                          <input
                            type="text"
                            placeholder="https://api.openai.com/v1"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-[10px] text-slate-250 focus:outline-none focus:border-amber-400 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-550 block font-bold uppercase">Model Name</label>
                          <input
                            type="text"
                            placeholder="gpt-4o-mini"
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            className="w-full bg-slate-900 border-2 border-slate-950 rounded-lg px-2 py-1 text-[10px] text-slate-250 focus:outline-none focus:border-amber-400 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* Helpers link */}
                    <div className="flex items-center justify-between text-[9px] pt-1">
                      <a
                        href={
                          provider === 'gemini' ? 'https://aistudio.google.com/app/apikey'
                          : provider === 'groq' ? 'https://console.groq.com/keys'
                          : 'https://openrouter.ai/keys'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-500 hover:underline flex items-center gap-0.5"
                      >
                        🔗 Lấy API Key miễn phí tại đây
                      </a>
                      {((provider === 'gemini' && geminiKey) || 
                        (provider === 'groq' && groqKey) || 
                        (provider === 'openrouter' && openRouterKey) || 
                        (provider === 'custom' && customKey)) && (
                        <button
                          onClick={removeApiKey}
                          className="text-rose-400 hover:text-rose-350 font-bold"
                        >
                          Xóa Key
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 📜 Tông Chủ's Advice Box */}
                <div className="neo-card p-4 bg-[#141b29] border-l-4 border-l-purple-500 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400 tracking-wider pixel-label">
                      📜 Tông Chủ Thiên Cơ Các:
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-purple-950/65 text-purple-300 font-mono uppercase font-black">
                      {provider}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {advice}
                  </p>
                </div>

                {/* 📋 Interactive Proposed Tasks */}
                {proposals.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-wider pixel-label">
                        📋 Trận Pháp Đề Xuất Nhiệm Vụ:
                      </h4>
                      <button
                        onClick={() => setProposals([])}
                        className="text-[9px] text-slate-500 hover:text-rose-400 font-bold"
                      >
                        Xóa tất cả
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {proposals.map((p) => (
                        <div 
                          key={p.id} 
                          className={`p-3 border-2 border-slate-950 rounded-xl flex items-start gap-2.5 transition-all shadow-[1.5px_1.5px_0px_#000] ${
                            p.checked ? 'bg-[#182334]' : 'bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => handleUpdateProposal(p.id, { checked: !p.checked })}
                            className="mt-0.5 text-slate-450 hover:text-slate-200 cursor-pointer shrink-0"
                          >
                            {p.checked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          {/* Editable fields */}
                          <div className="flex-1 space-y-2 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                p.action === 'NEW'
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60'
                                  : 'bg-blue-950/40 text-blue-400 border border-blue-900/60'
                              }`}>
                                {p.action === 'NEW' ? 'Thêm mới' : 'Sửa đổi'}
                              </span>
                              {p.action === 'MODIFY' && (
                                <span className="text-[8px] text-slate-500 truncate max-w-[80px]">
                                  (ID: {p.taskId?.slice(-5)})
                                </span>
                              )}
                            </div>

                            {/* Title input */}
                            <input
                              type="text"
                              value={p.title}
                              onChange={(e) => handleUpdateProposal(p.id, { title: e.target.value })}
                              placeholder="Tiêu đề nhiệm vụ..."
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-amber-400"
                            />

                            {/* Date and Priority row */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[7.5px] text-slate-550 block mb-0.5 font-bold uppercase">Hạn Chót</label>
                                <input
                                  type="date"
                                  value={p.dueDate}
                                  onChange={(e) => handleUpdateProposal(p.id, { dueDate: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[9px] text-slate-300 focus:outline-none focus:border-amber-400 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[7.5px] text-slate-550 block mb-0.5 font-bold uppercase">Phẩm Cấp</label>
                                <select
                                  value={p.priority}
                                  onChange={(e) => handleUpdateProposal(p.id, { priority: e.target.value as Priority })}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[9px] text-slate-300 focus:outline-none focus:border-amber-400 font-bold"
                                >
                                  <option value="SO_CAP">Sơ Cấp</option>
                                  <option value="TRUNG_CAP">Trung Cấp</option>
                                  <option value="CAO_CAP">Địa Cấp</option>
                                  <option value="THAN_CAP">Thiên Cấp</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleApplyChanges}
                      className="w-full py-2.5 neo-btn neo-btn-success text-[10.5px] font-black tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      THỰC THI PHÁP TRẬN (APPLY PLAN)
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Input area */}
              <div className="mt-4 pt-3 border-t-2 border-slate-950 space-y-3 shrink-0">
                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5 justify-start">
                  <button
                    onClick={() => handleQuickSuggestion('Hãy phân tích tiến độ học các công pháp hiện tại của ta và lên kế hoạch hoàn thành cụ thể.')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer font-sans font-medium"
                  >
                    📜 Lịch tu luyện Công Pháp
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('Hãy phân tích thói quen đang yếu và lên kế hoạch ngày mai để cân bằng Đạo tâm.')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer font-sans font-medium"
                  >
                    ⚖️ Cân bằng Đạo tâm (Thói quen)
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('Hãy phân tích các nhiệm vụ còn tồn đọng trong Bảng nhiệm vụ tông môn và đề xuất sắp xếp thứ tự ưu tiên hợp lý.')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer font-sans font-medium"
                  >
                    ⚔️ Sắp xếp Nhiệm vụ Tông môn
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('Hãy phân tích tiến độ tu luyện hôm nay (công pháp, thói quen, thiền định) và đề xuất kế hoạch ngày mai để tối ưu hóa tăng tu vi.')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer font-sans font-medium"
                  >
                    🔮 Dò tìm Thiên Cơ ngày mai
                  </button>
                  <button
                    onClick={() => handleQuickSuggestion('Hãy chia nhỏ mục tiêu lớn sau đây thành các nhiệm vụ sơ cấp, trung cấp cụ thể theo lộ trình 7 ngày: [Điền mục tiêu của đạo hữu tại đây]')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer font-sans font-medium"
                  >
                    🔨 Chia nhỏ Mục tiêu Lớn
                  </button>
                </div>

                {/* Main input form */}
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        executeAIPlanning();
                      }
                    }}
                    placeholder={
                      !activeKey 
                        ? `Vui lòng điền API Key cho ${provider.toUpperCase()} ở phần cài đặt...` 
                        : 'Ví dụ: Ta muốn tăng tu vi nhanh nhất trong ngày mai...'
                    }
                    disabled={!activeKey || isLoading}
                    className="flex-1 bg-slate-950 border-2 border-slate-950 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-400 placeholder-slate-600 resize-none font-sans"
                  />
                  <button
                    onClick={executeAIPlanning}
                    disabled={!activeKey || isLoading || !prompt.trim()}
                    className={`w-12 neo-btn shrink-0 ${
                      isLoading || !prompt.trim() 
                        ? 'bg-slate-900 border-slate-850 text-slate-650 cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]' 
                        : 'neo-btn-primary'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
