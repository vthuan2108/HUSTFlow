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

// 4. Studocu Auto-Capture & Bridge for HUSTFlow Tàng Kinh Các
if (window.location.hostname.includes('studocu.com') || window.location.hostname.includes('studocu.vn') || window.location.hostname.includes('studeersnel.nl')) {
  function tryCaptureStudocuData() {
    try {
      const el = document.querySelector('#__NEXT_DATA__');
      if (el && el.textContent) {
        const payload = {
          html: el.textContent,
          url: window.location.href,
          title: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : document.title,
          timestamp: Date.now()
        };
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ hustflow_captured_doc: payload });
        }
      }
    } catch(e) {}
  }
  tryCaptureStudocuData();
  setTimeout(tryCaptureStudocuData, 1000);
  setTimeout(tryCaptureStudocuData, 2500);
}

if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') || window.location.origin.includes('vercel.app')) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.hustflow_captured_doc && changes.hustflow_captured_doc.newValue) {
          window.postMessage({
            type: 'HUSTFLOW_STUDOCU_DECODE_RESPONSE',
            payload: changes.hustflow_captured_doc.newValue
          }, '*');
        }
      });
    }
  } catch (e) {}

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type === 'HUSTFLOW_DECODE_REQUEST' && event.data.url) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({ action: 'OPEN_AND_CAPTURE_STUDOCU', url: event.data.url });
        }
      } catch(e) {}
    }
  });
}
