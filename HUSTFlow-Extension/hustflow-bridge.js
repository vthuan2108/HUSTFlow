(function() {
  'use strict';

  // Signal extension presence to HUSTFlow web app
  window.HUSTFLOW_STUDOCU_EXTENSION_INSTALLED = true;
  try {
    document.documentElement.setAttribute('data-hustflow-extension', 'installed');
  } catch(e) {}

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    const data = event.data;

    if (data && data.type === 'HUSTFLOW_STUDOCU_DECODE_REQUEST') {
      const url = data.url;
      const requestId = data.requestId;

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'FETCH_STUDOCU', url: url }, function(response) {
          if (chrome.runtime.lastError) {
            console.warn('[HUSTFlow Bridge] Extension lastError:', chrome.runtime.lastError.message);
            window.postMessage({
              type: 'HUSTFLOW_STUDOCU_DECODE_RESPONSE',
              requestId: requestId,
              success: false,
              error: chrome.runtime.lastError.message
            }, '*');
            return;
          }

          if (response && response.success && (response.htmlText || response.realImgUrls)) {
            window.postMessage({
              type: 'HUSTFLOW_STUDOCU_DECODE_RESPONSE',
              requestId: requestId,
              success: true,
              htmlText: response.htmlText || '',
              realImgUrls: response.realImgUrls || []
            }, '*');
          } else {
            window.postMessage({
              type: 'HUSTFLOW_STUDOCU_DECODE_RESPONSE',
              requestId: requestId,
              success: false,
              error: (response && response.error) || 'Background service worker fetch failed'
            }, '*');
          }
        });
      } else {
        window.postMessage({
          type: 'HUSTFLOW_STUDOCU_DECODE_RESPONSE',
          requestId: requestId,
          success: false,
          error: 'Chrome runtime not available in this context'
        }, '*');
      }
    }
  });
})();
