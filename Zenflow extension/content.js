/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Set a custom dataset attribute on the root element to announce extension presence without violating CSP
document.documentElement.dataset.tlkExtensionInstalled = "true";

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
