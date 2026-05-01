// Ultra-Fast Loading Screen - Shows IMMEDIATELY before any content
// This script runs synchronously and blocks rendering until loading screen is visible

(function() {
  'use strict';
  
  // Inject CSS and HTML immediately - no waiting
  const css = `
    #visionLoader{position:fixed!important;inset:0!important;background:#0f172a!important;z-index:999999!important;display:flex!important;align-items:center!important;justify-content:center!important;opacity:1!important;transition:opacity .2s ease!important;font-family:system-ui,sans-serif!important}
    #visionLoader.hide{opacity:0!important;pointer-events:none!important}
    .vision-text{font-size:clamp(2rem,8vw,4rem)!important;font-weight:900!important;letter-spacing:.2em!important;color:#fff!important;animation:visionPulse 1s ease-in-out infinite!important;text-align:center!important}
    @keyframes visionPulse{0%,100%{opacity:.7}50%{opacity:1}}
    [data-theme=light] #visionLoader{background:#fff!important}
    [data-theme=light] .vision-text{color:#0f172a!important}
    body{overflow:hidden!important}
    body.loaded{overflow:auto!important}
  `;
  
  // Create and inject style immediately
  const style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  
  // Create loader HTML immediately
  const loader = document.createElement('div');
  loader.id = 'visionLoader';
  loader.innerHTML = '<div class="vision-text">VISION EDU</div>';
  
  // Insert loader immediately into document
  if (document.body) {
    document.body.insertBefore(loader, document.body.firstChild);
  } else {
    // If body doesn't exist, insert into documentElement
    document.documentElement.appendChild(loader);
  }
  
  // Hide loader function
  function hideLoader() {
    const loaderEl = document.getElementById('visionLoader');
    if (loaderEl) {
      loaderEl.classList.add('hide');
      document.body.classList.add('loaded');
      setTimeout(() => {
        if (loaderEl.parentNode) {
          loaderEl.remove();
        }
      }, 200);
    }
  }
  
  // Hide loader when page is fully loaded
  if (document.readyState === 'complete') {
    // Page already loaded, hide after short delay
    setTimeout(hideLoader, 300);
  } else {
    // Wait for page load
    window.addEventListener('load', () => {
      setTimeout(hideLoader, 100);
    });
  }
  
  // Fallback: hide after maximum 3 seconds
  setTimeout(hideLoader, 3000);
  
})();