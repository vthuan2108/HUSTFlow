// Set a custom dataset attribute on the root element to announce extension presence without violating CSP
document.documentElement.dataset.tlkExtensionInstalled = "true";

// Listen to sync events from the web app
window.addEventListener("TLK_BLOCKER_SYNC", (event) => {
  if (event.detail) {
    try {
      // Check if extension context is valid
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(event.detail, (response) => {
          // Access lastError to suppress Chrome's default console warning
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
