/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface CultivationSaveData {
  userName: string;
  planningCompletedDate: string;
  reflectionCompletedDate: string;
  todoItems: any[];
  tasks: any[];
  habits: any[];
  challenges: any[];
  cultState: any;
  dailyLogs: any[];
  ieltsLogs: any[];
  ieltsTargets: any;
  camBooksList: any[];
  manuals: any[];
  notes: any[];
  timeBlocks?: any[];
  calendarGroups?: any[];
  calendarEvents?: any[];
  lastUpdated?: number;
}

function sanitizeForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore);
  }
  if (typeof val === 'object') {
    const res: any = {};
    for (const key of Object.keys(val)) {
      if (val[key] !== undefined) {
        res[key] = sanitizeForFirestore(val[key]);
      }
    }
    return res;
  }
  return val;
}

/**
 * Saves all user states to Firebase Firestore under the user's UID document.
 */
export async function saveUserDataToCloud(uid: string, data: CultivationSaveData): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid);
    const sanitizedData = sanitizeForFirestore(data);
    await setDoc(docRef, {
      ...sanitizedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving user data to Firestore:', error);
    throw error;
  }
}

/**
 * Fetches user states from Firebase Firestore.
 * Returns null if no document exists yet.
 */
export async function loadUserDataFromCloud(uid: string): Promise<CultivationSaveData | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CultivationSaveData;
    }
    return null;
  } catch (error) {
    console.error('Error loading user data from Firestore:', error);
    throw error;
  }
}

export interface LeaderboardUser {
  uid: string;
  userName: string;
  level: number;
  totalExp: number;
  currentStreak: number;
}

export async function fetchLeaderboardFromCloud(): Promise<LeaderboardUser[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const leaderboard: LeaderboardUser[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userName && data.cultState) {
        leaderboard.push({
          uid: docSnap.id,
          userName: data.userName,
          level: data.cultState.level || 1,
          totalExp: data.cultState.totalExp || 0,
          currentStreak: data.cultState.currentStreak || 0,
        });
      }
    });
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}
