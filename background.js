// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'summarize') {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'summarize' });
      });
    }
  });
  