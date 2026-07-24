/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TodoItem } from '../types';

const API_BASE = 'https://tasks.googleapis.com/tasks/v1';
// Helper to make Google Tasks API requests
async function apiCall(endpoint: string, token: string, options: RequestInit = {}) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Tasks API Error on ${endpoint}:`, errorText);
    throw new Error(`Google Tasks API Error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Find or create the "Tiên Lộ Ký - Đạo Tràng" task list
export async function getOrCreateTaskList(token: string): Promise<string> {
  const targetTitle = 'Tiên Lộ Ký - Đạo Tràng';
  
  // 1. List all task lists
  const data = await apiCall('/users/@me/lists', token);
  const lists = data.items || [];
  
  const existingList = lists.find((l: any) => l.title === targetTitle);
  if (existingList) {
    return existingList.id;
  }
  
  // 2. Create list if not found
  const newList = await apiCall('/users/@me/lists', token, {
    method: 'POST',
    body: JSON.stringify({ title: targetTitle }),
  });
  
  return newList.id;
}

// Format date to RFC3339 UTC timestamp required by Google Tasks
function formatToRFC3339(dateStr: string): string {
  // dateStr is in YYYY-MM-DD
  return `${dateStr}T00:00:00.000Z`;
}

// Sync local todos with Google Tasks
export async function syncGoogleTasks(
  token: string,
  localTodos: TodoItem[],
  deletedIds: string[] = []
): Promise<{ syncedTodos: TodoItem[]; addedCount: number; updatedCount: number }> {
  try {
    const listId = await getOrCreateTaskList(token);

    // 1. Delete tasks on Google Tasks if they are in deletedIds list
    for (const gid of deletedIds) {
      try {
        await deleteTaskOnGoogle(token, gid);
      } catch (err) {
        console.warn(`Failed to delete task ${gid} on Google during sync:`, err);
      }
    }
    
    // Fetch all tasks from Google Tasks
    const googleData = await apiCall(`/lists/${listId}/tasks?showCompleted=true&showHidden=true`, token);
    const googleTasks = googleData.items || [];
    
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
      } else if (!todo.googleTaskId) {
        matchedGoogleTask = googleMapByTitle.get(todo.title);
      }
      
      if (matchedGoogleTask) {
        // Link them up if not already linked
        if (!todo.googleTaskId) {
          todo.googleTaskId = matchedGoogleTask.id;
        }
        
        // Sync status: If either is completed, we make both completed
        const isGoogleCompleted = matchedGoogleTask.status === 'completed';
        const isLocalCompleted = todo.isCompleted;
        
        if (isGoogleCompleted !== isLocalCompleted) {
          if (isGoogleCompleted) {
            // Completed on Google -> complete locally
            todo.isCompleted = true;
            todo.completedAt = matchedGoogleTask.completed || new Date().toISOString();
            updatedCount++;
          } else {
            // Completed locally -> complete on Google
            await apiCall(`/lists/${listId}/tasks/${todo.googleTaskId}`, token, {
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
          // If it was created locally on web (has no googleTaskId) and was not found on Google by title,
          // push it to Google Tasks rather than deleting it.
          const pushedId = await pushTaskToGoogle(token, todo);
          if (pushedId) {
            todo.googleTaskId = pushedId;
            addedCount++;
          }
          matchedLocalTodos.push(todo);
        } else {
          // It had a googleTaskId but wasn't found in googleMapById (meaning it was deleted on Google Tasks).
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
        
        // Parse due date
        let dueDate = new Date().toISOString().split('T')[0];
        if (gt.due) {
          dueDate = gt.due.split('T')[0];
        }
        
        const isCompleted = gt.status === 'completed';
        
        const pulledTodo: TodoItem = {
          id: `todo_pulled_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: gt.title,
          type,
          isCompleted,
          createdAt: gt.updated || new Date().toISOString(),
          completedAt: isCompleted ? (gt.completed || new Date().toISOString()) : undefined,
          tuViReward,
          linhThachReward,
          googleTaskId: gt.id,
          dueDate
        };
        
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

// Single push/create to Google Tasks
export async function pushTaskToGoogle(
  token: string,
  todo: TodoItem
): Promise<string | null> {
  try {
    const listId = await getOrCreateTaskList(token);
    const dueDateStr = todo.dueDate || todo.createdAt.split('T')[0];
    const notes = '[Tiên Lộ Ký] Chu kỳ: Hằng Ngày';
    
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

// Single patch/update to Google Tasks
export async function patchTaskOnGoogle(
  token: string,
  googleTaskId: string,
  updates: { title?: string; isCompleted?: boolean; completedAt?: string; dueDate?: string }
): Promise<boolean> {
  try {
    const listId = await getOrCreateTaskList(token);
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
    
    await apiCall(`/lists/${listId}/tasks/${googleTaskId}`, token, {
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
export async function deleteTaskOnGoogle(token: string, googleTaskId: string): Promise<boolean> {
  try {
    const listId = await getOrCreateTaskList(token);
    await apiCall(`/lists/${listId}/tasks/${googleTaskId}`, token, {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    console.error('deleteTaskOnGoogle error:', err);
    return false;
  }
}
