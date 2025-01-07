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
  popup.style.zIndex = '9999';

  // Create Shadow DOM
  const shadowRoot = popup.attachShadow({ mode: 'open' });

  // Add CSS to Shadow DOM to keep the styling isolated
  const style = document.createElement('style');
  style.textContent = `
    /* General Styling */
    * {
      font-family: Arial, sans-serif !important;
      color: white !important;
    }
    .popup-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #2f2f2f;
      padding: 30px 40px;
      border-radius: 15px;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
      width: 350px;
      height: 250px;  /* Adjusted height for the title and buttons */
      text-align: center;
    }

    .popup-title {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
      color: #8743d0;  /* Purple color for the title */
      margin-bottom: 15px;
    }

    .title-icon {
      width: 30px;
      height: 30px;
      margin-right: 10px;  /* Space between the icon and the title text */
    }

    .action-button {
      background-color: #8743d0;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 12px 25px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      font-size: 16px;
      margin: 10px 0;
    }
    .action-button:hover {
      background-color: #ba1313;
    }

    .auto-detect-text {
      font-size: 12px;
      color: #ccc;
      margin-top: 15px;
    }
  `;
  shadowRoot.appendChild(style);

  // Add content to the popup
  const container = document.createElement('div');
  container.classList.add('popup-container');

  // Create the image element
  const titleIcon = document.createElement('img');
  titleIcon.src = chrome.runtime.getURL("Icons/TermsofServiceExaminingtool.png");  // Ensure correct path
  titleIcon.alt = "Icon";
  titleIcon.classList.add('title-icon');

  // Create the title text
  const titleText = document.createTextNode('TermsSimplify');

  // Create the title element and append the icon and text
  const title = document.createElement('h1');
  title.classList.add('popup-title');
  title.appendChild(titleIcon);  // Append the icon first
  title.appendChild(titleText);  // Then append the title text

  // Add the title to the container
  container.appendChild(title);

  // Create the action buttons
  const summarizeButton = document.createElement('button');
  summarizeButton.classList.add('action-button');
  summarizeButton.textContent = 'Summarize and Score';

  const ignoreButton = document.createElement('button');
  ignoreButton.classList.add('action-button');
  ignoreButton.textContent = 'Ignore';

  // Add event listeners to the buttons
  summarizeButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'summarize' });
    document.body.removeChild(popup);
  });

  ignoreButton.addEventListener('click', function() {
    document.body.removeChild(popup);
  });

  // Add small text at the bottom about turning off auto-popup
  const autoDetectText = document.createElement('p');
  autoDetectText.classList.add('auto-detect-text');
  autoDetectText.textContent = 'To turn off auto pop-up, press the extension icon in Extensions.';

  // Append elements to shadow DOM
  container.appendChild(summarizeButton);
  container.appendChild(ignoreButton);
  container.appendChild(autoDetectText);
  shadowRoot.appendChild(container);

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
