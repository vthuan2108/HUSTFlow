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
// We use T12:00:00.000Z (noon UTC) so that in any timezone (like GMT+7),
// the date does NOT lurch back to the previous day when displayed in Google Tasks UI.
function formatToRFC3339(dateStr: string): string {
  // dateStr is in YYYY-MM-DD
  return `${dateStr}T12:00:00.000Z`;
}

// Sync local todos with Google Tasks Default List (Fetches all tasks, completed & uncompleted)
export async function syncGoogleTasks(
  token: string,
  localTodos: TodoItem[],
  deletedIds: string[] = []
): Promise<{ syncedTodos: TodoItem[]; addedCount: number; updatedCount: number }> {
  try {
    const defaultListId = await getDefaultTaskListId(token);
    const allLists = await getAllUserTaskLists(token);
    
    // Primary sync list is the default task list
    const listIdsToSync = new Set<string>();
    if (defaultListId) listIdsToSync.add(defaultListId);
    
    // Also inspect any legacy "Nhiệm Vụ Tông Môn" or "Tiên Lộ Ký - Đạo Tràng" lists so we can migrate existing tasks into default list
    const legacyListIds = new Set<string>();
    allLists.forEach((l: any) => {
      if (l.title === 'Nhiệm Vụ Tông Môn' || l.title === 'Tiên Lộ Ký - Đạo Tràng') {
        if (l.id && l.id !== defaultListId) {
          listIdsToSync.add(l.id);
          legacyListIds.add(l.id);
        }
      }
    });

    // 1. Delete tasks on Google Tasks if they are in deletedIds list
    for (const gid of deletedIds) {
      try {
        await deleteTaskOnGoogle(token, gid, defaultListId);
      } catch (err) {
        console.warn(`Failed to delete task ${gid} on Google during sync:`, err);
      }
    }
    
    // 2. Fetch tasks with full pagination (including all completed & uncompleted)
    let rawGoogleTasks: any[] = [];
    for (const listId of Array.from(listIdsToSync)) {
      const isLegacy = legacyListIds.has(listId);
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
              _isLegacy: isLegacy
            }));
            rawGoogleTasks = rawGoogleTasks.concat(items);
          }
          pageToken = googleData ? googleData.nextPageToken : undefined;
        } catch (err) {
          console.warn(`Failed to fetch tasks for list ${listId}:`, err);
          break;
        }
      } while (pageToken);
    }
    
    // Deduplicate by task ID
    const uniqueGoogleTasksMap = new Map<string, any>();
    rawGoogleTasks.forEach((gt: any) => {
      if (gt.id && !gt.deleted && !uniqueGoogleTasksMap.has(gt.id)) {
        uniqueGoogleTasksMap.set(gt.id, gt);
      }
    });
    const googleTasks = Array.from(uniqueGoogleTasksMap.values());
    
    let addedCount = 0;
    let updatedCount = 0;
    
    // Map Google Tasks by ID and title for matching
    const googleMapById = new Map<string, any>();
    const googleMapByTitle = new Map<string, any>();
    
    googleTasks.forEach((gt: any) => {
      googleMapById.set(gt.id, gt);
      if (!gt.parent) { // Avoid subtasks mismatch if any
        googleMapByTitle.set(gt.title, gt);
      }
    });
    
    // Step A: Sync local items that match Google Tasks, and filter out/delete those that don't match
    const matchedLocalTodos: TodoItem[] = [];
    
    for (let i = 0; i < localTodos.length; i++) {
      const todo = { ...localTodos[i], type: 'DAY' as const }; // Ensure type is strictly DAY
      
      let matchedGoogleTask = null;
      if (todo.googleTaskId && googleMapById.has(todo.googleTaskId)) {
        matchedGoogleTask = googleMapById.get(todo.googleTaskId);
      } else if (googleMapByTitle.has(todo.title)) {
        matchedGoogleTask = googleMapByTitle.get(todo.title);
      }
      
      if (matchedGoogleTask) {
        // Link them up if not already linked
        todo.googleTaskId = matchedGoogleTask.id;
        
        // If the task was pulled from a legacy list, migrate it into the default list!
        if (matchedGoogleTask._isLegacy) {
          const newGId = await pushTaskToGoogle(token, todo);
          if (newGId) {
            todo.googleTaskId = newGId;
            try {
              await apiCall(`/lists/${matchedGoogleTask._listId}/tasks/${matchedGoogleTask.id}`, token, { method: 'DELETE' });
            } catch (_) {}
          }
        }
        
        // Sync status: If either is completed, we make both completed
        const isGoogleCompleted = matchedGoogleTask.status === 'completed';
        const isLocalCompleted = todo.isCompleted;
        
        if (isGoogleCompleted !== isLocalCompleted) {
          if (isGoogleCompleted) {
            // Completed on Google -> complete locally
            todo.isCompleted = true;
            todo.completedAt = matchedGoogleTask.completed || matchedGoogleTask.updated || new Date().toISOString();
            updatedCount++;
          } else {
            // Completed locally -> complete on Google default list
            const activeListId = matchedGoogleTask._isLegacy ? defaultListId : (matchedGoogleTask._listId || defaultListId);
            await apiCall(`/lists/${activeListId}/tasks/${todo.googleTaskId}`, token, {
              method: 'PATCH',
              body: JSON.stringify({
                status: 'completed',
                completed: todo.completedAt || new Date().toISOString()
              }),
            });
            updatedCount++;
          }
        }
        matchedLocalTodos.push(todo);
      } else {
        if (!todo.googleTaskId) {
          // If it was created locally on web and was not found on Google,
          // push it to Google Tasks Default list rather than deleting it.
          const pushedId = await pushTaskToGoogle(token, todo);
          if (pushedId) {
            todo.googleTaskId = pushedId;
            addedCount++;
          }
          matchedLocalTodos.push(todo);
        } else {
          // It had a googleTaskId but wasn't found (deleted on Google Tasks).
          // We delete it locally by not adding it to matchedLocalTodos.
        }
      }
    }
    
    // Step B: Pull items from Google Tasks that don't exist locally
    const localGoogleIds = new Set(matchedLocalTodos.map(t => t.googleTaskId).filter(Boolean));
    const syncedTodos = [...matchedLocalTodos];
    
    for (const gt of googleTasks) {
      if (!localGoogleIds.has(gt.id) && !deletedIds.includes(gt.id)) {
        const type: 'DAY' = 'DAY';
        const tuViReward = 15;
        const linhThachReward = 5;
        
        // Parse accurate date: Priority: due -> completed -> updated -> today
        let dueDate = new Date().toISOString().split('T')[0];
        if (gt.due) {
          dueDate = gt.due.split('T')[0];
        } else if (gt.completed) {
          dueDate = gt.completed.split('T')[0];
        } else if (gt.updated) {
          dueDate = gt.updated.split('T')[0];
        }
        
        const isCompleted = gt.status === 'completed';
        const completedAt = isCompleted ? (gt.completed || gt.updated || new Date().toISOString()) : undefined;
        const createdAt = gt.updated || (isCompleted ? completedAt : new Date().toISOString());
        
        let finalGoogleTaskId = gt.id;
        
        const pulledTodo: TodoItem = {
          id: `todo_pulled_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: gt.title || 'Untitled Task',
          type,
          isCompleted,
          createdAt: createdAt || new Date().toISOString(),
          completedAt,
          tuViReward,
          linhThachReward,
          googleTaskId: finalGoogleTaskId,
          dueDate
        };
        
        // If from legacy list, migrate into default list!
        if (gt._isLegacy) {
          const newGId = await pushTaskToGoogle(token, pulledTodo);
          if (newGId) {
            pulledTodo.googleTaskId = newGId;
            try {
              await apiCall(`/lists/${gt._listId}/tasks/${gt.id}`, token, { method: 'DELETE' });
            } catch (_) {}
          }
        }
        
        syncedTodos.push(pulledTodo);
        addedCount++;
      }
    }
    
    return { syncedTodos, addedCount, updatedCount };
  } catch (error) {
    console.error('syncGoogleTasks error:', error);
    throw error;
  }
}

// Single push/create to Google Tasks (Default List)
export async function pushTaskToGoogle(
  token: string,
  todo: TodoItem
): Promise<string | null> {
  try {
    const listId = await getDefaultTaskListId(token);
    const dueDateStr = todo.dueDate || todo.createdAt.split('T')[0];
    const notes = '[HUSTFlow] Daily Tasks';
    
    const createdGT = await apiCall(`/lists/${listId}/tasks`, token, {
      method: 'POST',
      body: JSON.stringify({
        title: todo.title,
        notes,
        due: formatToRFC3339(dueDateStr),
        status: todo.isCompleted ? 'completed' : 'needsAction',
        ...(todo.isCompleted ? { completed: todo.completedAt || new Date().toISOString() } : {})
      }),
    });
    
    return createdGT.id;
  } catch (err) {
    console.error('pushTaskToGoogle error:', err);
    return null;
  }
}

// Single patch/update to Google Tasks (Default List)
export async function patchTaskOnGoogle(
  token: string,
  googleTaskId: string,
  updates: { title?: string; isCompleted?: boolean; completedAt?: string; dueDate?: string },
  listId?: string
): Promise<boolean> {
  try {
    const targetListId = listId || await getDefaultTaskListId(token);
    const body: any = {};
    
    if (updates.title !== undefined) {
      body.title = updates.title;
    }

    if (updates.dueDate !== undefined) {
      body.due = formatToRFC3339(updates.dueDate);
    }
    
    if (updates.isCompleted !== undefined) {
      body.status = updates.isCompleted ? 'completed' : 'needsAction';
      if (updates.isCompleted) {
        body.completed = updates.completedAt || new Date().toISOString();
      } else {
        // To uncomplete, status is needsAction, and we clear completed date
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

// Single delete on Google Tasks (Default List)
export async function deleteTaskOnGoogle(token: string, googleTaskId: string, listId?: string): Promise<boolean> {
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
