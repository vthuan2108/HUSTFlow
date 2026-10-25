/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TodoItem } from '../types';
import { authenticatedGoogleFetch } from './firebase';

const API_BASE = 'https://tasks.googleapis.com/tasks/v1';

// Helper to make Google Tasks API requests
async function apiCall(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await authenticatedGoogleFetch(`${API_BASE}${endpoint}`, token, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Tasks API Error on ${endpoint}:`, errorText);
    if (response.status === 401) {
      localStorage.removeItem('tlk_google_access_token');
      throw new Error('GOOGLE_AUTH_401');
    }
    throw new Error(`Google Tasks API Error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Get all task lists from user's Google account
export async function getAllUserTaskLists(token: string): Promise<any[]> {
  try {
    const data = await apiCall('/users/@me/lists?maxResults=100', token);
    return data?.items || [];
  } catch (e) {
    console.warn('Failed to fetch all task lists:', e);
    return [];
  }
}

// Get or resolve the Default task list ID from Google Tasks (@default)
export async function getDefaultTaskListId(token: string): Promise<string> {
  try {
    const data = await apiCall('/users/@me/lists/@default', token);
    return data?.id || '@default';
  } catch (e) {
    console.warn('Failed to resolve @default task list ID, using alias "@default":', e);
    return '@default';
  }
}

// Backward-compatible alias
export const getOrCreateTaskList = getDefaultTaskListId;

// Format date to RFC3339 UTC timestamp required by Google Tasks.
function formatToRFC3339(dateStr?: string): string | undefined {
  if (!dateStr || !dateStr.includes('-')) return undefined;
  return `${dateStr}T12:00:00.000Z`;
}

// Sync local todos with Google Tasks across ALL user task lists
export async function syncGoogleTasks(
  token: string,
  localTodos: TodoItem[],
  deletedIds: string[] = []
): Promise<{ syncedTodos: TodoItem[]; addedCount: number; updatedCount: number }> {
  try {
    // 1. Fetch all lists in the user's Google Tasks account
    const allLists = await getAllUserTaskLists(token);
    const defaultListId = await getDefaultTaskListId(token);

    // Build the set of all list objects to sync
    const listsMap = new Map<string, string>(); // listId -> listTitle
    if (defaultListId) listsMap.set(defaultListId, 'My Tasks');

    allLists.forEach((l: any) => {
      if (l.id) {
        listsMap.set(l.id, l.title || 'My Tasks');
      }
    });

    // 2. Delete tasks on Google Tasks if they are in deletedIds list
    for (const gid of deletedIds) {
      try {
        await deleteTaskOnGoogle(token, gid);
      } catch (err) {
        console.warn(`Failed to delete task ${gid} on Google during sync:`, err);
      }
    }

    // 3. Fetch tasks across ALL lists with full pagination
    let rawGoogleTasks: any[] = [];
    for (const [listId, listTitle] of Array.from(listsMap.entries())) {
      let pageToken: string | undefined = undefined;
      do {
        try {
          const query = new URLSearchParams({
            showCompleted: 'true',
            showHidden: 'true',
            maxResults: '100',
            ...(pageToken ? { pageToken } : {})
          });
          const googleData = await apiCall(`/lists/${listId}/tasks?${query.toString()}`, token);
          if (googleData && googleData.items) {
            const items = googleData.items.map((item: any) => ({
              ...item,
              _listId: listId,
              _listTitle: listTitle
            }));
            rawGoogleTasks = rawGoogleTasks.concat(items);
          }
          pageToken = googleData ? googleData.nextPageToken : undefined;
        } catch (err) {
          console.warn(`Failed to fetch tasks for list ${listTitle} (${listId}):`, err);
          break;
        }
      } while (pageToken);
    }

    // 4. Deduplicate tasks by task ID and filter out deleted tasks
    const uniqueGoogleTasksMap = new Map<string, any>();
    rawGoogleTasks.forEach((gt: any) => {
      if (gt.id && !gt.deleted && !uniqueGoogleTasksMap.has(gt.id)) {
        uniqueGoogleTasksMap.set(gt.id, gt);
      }
    });
    const googleTasks = Array.from(uniqueGoogleTasksMap.values());

    let addedCount = 0;
    let updatedCount = 0;

    // Index Google Tasks by ID, normalized (Title + Date), and normalized Title
    const googleMapById = new Map<string, any>();
    const googleMapByTitleAndDate = new Map<string, any>();
    const googleMapByTitle = new Map<string, any>();

    googleTasks.forEach((gt: any) => {
      googleMapById.set(gt.id, gt);
      const titleKey = (gt.title || '').trim().toLowerCase();
      const dateKey = gt.due ? gt.due.split('T')[0] : '';
      if (titleKey && !gt.parent) {
        if (dateKey) {
          googleMapByTitleAndDate.set(`${titleKey}__${dateKey}`, gt);
        }
        if (!googleMapByTitle.has(titleKey)) {
          googleMapByTitle.set(titleKey, gt);
        }
      }
    });

    // 5. Step A: Match local todos against Google Tasks
    const matchedLocalTodos: TodoItem[] = [];
    const usedGoogleIds = new Set<string>();

    for (let i = 0; i < localTodos.length; i++) {
      const todo = { ...localTodos[i], type: 'DAY' as const };

      let matchedGoogleTask = null;
      if (todo.googleTaskId && googleMapById.has(todo.googleTaskId)) {
        matchedGoogleTask = googleMapById.get(todo.googleTaskId);
      } else {
        const localTitleKey = (todo.title || '').trim().toLowerCase();
        const localDateKey = todo.dueDate || '';
        if (localTitleKey && localDateKey && googleMapByTitleAndDate.has(`${localTitleKey}__${localDateKey}`)) {
          const candidate = googleMapByTitleAndDate.get(`${localTitleKey}__${localDateKey}`);
          if (!usedGoogleIds.has(candidate.id)) {
            matchedGoogleTask = candidate;
          }
        } else if (localTitleKey && googleMapByTitle.has(localTitleKey)) {
          const candidate = googleMapByTitle.get(localTitleKey);
          if (!usedGoogleIds.has(candidate.id)) {
            matchedGoogleTask = candidate;
          }
        }
      }

      if (matchedGoogleTask) {
        usedGoogleIds.add(matchedGoogleTask.id);
        // Link up IDs and List metadata
        todo.googleTaskId = matchedGoogleTask.id;
        todo.googleTaskListId = matchedGoogleTask._listId;
        todo.googleTaskListName = matchedGoogleTask._listTitle;

        // Sync completion status
        const isGoogleCompleted = matchedGoogleTask.status === 'completed';
        const isLocalCompleted = todo.isCompleted;

        if (isGoogleCompleted !== isLocalCompleted) {
          if (isGoogleCompleted) {
            todo.isCompleted = true;
            todo.completedAt = matchedGoogleTask.completed || matchedGoogleTask.updated || new Date().toISOString();
            updatedCount++;
          } else {
            // Local is completed, Google is not -> update Google
            await patchTaskOnGoogle(
              token,
              todo.googleTaskId,
              {
                isCompleted: true,
                completedAt: todo.completedAt || new Date().toISOString()
              },
              todo.googleTaskListId
            );
            updatedCount++;
          }
        }

        // Sync due date if Google has an explicit due date
        if (matchedGoogleTask.due) {
          const gDueDate = matchedGoogleTask.due.split('T')[0];
          if (gDueDate && todo.dueDate !== gDueDate) {
            todo.dueDate = gDueDate;
            updatedCount++;
          }
        }

        // Clean up legacy '[HUSTFlow] Tasks' label from Google Tasks notes if present
        if (matchedGoogleTask.notes === '[HUSTFlow] Tasks') {
          patchTaskOnGoogle(
            token,
            todo.googleTaskId,
            { notes: null },
            todo.googleTaskListId
          ).catch(err => console.warn('Failed to clear legacy label from Google Task:', err));
        }

        matchedLocalTodos.push(todo);
      } else {
        if (!todo.googleTaskId) {
          // Task created locally on web, not yet on Google Tasks -> push to Google Tasks default list
          const pushedId = await pushTaskToGoogle(token, todo);
          if (pushedId) {
            todo.googleTaskId = pushedId;
            todo.googleTaskListId = defaultListId;
            todo.googleTaskListName = 'My Tasks';
            addedCount++;
          }
          matchedLocalTodos.push(todo);
        } else {
          // Task had a googleTaskId but is no longer on Google Tasks (deleted on Google)
          // -> remove from local state by omitting it
        }
      }
    }

    // 6. Step B: Pull tasks from Google Tasks that do not exist locally
    const localGoogleIds = new Set(matchedLocalTodos.map(t => t.googleTaskId).filter(Boolean));
    const localTitleDateSet = new Set(
      matchedLocalTodos.map(t => `${(t.title || '').trim().toLowerCase()}__${t.dueDate || ''}`)
    );
    const syncedTodos = [...matchedLocalTodos];

    for (const gt of googleTasks) {
      if (!localGoogleIds.has(gt.id) && !deletedIds.includes(gt.id)) {
        // If task has explicit due date on Google, use it.
        // If NO due date on Google, leave dueDate as undefined so it sits in "Chưa xếp ngày" (Backlog)!
        let dueDate: string | undefined = undefined;
        if (gt.due) {
          dueDate = gt.due.split('T')[0];
        }

        const titleKey = (gt.title || '').trim().toLowerCase();
        const titleDateKey = `${titleKey}__${dueDate || ''}`;

        // Deduplication: If local already has a task with identical title and dueDate, do NOT pull duplicate!
        if (titleKey && localTitleDateSet.has(titleDateKey)) {
          continue;
        }

        const isCompleted = gt.status === 'completed';
        const completedAt = isCompleted ? (gt.completed || gt.updated || new Date().toISOString()) : undefined;
        const createdAt = gt.updated || (isCompleted ? completedAt : new Date().toISOString());

        const listTitle = gt._listTitle || '';
        const isGenericList = ['tasks', 'my tasks', '@default', 'default', 'chung', 'hustflow'].includes(listTitle.toLowerCase());

        const pulledTodo: TodoItem = {
          id: `todo_pulled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: (gt.title || '').trim() || (gt.notes ? gt.notes.split('\n')[0] : 'Nhiệm vụ không tên'),
          type: 'DAY',
          isCompleted,
          createdAt: createdAt || new Date().toISOString(),
          completedAt,
          tuViReward: 15,
          linhThachReward: 5,
          googleTaskId: gt.id,
          googleTaskListId: gt._listId,
          googleTaskListName: gt._listTitle,
          dueDate,
          difficulty: 'SO_CAP',
          project: isGenericList ? '' : listTitle
        };

        syncedTodos.push(pulledTodo);
        localTitleDateSet.add(titleDateKey);
        addedCount++;
      }
    }

    return { syncedTodos, addedCount, updatedCount };
  } catch (error) {
    console.error('syncGoogleTasks error:', error);
    throw error;
  }
}

// Single push/create to Google Tasks
export async function pushTaskToGoogle(
  token: string,
  todo: TodoItem,
  listId?: string
): Promise<string | null> {
  try {
    const targetListId = listId || todo.googleTaskListId || await getDefaultTaskListId(token);

    const body: any = {
      title: todo.title,
      status: todo.isCompleted ? 'completed' : 'needsAction',
      ...(todo.isCompleted ? { completed: todo.completedAt || new Date().toISOString() } : {})
    };

    // Only set notes if an actual description exists
    if ((todo as any).description && (todo as any).description.trim()) {
      body.notes = (todo as any).description.trim();
    }

    if (todo.dueDate) {
      const rfc = formatToRFC3339(todo.dueDate);
      if (rfc) body.due = rfc;
    }

    const createdGT = await apiCall(`/lists/${targetListId}/tasks`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return createdGT?.id || null;
  } catch (err) {
    console.error('pushTaskToGoogle error:', err);
    return null;
  }
}

// Single patch/update to Google Tasks
export async function patchTaskOnGoogle(
  token: string,
  googleTaskId: string,
  updates: { title?: string; isCompleted?: boolean; completedAt?: string; dueDate?: string; notes?: string | null },
  listId?: string
): Promise<boolean> {
  try {
    const targetListId = listId || await getDefaultTaskListId(token);
    const body: any = {};

    if (updates.title !== undefined) {
      body.title = updates.title;
    }

    if (updates.notes !== undefined) {
      body.notes = updates.notes;
    }

    if (updates.dueDate !== undefined) {
      if (updates.dueDate && updates.dueDate.trim()) {
        const rfc = formatToRFC3339(updates.dueDate);
        if (rfc) body.due = rfc;
      } else {
        body.due = null; // Clear due date on Google Tasks
      }
    }

    if (updates.isCompleted !== undefined) {
      body.status = updates.isCompleted ? 'completed' : 'needsAction';
      if (updates.isCompleted) {
        body.completed = updates.completedAt || new Date().toISOString();
      } else {
        body.completed = null;
      }
    }

    await apiCall(`/lists/${targetListId}/tasks/${googleTaskId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    return true;
  } catch (err) {
    console.error('patchTaskOnGoogle error:', err);
    return false;
  }
}

// Single delete on Google Tasks
export async function deleteTaskOnGoogle(
  token: string,
  googleTaskId: string,
  listId?: string
): Promise<boolean> {
  try {
    const targetListId = listId || await getDefaultTaskListId(token);
    await apiCall(`/lists/${targetListId}/tasks/${googleTaskId}`, token, {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    console.error('deleteTaskOnGoogle error:', err);
    return false;
  }
}
