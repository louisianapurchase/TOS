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
    document.body.removeChild(popup);
    isPopupShown = false; // Reset the flag so it can be shown again if needed
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
      : null;
  
    console.log("TOS text extraction result:", tosText);
    return tosText;
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
      }
    });
  });
});
