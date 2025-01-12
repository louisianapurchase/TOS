let isPopupShown = false; // Flag to prevent continuous popup opening

// Function to detect if TOS is present on the page
const checkForTOS = () => {
  // Normalize page text to lowercase
  const pageText = document.body.innerText.toLowerCase();

  // Extensive list of contract-related phrases
  const tosPhrases = [
    /terms of service/i,
    /privacy policy/i,
    /end user agreement/i,
    /terms of use/i,
    /conditions of use/i,
    /user agreement/i,
    /license agreement/i,
    /acceptable use policy/i,
    /data use policy/i,
    /cookie policy/i,
    /service agreement/i,
    /contract terms/i,
    /agreement terms/i,
    /gdpr compliance/i,
    /ccpa compliance/i,
    /arbitration agreement/i,
    /liability waiver/i,
    /refund policy/i,
    /payment terms/i,
    /subscription terms/i,
    /dispute resolution/i,
    /binding agreement/i,
    /data sharing policy/i
  ];

  // Keywords for button/link detection
  const actionKeywords = [
    /accept/i,
    /agree/i,
    /continue/i,
    /confirm/i,
    /decline/i,
    /reject/i
  ];

  // Context-based element detection
  const detectContextualElements = () => {
    // Check if modal-like elements exist
    const modals = document.querySelectorAll('div[role="dialog"], div[class*="modal"], div[class*="popup"]');
    for (const modal of modals) {
      const modalText = modal.innerText.toLowerCase();
      if (tosPhrases.some((regex) => regex.test(modalText))) {
        return true; // Found TOS content in a modal
      }
    }

    // Check for buttons or links with action keywords
    const buttons = document.querySelectorAll('button, a');
    for (const button of buttons) {
      if (actionKeywords.some((regex) => regex.test(button.innerText))) {
        const parentText = button.closest('div')?.innerText?.toLowerCase() || ''; // Get parent context
        if (tosPhrases.some((regex) => regex.test(parentText))) {
          return true; // Found relevant button in a TOS context
        }
      }
    }
    const footer = document.querySelector('footer');
    if (footer && tosPhrases.some((regex) => regex.test(footer.innerText.toLowerCase()))) {
      return false;  // Don't trigger popup if it's just footer text
    }

    return false; // No contextual elements detected
  };

  // Check if terms are present in body text or relevant elements
  const isTOSDetected = tosPhrases.some((regex) => regex.test(pageText)) || detectContextualElements();
  return isTOSDetected;
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
      height: 250px;
      text-align: center;
    }

    .popup-title {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
      color: #8743d0;
      margin-bottom: 15px;
    }

    .title-icon {
      width: 30px;
      height: 30px;
      margin-right: 10px;
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
  titleIcon.src = chrome.runtime.getURL("Icons/TermsofServiceExaminingtool.png");
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
  summarizeButton.addEventListener('click', async function() {
    console.log("Summarize button clicked");
  
    try {
      const tosText = await extractTOSText(); // Wait for TOS text extraction
      console.log("Extracted TOS Text:", tosText);
  
      // If no TOS text is found, alert the user and stop
      if (!tosText) {
        alert("No TOS text detected.");
        return;
      }
  
      // Send TOS text to the Flask server for summarization
      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tosText: tosText })
      });
  
      // Check if the response is okay (status code 200-299)
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Unknown error"}`);
        console.error("Error from server:", errorData);
        return;
      }
  
      // Parse the response data
      const data = await response.json();
      console.log("Server response:", data);
  
      // Check if there is an error in the response
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        // Show the summary and score in an alert or update your popup UI
        alert(`Summary: ${data.summary}\nScore: ${data.score}`);
      }
    } catch (error) {
      // Catch any errors in the async flow
      console.error('Error:', error);
      alert('Failed to summarize TOS. Please try again.');
    }
  
    // Remove the popup after summarization is complete
    if (popup && document.body.contains(popup)) {
      document.body.removeChild(popup);
    }
     // Reset the flag so it can be shown again if needed
  });
  
  
  // Function to update summary text based on TOS detection
  const updateSummaryText = (isTOSDetected) => {
    if (isTOSDetected) {
      summaryText.textContent = 'TOS detected on Page';
      console.log('TOS detected on Page');
    } else {
      summaryText.textContent = 'No TOS detected yet...';
      console.log('No TOS detected yet...');
    }
  };
  
  // Example function to extract TOS text (needs real implementation)
  async function extractTOSText() {
    console.log("Extracting TOS text...");
    // This is a placeholder function to extract TOS text.
    // Replace this logic with actual DOM parsing or content extraction.
    const tosText = document.body.innerText.match(/Terms of Service/i)
        ? document.body.innerText
      : "Dummy Terms of Service text for testing.";
  
    console.log("TOS text extracted:", tosText);
    return tosText;
  }
  

  
  
  ignoreButton.addEventListener('click', function() {
    document.body.removeChild(popup);
    isPopupShown = false; 

  });
  

  // Add small text at the bottom about turning off auto-popup
  const autoDetectText = document.createElement('p');
  autoDetectText.classList.add('auto-detect-text');
  autoDetectText.textContent = 'To turn off auto pop-up, press the TermsSimplify Icon in Extensions.';

  // Append elements to shadow DOM
  container.appendChild(summarizeButton);
  container.appendChild(ignoreButton);
  container.appendChild(autoDetectText);       
  shadowRoot.appendChild(container);

  // Append the popup to the body
  document.body.appendChild(popup);
};
const isBlacklistedPage = () => {
  const blacklistedDomains = ['accounts.google.com', 'mail.google.com', 'chat.openai.com'];
  return blacklistedDomains.some(domain => window.location.hostname.includes(domain));
};
// Continuously check for TOS detection on page load and at intervals
const autoDetectTOS = () => {
  chrome.storage.local.get('autoDetect', function(data) {
    if (data.autoDetect && !isBlacklistedPage()) {
      if (document.readyState === 'complete') {
        // Get ignored pages from storage
        chrome.storage.local.get('ignoredPages', function(ignoredData) {
          const ignoredPages = ignoredData.ignoredPages || {};
          const currentPageUrl = window.location.href;

          // Check if the page is ignored
          if (!ignoredPages[currentPageUrl] && checkForTOS()) {
            showTOSPopup(); // Show popup if TOS is detected
          }
        });
      } else {
        // Wait a bit if the document is still loading
        setTimeout(autoDetectTOS, 1000);
      }
    }
  });
};

ignoreButton.addEventListener('click', function() {
  const currentPageUrl = window.location.href;

  chrome.storage.local.get('ignoredPages', function(ignoredData) {
    if (!ignoredData.ignoredPages) {
      chrome.storage.local.set({ ignoredPages: {} });  // Initialize ignoredPages if it doesn't exist
    }
  });
  
  chrome.storage.local.get('ignoredPages', function(ignoredData) {
    const ignoredPages = ignoredData.ignoredPages || {};
    ignoredPages[currentPageUrl] = true;  // Mark current page as ignored
    chrome.storage.local.set({ ignoredPages: ignoredPages });

    document.body.removeChild(popup);  // Close popup
  });
});


chrome.storage.local.get('ignoredPages', function(ignoredData) {
  const ignoredPages = ignoredData.ignoredPages || {};
  const currentPageUrl = window.location.href;

  console.log('Current Page URL:', currentPageUrl);
  console.log('Ignored Pages:', ignoredPages);

  if (!ignoredPages[currentPageUrl] && checkForTOS()) {
    showTOSPopup(); // Show popup if TOS is detected
  }
});

// Only check after the page load


