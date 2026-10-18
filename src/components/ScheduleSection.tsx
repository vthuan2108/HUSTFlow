/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CalendarGroup, CalendarEvent, CultivationManual, TodoItem } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Clock, 
  X, 
  Save, 
  AlertCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { syncGoogleCalendarData, insertGoogleEvent, updateGoogleEvent, deleteGoogleEvent, createGoogleCalendar } from '../lib/googleCalendar';
import { getAccessToken, googleSignIn, initAuth, logout } from '../lib/firebase';

interface ScheduleSectionProps {
  manuals: CultivationManual[];
  onUpdateManuals: (updatedList: CultivationManual[]) => void;
  calendarGroups: CalendarGroup[];
  onUpdateCalendarGroups: (updatedList: CalendarGroup[]) => void;
  calendarEvents: CalendarEvent[];
  onUpdateCalendarEvents: (updatedList: CalendarEvent[]) => void;
  todoItems: TodoItem[];
}

const HOUR_HEIGHT = 60; // 60px per hour
const START_HOUR = 5; // Grid starts at 5 AM
const END_HOUR = 23; // Grid ends at 11 PM (23:00)

const CALENDAR_COLORS = [
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#e11d48', // Crimson
];

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ScheduleSection({
  manuals,
  onUpdateManuals,
  calendarGroups,
  onUpdateCalendarGroups,
  calendarEvents,
  onUpdateCalendarEvents,
  todoItems
}: ScheduleSectionProps) {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  
  // Selected event for editing
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCalendarId, setFormCalendarId] = useState('');
  const [formDate, setFormDate] = useState(getLocalDateString());
  const [formStartHour, setFormStartHour] = useState(8);
  const [formStartMinute, setFormStartMinute] = useState(0);
  const [formEndHour, setFormEndHour] = useState(9);
  const [formEndMinute, setFormEndMinute] = useState(0);
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [associatedTaskId, setAssociatedTaskId] = useState('');

  // Drag-to-select range state
  const [selectionActive, setSelectionActive] = useState<{ date: string; start: number; end: number } | null>(null);
  const [isDraggingRange, setIsDraggingRange] = useState(false);

  // Drag position ref for moving events
  const dragOffsetRef = useRef<number>(0);

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setIsLoggedIn(true);
        setUserProfile(user);
      },
      () => {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set default calendar ID for form if not set
  useEffect(() => {
    if (calendarGroups.length > 0 && !formCalendarId) {
      const primary = calendarGroups.find(g => g.isPrimary) || calendarGroups[0];
      setFormCalendarId(primary.id);
    }
  }, [calendarGroups, formCalendarId]);

  // Calculate days for the active week view (Monday to Sunday)
  const weekDates = useMemo(() => {
    const dates = [];
    const current = new Date(anchorDate);
    const day = current.getDay();
    // Monday is index 0
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [anchorDate]);

  // Get formatted start-end month text (e.g. "Jul - Aug, 2026")
  const headerDateText = useMemo(() => {
    if (weekDates.length === 0) return '';
    const first = weekDates[0];
    const last = weekDates[6];
    const formatMonth = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
    if (first.getFullYear() !== last.getFullYear()) {
      return `${formatMonth(first)} ${first.getFullYear()} - ${formatMonth(last)} ${last.getFullYear()}`;
    }
    if (first.getMonth() !== last.getMonth()) {
      return `${formatMonth(first)} - ${formatMonth(last)}, ${first.getFullYear()}`;
    }
    return `${formatMonth(first)}, ${first.getFullYear()}`;
  }, [weekDates]);

  // Generate days in the mini-month calendar (based on miniCalendarDate)
  const miniCalendarDays = useMemo(() => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDayIdx = firstDay.getDay(); // Sun = 0, Mon = 1
    startDayIdx = startDayIdx === 0 ? 6 : startDayIdx - 1;

    const days = [];
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDayIdx - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, isCurrent: false, date: new Date(year, month - 1, prevMonthLast - i) });
    }

    const currentMonthLast = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentMonthLast; i++) {
      days.push({ day: i, isCurrent: true, date: new Date(year, month, i) });
    }

    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrent: false, date: new Date(year, month + 1, i) });
    }

    return days;
  }, [miniCalendarDate]);

  // Mini calendar navigation
  const prevMiniMonth = () => {
    setMiniCalendarDate(new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() - 1, 1));
  };

  const nextMiniMonth = () => {
    setMiniCalendarDate(new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth() + 1, 1));
  };

  // Filter events to only show those that belong to selected calendar groups
  const visibleEvents = useMemo(() => {
    const selectedIds = new Set(calendarGroups.filter(g => g.isSelected).map(g => g.id));
    const events = calendarEvents.filter(e => selectedIds.has(e.calendarId));

    // Inject calculated exam events dynamically (virtual events)
    const schoolGroupObj = calendarGroups.find(g => g.summary.toLowerCase() === 'school') ?? calendarGroups[0];
    const schoolGroupId = schoolGroupObj?.id ?? '';
    manuals.forEach(manual => {
      // 1. Midterm Exam
      if (manual.midtermExamDate) {
        const limitStage = manual.midtermLimitStageId ? manual.stages.find(s => s.id === manual.midtermLimitStageId) : null;
        events.push({
          id: `exam_midterm_${manual.id}`,
          calendarId: schoolGroupId,
          summary: `📝 MIDTERM: ${manual.name}`,
          description: `Midterm exam for ${manual.name}. Scope: ${limitStage ? `Up to ${limitStage.title}` : 'Full curriculum'}`,
          start: { date: manual.midtermExamDate }, // all-day event
          end: { date: manual.midtermExamDate }
        });
      }
      // 2. Final Exam
      if (manual.finalExamDate) {
        events.push({
          id: `exam_final_${manual.id}`,
          calendarId: schoolGroupId,
          summary: `⚔️ FINAL: ${manual.name}`,
          description: `Final exam for ${manual.name}. Scope: Full curriculum`,
          start: { date: manual.finalExamDate }, // all-day event
          end: { date: manual.finalExamDate }
        });
      }
      // 3. Fallback/Backward compatibility
      if (manual.examDate && !manual.midtermExamDate && !manual.finalExamDate) {
        events.push({
          id: `exam_${manual.id}`,
          calendarId: schoolGroupId,
          summary: `⚔️ EXAM: ${manual.name}`,
          description: `Exam for ${manual.name}`,
          start: { date: manual.examDate }, // all-day event
          end: { date: manual.examDate }
        });
      }
    });

    return events;
  }, [calendarEvents, calendarGroups, manuals]);

  // --- BIDIRECTIONAL SYNC TO GOOGLE CALENDAR ---
  const handleSyncGoogleCalendar = async () => {
    let token = getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
        }
      } catch (err) {
        console.error('Failed to authenticate Google account:', err);
        alert('⚠️ Failed to connect Google account!');
        return;
      }
    }
    if (!token) {
      alert('Please connect your Google account to sync schedule!');
      return;
    }

    setIsSyncing(true);
    try {
      // Calculate 1-year window (6 months past, 6 months future) for sync
      const pastWindow = new Date(anchorDate);
      pastWindow.setMonth(pastWindow.getMonth() - 6);
      const futureWindow = new Date(anchorDate);
      futureWindow.setMonth(futureWindow.getMonth() + 6);

      const timeMin = pastWindow.toISOString();
      const timeMax = futureWindow.toISOString();

      const result = await syncGoogleCalendarData(token, calendarGroups, calendarEvents, timeMin, timeMax);
      onUpdateCalendarGroups(result.syncedGroups);
      onUpdateCalendarEvents(result.syncedEvents);
      
      // Save locally
      localStorage.setItem('tlk_calendar_groups', JSON.stringify(result.syncedGroups));
      alert('⚡ Google Calendar sync completed successfully!');
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'GOOGLE_AUTH_401' || err?.message?.includes('401')) {
        if (confirm('⚠️ Your Google session has expired (60-minute token).\n\nWould you like to sign in again to re-authenticate and sync now?')) {
          try {
            const res = await googleSignIn();
            if (res?.accessToken) {
              handleSyncGoogleCalendar();
            }
          } catch (loginErr) {
            alert('❌ Token renewal failed!');
          }
        }
      } else {
        alert(`⚠️ Google Calendar sync error: ${err?.message || err}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync Google on mount if token is available
  useEffect(() => {
    const token = getAccessToken();
    if (token && calendarGroups.length > 0) {
      const syncQuietly = async () => {
        try {
          const pastWindow = new Date();
          pastWindow.setMonth(pastWindow.getMonth() - 6);
          const futureWindow = new Date();
          futureWindow.setMonth(futureWindow.getMonth() + 6);
          const result = await syncGoogleCalendarData(token, calendarGroups, calendarEvents, pastWindow.toISOString(), futureWindow.toISOString());
          onUpdateCalendarGroups(result.syncedGroups);
          onUpdateCalendarEvents(result.syncedEvents);
        } catch (e) {
          console.warn('Quiet background calendar sync failed:', e);
        }
      };
      syncQuietly();
    }
  }, []);

  // Navigate weeks
  const prevWeek = () => {
    const d = new Date(anchorDate);
    d.setDate(anchorDate.getDate() - 7);
    setAnchorDate(d);
    setMiniCalendarDate(d);
  };

  const nextWeek = () => {
    const d = new Date(anchorDate);
    d.setDate(anchorDate.getDate() + 7);
    setAnchorDate(d);
    setMiniCalendarDate(d);
  };

  const setToday = () => {
    const today = new Date();
    setAnchorDate(today);
    setMiniCalendarDate(today);
  };

  // --- NATIVE DRAG & DROP FOR EVENTS ---
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';

    // Measure offset from click Y to event Y to maintain offset on drop
    if (event.start.dateTime) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      dragOffsetRef.current = clickY;
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');

    if (eventId.startsWith('exam_')) {
      alert('Cannot drag & drop exam events. Please update exams via the Exam Schedule panel!');
      return;
    }

    const foundEvent = calendarEvents.find(ev => ev.id === eventId);
    if (!foundEvent) return;

    // Calculate Y coordinates relative to column container
    const columnRect = e.currentTarget.getBoundingClientRect();
    const dropY = e.clientY - columnRect.top - dragOffsetRef.current;

    // Convert pixel drop location back to minutes
    const gridStartMin = START_HOUR * 60;
    const dropMinutes = Math.round((dropY / HOUR_HEIGHT) * 60);
    const newStartMinutes = Math.max(0, Math.min((END_HOUR - START_HOUR) * 60, dropMinutes)) + gridStartMin;

    // Round to nearest 15 minutes
    const roundedMinutes = Math.round(newStartMinutes / 15) * 15;
    const startH = Math.floor(roundedMinutes / 60);
    const startM = roundedMinutes % 60;

    // Keep duration
    let duration = 60;
    if (foundEvent.start.dateTime && foundEvent.end.dateTime) {
      duration = (new Date(foundEvent.end.dateTime).getTime() - new Date(foundEvent.start.dateTime).getTime()) / 60000;
    }

    const newStartDateTime = new Date(`${dateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`).toISOString();
    const newEndDateTime = new Date(new Date(newStartDateTime).getTime() + duration * 60000).toISOString();

    const updatedEvent = {
      ...foundEvent,
      start: { dateTime: newStartDateTime },
      end: { dateTime: newEndDateTime }
    };

    // Update local state optimistically
    const updatedEventsList = calendarEvents.map(ev => ev.id === eventId ? updatedEvent : ev);
    onUpdateCalendarEvents(updatedEventsList);
    localStorage.setItem('tlk_calendar_events', JSON.stringify(updatedEventsList));

    // Sync to Google in background if token exists
    const token = getAccessToken();
    if (token && !eventId.startsWith('local_')) {
      try {
        await updateGoogleEvent(token, foundEvent.calendarId, eventId, updatedEvent);
      } catch (err) {
        console.error('Failed to sync drag update to Google:', err);
      }
    }
  };

  // --- DRAG TO SELECT TIME RANGE ---
  const handleColumnMouseDown = (e: React.MouseEvent, dateStr: string) => {
    if ((e.target as HTMLElement).closest('.event-card') || (e.target as HTMLElement).closest('.inline-creator')) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Round grid start minutes
    const startMin = Math.round(((y / HOUR_HEIGHT) * 60 + START_HOUR * 60) / 15) * 15;
    
    setSelectionActive({
      date: dateStr,
      start: startMin,
      end: startMin + 30 // default 30 min block
    });
    setIsDraggingRange(true);
  };

  const handleColumnMouseMove = (e: React.MouseEvent, dateStr: string) => {
    if (!isDraggingRange || !selectionActive || selectionActive.date !== dateStr) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const currentMin = Math.round(((y / HOUR_HEIGHT) * 60 + START_HOUR * 60) / 15) * 15;
    
    if (currentMin > selectionActive.start) {
      setSelectionActive({
        ...selectionActive,
        end: currentMin
      });
    }
  };

  const handleColumnMouseUp = () => {
    setIsDraggingRange(false);
    if (selectionActive) {
      setSelectedEvent(null);
      setFormTitle('');
      setFormDescription('');
      setFormDate(selectionActive.date);

      const startH = Math.floor(selectionActive.start / 60);
      const startM = selectionActive.start % 60;
      
      // Ensure end time is at least 15 minutes after start time
      const endVal = Math.max(selectionActive.start + 15, selectionActive.end);
      const endH = Math.floor(endVal / 60);
      const endM = endVal % 60;

      setFormStartHour(startH);
      setFormStartMinute(startM);
      setFormEndHour(endH);
      setFormEndMinute(endM);
      setFormIsAllDay(false);
      setAssociatedTaskId('');

      setShowAddModal(true);
      setSelectionActive(null);
    }
  };

  // --- CALENDAR GROUP & EVENT MUTATIONS ---
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const summary = newGroupTitle.trim();
    if (!summary) return;

    const localId = `local_group_${Date.now()}`;
    const newGroup: CalendarGroup = {
      id: localId,
      summary,
      backgroundColor: CALENDAR_COLORS[calendarGroups.length % CALENDAR_COLORS.length],
      isSelected: true
    };

    const updatedGroups = [...calendarGroups, newGroup];
    onUpdateCalendarGroups(updatedGroups);
    localStorage.setItem('tlk_calendar_groups', JSON.stringify(updatedGroups));
    setNewGroupTitle('');

    // Push to Google Calendar in background
    const token = getAccessToken();
    if (token) {
      try {
        const gCal = await createGoogleCalendar(token, summary);
        const fixedGroups = updatedGroups.map(g => g.id === localId ? { ...g, id: gCal.id } : g);
        onUpdateCalendarGroups(fixedGroups);
        localStorage.setItem('tlk_calendar_groups', JSON.stringify(fixedGroups));
      } catch (err) {
        console.error('Failed to sync calendar creation to Google:', err);
      }
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const updated = calendarGroups.map(g => g.id === groupId ? { ...g, isSelected: !g.isSelected } : g);
    onUpdateCalendarGroups(updated);
    localStorage.setItem('tlk_calendar_groups', JSON.stringify(updated));
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this calendar group? All events in this group will be deleted.')) {
      const updatedGroups = calendarGroups.filter(g => g.id !== groupId);
      onUpdateCalendarGroups(updatedGroups);
      localStorage.setItem('tlk_calendar_groups', JSON.stringify(updatedGroups));

      const updatedEvents = calendarEvents.filter(e => e.calendarId !== groupId);
      onUpdateCalendarEvents(updatedEvents);
      localStorage.setItem('tlk_calendar_events', JSON.stringify(updatedEvents));
    }
  };

  const openAddModalForTime = (dateStr: string, hour: number) => {
    setSelectedEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(dateStr);
    setFormStartHour(hour);
    setFormStartMinute(0);
    setFormEndHour(hour + 1);
    setFormEndMinute(0);
    setFormIsAllDay(false);
    setAssociatedTaskId('');
    setShowAddModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormTitle(event.summary);
    setFormDescription(event.description || '');
    setFormCalendarId(event.calendarId);

    if (event.start.date) {
      setFormIsAllDay(true);
      setFormDate(event.start.date);
    } else if (event.start.dateTime && event.end.dateTime) {
      setFormIsAllDay(false);
      const startD = new Date(event.start.dateTime);
      const endD = new Date(event.end.dateTime);
      setFormDate(getLocalDateString(startD));
      setFormStartHour(startD.getHours());
      setFormStartMinute(startD.getMinutes());
      setFormEndHour(endD.getHours());
      setFormEndMinute(endD.getMinutes());
    }
    setShowAddModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    let titleToUse = formTitle.trim();
    if (associatedTaskId) {
      const foundTask = todoItems.find(t => t.id === associatedTaskId);
      if (foundTask) titleToUse = foundTask.title;
    }

    if (!titleToUse) {
      alert('Please enter a title!');
      return;
    }

    let start = {};
    let end = {};

    if (formIsAllDay) {
      start = { date: formDate };
      end = { date: formDate };
    } else {
      const startIso = new Date(`${formDate}T${String(formStartHour).padStart(2, '0')}:${String(formStartMinute).padStart(2, '0')}:00`).toISOString();
      const endIso = new Date(`${formDate}T${String(formEndHour).padStart(2, '0')}:${String(formEndMinute).padStart(2, '0')}:00`).toISOString();
      start = { dateTime: startIso };
      end = { dateTime: endIso };
    }

    const eventPayload: Partial<CalendarEvent> = {
      calendarId: formCalendarId,
      summary: titleToUse,
      description: formDescription,
      start,
      end
    };

    const token = getAccessToken();

    if (selectedEvent) {
      // Edit mode
      const updatedEvent = { ...selectedEvent, ...eventPayload } as CalendarEvent;
      const updatedList = calendarEvents.map(ev => ev.id === selectedEvent.id ? updatedEvent : ev);
      onUpdateCalendarEvents(updatedList);
      localStorage.setItem('tlk_calendar_events', JSON.stringify(updatedList));

      if (token && !selectedEvent.id.startsWith('local_')) {
        try {
          await updateGoogleEvent(token, selectedEvent.calendarId, selectedEvent.id, updatedEvent);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      // Create mode
      const localId = `local_event_${Date.now()}`;
      const newEvent: CalendarEvent = {
        id: localId,
        calendarId: formCalendarId,
        summary: titleToUse,
        description: formDescription,
        start,
        end
      };

      const updatedList = [...calendarEvents, newEvent];
      onUpdateCalendarEvents(updatedList);
      localStorage.setItem('tlk_calendar_events', JSON.stringify(updatedList));

      if (token) {
        try {
          const gEv = await insertGoogleEvent(token, formCalendarId, newEvent);
          const fixedList = updatedList.map(ev => ev.id === localId ? { ...ev, id: gEv.id } : ev);
          onUpdateCalendarEvents(fixedList);
          localStorage.setItem('tlk_calendar_events', JSON.stringify(fixedList));
        } catch (err) {
          console.error(err);
        }
      }
    }

    setShowAddModal(false);
  };

  const handleDeleteEvent = async (eventId: string, calendarId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const updated = calendarEvents.filter(ev => ev.id !== eventId);
      onUpdateCalendarEvents(updated);
      localStorage.setItem('tlk_calendar_events', JSON.stringify(updated));

      const token = getAccessToken();
      if (token && !eventId.startsWith('local_')) {
        try {
          await deleteGoogleEvent(token, calendarId, eventId);
        } catch (err) {
          console.error(err);
        }
      }
      setShowAddModal(false);
    }
  };

  // --- EXAM SCHEDULE REGISTRATION ---
  const handleMidtermExamDateChange = (manualId: string, dateStr: string) => {
    const updated = manuals.map(m => m.id === manualId ? { ...m, midtermExamDate: dateStr || undefined } : m);
    onUpdateManuals(updated);
  };

  const handleFinalExamDateChange = (manualId: string, dateStr: string) => {
    const updated = manuals.map(m => m.id === manualId ? { ...m, finalExamDate: dateStr || undefined } : m);
    onUpdateManuals(updated);
  };

  // --- LAYOUT HELPER FOR OVERLAPPING EVENTS ---
  const arrangeEvents = (dayEvents: CalendarEvent[]) => {
    // Filter out all-day events
    const timedEvents = dayEvents.filter(e => e.start.dateTime);
    
    const getMinutes = (ev: CalendarEvent) => {
      const d = new Date(ev.start.dateTime!);
      return d.getHours() * 60 + d.getMinutes();
    };
    timedEvents.sort((a, b) => getMinutes(a) - getMinutes(b));

    const columns: CalendarEvent[][] = [];
    timedEvents.forEach(event => {
      let placed = false;
      const startMin = getMinutes(event);

      for (let i = 0; i < columns.length; i++) {
        const lastEv = columns[i][columns[i].length - 1];
        const lastEndMin = new Date(lastEv.end.dateTime!).getHours() * 60 + new Date(lastEv.end.dateTime!).getMinutes();

        if (startMin >= lastEndMin) {
          columns[i].push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
      }
    });

    const arranged: { event: CalendarEvent; left: number; width: number }[] = [];
    columns.forEach((col, colIdx) => {
      col.forEach(event => {
        arranged.push({
          event,
          left: (colIdx / columns.length) * 100,
          width: 90 / columns.length // 10% spacing buffer
        });
      });
    });

    return arranged;
  };

  return (
    <div className="space-y-6" id="schedule-weekly-root">
      
      {/* ==================== TOP CONTROL AREA ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white border border-[#E7E1D7] p-5 rounded-2xl shadow-xs">
        
        {/* Left Col: Mini Month Calendar with Nav Arrows */}
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E1D7]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-bold text-[#7A7268] uppercase tracking-wider select-none">
              {miniCalendarDate.toLocaleString('vi-VN', { month: 'short', year: 'numeric' })}
            </h4>
            <div className="flex gap-1">
              <button
                onClick={prevMiniMonth}
                className="p-1 bg-white hover:bg-[#F2EFE9] rounded border border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825] cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextMiniMonth}
                className="p-1 bg-white hover:bg-[#F2EFE9] rounded border border-[#E7E1D7] text-[#7A7268] hover:text-[#2C2825] cursor-pointer transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px]">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((h, i) => (
              <span key={i} className="text-[#8C827A] font-semibold py-0.5 select-none">{h}</span>
            ))}
            {miniCalendarDays.map((c, idx) => {
              const isActive = getLocalDateString(c.date) === getLocalDateString(anchorDate);
              const isToday = getLocalDateString(c.date) === getLocalDateString();
              const dateStr = getLocalDateString(c.date);
              const hasExam = manuals.some(m => m.midtermExamDate === dateStr || m.finalExamDate === dateStr || m.examDate === dateStr);
              
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setAnchorDate(c.date);
                    setMiniCalendarDate(c.date);
                  }}
                  className={`w-6 h-5.5 rounded font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#2E6930] text-white font-bold' 
                      : isToday 
                      ? 'border border-[#2E6930] text-[#2E6930] font-bold bg-[#EEF5EE]' 
                      : hasExam
                      ? 'bg-rose-100 border border-rose-300 text-rose-700 font-bold'
                      : c.isCurrent 
                      ? 'text-[#2C2825] hover:bg-[#EAE5DC]' 
                      : 'text-[#B0A79E] opacity-50'
                  }`}
                  title={hasExam ? 'Có lịch thi' : undefined}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Col: My Calendars (Calendar Groups horizontal chips) */}
        <div className="flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-[11px] font-bold text-[#7A7268] uppercase tracking-wider mb-2 border-b border-[#EFECE6] pb-1 flex justify-between items-center select-none">
              <span>Danh mục lịch</span>
              <span 
                className="cursor-pointer text-[#B85D38] hover:underline font-medium text-xs normal-case" 
                onClick={() => setShowExamModal(true)}
              >
                + Lịch thi học phần
              </span>
            </h4>

            {/* Horizontal Scrollable Badges for Calendar filters */}
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
              {calendarGroups.map(group => (
                <div 
                  key={group.id} 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F5F2EC] rounded-xl border border-[#E7E1D7] shadow-xs group/chip"
                >
                  <button
                    onClick={() => handleToggleGroup(group.id)}
                    className="flex items-center gap-1.5 text-xs text-[#2C2825] font-medium cursor-pointer"
                  >
                    <span 
                      style={{ backgroundColor: group.isSelected ? group.backgroundColor : 'transparent', borderColor: group.backgroundColor }} 
                      className="w-3 h-3 rounded-full border flex items-center justify-center transition-colors shrink-0"
                    >
                      {group.isSelected && <Check className="w-2 h-2 text-white stroke-[3px]" />}
                    </span>
                    <span className="truncate max-w-[90px]">{group.summary}</span>
                  </button>

                  {!group.isPrimary && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="opacity-0 group-hover/chip:opacity-100 p-0.5 text-[#8C827A] hover:text-rose-600 transition-all cursor-pointer shrink-0"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inline Add Calendar Group */}
          <form onSubmit={handleAddGroup} className="flex gap-1.5">
            <input
              type="text"
              required
              placeholder="Tên nhóm lịch mới..."
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              className="flex-1 bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg px-2.5 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930]"
            />
            <button
              type="submit"
              className="p-1.5 bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E7E1D7] rounded-lg text-[#7A7268] hover:text-[#2C2825] cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Col: Event Actions & Sync Controls */}
        <div className="flex flex-col justify-center space-y-2.5 md:pl-4 md:border-l border-[#EFECE6]">
          {isLoggedIn ? (
            <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#E7E1D7] px-3 py-1.5 rounded-xl text-xs text-[#2C2825]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#2E6930] shrink-0" />
                <span className="font-medium truncate max-w-[120px]">{userProfile?.displayName || 'Đã kết nối'}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-[10px] text-[#8C827A] hover:text-rose-600 cursor-pointer ml-1.5"
                title="Ngắt kết nối Google"
              >
                Ngắt kết nối
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-[#8C827A] italic bg-[#FAF8F5] py-1.5 rounded-xl border border-dashed border-[#E7E1D7] select-none">
              Chưa kết nối Google Calendar
            </div>
          )}

          <button
            onClick={() => openAddModalForTime(getLocalDateString(), 8)}
            className="w-full py-2 bg-[#2E6930] hover:bg-[#255527] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo sự kiện
          </button>
          
          <button
            onClick={handleSyncGoogleCalendar}
            disabled={isSyncing}
            className="w-full py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#2C2825] border border-[#E7E1D7] font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#2E6930]' : 'text-[#7A7268]'}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Google Calendar'}</span>
          </button>
        </div>

      </div>

      {/* ==================== MAIN WEEK TIMELINE VIEW (Takes full width now) ==================== */}
      <div className="flex flex-col min-w-0 w-full">
        
        {/* Controls header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E7E1D7] p-4 rounded-2xl shadow-xs mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={setToday}
              className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl text-xs font-semibold text-[#2C2825] uppercase tracking-wider hover:bg-[#F2EFE9] transition-all cursor-pointer"
            >
              Hôm nay
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={prevWeek}
                className="p-1.5 bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg hover:bg-[#F2EFE9] text-[#7A7268] hover:text-[#2C2825] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextWeek}
                className="p-1.5 bg-[#FAF8F5] border border-[#E7E1D7] rounded-lg hover:bg-[#F2EFE9] text-[#7A7268] hover:text-[#2C2825] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-[#2C2825] tracking-wide">
              {headerDateText}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExamModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#B85D38] border border-[#E7E1D7] font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#B85D38]" />
              Lịch thi học phần
            </button>
            <select
              disabled
              value="week"
              className="bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl text-xs font-semibold text-[#7A7268] px-3 py-1.5 focus:outline-none cursor-not-allowed"
            >
              <option value="week">Tuần</option>
            </select>
          </div>
        </div>

        {/* Weekly Scheduler Table */}
        <div className="bg-white border border-[#E7E1D7] rounded-2xl overflow-hidden shadow-xs flex flex-col flex-1 max-h-[750px]">
          
          {/* Day Headers row */}
          <div className="grid grid-cols-[60px_1fr] border-b border-[#E7E1D7] bg-[#FAF8F5] divide-x divide-[#EFECE6]">
            <div className="flex items-center justify-center text-[10px] font-semibold text-[#8C827A] font-mono tracking-wider">
              GMT+7
            </div>
            
            <div className="grid grid-cols-7 divide-x divide-[#EFECE6]">
              {weekDates.map((date, idx) => {
                const dateStr = getLocalDateString(date);
                const isToday = dateStr === getLocalDateString();
                const dayNum = date.getDate();
                const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                
                return (
                  <div key={idx} className={`py-2.5 text-center flex flex-col items-center justify-center ${isToday ? 'bg-[#2E6930]/5' : ''}`}>
                    <span className="text-[10px] font-medium text-[#8C827A] uppercase tracking-wider">{dayLabel}</span>
                    <span className={`text-sm font-bold mt-0.5 rounded-full w-7 h-7 flex items-center justify-center ${
                      isToday ? 'bg-[#2E6930] text-white shadow-xs' : 'text-[#2C2825]'
                    }`}>
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Scroll Container */}
          <div className="flex-1 overflow-y-auto flex min-h-0 select-none">
            <div className="grid grid-cols-[60px_1fr] divide-x divide-[#EFECE6] w-full relative">
              
              {/* Hour Grid Indicators */}
              <div className="flex flex-col bg-[#FAF8F5]/50 font-mono text-[9px] font-semibold text-[#8C827A] py-1.5">
                {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                  const hour = START_HOUR + i;
                  const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                  return (
                    <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="text-center pt-1.5 pr-2 border-b border-[#F0EDE6]">
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Day Grid timeline columns */}
              <div className="grid grid-cols-7 divide-x divide-[#EFECE6] relative h-full bg-white">
                
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      style={{ height: `${HOUR_HEIGHT}px` }} 
                      className="border-b border-[#F0EDE6] w-full"
                    />
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((date, dayIdx) => {
                  const dateStr = getLocalDateString(date);
                  const isToday = dateStr === getLocalDateString();
                  
                  // Filter events for this column (excluding all-day)
                  const dayEvents = visibleEvents.filter(e => {
                    if (!e.start.dateTime) return false;
                    const d = new Date(e.start.dateTime);
                    return getLocalDateString(d) === dateStr;
                  });

                  const arranged = arrangeEvents(dayEvents);

                  return (
                    <div
                      key={dayIdx}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleColumnDrop(e, dateStr)}
                      onMouseDown={(e) => handleColumnMouseDown(e, dateStr)}
                      onMouseMove={(e) => handleColumnMouseMove(e, dateStr)}
                      onMouseUp={handleColumnMouseUp}
                      className={`relative h-full transition-colors group cursor-crosshair ${isToday ? 'bg-[#2E6930]/[0.02]' : ''}`}
                    >
                      {/* Active drag range placeholder */}
                      {selectionActive && selectionActive.date === dateStr && isDraggingRange && (
                        <div
                          style={{
                            top: `${((selectionActive.start - START_HOUR * 60) / 60) * HOUR_HEIGHT}px`,
                            height: `${Math.max(30, ((selectionActive.end - selectionActive.start) / 60) * HOUR_HEIGHT)}px`,
                            left: '5%',
                            width: '90%'
                          }}
                          className="absolute bg-[#2E6930]/20 border-2 border-dashed border-[#2E6930] rounded-lg p-1.5 z-30 flex flex-col justify-center pointer-events-none"
                        >
                          <span className="text-[9px] font-bold text-[#2E6930] font-mono text-center truncate">
                            {Math.floor(selectionActive.start / 60)}:{String(selectionActive.start % 60).padStart(2, '0')} - {Math.floor(selectionActive.end / 60)}:{String(selectionActive.end % 60).padStart(2, '0')}
                          </span>
                        </div>
                      )}

                      {/* Render events */}
                      {arranged.map(({ event, left, width }) => {
                        const group = calendarGroups.find(g => g.id === event.calendarId);
                        const bg = group ? group.backgroundColor : '#3b82f6';
                        
                        const startD = new Date(event.start.dateTime!);
                        const endD = new Date(event.end.dateTime!);
                        
                        const startMin = startD.getHours() * 60 + startD.getMinutes();
                        const endMin = endD.getHours() * 60 + endD.getMinutes();
                        
                        const gridStartMin = START_HOUR * 60;
                        
                        const topPx = ((startMin - gridStartMin) / 60) * HOUR_HEIGHT;
                        const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;

                        const startTimeStr = startD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onMouseDown={(e) => e.stopPropagation()} // prevent triggering drag selection
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(event);
                            }}
                            style={{ 
                              top: `${topPx}px`, 
                              height: `${Math.max(26, heightPx)}px`,
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: bg
                            }}
                            className="absolute rounded-lg border border-black/15 p-1.5 shadow-xs text-white text-left select-none cursor-grab active:cursor-grabbing hover:shadow-sm hover:-translate-y-[0.5px] transition-all overflow-hidden flex flex-col z-10 hover:z-20 event-card"
                            title={`${event.summary}\n${startTimeStr} (${endMin - startMin}m)`}
                          >
                            <span className="text-[11px] font-semibold leading-tight truncate drop-shadow-xs">
                              {event.summary}
                            </span>
                            {heightPx > 40 && (
                              <span className="text-[9px] font-medium opacity-90 mt-0.5 font-mono drop-shadow-xs">
                                {startTimeStr}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ==================== ADD / EDIT EVENT MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <div className="bg-white border border-[#E7E1D7] p-6 rounded-2xl w-full max-w-md shadow-xl relative text-[#2C2825]">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#8C827A] hover:text-[#2C2825] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-[#2C2825] mb-4 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[#2E6930]" />
              {selectedEvent ? 'Chi tiết / Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#7A7268] font-semibold block mb-1">Tiêu đề sự kiện:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Học Kubernetes, Làm đồ án..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  disabled={!!associatedTaskId}
                  className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-[#2C2825] focus:outline-none focus:border-[#2E6930] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7A7268] font-semibold block mb-1">Mô tả (tùy chọn):</label>
                <textarea
                  placeholder="Thêm ghi chú cho sự kiện..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-[#2C2825] focus:outline-none focus:border-[#2E6930] h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#7A7268] font-semibold block mb-1">Nhóm lịch:</label>
                  <select
                    value={formCalendarId}
                    onChange={(e) => setFormCalendarId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-[#2C2825] focus:outline-none focus:border-[#2E6930] cursor-pointer"
                  >
                    {calendarGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.summary}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#7A7268] font-semibold block mb-1">Ngày diễn ra:</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-[#2C2825] focus:outline-none focus:border-[#2E6930] font-mono"
                  />
                </div>
              </div>

              {/* All day toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDayCheck"
                  checked={formIsAllDay}
                  onChange={(e) => setFormIsAllDay(e.target.checked)}
                  className="w-4 h-4 accent-[#2E6930] rounded cursor-pointer"
                />
                <label htmlFor="allDayCheck" className="font-medium text-[#2C2825] cursor-pointer select-none">
                  Cả ngày
                </label>
              </div>

              {/* Start/End hours */}
              {!formIsAllDay && (
                <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] p-2.5 border border-[#E7E1D7] rounded-xl">
                  <div>
                    <label className="text-[9px] text-[#7A7268] font-semibold block mb-1">Bắt đầu:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={START_HOUR}
                        max={END_HOUR}
                        required
                        value={formStartHour}
                        onChange={(e) => setFormStartHour(Number(e.target.value))}
                        className="w-14 bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-center text-[#2C2825] font-mono"
                      />
                      <span className="self-center text-[#7A7268]">:</span>
                      <select
                        value={formStartMinute}
                        onChange={(e) => setFormStartMinute(Number(e.target.value))}
                        className="bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-[#2C2825] font-mono flex-1 cursor-pointer"
                      >
                        <option value={0}>00</option>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={45}>45</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-[#7A7268] font-semibold block mb-1">Kết thúc:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={START_HOUR}
                        max={END_HOUR + 1}
                        required
                        value={formEndHour}
                        onChange={(e) => setFormEndHour(Number(e.target.value))}
                        className="w-14 bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-center text-[#2C2825] font-mono"
                      />
                      <span className="self-center text-[#7A7268]">:</span>
                      <select
                        value={formEndMinute}
                        onChange={(e) => setFormEndMinute(Number(e.target.value))}
                        className="bg-white border border-[#E7E1D7] rounded-lg p-1.5 text-[#2C2825] font-mono flex-1 cursor-pointer"
                      >
                        <option value={0}>00</option>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={45}>45</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Association */}
              {!selectedEvent && (
                <div>
                  <label className="text-[10px] text-[#7A7268] font-semibold block mb-1">Liên kết với nhiệm vụ:</label>
                  <select
                    value={associatedTaskId}
                    onChange={(e) => {
                      setAssociatedTaskId(e.target.value);
                      if (e.target.value) {
                        const found = todoItems.find(t => t.id === e.target.value);
                        if (found) setFormTitle(found.title);
                      }
                    }}
                    className="w-full bg-[#FAF8F5] border border-[#E7E1D7] rounded-xl px-3 py-2 text-[#2C2825] focus:outline-none focus:border-[#2E6930] cursor-pointer"
                  >
                    <option value="">-- Sự kiện độc lập (Không liên kết task) --</option>
                    {todoItems.filter(t => !t.isCompleted).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                {selectedEvent && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent.id, selectedEvent.calendarId)}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa sự kiện
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 py-2.5 bg-[#2E6930] hover:bg-[#255527] text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EXAM SCHEDULE MODAL ==================== */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <div className="bg-white border border-[#E7E1D7] p-6 rounded-2xl w-full max-w-lg shadow-xl relative flex flex-col max-h-[85vh] text-[#2C2825]">
            <button
              onClick={() => setShowExamModal(false)}
              className="absolute top-4 right-4 text-[#8C827A] hover:text-[#2C2825] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#2C2825] flex items-center gap-2 select-none">
                <GraduationCap className="w-5 h-5 text-[#B85D38]" />
                Đăng ký lịch thi học phần
              </h3>
              <p className="text-xs text-[#7A7268] mt-1">Cài đặt ngày thi giữa kỳ và cuối kỳ cho các môn học đang theo dõi</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
              {manuals.length > 0 ? (
                manuals.map(manual => (
                  <div 
                    key={manual.id} 
                    className="bg-[#FAF8F5] border border-[#E7E1D7] p-3.5 rounded-xl flex flex-col gap-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFECE6] pb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[#2C2825] truncate">{manual.name}</h4>
                          {manual.status === 'DAI_VIEN_MAN' ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold shrink-0">Hoàn thành</span>
                          ) : manual.status === 'DANG_TU_LUYEN' ? (
                            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold shrink-0">Đang học</span>
                          ) : (
                            <span className="text-[10px] bg-stone-100 text-[#7A7268] border border-[#E7E1D7] px-2 py-0.5 rounded-full font-semibold shrink-0">Chưa bắt đầu</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8C827A] mt-0.5 uppercase tracking-wide">{manual.category || 'Học phần'}</p>
                      </div>

                      {/* Display midterm limit details */}
                      <div className="text-[10px] text-[#7A7268] font-medium bg-white px-2 py-1 rounded-lg border border-[#E7E1D7] shrink-0">
                        📌 Giữa kỳ: {(() => {
                          const limitStage = manual.midtermLimitStageId ? manual.stages.find(s => s.id === manual.midtermLimitStageId) : null;
                          return limitStage ? `Đến ${limitStage.title}` : 'Toàn bộ nội dung';
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#B85D38] font-semibold shrink-0">Thi giữa kỳ:</span>
                        <input
                          type="date"
                          value={manual.midtermExamDate || ''}
                          onChange={(e) => handleMidtermExamDateChange(manual.id, e.target.value)}
                          className="bg-white border border-[#E7E1D7] rounded-lg px-2.5 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] font-mono w-32"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#B85D38] font-semibold shrink-0">Thi cuối kỳ:</span>
                        <input
                          type="date"
                          value={manual.finalExamDate || ''}
                          onChange={(e) => handleFinalExamDateChange(manual.id, e.target.value)}
                          className="bg-white border border-[#E7E1D7] rounded-lg px-2.5 py-1 text-xs text-[#2C2825] focus:outline-none focus:border-[#2E6930] font-mono w-32"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[#8C827A] text-xs flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-[#A8A29E]" />
                  Chưa có môn học nào được tạo.
                  <br />
                  <span className="text-[11px] text-[#A8A29E] italic">Vui lòng thêm môn học ở tab "Lộ trình học tập" trước!</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#EFECE6] shrink-0">
              <button
                onClick={() => setShowExamModal(false)}
                className="w-full py-2.5 bg-[#2E6930] hover:bg-[#255527] text-white font-semibold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                Xong & Đồng bộ với Lịch biểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
