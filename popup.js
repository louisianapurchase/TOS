document.addEventListener('DOMContentLoaded', function () {
  // Get the auto-detect toggle element and summary paragraph
  const autoDetectToggle = document.getElementById('auto-detect-toggle');
  const summarizeButton = document.getElementById('summarize-btn');
  const summaryText = document.getElementById('summary');  // Reference to the summary paragraph

  // Check if the user has set a preference for auto-detect
  chrome.storage.local.get('autoDetect', function(data) {
    // If no preference is found, default it to true
    if (data.autoDetect === undefined) {
      autoDetectToggle.checked = true;  // Default to "on"
      chrome.storage.local.set({ autoDetect: true }); // Save default setting
    } else {
      autoDetectToggle.checked = data.autoDetect; // Set from saved preference
    }
  });

  // Save the state of the auto-detect option when toggled
  autoDetectToggle.addEventListener('change', function () {
    chrome.storage.local.set({ autoDetect: autoDetectToggle.checked });
  });

  // Handle the manual "Summarize TOS" button click
  summarizeButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'summarize' });
    });
  });

  // Function to update summary text based on TOS detection
  const updateSummaryText = (isTOSDetected) => {
    if (isTOSDetected) {
      summaryText.textContent = 'TOS detected on Page';
    } else {
      summaryText.textContent = 'No TOS detected yet...';
    }
  };

  // Detect TOS or Privacy Policy on the page (works even if auto-detect is off)
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'checkForTOS' }, function(response) {
      if (response && response.isTOSDetected) {
        updateSummaryText(true);  // Update the summary text if TOS is detected
        if (autoDetectToggle.checked) {
          // Show the popup if auto-detect is on and TOS is detected
          chrome.tabs.sendMessage(tabs[0].id, { action: 'showTOSPopup' });
        }
      } else {
        updateSummaryText(false); // Otherwise, keep "No TOS detected yet..."
      }
    });
  });
});
