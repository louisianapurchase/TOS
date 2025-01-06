// Detect if TOS or Privacy Policy is present
const checkForTOS = () => {
  const termsOfService = document.body.innerText;
  if (termsOfService.includes("Terms of Service") || termsOfService.includes("Privacy Policy")) {
    alert("Terms of Service Detected!");
    // Your code for summarizing or analyzing the TOS goes here
  }
};

// Run on page load
window.addEventListener("load", checkForTOS);
