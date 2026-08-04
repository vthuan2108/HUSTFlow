/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarGroup, CalendarEvent } from '../types';

async function checkResponse(res: Response, errorLabel: string) {
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('tlk_google_access_token');
      throw new Error('GOOGLE_AUTH_401');
    }
    throw new Error(`${errorLabel}: ${res.statusText}`);
  }
}

/**
 * Fetch list of calendars from Google Calendar
 */
export async function fetchGoogleCalendars(token: string): Promise<any[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res, 'Failed to fetch calendar list');
  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new secondary calendar on Google Calendar
 */
export async function createGoogleCalendar(token: string, summary: string): Promise<any> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ summary })
  });
  await checkResponse(res, 'Failed to create Google Calendar');
  return await res.json();
}

/**
 * Fetch events for a specific calendar within a time range
 */
export async function fetchGoogleEvents(
  token: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<any[]> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res, `Failed to fetch events for calendar ${calendarId}`);
  const data = await res.json();
  return data.items || [];
}

/**
 * Insert a new event into a Google Calendar
 */
export async function insertGoogleEvent(
  token: string,
  calendarId: string,
  event: Partial<CalendarEvent>
): Promise<any> {
  const resource = {
    summary: event.summary,
    description: event.description || '',
    start: event.start,
    end: event.end
  };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resource)
  });
  await checkResponse(res, 'Failed to insert Google Calendar event');
  return await res.json();
}

/**
 * Update an existing event in a Google Calendar
 */
export async function updateGoogleEvent(
  token: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<any> {
  const resource = {
    summary: event.summary,
    description: event.description || '',
    start: event.start,
    end: event.end
  };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resource)
  });
  await checkResponse(res, 'Failed to update Google Calendar event');
  return await res.json();
}

/**
 * Delete an event from a Google Calendar
 */
export async function deleteGoogleEvent(
  token: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    await checkResponse(res, 'Failed to delete Google Calendar event');
  }
}

/**
 * Full bidirectional synchronization of Google Calendar groups (calendars) and events
 */
const isLocalGroupId = (id: string): boolean => {
  return id.startsWith('group_') || id.startsWith('local_') || (!id.includes('@') && id !== 'primary');
};

/**
 * Full bidirectional synchronization of Google Calendar groups (calendars) and events
 */
export async function syncGoogleCalendarData(
  token: string,
  localGroups: CalendarGroup[],
  localEvents: CalendarEvent[],
  timeMin: string,
  timeMax: string
): Promise<{ syncedGroups: CalendarGroup[]; syncedEvents: CalendarEvent[] }> {
  try {
    // 1. Fetch Google Calendar list
    const googleCalendars = await fetchGoogleCalendars(token);

    const syncedGroups: CalendarGroup[] = [...localGroups];

    // Merge Google Calendars with local groups
    for (const gCal of googleCalendars) {
      const exists = syncedGroups.some(g => g.id === gCal.id);
      if (!exists) {
        // Try to match primary or match secondary by name (summary) to link existing local placeholders
        let localMatchIdx = -1;
        if (gCal.primary) {
          localMatchIdx = syncedGroups.findIndex(g => g.isPrimary || g.id === 'group_tasks');
        } else {
          localMatchIdx = syncedGroups.findIndex(g => isLocalGroupId(g.id) && g.summary.toLowerCase() === gCal.summary.toLowerCase());
        }

        if (localMatchIdx !== -1) {
          syncedGroups[localMatchIdx].id = gCal.id;
          syncedGroups[localMatchIdx].isPrimary = gCal.primary || false;
        } else {
          // Add as new calendar group
          syncedGroups.push({
            id: gCal.id,
            summary: gCal.summary,
            backgroundColor: gCal.backgroundColor || '#8b5cf6',
            isSelected: true,
            isPrimary: gCal.primary || false
          });
        }
      }
    }

    // Create local-only groups in Google Calendar
    for (let i = 0; i < syncedGroups.length; i++) {
      const group = syncedGroups[i];
      if (isLocalGroupId(group.id)) {
        try {
          const newGCal = await createGoogleCalendar(token, group.summary);
          syncedGroups[i] = {
            ...group,
            id: newGCal.id
          };
        } catch (err) {
          console.error(`Failed to create calendar for group ${group.summary}:`, err);
        }
      }
    }

    // Map local events' calendarIds if their group IDs were updated to Google Calendar IDs
    const mappedLocalEvents = localEvents.map(event => {
      const matchIdx = localGroups.findIndex(g => g.id === event.calendarId);
      if (matchIdx !== -1) {
        const syncedGroup = syncedGroups[matchIdx];
        if (syncedGroup && syncedGroup.id !== event.calendarId) {
          return {
            ...event,
            calendarId: syncedGroup.id
          };
        }
      }
      return event;
    });

    // 2. Fetch Google Events for all selected groups
    const syncedEvents: CalendarEvent[] = [];
    const localOnlyEvents = mappedLocalEvents.filter(e => e.id.startsWith('local_') || e.id.startsWith('exam_')); // Keep virtual exams or local unsynced

    // Push local-only events to Google if they are associated with a valid Google calendarId
    for (const localEvent of localOnlyEvents) {
      // Skip exams (exams are calculated from manuals state, no need to push them as separate calendar events unless desired. We skip to avoid duplicate exams on Google Calendar)
      if (localEvent.id.startsWith('exam_')) {
        syncedEvents.push(localEvent);
        continue;
      }
      
      const targetGroup = syncedGroups.find(g => g.id === localEvent.calendarId);
      if (targetGroup && !isLocalGroupId(targetGroup.id)) {
        try {
          const newGEvent = await insertGoogleEvent(token, targetGroup.id, localEvent);
          syncedEvents.push({
            ...localEvent,
            id: newGEvent.id,
            calendarId: targetGroup.id
          });
        } catch (err) {
          console.error(`Failed to push local event to Google:`, err);
          syncedEvents.push(localEvent); // Keep it local for retry
        }
      } else {
        syncedEvents.push(localEvent);
      }
    }

    // Sync active calendars
    for (const group of syncedGroups) {
      if (!group.isSelected || group.id.startsWith('local_')) continue;

      try {
        const gEvents = await fetchGoogleEvents(token, group.id, timeMin, timeMax);

        // Merge fetched Google events
        for (const gEv of gEvents) {
          if (gEv.status === 'cancelled') continue;

          const existsIdx = syncedEvents.findIndex(e => e.id === gEv.id);
          const mappedEvent: CalendarEvent = {
            id: gEv.id,
            calendarId: group.id,
            summary: gEv.summary || 'Không có tiêu đề',
            description: gEv.description || '',
            start: {
              dateTime: gEv.start?.dateTime,
              date: gEv.start?.date
            },
            end: {
              dateTime: gEv.end?.dateTime,
              date: gEv.end?.date
            }
          };

          if (existsIdx !== -1) {
            syncedEvents[existsIdx] = mappedEvent;
          } else {
            syncedEvents.push(mappedEvent);
          }
        }
      } catch (err) {
        console.error(`Failed to sync events for calendar ${group.summary}:`, err);
      }
    }

    return { syncedGroups, syncedEvents };
  } catch (error) {
    console.error('syncGoogleCalendarData error:', error);
    return { syncedGroups: localGroups, syncedEvents: localEvents };
  }
}
