// Universal Loading Screen - Auto-syncs across all pages
// This script automatically injects the loading screen into any page

(function() {
  'use strict';
  
  // Loading screen CSS (minified)
  const loadingCSS = `
    #visionLoader{position:fixed;inset:0;background:#0f172a;z-index:99999;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .3s}
    #visionLoader.hide{opacity:0;pointer-events:none}
    .vision-text{font-family:system-ui,-apple-system,sans-serif;font-size:clamp(2rem,8vw,4rem);font-weight:900;letter-spacing:.2em;color:#fff;animation:pulse 1.5s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
    [data-theme=light] #visionLoader{background:#fff}
    [data-theme=light] .vision-text{color:#0f172a}
  `;
  
  // Loading screen HTML
  const loadingHTML = `
    <div id="visionLoader">
      <div class="vision-text">VISION EDU</div>
    </div>
  `;
  
  // Inject CSS immediately
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = loadingCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }
  
  // Inject HTML immediately
  function injectHTML() {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = loadingHTML;
    
    // Insert at the very beginning of body
    if (document.body) {
      document.body.insertBefore(temp.firstChild, document.body.firstChild);
    } else {
      // If body doesn't exist yet, wait for it
      document.addEventListener('DOMContentLoaded', function() {
        document.body.insertBefore(temp.firstChild, document.body.firstChild);
      });
    }
  }
  
  // Hide loading screen when page is loaded
  function hideLoader() {
    const loader = document.getElementById('visionLoader');
    if (loader) {
      loader.classList.add('hide');
      setTimeout(function() {
        if (loader.parentNode) {
          loader.remove();
        }
      }, 300);
    }
  }
  
  // Initialize immediately
  injectCSS();
  injectHTML();
  
  // Hide when page loads
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }
  
  // Prevent scrolling while loading
  if (document.body) {
    document.body.style.overflow = 'hidden';
  }
  
  // Restore scrolling when hiding
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (document.body) {
        document.body.style.overflow = '';
      }
    }, 300);
  });
  
})();