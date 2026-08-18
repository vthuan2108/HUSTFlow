/**
 * Studocu Downloader + Chặn Tâm Ma - Background Service Worker (Manifest V3)
 * Referenced 100% from studocu-downloader & HUSTFlow-Extension original codebase
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === 'FETCH_STUDOCU' && request.url) {
    const targetUrl = request.url;

    // Open temporary background tab (active: false)
    chrome.tabs.create({ url: targetUrl, active: false }, (tab) => {
      if (chrome.runtime.lastError || !tab || !tab.id) {
        sendResponse({ success: false, error: 'Cannot create background tab' });
        return;
      }

      const tabId = tab.id;
      let attempts = 0;

      const extractData = () => {
        attempts++;
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const el = document.querySelector('#__NEXT_DATA__');
            const nextDataText = el ? el.textContent : '';

            // Extract all real signed image URLs present in DOM
            const imgEls = Array.from(document.querySelectorAll('img[src*="html/bg"], img.bi, .pf img, img[src*="doc-assets"], img[src*="cloudfront.net"]'));
            const realImgUrls = imgEls.map(img => img.src || img.getAttribute('data-src') || '').filter(s => s.includes('.png'));

            return JSON.stringify({
              nextDataText: nextDataText,
              realImgUrls: realImgUrls,
              htmlText: document.documentElement ? document.documentElement.outerHTML : ''
            });
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.warn('[Background Scripting] Error:', chrome.runtime.lastError.message);
          }

          const rawRes = (results && results[0] && results[0].result) || '';
          let dataObj = null;
          try {
            if (rawRes) dataObj = JSON.parse(rawRes);
          } catch(e) {}

          const htmlOrJson = (dataObj && (dataObj.nextDataText || dataObj.htmlText)) || '';
          
          if (htmlOrJson && (htmlOrJson.includes('props') || htmlOrJson.includes('objectKey') || htmlOrJson.includes('doc-assets') || (dataObj?.realImgUrls?.length > 0))) {
            // Close background tab automatically!
            try { chrome.tabs.remove(tabId); } catch(e) {}
            sendResponse({
              success: true,
              htmlText: htmlOrJson,
              realImgUrls: dataObj?.realImgUrls || []
            });
          } else if (attempts < 18) {
            setTimeout(extractData, 400);
          } else {
            try { chrome.tabs.remove(tabId); } catch(e) {}
            sendResponse({ success: false, error: 'Timeout reading Studocu page' });
          }
        });
      };

      setTimeout(extractData, 700);
    });

    return true; // Keep async response channel open
  } else if (request && request.action === 'START_BLOCKING') {
    const blocklist = request.blocklist || [];
    startBlocking(blocklist)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('startBlocking error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  } else if (request && request.action === 'STOP_BLOCKING') {
    stopBlocking()
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('stopBlocking error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

async function startBlocking(domains) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  const addRules = domains.map((domain, index) => {
    let cleaned = domain.replace(/^(https?:\/\/)?(www\.)?/, '').trim();
    if (!cleaned) return null;

    return {
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { extensionPath: '/blocked.html' }
      },
      condition: {
        urlFilter: '||' + cleaned,
        resourceTypes: ['main_frame']
      }
    };
  }).filter(Boolean);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

async function stopBlocking() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds
  });
}
