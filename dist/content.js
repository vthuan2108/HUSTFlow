/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Set a custom dataset attribute on the root element to announce extension presence without violating CSP
document.documentElement.dataset.tlkExtensionInstalled = "true";

// Listen to messages from the page (React app in main world)
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.type === "TLK_STATE_SYNC") {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: "SYNC_STATE",
          state: event.data.state
        });
      }
    } catch (err) {
      console.warn("Zenflow Blocker: Relayer context invalidated, please refresh page.", err);
    }
  }
});

// Relay events from the extension background/newtab back to the web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'EXTENSION_STATE_UPDATED') {
    window.postMessage({
      type: "TLK_EXTENSION_STATE_UPDATED",
      state: message.state
    }, "*");
  }
});

// Request current extension state at startup and post it to the main world page
try {
  if (chrome.runtime && chrome.runtime.id) {
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
      if (response && response.state) {
        window.postMessage({
          type: "TLK_EXTENSION_LOADED_STATE",
          state: response.state
        }, "*");
      }
    });
  }
} catch (e) {
  console.warn("Zenflow: Failed to fetch startup state from extension.", e);
}

// Listen to blocker sync events from the web app
window.addEventListener("TLK_BLOCKER_SYNC", (event) => {
  if (event.detail) {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(event.detail, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.log("Zenflow Blocker: Relayer status message:", err.message);
          }
        });
      }
    } catch (err) {
      console.warn("Zenflow Blocker: Relayer context invalidated, please refresh page.", err);
    }
  }
});
