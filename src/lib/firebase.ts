/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAlntdHi0IY4xqwfohHjfAxZLcRT23Crm0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tien-lo-kyv1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tien-lo-kyv1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tien-lo-kyv1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "731937394818",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:731937394818:web:f782c88918ca186bd2a49b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const provider = new GoogleAuthProvider();
// Request Google Tasks, Sheets & Calendar scope
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener - auto-logins user on every refresh
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      let token = cachedAccessToken || localStorage.getItem('tlk_google_access_token') || '';
      if (!token) {
        token = (await refreshGoogleAccessToken()) || '';
      }
      if (token) {
        cachedAccessToken = token;
      }
      // Always trigger onAuthSuccess so user remains logged in
      if (onAuthSuccess) {
        onAuthSuccess(user, token);
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('tlk_google_access_token');
      localStorage.removeItem('tlk_google_refresh_token');
      localStorage.removeItem('tlk_google_token_expires_at');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';

    if (accessToken) {
      cachedAccessToken = accessToken;
      localStorage.setItem('tlk_google_access_token', accessToken);
      localStorage.setItem('tlk_google_token_expires_at', String(Date.now() + 3500 * 1000));
    }

    return { user: result.user, accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Token Refresh Function
export const refreshGoogleAccessToken = async (): Promise<string | null> => {
  if (auth.currentUser) {
    try {
      await auth.currentUser.getIdToken(true);
    } catch (e) {
      console.warn('Firebase ID token refresh warning:', e);
    }
  }

  const storedToken = localStorage.getItem('tlk_google_access_token');
  const expiresAt = Number(localStorage.getItem('tlk_google_token_expires_at') || '0');

  // Reuse stored token if it's still valid
  if (storedToken && expiresAt > Date.now() + 60000) {
    cachedAccessToken = storedToken;
    return storedToken;
  }

  return cachedAccessToken || storedToken;
};

// Helper for authenticated Google API requests with 401 auto-retry
export async function authenticatedGoogleFetch(url: string, token: string, options: RequestInit = {}): Promise<Response> {
  let activeToken = token || (await refreshGoogleAccessToken()) || getAccessToken() || '';

  const headers = {
    'Authorization': `Bearer ${activeToken}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.warn('Google API 401 Unauthorized encountered. Retrying with refreshed token...');
    const newToken = await refreshGoogleAccessToken();
    if (newToken && newToken !== activeToken) {
      const retryHeaders = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem('tlk_google_access_token');
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('tlk_google_access_token');
  localStorage.removeItem('tlk_google_refresh_token');
  localStorage.removeItem('tlk_google_token_expires_at');
};
