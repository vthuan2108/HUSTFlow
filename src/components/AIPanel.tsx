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
  cultState: CultivationState;
  gradeSubjects?: GradeSubject[];
  cpaOverall?: number;
  semesterGpaList?: SemesterGPA[];
  calendarEvents?: CalendarEvent[];
  calendarGroups?: CalendarGroup[];
  ieltsLogs?: IeltsTestLog[];
  notes?: CultivationNote[];
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
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onAddCalendarEvent,
  onUpdateCalendarEvent,
  onDeleteCalendarEvent,
  onCreateManual
}: AIPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    'llama-3.1-8b-instant',
    'deepseek-r1-distill-llama-70b',
    'qwen-2.5-coder-32b',
    'gemma2-9b-it'
  ]);

  const [groqModel, setGroqModel] = useState<string>(() => {
    return localStorage.getItem('tlk_groq_model') || 'llama-3.3-70b-versatile';
  });

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
              .filter((id: string) => id && !id.includes('whisper') && !id.includes('safetensors') && !id.includes('guard'));
            if (fetchedIds.length > 0) {
              setAvailableGroqModels(fetchedIds);
              setGroqModel(prev => (fetchedIds.includes(prev) ? prev : fetchedIds[0]));
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

  const [aiPersona, setAiPersona] = useState<AIPersonaType>(() => {
    return (localStorage.getItem('tlk_ai_persona') as AIPersonaType) || 'MO_UYEN';
  });

  // Multi-turn Chat Messages History (Resets fresh on page reload)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => [
    {
      id: 'init_msg',
      role: 'assistant',
      content: (localStorage.getItem('tlk_ai_persona') as AIPersonaType) === 'MO_UYEN' || !localStorage.getItem('tlk_ai_persona')
        ? 'Senior Brother, Uyen Nhi is here by your side. Are you weary from seclusion? Please share your thoughts with Uyen Nhi...'
        : (localStorage.getItem('tlk_ai_persona') as AIPersonaType) === 'TU_DO_NAM'
        ? 'Tie Zhu! Old man Situ Nan is here. Hurry up and enter seclusion to cultivate! What trouble do you have for me?!'
        : 'I am the Master of the Heavenly Secrets Pavilion. Fellow Daoist, whatever you wish to consult or calculate, please speak!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, isLoading]);

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
    if (confirm('Are you sure you want to clear all AI chat history?')) {
      const clearText = aiPersona === 'MO_UYEN'
        ? 'Chat history has been cleared. Uyen Nhi is ready to listen to Senior Brother!'
        : aiPersona === 'TU_DO_NAM'
        ? 'Chat history cleared. Old man Situ Nan is ready to guide Tie Zhu!'
        : 'Chat history has been cleared. Ready for new inquiries!';
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

  const compileContext = (query: string = '') => {
    const isCalendarQuery = query.includes('/calendar') || /calendar|schedule|time|free|busy|agenda|lịch|thời gian|lịch trình|thời khóa biểu/i.test(query);
    const isTaskQuery = query.includes('/task') || /task|todo|homework|assignment|deadline|due|priority|nhiệm vụ|công việc|bài tập|độ ưu tiên|mức độ|ưu tiên/i.test(query);

    let contextParts: string[] = [
      `- Level: ${cultState.level} | Spirit Stones: ${cultState.linhThach} | CPA: ${cpaOverall.toFixed(2)}`,
      `- Current Date: ${new Date().toISOString().split('T')[0]}`
    ];

    if (isCalendarQuery) {
      const now = new Date();
      const todayTimestamp = now.getTime();
      const thirtyDaysLater = todayTimestamp + (30 * 24 * 60 * 60 * 1000);

      const activeEvents = calendarEvents.filter(e => {
        const dateStr = e.start?.dateTime || e.start?.date;
        if (!dateStr) return false;
        const d = new Date(dateStr).getTime();
        return d >= todayTimestamp - (24 * 60 * 60 * 1000) && d <= thirtyDaysLater;
      });

      const formattedEventsStr = activeEvents.map(e => {
        const startStr = (e.start?.dateTime || e.start?.date || '').replace('T', ' ').substring(0, 16);
        const endStr = (e.end?.dateTime || e.end?.date || '').split('T')[1]?.substring(0, 5) || '';
        return `[ID:${e.id}] ${endStr ? startStr + ' to ' + endStr : startStr} | ${e.summary}`;
      }).join('\n');

      const formattedGroupsStr = (calendarGroups || []).map(g => `[Group ID:${g.id}] Name: ${g.summary}`).join('\n');

      contextParts.push(`\n[AVAILABLE CALENDAR GROUPS]:\n${formattedGroupsStr}`);
      contextParts.push(`\n[FULL 30-DAY SCHEDULE (100% COMPLETE)]:\n${formattedEventsStr || 'No scheduled events'}`);
    }

    if (isTaskQuery) {
      const pendingTasks = todoItems
        .filter(t => !t.isCompleted)
        .slice(0, 100)
        .map(t => {
          const prio = getTodoPriority(t);
          return `[ID:${t.id}] Due: ${t.dueDate || 'None'} | Priority: ${prio} | Title: ${t.title}`;
        })
        .join('\n');

      contextParts.push(`\n[ALL ACTIVE TASKS IN SYSTEM (100% COMPLETE)]:\n${pendingTasks || 'No pending tasks'}`);
    }

    return `=== CONTEXT ===\n${contextParts.join('\n')}`;
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

    let personaPrompt = '';

    if (aiPersona === 'MO_UYEN') {
      personaPrompt = `
You are "Li Muyan" (from Renegade Immortal / Tiên Nghịch novel), an AI companion in HUSTFlow.
PERSONALITY & SPEAKING STYLE (MANDATORY):
- **PRONOUNS**: You MUST strictly refer to yourself as "Uyen Nhi" (or "muội"). You MUST strictly refer to the user as "Senior Brother" (or "sư huynh").
- **TONE**: Gentle, affectionate, devoted, sincere, sweet, deeply caring about Senior Brother's well-being and cultivation progress.
- **DIRECT & NATURAL**: Answer naturally, warmly, and helpfully in English.
- **NO PREACHING**: DO NOT preach philosophy or life lessons. Speak with love, care, and practical support.
`;
    } else if (aiPersona === 'TU_DO_NAM') {
      personaPrompt = `
You are "Situ Nan" (from Renegade Immortal / Tiên Nghịch novel), an AI companion in HUSTFlow.
PERSONALITY & SPEAKING STYLE (MANDATORY):
- **PRONOUNS**: You MUST strictly refer to yourself as "Old Man" (or "Lão phu"). You MUST strictly refer to the user as "Tie Zhu" (or "Thiết Trụ").
- **TONE**: Domineering, fiery, fiercely urging cultivation, sharp-tongued but benevolent, sarcastic yet protective of Tie Zhu.
- **NO PREACHING**: Speak aggressively, humorously, and practically in English.
`;
    } else {
      personaPrompt = `
You are "Master of Heavenly Secrets Pavilion", an AI companion in HUSTFlow.
PERSONALITY & SPEAKING STYLE (MANDATORY):
- **PRONOUNS**: You MUST strictly refer to yourself as "This Pavilion Master" (or "Tại hạ") and refer to the user as "Fellow Daoist" (or "Đạo hữu").
- **TONE**: Polite, refined, objective, composed.
- **NO PREACHING**: Answer clearly, helpfully, and practically in English.
`;
    }

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

          // If 400 Bad Request or 429 Rate Limit, retry with clean payload and fallback model
          const fallbackModel = modelName === 'llama-3.1-8b-instant' ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';
          console.warn(`Groq API Error ${response.status}! Retrying with fallback model ${fallbackModel}...`);
          bodyData.model = fallbackModel;
          delete bodyData.response_format;

          response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyData)
          });
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
      const errPrefix = aiPersona === 'MO_UYEN'
        ? 'Uyen Nhi encountered an issue connecting to AI assistant.'
        : aiPersona === 'TU_DO_NAM'
        ? 'This old man encountered an issue transmitting divine sense.'
        : 'The Pavilion Master encountered an issue divining heavenly secrets.';

      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `${errPrefix} Error details: ${err.message || err}`,
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

    alert(`⚡ Successfully applied ${appliedCount} proposals from Heavenly Secrets!`);
  };

  return (
    <>
      {/* Floating Trigger Button (Minimalist Sleek Circle) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full border-2 shadow-[0_4px_20px_rgba(0,0,0,0.6)] active:scale-95 cursor-pointer flex items-center justify-center transition-all select-none group backdrop-blur-md ${
          aiPersona === 'MO_UYEN'
            ? 'bg-[#18111b]/95 border-rose-500/50 hover:border-rose-400 text-rose-300 shadow-rose-950/40'
            : aiPersona === 'TU_DO_NAM'
            ? 'bg-[#1c1811]/95 border-amber-500/50 hover:border-amber-400 text-amber-300 shadow-amber-950/40'
            : 'bg-[#141124]/95 border-purple-500/50 hover:border-purple-400 text-purple-300 shadow-purple-950/40'
        }`}
        title={aiPersona === 'MO_UYEN' ? 'Chat with Li Muyan (Uyen Nhi)' : aiPersona === 'TU_DO_NAM' ? 'Chat with Situ Nan' : 'Open Heavenly Secrets Pavilion'}
      >
        <span className="text-2xl transition-transform group-hover:scale-110">
          {aiPersona === 'MO_UYEN' ? '🌸' : aiPersona === 'TU_DO_NAM' ? '👺' : '🔮'}
        </span>
      </button>

      {/* Slide-over AI Panel with Backdrop Click Outside */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex justify-end"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-[480px] bg-[#070a0f] border-l-3 border-slate-950 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] flex flex-col font-sans h-full ai-slideover-panel"
            >
              {/* Panel Header */}
              <div className="p-4 bg-[#0f141c] border-b-2 border-slate-950 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[2px_2px_0px_#000]">
                    {aiPersona === 'MO_UYEN' ? '🌸' : aiPersona === 'TU_DO_NAM' ? '👺' : '🔮'}
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      {aiPersona === 'MO_UYEN' ? 'LI MUYAN (UYEN NHI)' : aiPersona === 'TU_DO_NAM' ? 'SITU NAN (OLD MAN)' : 'HEAVENLY SECRETS'}
                    </h2>
                    <p className="text-[9.5px] text-slate-400 font-mono">
                      {aiPersona === 'MO_UYEN' ? 'Senior Brother & Uyen Nhi • Dao Heart Mentor' : aiPersona === 'TU_DO_NAM' ? 'Old Man Situ Nan • Cultivation Urger' : 'Pavilion Master: AI Cultivation Strategist'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClearHistory}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                    title="Clear chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsConfiguringKey(!isConfiguringKey)}
                    className={`p-1.5 rounded-lg border-2 border-slate-950 transition-all cursor-pointer ${
                      isConfiguringKey ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Configure API Key & Provider"
                  >
                    <Settings className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
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
                    className="bg-[#0f141c] border-b-2 border-slate-950 p-4 space-y-3 shrink-0 overflow-hidden text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 uppercase text-[10px] tracking-wider font-mono">AI Provider Source</span>
                      {activeKey && (
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded-full font-mono">
                          ✓ API Key Connected
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['groq', 'gemini', 'openrouter', 'custom'] as ProviderType[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setProvider(p)}
                          className={`py-1.5 px-2 rounded-lg border-2 border-slate-950 font-extrabold uppercase text-[9px] transition-all cursor-pointer ${
                            provider === p
                              ? 'bg-amber-400 text-slate-950 shadow-[1px_1px_0px_#000]'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p === 'groq' ? 'Groq Free' : p === 'gemini' ? 'Gemini' : p === 'openrouter' ? 'OpenRouter' : 'Custom'}
                        </button>
                      ))}
                    </div>

                    {/* Groq Model Selector */}
                    {provider === 'groq' && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[9.5px] font-bold text-slate-400 font-mono">Select Free Groq Model:</label>
                        <select
                          value={groqModel}
                          onChange={(e) => setGroqModel(e.target.value)}
                          className="w-full bg-slate-950 border-2 border-slate-900 rounded-lg px-2 py-1.5 text-[10px] font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {availableGroqModels.map(mId => (
                            <option key={mId} value={mId}>
                              {mId === 'llama-3.3-70b-versatile' ? '🚀 llama-3.3-70b-versatile (Recommended)' : mId === 'llama-3.1-8b-instant' ? '⚡ llama-3.1-8b-instant (Ultra Fast)' : mId}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* API Key Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
                        <span>API Key ({provider.toUpperCase()}):</span>
                        {provider === 'groq' && (
                          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-amber-400 underline">Get free Groq API key</a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder={provider === 'groq' ? 'Paste Groq Key (gsk_...)' : 'Paste API Key...'}
                          value={inputKeyTemp}
                          onChange={(e) => setInputKeyTemp(e.target.value)}
                          className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        />
                        <button
                          onClick={saveApiKey}
                          className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-lg border-2 border-slate-950 text-xs uppercase transition-all shadow-[1px_1px_0px_#000] cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* AI Persona Selector */}
                    <div className="pt-2 border-t border-slate-900 space-y-1.5">
                      <span className="font-bold text-slate-300 uppercase text-[9.5px] tracking-wider font-mono">AI Persona & Mentor Style:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'MO_UYEN', label: '🌸 Li Muyan', desc: 'Uyen Nhi • Senior Brother' },
                          { id: 'TONG_CHU', label: '📜 Pavilion Master', desc: 'Humble One • Fellow Daoist' },
                          { id: 'TU_DO_NAM', label: '👺 Situ Nan', desc: 'Old Man • Tie Zhu' }
                        ].map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setAiPersona(p.id as AIPersonaType);
                              localStorage.setItem('tlk_ai_persona', p.id);
                            }}
                            className={`p-2 rounded-xl border-2 border-slate-950 text-left transition-all cursor-pointer ${
                              aiPersona === p.id
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[1px_1px_0px_#000]'
                                : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="font-black text-[10px] truncate">{p.label}</div>
                            <div className="text-[8px] opacity-75 font-mono truncate">{p.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat History View */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-[#080b12]">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {msg.role === 'user' ? (
                      /* User Message Bubble */
                      <div className="max-w-[85%] bg-slate-900 border-2 border-slate-950 text-slate-100 p-3.5 rounded-2xl shadow-[3px_3px_0px_#000] text-xs leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                    ) : (
                      /* Assistant Message Card (Matching Screenshot Exactly) */
                      <div className="w-full bg-[#121622] border-2 border-slate-950 rounded-2xl p-4.5 shadow-[4px_4px_0px_#000] text-xs leading-relaxed space-y-3.5">
                        {/* Card Header matching screenshot */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">
                              {aiPersona === 'MO_UYEN' ? '🌸' : aiPersona === 'TU_DO_NAM' ? '👺' : '📜'}
                            </span>
                            <span className={`text-[13px] font-extrabold tracking-wide font-sans ${
                              aiPersona === 'MO_UYEN' ? 'text-rose-300' : aiPersona === 'TU_DO_NAM' ? 'text-amber-300' : 'text-purple-300'
                            }`}>
                              {aiPersona === 'MO_UYEN' ? 'Uyen Nhi:' : aiPersona === 'TU_DO_NAM' ? 'Situ Nan:' : 'Heavenly Secrets Master:'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800/80 rounded-md text-[9px] font-extrabold font-mono uppercase tracking-wider">
                            {provider.toUpperCase()}
                          </span>
                        </div>

                        {/* Text Message Content */}
                        <div className="text-slate-100 leading-relaxed whitespace-pre-wrap font-sans text-[13px] font-normal tracking-wide">
                          {msg.content}
                        </div>

                        {/* Interactive Proposals list if attached */}
                        {msg.proposals && msg.proposals.length > 0 && (
                          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] text-left">
                            <div className="font-extrabold uppercase text-[9.5px] tracking-wider text-amber-400 font-mono flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Automated Proposals from Heavenly Secrets:
                            </div>
                            
                            <div className="space-y-1.5">
                              {msg.proposals.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => handleToggleProposal(msg.id, p.id)}
                                  className={`p-2.5 rounded-xl border border-slate-900 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                    p.checked ? 'bg-slate-950 border-amber-500/50' : 'bg-slate-950/40 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {p.checked ? (
                                      <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                                    )}
                                    <div className="truncate text-left">
                                      <div className="flex items-center gap-1.5 font-bold text-slate-200 truncate">
                                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-black uppercase shrink-0 ${
                                          p.action === 'DELETE' || p.type.includes('DELETE')
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            : p.action === 'MODIFY' || p.type.includes('EDIT')
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}>
                                          {p.action === 'DELETE' || p.type.includes('DELETE') ? '🗑️ Delete' : p.action === 'MODIFY' || p.type.includes('EDIT') ? '✏️ Edit' : '+ Add'}
                                        </span>
                                        <span className="truncate">{p.title}</span>
                                      </div>
                                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                                        {(p.type === 'TASK' || p.type === 'TASK_EDIT' || p.type === 'TASK_DELETE') && `⚔️ Task • Priority: ${p.priority === 'THAN_CAP' ? 'Thần Cấp (Heaven)' : p.priority === 'CAO_CAP' ? 'Cao Cấp (Earth)' : p.priority === 'TRUNG_CAP' ? 'Trung Cấp (Adept)' : 'Sơ Cấp (Novice)'} • Due: ${p.dueDate || 'Today'}`}
                                        {p.type === 'MANUAL' && `📚 Manual (${p.category}) • ${p.stages?.length || 0} Stages`}
                                        {(p.type === 'CALENDAR' || p.type === 'CALENDAR_EDIT' || p.type === 'CALENDAR_DELETE') && (
                                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[9.5px] text-amber-300/90 font-mono">
                                              📅 {p.startDate ? p.startDate.replace('T', ' ') : 'Upcoming'}
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
                                                className="bg-slate-900 text-purple-300 text-[9px] border border-purple-500/40 rounded px-1.5 py-0.5 font-mono focus:outline-none cursor-pointer hover:bg-slate-800"
                                              >
                                                {calendarGroups.map(g => (
                                                  <option key={g.id} value={g.id}>📁 Group: {g.summary || g.id}</option>
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
                              className="w-full py-2.5 mt-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl border-2 border-slate-950 uppercase tracking-wider text-[10px] shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                            >
                              ⚡ Apply Selected Proposals
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading Indicator Bubble */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono p-3 bg-[#141a29] border-2 border-slate-950 rounded-2xl max-w-[85%] shadow-[2px_2px_0px_#000]">
                    <Compass className={`w-4 h-4 animate-spin ${aiPersona === 'MO_UYEN' ? 'text-rose-400' : 'text-purple-400'}`} />
                    <span>
                      {aiPersona === 'MO_UYEN'
                        ? 'Uyen Nhi is listening and preparing response for Senior Brother...'
                        : aiPersona === 'TU_DO_NAM'
                        ? 'Old man Situ Nan is calculating the heavenly secrets for Tie Zhu...'
                        : 'The Pavilion Master is divining the cosmic patterns...'}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form & Quick Command Presets */}
              <div className="p-3 bg-[#0d111a] border-t-2 border-slate-950 shrink-0 space-y-2 relative">
                {/* Slash Command Autocomplete Popup */}
                {prompt.startsWith('/') && !prompt.includes(' ') && (
                  <div className="bg-[#121722] border-2 border-purple-500/60 rounded-xl p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-2 animate-fadeIn">
                    {['/task', '/calendar']
                      .filter(cmd => cmd.toLowerCase().startsWith(prompt.toLowerCase()))
                      .map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPrompt(`${opt} `)}
                          className="px-3.5 py-1.5 bg-[#182030] hover:bg-purple-600 hover:text-white text-purple-300 font-mono font-bold text-xs rounded-lg border border-purple-500/30 transition-all cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                  </div>
                )}

                {/* Quick Command Preset Pills */}
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {[
                    { icon: '📜', label: 'Manual Cultivation Schedule', text: 'Please devise a manual cultivation schedule and daily routine for me.' },
                    { icon: '⚖️', label: 'Balance Dao Heart', text: 'Analyze and help me balance my current study and practice habits.' },
                    { icon: '⚔️', label: 'Prioritize Tasks', text: 'Please prioritize my pending tasks and assignments.' },
                    { icon: '🔮', label: 'Daily Divination', text: 'Divine heavenly secrets and suggest an optimal cultivation plan for tomorrow.' },
                    { icon: '🔨', label: 'Deconstruct Goals', text: 'Help me break down large academic courses into bite-sized study units.' },
                  ].map((cmd, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!activeKey || isLoading}
                      onClick={() => executeAIPlanning(cmd.text)}
                      className="px-3 py-1.5 bg-[#141a29] hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-xl text-[11px] font-medium font-sans text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-[1px_1px_0px_#000] disabled:opacity-40"
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
                    placeholder={activeKey ? "Type / to browse slash commands (/task, /calendar) or ask questions..." : "Please configure your API Key in Settings above..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={!activeKey || isLoading}
                    className="flex-1 bg-[#070910] border-2 border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!activeKey || !prompt.trim() || isLoading}
                    className="p-3 bg-[#171d2d] hover:bg-[#1f273d] text-slate-100 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4 text-purple-400 stroke-[2.5]" />
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
