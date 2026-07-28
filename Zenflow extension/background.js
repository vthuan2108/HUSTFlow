/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_BLOCKING') {
    const blocklist = message.blocklist || [];
    startBlocking(blocklist)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('startBlocking error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep message channel open for async response
  } else if (message.action === 'STOP_BLOCKING') {
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
    // Clean domain name
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
  console.log('🛡️ Trận pháp chặn tâm ma kích hoạt cho:', domains);
}

async function stopBlocking() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: []
  });
  console.log('🔓 Giải trừ trận pháp chặn tâm ma.');
}
