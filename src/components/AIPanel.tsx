/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TodoItem, 
  Task, 
  Habit, 
  CultivationState, 
  Priority, 
  normalizePriority,
  getTodoPriority,
  CultivationManual,
  GradeSubject,
  SemesterGPA,
  CalendarEvent,
  CalendarGroup,
  IeltsTestLog,
  CultivationNote
} from '../types';
import { 
  Send, 
  Settings, 
  Check, 
  CheckSquare, 
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Bot,
  User as UserIcon,
  Calendar as CalendarIcon,
  BookOpen,
  Trash2,
  RotateCcw,
  X,
  Compass,
  Zap,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AIPanelProps {
  todoItems: TodoItem[];
  tasks: Task[];
  habits: Habit[];
  manuals: CultivationManual[];
  cultState?: any;
  gradeSubjects?: GradeSubject[];
  cpaOverall?: number;
  semesterGpaList?: SemesterGPA[];
  calendarEvents?: CalendarEvent[];
  calendarGroups?: CalendarGroup[];
  ieltsLogs?: IeltsTestLog[];
  notes?: CultivationNote[];
  isOpen?: boolean;
  onClose?: () => void;
  onAddTodo: (title: string, priority: Priority, dueDate: string, description?: string) => void;
  onUpdateTodo: (updatedTodo: TodoItem) => void;
  onDeleteTodo?: (id: string) => void;
  onAddCalendarEvent?: (summary: string, startDate: string, endDate: string, calendarGroupId?: string) => void;
  onUpdateCalendarEvent?: (eventId: string, summary: string, startDate: string, endDate: string) => void;
  onDeleteCalendarEvent?: (eventId: string) => void;
  onCreateManual?: (name: string, category: string, stages: string[]) => void;
}

export interface ProposedAction {
  id: string; // Client rendering ID
  type: 'TASK' | 'TASK_EDIT' | 'TASK_DELETE' | 'CALENDAR' | 'CALENDAR_EDIT' | 'CALENDAR_DELETE' | 'MANUAL';
  action?: 'NEW' | 'MODIFY' | 'DELETE';
  taskId?: string;
  eventId?: string;
  calendarGroupId?: string;
  title: string;
  priority?: Priority;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  stages?: string[];
  checked: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string; // DeepSeek R1 <think> block
  proposals?: ProposedAction[];
  timestamp: string;
}

type ProviderType = 'gemini' | 'groq' | 'openrouter' | 'custom';
export type AIPersonaType = 'CO_VAN' | 'HIEU_SUAT' | 'DONG_HANH' | 'MO_UYEN' | 'TONG_CHU' | 'TU_DO_NAM';

export default function AIPanel({
  todoItems,
  tasks,
  habits,
  manuals,
  cultState,
  gradeSubjects = [],
  cpaOverall = 0,
  semesterGpaList = [],
  calendarEvents = [],
  calendarGroups = [],
  ieltsLogs = [],
  notes = [],
  isOpen: externalIsOpen,
  onClose,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onAddCalendarEvent,
  onUpdateCalendarEvent,
  onDeleteCalendarEvent,
  onCreateManual
}: AIPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isPanelOpen = externalIsOpen !== undefined ? externalIsOpen : internalOpen;
  const handleClose = () => {
    if (onClose) onClose();
    setInternalOpen(false);
  };
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Multi-provider settings
  const [provider, setProvider] = useState<ProviderType>(() => {
    return (localStorage.getItem('tlk_ai_provider') as ProviderType) || 'groq';
  });

  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('tlk_gemini_api_key') || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('tlk_groq_api_key') || '');
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('tlk_openrouter_api_key') || '');
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('tlk_custom_api_key') || '');
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('tlk_custom_api_url') || 'https://api.openai.com/v1');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('tlk_custom_model') || 'gpt-4o-mini');

  // Dynamic Groq Models state fetched directly from https://api.groq.com/openai/v1/models
  const [availableGroqModels, setAvailableGroqModels] = useState<string[]>([
    'llama-3.3-70b-versatile',
    'deepseek-r1-distill-llama-70b',
    'qwen-2.5-coder-32b',
    'gemma2-9b-it'
  ]);

  const [groqModel, setGroqModel] = useState<string>(() => {
    const saved = localStorage.getItem('tlk_groq_model');
    if (!saved || saved.includes('3.1-8b') || saved === 'llama-3.1-8b-instant') {
      return 'llama-3.3-70b-versatile';
    }
    return saved;
  });

  // Automatically migrate away from decommissioned models on load
  useEffect(() => {
    if (groqModel.includes('3.1-8b') || groqModel === 'llama-3.1-8b-instant') {
      setGroqModel('llama-3.3-70b-versatile');
      localStorage.setItem('tlk_groq_model', 'llama-3.3-70b-versatile');
    }
  }, [groqModel]);

  // Dynamically query Groq Models API for the exact active model list for user's key
  useEffect(() => {
    if (provider === 'groq' && groqKey.trim()) {
      fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${groqKey.trim()}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            const fetchedIds = data.data
              .map((m: any) => m.id)
              .filter((id: string) => 
                id && 
                !id.includes('whisper') && 
                !id.includes('safetensors') && 
                !id.includes('guard') &&
                !id.includes('3.1-8b') // filter out deprecated llama-3.1-8b
              );
            if (fetchedIds.length > 0) {
              setAvailableGroqModels(fetchedIds);
              setGroqModel(prev => {
                if (prev && fetchedIds.includes(prev) && !prev.includes('3.1-8b')) return prev;
                return fetchedIds.includes('llama-3.3-70b-versatile') ? 'llama-3.3-70b-versatile' : fetchedIds[0];
              });
            }
          }
        })
        .catch(err => console.warn('Error fetching Groq models list API:', err));
    }
  }, [groqKey, provider]);

  // Gemini Model Selector
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('tlk_gemini_model');
    if (saved === 'gemini-2.5-flash') return 'gemini-1.5-flash';
    return saved || 'gemini-1.5-flash';
  });

  // Multi-turn Chat Messages History (Resets fresh on page reload)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'init_msg',
        role: 'assistant',
        content: 'Xin chào! Mình là Trợ lý AI học tập của bạn. Mình có thể giúp bạn lập kế hoạch tuần, phân bổ thời gian học, quản lý nhiệm vụ (/task) hoặc sắp xếp lịch trình (/calendar). Hôm nay bạn cần hỗ trợ gì?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Active reasoning visibility toggles
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  // Local key inputs for settings UI
  const [inputKeyTemp, setInputKeyTemp] = useState('');
  const [prompt, setPrompt] = useState('');
  const activeKey = provider === 'gemini' ? geminiKey 
                  : provider === 'groq' ? groqKey 
                  : provider === 'openrouter' ? openRouterKey 
                  : customKey;

  const [isConfiguringKey, setIsConfiguringKey] = useState(!activeKey);

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
    localStorage.setItem('tlk_groq_model', groqModel);
  }, [groqModel]);

  useEffect(() => {
    localStorage.setItem('tlk_gemini_model', selectedModel);
  }, [selectedModel]);



  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isPanelOpen, isLoading]);

  // Auto-fill temp input on provider change
  useEffect(() => {
    if (provider === 'gemini') setInputKeyTemp(geminiKey);
    else if (provider === 'groq') setInputKeyTemp(groqKey);
    else if (provider === 'openrouter') setInputKeyTemp(openRouterKey);
    else if (provider === 'custom') setInputKeyTemp(customKey);
  }, [provider, geminiKey, groqKey, openRouterKey, customKey]);

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

  const handleClearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với AI không?')) {
      const clearText = 'Lịch sử trò chuyện đã được làm mới. Trợ lý AI sẵn sàng hỗ trợ bạn!';
      setChatHistory([
        {
          id: `init_${Date.now()}`,
          role: 'assistant',
          content: clearText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const getLocalDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const compileContext = (query: string = '') => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[now.getDay()];
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Read projects & master tasks from storage so AI knows full project hierarchy
    let userProjects: string[] = [];
    let userMasterTasks: { title: string; project: string }[] = [];
    try {
      const savedPrj = localStorage.getItem('tlk_beaver_projects');
      if (savedPrj) userProjects = JSON.parse(savedPrj);
      const savedMt = localStorage.getItem('tlk_beaver_master_tasks');
      if (savedMt) userMasterTasks = JSON.parse(savedMt);
    } catch (e) {}

    // 1. Tasks for Today (due today)
    const todayTodos = todoItems.filter(t => t.dueDate === todayStr);
    const todayPending = todayTodos.filter(t => !t.isCompleted);
    const todayDone = todayTodos.filter(t => t.isCompleted);

    // 2. Overdue Tasks (past due date & incomplete)
    const overdueTodos = todoItems.filter(t => !t.isCompleted && t.dueDate && t.dueDate < todayStr);

    // 3. Upcoming Tasks in current week
    const upcomingTodos = todoItems.filter(t => !t.isCompleted && t.dueDate && t.dueDate > todayStr).slice(0, 20);

    // 4. Backlog / Unscheduled Tasks
    const backlogTodos = todoItems.filter(t => !t.isCompleted && !t.dueDate).slice(0, 20);

    // 5. Today's Calendar Events
    const todayTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000;
    const thirtyDaysLater = todayTimestamp + 30 * 24 * 60 * 60 * 1000;

    const todayEvents = calendarEvents.filter(e => {
      const dateStr = e.start?.dateTime || e.start?.date;
      if (!dateStr) return false;
      const d = new Date(dateStr).getTime();
      return d >= todayTimestamp && d < tomorrowTimestamp;
    });

    const activeEvents = calendarEvents.filter(e => {
      const dateStr = e.start?.dateTime || e.start?.date;
      if (!dateStr) return false;
      const d = new Date(dateStr).getTime();
      return d >= todayTimestamp && d <= thirtyDaysLater;
    }).slice(0, 25);

    const formattedGroupsStr = (calendarGroups || []).map(g => `[Group ID:${g.id}] Name: ${g.summary}`).join('\n');

    let contextParts: string[] = [
      `=== THỜI GIAN THỰC TẾ HIỆN TẠI ===`,
      `- Thời gian: ${currentTimeStr}, ${dayOfWeek}, ngày ${todayStr}`,
      `- CPA hiện tại: ${cpaOverall.toFixed(2)} | Tổng nhiệm vụ: ${todoItems.filter(t => !t.isCompleted).length} đang chờ, ${todoItems.filter(t => t.isCompleted).length} đã hoàn thành`,
      ``,
      `=== CÔNG VIỆC HÔM NAY (NGÀY ${todayStr} - ${dayOfWeek}) ===`,
      `Tổng số việc hôm nay: ${todayTodos.length} (${todayPending.length} việc cần làm, ${todayDone.length} việc đã xong):`,
      todayPending.length > 0 
        ? todayPending.map(t => `- [ID:${t.id}] [Dự án: ${t.project || 'Chung'}] [Ưu tiên: ${getTodoPriority(t)}] ⭕ CẦN LÀM: ${t.title}`).join('\n')
        : `- (Không có công việc nào chưa xong trong hôm nay)`,
      todayDone.length > 0 
        ? todayDone.map(t => `- [ID:${t.id}] [Dự án: ${t.project || 'Chung'}] ✅ ĐÃ HOÀN THÀNH: ${t.title}`).join('\n')
        : '',
      ``,
      `=== CÔNG VIỆC QUÁ HẠN (CẦN LÀM NGAY) ===`,
      overdueTodos.length > 0 
        ? overdueTodos.map(t => `- [ID:${t.id}] [Dự án: ${t.project || 'Chung'}] [Hạn: ${t.dueDate}] [Ưu tiên: ${getTodoPriority(t)}] ⚠️ QUÁ HẠN: ${t.title}`).join('\n')
        : `- (Không có việc quá hạn)`,
      ``,
      `=== CÔNG VIỆC SẮP TỚI TRONG TUẦN ===`,
      upcomingTodos.length > 0
        ? upcomingTodos.map(t => `- [ID:${t.id}] [Hạn: ${t.dueDate}] [Dự án: ${t.project || 'Chung'}]: ${t.title}`).join('\n')
        : `- (Không có việc sắp tới)`,
      ``,
      `=== VIỆC CHƯA XẾP NGÀY / BACKLOG ===`,
      backlogTodos.length > 0
        ? backlogTodos.map(t => `- [ID:${t.id}] [Dự án: ${t.project || 'Chung'}]: ${t.title}`).join('\n')
        : `- (Trống)`,
      ``,
      `=== CÁC DỰ ÁN & ĐẦU VIỆC TRONG DỰ ÁN ===`,
      userProjects.length > 0
        ? userProjects.map(p => {
            const pTasks = userMasterTasks.filter(m => m.project.toLowerCase() === p.toLowerCase()).map(m => m.title);
            return `* Dự án "${p}": ${pTasks.length > 0 ? pTasks.join(', ') : '(Chưa có đầu việc con nào)'}`;
          }).join('\n')
        : `- (Chưa có dự án nào)`,
      ``,
      `=== LỊCH BIỂU & SỰ KIỆN HÔM NAY (${todayStr}) ===`,
      todayEvents.length > 0
        ? todayEvents.map(e => {
            const startStr = (e.start?.dateTime || e.start?.date || '').replace('T', ' ').substring(0, 16);
            const endStr = (e.end?.dateTime || e.end?.date || '').split('T')[1]?.substring(0, 5) || '';
            return `- [ID:${e.id}] ${endStr ? startStr + ' đến ' + endStr : startStr} | ${e.summary}`;
          }).join('\n')
        : `- (Hôm nay không có sự kiện lịch nào)`,
      ``,
      `=== LỊCH TRÌNH CÁC NGÀY TỚI ===`,
      activeEvents.length > 0
        ? activeEvents.map(e => {
            const startStr = (e.start?.dateTime || e.start?.date || '').replace('T', ' ').substring(0, 16);
            const endStr = (e.end?.dateTime || e.end?.date || '').split('T')[1]?.substring(0, 5) || '';
            return `- [ID:${e.id}] ${endStr ? startStr + ' đến ' + endStr : startStr} | ${e.summary}`;
          }).join('\n')
        : `- (Không có sự kiện lịch)`,
      ``,
      `=== NHÓM LỊCH CÓ SẴN (CALENDAR GROUPS) ===`,
      formattedGroupsStr || 'None'
    ];

    return `=== CONTEXT DỮ LIỆU THỰC TẾ CỦA NGƯỜI DÙNG ===\n${contextParts.filter(Boolean).join('\n')}`;
  };

  const executeAIPlanning = async (customPrompt?: string) => {
    if (!activeKey) return;
    const userQuery = (customPrompt || prompt).trim();
    if (!userQuery) return;
    setPrompt('');

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setIsLoading(true);

    const context = compileContext(userQuery);

    const personaPrompt = `
You are "Trợ lý AI" (AI Study & Productivity Assistant), a knowledgeable, empathetic, and action-oriented AI mentor in HUSTFlow.
PERSONALITY & TONE:
- Professional, encouraging, clear, and proactive in Vietnamese.
- Help the user organize weekly plans, prioritize urgent and high-impact tasks (/task), balance schedule and calendar events (/calendar), optimize GPA/CPA, and build disciplined study habits.
- Respond concisely, naturally, and helpfully in Vietnamese.
- CRITICAL: You have FULL access to the user's real-time data in the CONTEXT above (including today's tasks, overdue tasks, projects, master tasks, and calendar events). When the user asks about their tasks or schedule (e.g., "tasks hôm nay", "hôm nay có việc gì", "dự án có việc gì"), ALWAYS directly read and summarize the tasks from the context. Mention exact task names, projects, and completion status. Never say you don't have access to their tasks or schedule.
`;

    const systemInstruction = `
${personaPrompt}

TASK PRIORITY ENUM (MANDATORY):
Task priority MUST strictly be one of the following 4 enum values:
- "SO_CAP" (Novice / Sơ Cấp / Low)
- "TRUNG_CAP" (Adept / Trung Cấp / Medium)
- "CAO_CAP" (Earth / Cao Cấp / High)
- "THAN_CAP" (Heaven / Thần Cấp / Urgent / Critical)
When the user asks to set or change task priority (e.g., "cao cấp", "high", "thần cấp", "urgent", "trung cấp", "medium", "sơ cấp", "low"), map it directly to the exact corresponding enum value: "SO_CAP", "TRUNG_CAP", "CAO_CAP", or "THAN_CAP".

SLASH COMMANDS & INTENT TARGETING:
1. **"/task [query]"**: If the request starts with or contains "/task", strictly generate ONLY "TASK" proposals for the Todo List.
2. **"/calendar [query]"**: If the request starts with or contains "/calendar", strictly generate ONLY "CALENDAR" proposals for the Calendar Tab. Include calendarGroupId matching the best calendar group from context.

CALENDAR & TASK PROPOSALS (ADD / EDIT / DELETE MANDATORY FORMAT):
1. **TASK PROPOSALS**:
   - Create new task: {"type": "TASK", "action": "NEW", "title": "...", "priority": "<SO_CAP|TRUNG_CAP|CAO_CAP|THAN_CAP>", "dueDate": "YYYY-MM-DD"}
   - Modify existing task: {"type": "TASK_EDIT", "action": "MODIFY", "taskId": "<exact ID from context>", "title": "...", "priority": "<SO_CAP|TRUNG_CAP|CAO_CAP|THAN_CAP>", "dueDate": "YYYY-MM-DD"}
   - Delete existing task: {"type": "TASK_DELETE", "action": "DELETE", "taskId": "<exact ID from context>", "title": "..."}

CRITICAL RULES FOR MODIFYING EXISTING TASKS (TASK_EDIT):
- Always find the target task in [ALL ACTIVE TASKS IN SYSTEM] from context.
- Set "taskId" to the exact task ID (e.g. "todo_1740000000000", WITHOUT brackets or prefix like "[ID:]").
- When modifying priority: set "priority" to the desired Priority enum value ("SO_CAP", "TRUNG_CAP", "CAO_CAP", or "THAN_CAP"). Preserve the existing task title and dueDate unless explicitly asked to modify them.

2. **CALENDAR PROPOSALS**:
   - Create new event: {"type": "CALENDAR", "action": "NEW", "title": "...", "startDate": "YYYY-MM-DDTHH:mm", "endDate": "YYYY-MM-DDTHH:mm", "calendarGroupId": "..."}
   - Modify existing event: {"type": "CALENDAR_EDIT", "action": "MODIFY", "eventId": "<exact ID from context>", "title": "...", "startDate": "...", "endDate": "..."}
   - Delete existing event: {"type": "CALENDAR_DELETE", "action": "DELETE", "eventId": "<exact ID from context>", "title": "..."}

RULES FOR RESPONDING:
1. Respond directly and naturally to whatever the user is talking about.
2. Do NOT generate proposals unless the user explicitly asks to create, modify, delete or schedule tasks or events, or uses /task or /calendar.

You MUST respond strictly in a valid JSON object format (no extra markdown outside the JSON block unless using <think> tags for reasoning):
{
  "reasoning": "Step by step reasoning logic in Vietnamese (optional)",
  "advice": "Your natural response in Vietnamese following your persona pronouns strictly.",
  "proposals": []
}
`;

    try {
      let rawText = '';

      if (provider === 'gemini') {
        let targetModel = selectedModel === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : selectedModel;
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${activeKey}`;

        const contentsPayload = [
          {
            role: 'user',
            parts: [
              { text: systemInstruction },
              { text: context },
              ...chatHistory.slice(-6).map(m => ({ text: `${m.role.toUpperCase()}: ${m.content}` })),
              { text: `USER REQUEST: ${userQuery}` }
            ]
          }
        ];

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contentsPayload,
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        // OpenAI-compatible Providers (Groq, OpenRouter, Custom)
        let endpoint = '';
        let modelName = '';
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        };

        if (provider === 'groq') {
          endpoint = 'https://api.groq.com/openai/v1/chat/completions';
          modelName = groqModel;
        } else if (provider === 'openrouter') {
          endpoint = 'https://openrouter.ai/api/v1/chat/completions';
          modelName = 'google/gemini-2.0-flash-exp:free';
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'HUSTFlow';
        } else {
          endpoint = `${customUrl}/chat/completions`;
          modelName = customModel;
        }

        const historyPayload = chatHistory.slice(-4).map(m => {
          let cleanContent = m.content;
          if (m.role === 'assistant') {
            cleanContent = m.content.replace(/\{[\s\S]*\}/g, '').trim();
          }
          if (cleanContent.length > 250) {
            cleanContent = cleanContent.substring(0, 250) + '...';
          }
          return {
            role: m.role === 'user' ? 'user' : 'assistant',
            content: cleanContent || 'Yes, Senior Brother.'
          };
        });

        const bodyData: any = {
          model: modelName,
          messages: [
            { role: 'system', content: systemInstruction },
            ...historyPayload,
            { role: 'user', content: `${context}\n\nUSER REQUEST: ${userQuery}` }
          ]
        };

        // Remove response_format constraint to avoid Groq HTTP 400 schema validation errors
        // systemInstruction already enforces strict JSON output format naturally.

        let response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyData)
        });

        if (!response.ok && provider === 'groq') {
          const errData = await response.json().catch(() => ({}));
          console.warn(`Groq API Error ${response.status}:`, errData);

          // If 400 Bad Request, 404 Model Not Found, or 429 Rate Limit, retry with clean payload and active fallback model
          const fallbackModel = (modelName === 'llama-3.3-70b-versatile' || modelName.includes('3.1-8b'))
            ? 'deepseek-r1-distill-llama-70b'
            : 'llama-3.3-70b-versatile';
          console.warn(`Groq API Error ${response.status}! Retrying with fallback model ${fallbackModel}...`);
          bodyData.model = fallbackModel;
          delete bodyData.response_format;

          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyData)
          });

          if (response.ok) {
            setGroqModel(fallbackModel);
            localStorage.setItem('tlk_groq_model', fallbackModel);
          }
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        rawText = data?.choices?.[0]?.message?.content || '';
      }

      // 1. Extract <think> reasoning tags if present (e.g., DeepSeek R1)
      let extractedReasoning = '';
      let jsonText = rawText;

      const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
      if (thinkMatch) {
        extractedReasoning = thinkMatch[1].trim();
        jsonText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      }

      // 2. Extract JSON block
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      let parsedAdvice = jsonText;
      let parsedProposals: ProposedAction[] = [];

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedAdvice = parsed.advice || jsonText;
          if (parsed.reasoning && !extractedReasoning) {
            extractedReasoning = parsed.reasoning;
          }

          const rawProps = parsed.proposals || [];
          parsedProposals = rawProps.map((p: any, idx: number) => {
            const rawType = String(p.type || '').toUpperCase();
            const rawAction = String(p.action || '').toUpperCase();

            let action: 'NEW' | 'MODIFY' | 'DELETE' = 'NEW';
            if (rawAction === 'DELETE' || rawType.includes('DELETE')) {
              action = 'DELETE';
            } else if (rawAction === 'MODIFY' || rawAction === 'EDIT' || rawType.includes('EDIT') || rawType.includes('MODIFY')) {
              action = 'MODIFY';
            }

            let type: 'TASK' | 'TASK_EDIT' | 'TASK_DELETE' | 'CALENDAR' | 'CALENDAR_EDIT' | 'CALENDAR_DELETE' | 'MANUAL' = 'TASK';
            if (rawType.includes('CALENDAR') || rawType.includes('EVENT')) {
              type = action === 'DELETE' ? 'CALENDAR_DELETE' : action === 'MODIFY' ? 'CALENDAR_EDIT' : 'CALENDAR';
            } else if (rawType.includes('MANUAL')) {
              type = 'MANUAL';
            } else {
              type = action === 'DELETE' ? 'TASK_DELETE' : action === 'MODIFY' ? 'TASK_EDIT' : 'TASK';
            }

            const cleanTaskId = p.taskId || p.id || undefined;
            const normPriority = normalizePriority(p.priority);

            return {
              id: `prop_${Date.now()}_${idx}`,
              type,
              action,
              taskId: cleanTaskId,
              eventId: p.eventId || p.id || undefined,
              calendarGroupId: p.calendarGroupId || p.groupId || undefined,
              title: p.title || (action === 'DELETE' ? 'Delete item' : 'New Task'),
              priority: normPriority,
              dueDate: p.dueDate || new Date().toISOString().split('T')[0],
              startDate: p.startDate || undefined,
              endDate: p.endDate || undefined,
              category: p.category || 'Academic',
              stages: Array.isArray(p.stages) ? p.stages : [],
              checked: true
            };
          });
        } catch (e) {
          console.warn("JSON parsing failed, falling back to raw text", e);
        }
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        role: 'assistant',
        content: parsedAdvice,
        reasoning: extractedReasoning || undefined,
        proposals: parsedProposals.length > 0 ? parsedProposals : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI Error:', err);
      const errPrefix = 'Rất tiếc, đã xảy ra lỗi kết nối với trợ lý AI.';

      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `${errPrefix} Chi tiết lỗi: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProposal = (msgId: string, propId: string) => {
    setChatHistory(prev => prev.map(m => {
      if (m.id === msgId && m.proposals) {
        return {
          ...m,
          proposals: m.proposals.map(p => p.id === propId ? { ...p, checked: !p.checked } : p)
        };
      }
      return m;
    }));
  };

  const handleApplyProposals = (msgId: string) => {
    const msg = chatHistory.find(m => m.id === msgId);
    if (!msg || !msg.proposals) return;

    const selected = msg.proposals.filter(p => p.checked);
    if (selected.length === 0) return;

    // Helper to find matching todo item by ID or title
    const findExistingTodo = (inputTaskId?: string, inputTitle?: string) => {
      const cleanId = (inputTaskId || '').replace(/^\[?ID:\s*/i, '').replace(/\]$/, '').trim();
      if (cleanId) {
        const matchById = todoItems.find(t => t.id === cleanId || t.id.toLowerCase() === cleanId.toLowerCase());
        if (matchById) return matchById;
      }

      const candidateTitle = (inputTitle || cleanId).trim().toLowerCase();
      if (candidateTitle) {
        const exactMatch = todoItems.find(t => t.title.trim().toLowerCase() === candidateTitle);
        if (exactMatch) return exactMatch;

        const partialMatch = todoItems.find(t =>
          t.title.toLowerCase().includes(candidateTitle) || candidateTitle.includes(t.title.toLowerCase())
        );
        if (partialMatch) return partialMatch;
      }
      return undefined;
    };

    let appliedCount = 0;
    selected.forEach(p => {
      if (p.type === 'TASK_DELETE' || (p.type === 'TASK' && p.action === 'DELETE')) {
        const existing = findExistingTodo(p.taskId, p.title);
        const targetId = existing ? existing.id : (p.taskId || '').replace(/^\[?ID:\s*/i, '').replace(/\]$/, '').trim();
        if (targetId && onDeleteTodo) {
          onDeleteTodo(targetId);
          appliedCount++;
        }
      } else if (p.type === 'TASK_EDIT' || (p.type === 'TASK' && p.action === 'MODIFY')) {
        const existing = findExistingTodo(p.taskId, p.title);
        if (existing) {
          const updatedPriority = normalizePriority(p.priority || existing.difficulty);
          const safeTitle = (p.title && p.title !== existing.id && !p.title.startsWith('todo_'))
            ? p.title
            : existing.title;

          onUpdateTodo({
            ...existing,
            title: safeTitle,
            difficulty: updatedPriority,
            dueDate: p.dueDate || existing.dueDate
          });
          appliedCount++;
        }
      } else if (p.type === 'TASK' || !p.type) {
        onAddTodo(p.title, normalizePriority(p.priority), p.dueDate || new Date().toISOString().split('T')[0]);
        appliedCount++;
      } else if (p.type === 'CALENDAR_DELETE' || (p.type === 'CALENDAR' && p.action === 'DELETE')) {
        const cleanEventId = (p.eventId || '').replace(/^\[?ID:\s*/i, '').replace(/\]$/, '').trim();
        if (cleanEventId && onDeleteCalendarEvent) {
          onDeleteCalendarEvent(cleanEventId);
          appliedCount++;
        }
      } else if (p.type === 'CALENDAR_EDIT' || (p.type === 'CALENDAR' && p.action === 'MODIFY')) {
        const cleanEventId = (p.eventId || '').replace(/^\[?ID:\s*/i, '').replace(/\]$/, '').trim();
        if (cleanEventId && onUpdateCalendarEvent) {
          onUpdateCalendarEvent(
            cleanEventId,
            p.title,
            p.startDate || new Date().toISOString(),
            p.endDate || new Date(Date.now() + 3600000).toISOString()
          );
          appliedCount++;
        }
      } else if (p.type === 'CALENDAR' && onAddCalendarEvent) {
        onAddCalendarEvent(
          p.title,
          p.startDate || new Date().toISOString(),
          p.endDate || new Date(Date.now() + 3600000).toISOString(),
          p.calendarGroupId
        );
        appliedCount++;
      } else if (p.type === 'MANUAL' && onCreateManual) {
        onCreateManual(p.title, p.category || 'Academic', p.stages || ['Stage 1: Introductory']);
        appliedCount++;
      }
    });

    // Mark applied
    setChatHistory(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, proposals: undefined };
      }
      return m;
    }));

    alert(`✓ Đã áp dụng thành công ${appliedCount} đề xuất vào kế hoạch học tập!`);
  };

  return (
    <>
      {/* Slide-over AI Panel with Backdrop Click Outside */}
      <AnimatePresence>
        {isPanelOpen && (
          <div 
            className="fixed inset-0 bg-[#2C2825]/30 backdrop-blur-xs z-50 flex justify-end"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-[480px] bg-[#FAF8F5] border-l border-[#E7E1D7] shadow-2xl flex flex-col font-sans h-full text-[#2C2825] ai-slideover-panel"
            >
              {/* Panel Header */}
              <div className="p-4 bg-white border-b border-[#E7E1D7] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF5EE] border border-[#D2E5D2] flex items-center justify-center text-[#2E6930] shrink-0">
                    <Bot className="w-5 h-5 text-[#2E6930]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#2C2825] tracking-tight flex items-center gap-1.5">
                      Trợ lý AI
                    </h2>
                    <p className="text-[11px] text-[#7A7268]">
                      Cố vấn học tập & kế hoạch
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClearHistory}
                    className="p-2 text-[#7A7268] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Xóa lịch sử trò chuyện"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsConfiguringKey(!isConfiguringKey)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isConfiguringKey ? 'bg-emerald-50 border-emerald-200 text-[#2E6930]' : 'border-transparent text-[#7A7268] hover:text-[#2C2825] hover:bg-[#FAF8F5]'
                    }`}
                    title="Cài đặt API Key & Nguồn AI"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-2 text-[#7A7268] hover:text-[#2C2825] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* API Key & Provider Config Panel */}
              <AnimatePresence>
                {isConfiguringKey && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white border-b border-[#E7E1D7] p-4 space-y-3 shrink-0 overflow-hidden text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#2C2825]">Nguồn cung cấp AI</span>
                      {activeKey && (
                        <span className="text-[10px] text-[#2E6930] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-medium">
                          ✓ Đã kết nối API Key
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['groq', 'gemini', 'openrouter', 'custom'] as ProviderType[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setProvider(p)}
                          className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                            provider === p
                              ? 'bg-emerald-50 border-emerald-200 text-[#2E6930] shadow-xs'
                              : 'bg-[#FAF8F5] border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825]'
                          }`}
                        >
                          {p === 'groq' ? 'Groq Free' : p === 'gemini' ? 'Gemini' : p === 'openrouter' ? 'OpenRouter' : 'Custom'}
                        </button>
                      ))}
                    </div>

                    {/* Groq Model Selector */}
                    {provider === 'groq' && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-semibold text-[#7A7268]">Chọn Model Groq:</label>
                        <select
                          value={groqModel}
                          onChange={(e) => setGroqModel(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-2.5 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] cursor-pointer"
                        >
                          {availableGroqModels.map(mId => (
                            <option key={mId} value={mId}>
                              {mId === 'llama-3.3-70b-versatile' ? '🚀 llama-3.3-70b-versatile (Khuyên dùng)' : mId === 'llama-3.1-8b-instant' ? '⚡ llama-3.1-8b-instant (Siêu nhanh)' : mId}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* API Key Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#7A7268]">
                        <span>API Key ({provider.toUpperCase()}):</span>
                        {provider === 'groq' && (
                          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-[#2E6930] underline">Lấy API key Groq miễn phí</a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder={provider === 'groq' ? 'Dán khóa Groq (gsk_...)' : 'Dán khóa API...'}
                          value={inputKeyTemp}
                          onChange={(e) => setInputKeyTemp(e.target.value)}
                          className="flex-1 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-1.5 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] focus:bg-white"
                        />
                        <button
                          onClick={saveApiKey}
                          className="px-4 py-1.5 bg-[#2E6930] hover:bg-[#245226] text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat History View */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-[#FAF8F5]">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {msg.role === 'user' ? (
                      /* User Message Bubble */
                      <div className="max-w-[85%] bg-white border border-[#E7E1D7] text-[#2C2825] p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                    ) : (
                      /* Assistant Message Card */
                      <div className="w-full bg-white border border-[#E7E1D7] rounded-2xl p-4.5 shadow-xs text-xs leading-relaxed space-y-3.5 text-[#2C2825]">
                        {/* Card Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#F0EDE6]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">🤖</span>
                            <span className="text-xs font-bold text-[#2C2825]">
                              Trợ lý AI:
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-[#FAF8F5] text-[#7A7268] border border-[#E7E1D7] rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider">
                            {provider.toUpperCase()}
                          </span>
                        </div>

                        {/* Text Message Content */}
                        <div className="text-[#2C2825] leading-relaxed whitespace-pre-wrap font-sans text-xs">
                          {msg.content}
                        </div>

                        {/* Interactive Proposals list if attached */}
                        {msg.proposals && msg.proposals.length > 0 && (
                          <div className="pt-3 border-t border-[#F0EDE6] space-y-2 text-xs text-left">
                            <div className="font-bold text-xs text-[#2E6930] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Đề xuất thao tác tự động:
                            </div>
                            
                            <div className="space-y-1.5">
                              {msg.proposals.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => handleToggleProposal(msg.id, p.id)}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                                    p.checked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-[#E7E1D7] opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    {p.checked ? (
                                      <CheckSquare className="w-4 h-4 text-[#2E6930] shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-[#7A7268] shrink-0" />
                                    )}
                                    <div className="truncate text-left">
                                      <div className="flex items-center gap-1.5 font-bold text-[#2C2825] truncate">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 ${
                                          p.action === 'DELETE' || p.type.includes('DELETE')
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : p.action === 'MODIFY' || p.type.includes('EDIT')
                                            ? 'bg-amber-50 text-[#B85D38] border border-amber-200'
                                            : 'bg-emerald-50 text-[#2E6930] border border-emerald-200'
                                        }`}>
                                          {p.action === 'DELETE' || p.type.includes('DELETE') ? '🗑️ Xóa' : p.action === 'MODIFY' || p.type.includes('EDIT') ? '✏️ Sửa' : '+ Thêm'}
                                        </span>
                                        <span className="truncate">{p.title}</span>
                                      </div>
                                      <div className="text-[10px] text-[#7A7268] font-mono mt-0.5">
                                        {(p.type === 'TASK' || p.type === 'TASK_EDIT' || p.type === 'TASK_DELETE') && `Nhiệm vụ • Mức độ: ${p.priority === 'THAN_CAP' ? 'Khẩn cấp' : p.priority === 'CAO_CAP' ? 'Cao' : p.priority === 'TRUNG_CAP' ? 'Trung bình' : 'Thấp'} • Hạn: ${p.dueDate || 'Hôm nay'}`}
                                        {p.type === 'MANUAL' && `Lộ trình (${p.category}) • ${p.stages?.length || 0} Chặng`}
                                        {(p.type === 'CALENDAR' || p.type === 'CALENDAR_EDIT' || p.type === 'CALENDAR_DELETE') && (
                                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[10px] text-[#B85D38] font-mono">
                                              📅 {p.startDate ? p.startDate.replace('T', ' ') : 'Sắp tới'}
                                            </span>
                                            {calendarGroups && calendarGroups.length > 0 && p.type === 'CALENDAR' && (
                                              <select
                                                value={p.calendarGroupId || (calendarGroups.find(g => g.isPrimary) || calendarGroups[0])?.id}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  const targetGroupId = e.target.value;
                                                  setChatHistory(prev => prev.map(m => {
                                                    if (m.id === msg.id && m.proposals) {
                                                      return {
                                                        ...m,
                                                        proposals: m.proposals.map(item => item.id === p.id ? { ...item, calendarGroupId: targetGroupId } : item)
                                                      };
                                                    }
                                                    return m;
                                                  }));
                                                }}
                                                className="bg-white text-[#2C2825] text-[10px] border border-[#E7E1D7] rounded-lg px-2 py-0.5 font-mono focus:outline-none cursor-pointer hover:bg-[#FAF8F5]"
                                              >
                                                {calendarGroups.map(g => (
                                                  <option key={g.id} value={g.id}>📁 {g.summary || g.id}</option>
                                                ))}
                                              </select>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => handleApplyProposals(msg.id)}
                              className="w-full py-2.5 mt-2 bg-[#2E6930] hover:bg-[#245226] text-white font-semibold rounded-xl uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              ✓ ÁP DỤNG CÁC ĐỀ XUẤT ĐÃ CHỌN
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2.5 text-[#7A7268] text-xs font-medium p-3.5 bg-white border border-[#E7E1D7] rounded-2xl max-w-[85%] shadow-xs">
                    <Compass className="w-4 h-4 animate-spin text-[#2E6930]" />
                    <span>Trợ lý AI đang xử lý và chuẩn bị câu trả lời cho bạn...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form & Quick Command Presets */}
              <div className="p-3.5 bg-white border-t border-[#E7E1D7] shrink-0 space-y-2.5 relative">
                {/* Slash Command Autocomplete Popup */}
                {prompt.startsWith('/') && !prompt.includes(' ') && (
                  <div className="bg-white border border-[#E7E1D7] rounded-xl p-1.5 shadow-md flex items-center gap-2 animate-fadeIn">
                    {['/task', '/calendar']
                      .filter(cmd => cmd.toLowerCase().startsWith(prompt.toLowerCase()))
                      .map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPrompt(`${opt} `)}
                          className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-emerald-50 hover:text-[#2E6930] text-[#2C2825] font-mono font-semibold text-xs rounded-lg border border-[#E7E1D7] transition-all cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                  </div>
                )}

                {/* Quick Command Preset Pills */}
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {[
                    { icon: '📅', label: 'Lập lịch tuần này', text: 'Hãy giúp tôi lập kế hoạch và phân bổ thời gian học tập cho tuần này.' },
                    { icon: '⚖️', label: 'Cân bằng thói quen', text: 'Phân tích và gợi ý cách cân bằng giữa việc học tập và duy trì thói quen tốt.' },
                    { icon: '🎯', label: 'Ưu tiên nhiệm vụ', text: 'Hãy xem xét và sắp xếp thứ tự ưu tiên các nhiệm vụ còn tồn đọng.' },
                    { icon: '💡', label: 'Kế hoạch ngày mai', text: 'Gợi ý lịch trình và công việc trọng tâm cho ngày mai.' },
                    { icon: '🧩', label: 'Chia nhỏ môn học', text: 'Giúp tôi chia nhỏ các môn học lớn thành các mục tiêu học tập cụ thể theo từng chặng.' },
                  ].map((cmd, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!activeKey || isLoading}
                      onClick={() => executeAIPlanning(cmd.text)}
                      className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-white border border-[#E7E1D7] hover:border-[#2E6930] rounded-xl text-[11px] font-medium text-[#2C2825] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <span>{cmd.icon}</span>
                      <span>{cmd.label}</span>
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeAIPlanning();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={activeKey ? "Nhập / để xem lệnh nhanh (/task, /calendar) hoặc đặt câu hỏi..." : "Vui lòng nhập API Key trong Cài đặt ở trên..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={!activeKey || isLoading}
                    className="flex-1 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3.5 py-2.5 text-xs text-[#2C2825] placeholder-[#7A7268]/60 focus:outline-none focus:border-[#2E6930] focus:bg-white font-sans disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!activeKey || !prompt.trim() || isLoading}
                    className="p-2.5 bg-[#2E6930] hover:bg-[#245226] text-white rounded-xl shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
