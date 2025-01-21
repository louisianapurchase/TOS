
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

    const detectContextualElements = () => {
      const modals = document.querySelectorAll('div[role="dialog"], div[class*="modal"], div[class*="popup"]');
      for (const modal of modals) {
        const modalText = modal.innerText.toLowerCase();
        if (tosPhrases.some((regex) => regex.test(modalText))) {
          return true; // Found TOS content in a modal
        }
      }

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

    // Check if TOS is present in body text or relevant elements
    const isTOSDetected = tosPhrases.some((regex) => regex.test(pageText)) || detectContextualElements();
    return isTOSDetected;
  };

  // Listen for the check request from popup.js to know if TOS is present
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Received action:', request.action);

    if (request.action === 'checkForTOS') {
      const isTOSDetected = checkForTOS();
      console.log('TOS detected:', isTOSDetected);
      sendResponse({ isTOSDetected });
    }

    if (request.action === 'extractTOS') {
      const pageText = document.body.innerText;
      const cleanText = pageText.replace(/\s+/g, ' ').trim();
      sendResponse({ text: cleanText });
    }

    // Auto-detect and show popup if TOS is found
    if (request.action === 'showTOSPopup') {
      showTOSPopup();
    }
  });

  // Ensure TOS is checked after the page fully loads
  if (document.readyState === 'complete') {
    console.log('Page fully loaded. Checking for TOS...');
    checkForTOS(); // Check TOS as soon as the page is fully loaded
  } else {
    window.addEventListener('load', () => {
      console.log('Page fully loaded. Checking for TOS...');
      checkForTOS(); // Check TOS when the page is ready
    });
  }

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
      /* Loading Progress Bar Styling */
      #loading-container {
        display: none; /* Initially hidden */
        text-align: center;
        margin-top: 20px;
      }

      .progress-bar {
        width: 150px;
        height: 20px;
        background-color: #ccc;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 10px;
      }

      .progress {
        height: 100%;
        width: 0%; /* Start at 0% width */
        background-color: #8743d0; /* Purple progress */
        border-radius: 10px;
      }

      .percentage {
        font-size: 14px;
        color: #fff;
        margin-top: 5px;
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

    // Loading container for progress bar
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'loading-container';
    loadingContainer.style.display = 'none'; // Initially hidden

    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add('progress-bar');
    
    const progress = document.createElement('div');
    progress.classList.add('progress');

    const percentage = document.createElement('div');
    percentage.classList.add('percentage');
    percentage.textContent = '0%'; // Start at 0%

    progressBarContainer.appendChild(progress);
    loadingContainer.appendChild(progressBarContainer);
    loadingContainer.appendChild(percentage);

    container.appendChild(summarizeButton);
    container.appendChild(ignoreButton);
    container.appendChild(loadingContainer);

   // Add event listeners to the buttons
    summarizeButton.addEventListener('click', async function () {
      loadingContainer.style.display = 'block';
      progress.style.width = '0%'; 
      percentage.textContent = '0%';
    
      try {
        const tosText = await extractTOSText();
        if (!tosText) {
          alert("No TOS text detected.");
          return;
        }
    
        percentage.textContent = '15%';
    
        const summarizeResponse = await fetch('http://localhost:5000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tosText: tosText }),
        });
    
        if (summarizeResponse.ok) {
          const summaryData = await summarizeResponse.json();
          console.log('Summary Data:', summaryData); 

          alert(`Risk Score: ${summaryData.RiskScore}\nRisk Summary: ${summaryData.RiskSummary}\nRisk Breakdown: ${JSON.stringify(summaryData.RiskBreakDown)}`);
        } else {
          alert('Failed to summarize TOS.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to summarize TOS. Please try again.');
      } finally {
        loadingContainer.style.display = 'none';
        progress.style.width = '0%';
        percentage.textContent = '0%';
      }
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
      console.log("Extracting page text...");

      // Extract all visible text on the page
      let pageText = document.body.innerText;

      // Clean the text by removing unnecessary line breaks and excessive whitespace
      pageText = pageText.replace(/\s+/g, ' ').trim();  // Replace multiple spaces and trim leading/trailing spaces

      // Check if the extracted text is valid and not empty
      if (!pageText || pageText.length === 0) {
          console.error("No text found on the page or extracted text is empty.");
          return "";  // Ensure it's a string (empty string if no text)
      }

      // Optional: Limit the length of the extracted text to avoid oversized payload
      const maxLength = 102400;
      if (pageText.length > maxLength) {
          pageText = pageText.substring(0, maxLength) + "..."; // Trim the text
      }

      // Ensure this is a string and return it
      return pageText;
  }
    
  ignoreButton.addEventListener('click', function () {
    if (popup && document.body.contains(popup)) {
      document.body.removeChild(popup);
      isPopupShown = false; // Reset popup state
    }
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
    console.log('Checking for TOS...');
    chrome.storage.local.get(['autoDetect', 'ignoredPages'], function(data) {
      const autoDetect = data.autoDetect;
      const ignoredPages = data.ignoredPages || {};
      const currentPageUrl = window.location.href;

      console.log('Auto-detect enabled:', autoDetect);
      console.log('Ignored Pages:', ignoredPages);
      console.log('Current Page URL:', currentPageUrl);

      if (autoDetect && !isBlacklistedPage() && !ignoredPages[currentPageUrl]) {
        const isTOSDetected = checkForTOS();
        console.log('TOS Detected:', isTOSDetected);
        if (isTOSDetected) {
          showTOSPopup();
        }
      }
    });
  };

  // Ensure this runs after the DOM is fully loaded



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