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
// Request Google Tasks, Sheets & Calendar scope + offline access for refresh token
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.setCustomParameters({
  access_type: 'offline',
  prompt: 'consent'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await refreshGoogleAccessToken();
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        cachedAccessToken = localStorage.getItem('tlk_google_access_token');
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else {
          if (onAuthFailure) onAuthFailure();
        }
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
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    // Store access_token, expires_at, and refresh_token if available
    localStorage.setItem('tlk_google_access_token', cachedAccessToken);
    localStorage.setItem('tlk_google_token_expires_at', String(Date.now() + 3500 * 1000));
    
    // Store refresh token if returned by Google Credential
    const rawResult = result as any;
    if (rawResult?._tokenResponse?.refreshToken) {
      localStorage.setItem('tlk_google_refresh_token', rawResult._tokenResponse.refreshToken);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Silent Token Refresh Function
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

  // Reuse stored token if it's valid for more than 2 minutes
  if (storedToken && expiresAt > Date.now() + 120000) {
    cachedAccessToken = storedToken;
    return storedToken;
  }

  const refreshToken = localStorage.getItem('tlk_google_refresh_token');
  if (refreshToken) {
    try {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_FIREBASE_APP_ID || "1:731937394818:web:f782c88918ca186bd2a49b",
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          cachedAccessToken = data.access_token;
          localStorage.setItem('tlk_google_access_token', data.access_token);
          localStorage.setItem('tlk_google_token_expires_at', String(Date.now() + (data.expires_in || 3500) * 1000));
          return data.access_token;
        }
      }
    } catch (err) {
      console.warn('Google OAuth refresh_token fetch warning:', err);
    }
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
