// Universal Loading Screen - Auto-syncs across all pages
// This script automatically injects the loading screen into any page

(function() {
  'use strict';
  
  // Immediately inject CSS to prevent flash
  const style = document.createElement('style');
  style.textContent = `
    #visionLoader{position:fixed;inset:0;background:#0f172a;z-index:99999;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .3s}
    #visionLoader.hide{opacity:0;pointer-events:none}
    .vision-text{font-family:system-ui,-apple-system,sans-serif;font-size:clamp(2rem,8vw,4rem);font-weight:900;letter-spacing:.2em;color:#fff;animation:pulse 1.5s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
    [data-theme=light] #visionLoader{background:#fff}
    [data-theme=light] .vision-text{color:#0f172a}
    body{overflow:hidden!important}
    body.loaded{overflow:auto!important}
  `;
  
  // Insert CSS immediately if head exists, otherwise wait
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.head.appendChild(style);
    });
  }
  
  // Create and inject loader HTML
  function createLoader() {
    // Don't create if already exists
    if (document.getElementById('visionLoader')) {
      return;
    }
    
    const loader = document.createElement('div');
    loader.id = 'visionLoader';
    loader.innerHTML = '<div class="vision-text">VISION EDU</div>';
    
    // Insert into body if it exists
    if (document.body) {
      document.body.insertBefore(loader, document.body.firstChild);
    } else {
      // Wait for body to be available
      const observer = new MutationObserver(function(mutations) {
        if (document.body) {
          document.body.insertBefore(loader, document.body.firstChild);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    }
  }
  
  // Hide loading screen
  function hideLoader() {
    const loader = document.getElementById('visionLoader');
    if (loader) {
      loader.classList.add('hide');
      if (document.body) {
        document.body.classList.add('loaded');
      }
      setTimeout(function() {
        if (loader && loader.parentNode) {
          loader.remove();
        }
      }, 300);
    }
  }
  
  // Initialize loader creation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createLoader);
  } else {
    createLoader();
  }
  
  // Hide loader when page is fully loaded
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 100); // Small delay to ensure visibility
  } else {
    window.addEventListener('load', function() {
      setTimeout(hideLoader, 100);
    });
  }
  
})();