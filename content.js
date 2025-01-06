let isPopupShown = false; // Flag to prevent continuous popup opening

// Function to detect if TOS is present on the page
const checkForTOS = () => {
  const termsOfService = document.body.innerText;

  // Look for terms of service-related phrases
  return termsOfService.includes("Terms of Service") || 
         termsOfService.includes("Privacy Policy") || 
         termsOfService.includes("End User Agreement") || 
         termsOfService.includes("Terms of Use");
};

// Listen for the check request from popup.js to know if TOS is present
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'checkForTOS') {
    const isTOSDetected = checkForTOS();
    sendResponse({ isTOSDetected });
  }

  // If auto-detect is enabled, show the popup automatically when TOS is detected
  if (request.action === 'showTOSPopup') {
    showTOSPopup();  // Function to show the popup
  }
});

// Function to display the popup when TOS is detected
const showTOSPopup = () => {
  if (isPopupShown) return;  // Prevent the popup from showing if already displayed

  isPopupShown = true; // Set the flag to indicate the popup has been shown

  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.padding = '20px';
  popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  popup.style.color = 'white';
  popup.style.zIndex = '9999';

  // Add content to the popup
  const title = document.createElement('h3');
  title.textContent = 'TOS Detected';
  const message = document.createElement('p');
  message.textContent = 'Would you like to summarize and score the TOS?';

  // Create and style the buttons
  const summarizeButton = document.createElement('button');
  summarizeButton.textContent = 'Summarize and Score';
  summarizeButton.style.backgroundColor = '#333'; // Darker color for visibility
  summarizeButton.style.color = 'white'; // Button text color
  summarizeButton.style.padding = '10px';
  summarizeButton.style.marginRight = '10px';
  summarizeButton.style.border = 'none';
  summarizeButton.style.cursor = 'pointer';

  const ignoreButton = document.createElement('button');
  ignoreButton.textContent = 'Ignore';
  ignoreButton.style.backgroundColor = '#333'; // Darker color for visibility
  ignoreButton.style.color = 'white'; // Button text color
  ignoreButton.style.padding = '10px';
  ignoreButton.style.border = 'none';
  ignoreButton.style.cursor = 'pointer';

  // Add event listeners to the buttons
  summarizeButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'summarize' });
    document.body.removeChild(popup);
  });

  ignoreButton.addEventListener('click', function() {
    document.body.removeChild(popup);
  });

  // Append elements to the popup
  popup.appendChild(title);
  popup.appendChild(message);
  popup.appendChild(summarizeButton);
  popup.appendChild(ignoreButton);

  // Append the popup to the body
  document.body.appendChild(popup);
};

// Continuously check for TOS detection on page load and at intervals
const autoDetectTOS = () => {
  chrome.storage.local.get('autoDetect', function(data) {
    if (data.autoDetect) {
      // If auto-detect is enabled, keep checking for TOS on the page
      if (checkForTOS()) {
        showTOSPopup(); // Show popup if TOS is detected
      }
    }
  });
};

// Check for TOS as soon as the content script runs
autoDetectTOS();

// Optionally, add a check at intervals (e.g., every 5 seconds)
setInterval(autoDetectTOS, 5000);
