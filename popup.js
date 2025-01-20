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
  document.getElementById('summarize-btn').addEventListener('click', async function() {
    console.log("Summarize button clicked");
  
    // Send a message to content.js to extract the TOS text
    document.getElementById('loading-container').style.display = 'block';
    let progress = 0;
    updateProgress(progress);
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extractTOS' }, async function(response) {
        const tosText = response.text;
        console.log("Extracted TOS Text:", tosText);
  
        if (!tosText) {
          alert("No TOS text detected.");
          return;
        }
        progress = 25;
        updateProgress(progress);
        // Proceed with sending extracted TOS text to the summarizer
        const summarizeResponse = await fetch('http://localhost:5000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tosText: tosText })
          
        });
        progress = 50;
        updateProgress(progress);
        if (summarizeResponse.ok) {
          const summaryData = await summarizeResponse.json();
          progress = 75;
          updateProgress(progress);

          alert(`Risk Score: ${summaryData.RiskScore}\nRisk Summary: ${summaryData.RiskSummary}\nRisk Breakdown: ${JSON.stringify(summaryData.RiskBreakDown)}`);

          //alert(`Score Rating: ${data.RiskScore}\nRisk Summary: ${data.RiskSummary}\nRisk Breakdown: ${data.RiskBreakdown}`);
          progress = 100;
          updateProgress(progress);
        } else {
          alert("Failed to summarize TOS.");
        }
        setTimeout(() => {
          document.getElementById('loading-container').style.display = 'none';
        }, 500); // Hide after 500ms delay for smooth transition
      });
    });
  });

  function updateProgress(percentage) {
    document.getElementById('progress').style.width = `${percentage}%`;
    document.getElementById('percentage').textContent = `${percentage}%`;
  }

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
    const maxLength = 1024;
    if (pageText.length > maxLength) {
        pageText = pageText.substring(0, maxLength) + "..."; // Trim the text
    }

    // Ensure this is a string and return it
    return pageText;
}

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
        
        // Disable summarize button and turn it red
        summarizeButton.disabled = true;
        summarizeButton.style.backgroundColor = '#f44336';  // Red color like the hover effect
        summarizeButton.style.cursor = 'not-allowed';  // Change cursor to show it's disabled
      }
    });
  });
});
