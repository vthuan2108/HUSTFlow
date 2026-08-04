/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Set a custom dataset attribute on the root element to announce extension presence
document.documentElement.dataset.tlkExtensionInstalled = "true";

// Helper to save current app URL to extension storage for redirecting back from blocked page
function saveAppUrl() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ zenflow_app_url: window.location.origin + '/' });
    }
  } catch (e) {}
}

saveAppUrl();

// 1. Listen for postMessage from Web App (App.tsx & MeditationTimer.tsx)
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;
  const data = event.data;

  if (data.type === "TLK_REQUEST_INITIAL_STATE") {
    saveAppUrl();
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["tlk_state"], (result) => {
          window.postMessage({
            type: "TLK_EXTENSION_LOADED_STATE",
            state: result?.tlk_state || null
          }, "*");
        });
      }
    } catch (e) {
      console.warn("Zenflow Content Script: Failed to fetch initial state", e);
    }
  } else if (data.type === "TLK_STATE_SYNC" && data.state) {
    saveAppUrl();
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ tlk_state: data.state });
      }
    } catch (e) {
      console.warn("Zenflow Content Script: Failed to save state sync", e);
    }
  } else if (data.type === "TLK_BLOCKER_SYNC" && data.detail) {
    saveAppUrl();
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(data.detail, (_response) => {
          const err = chrome.runtime.lastError;
          if (err) console.log("Zenflow Blocker status:", err.message);
        });
      }
    } catch (e) {
      console.warn("Zenflow Content Script: Blocker context invalidated", e);
    }
  }
});

// 2. Listen for CustomEvent TLK_BLOCKER_SYNC (fallback for direct CustomEvent dispatching)
window.addEventListener("TLK_BLOCKER_SYNC", (event) => {
  saveAppUrl();
  const detail = event.detail;
  if (detail) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(detail, (_response) => {
          const err = chrome.runtime.lastError;
          if (err) console.log("Zenflow Blocker status:", err.message);
        });
      }
    } catch (err) {
      console.warn("Zenflow Content Script: Relayer context invalidated", err);
    }
  }
});

// 3. Listen for chrome.storage.local changes (e.g. from NewTab page) and notify Web App
try {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes.tlk_state && changes.tlk_state.newValue) {
        window.postMessage({
          type: "TLK_EXTENSION_STATE_UPDATED",
          state: changes.tlk_state.newValue
        }, "*");
      }
    });
  }
} catch (e) {
  console.warn("Zenflow Content Script: Failed to set storage change listener", e);
}
