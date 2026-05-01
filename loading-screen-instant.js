// INSTANT Loading Screen - Shows BEFORE any content renders
// Ultra-fast and minimal

// Inject CSS immediately - blocks rendering until complete
document.write(`<style>
#visionLoader{position:fixed!important;inset:0!important;background:#0f172a!important;z-index:999999!important;display:flex!important;align-items:center!important;justify-content:center!important;opacity:1!important;transition:opacity .1s ease!important;font-family:system-ui,sans-serif!important}
#visionLoader.hide{opacity:0!important;pointer-events:none!important}
.vision-text{font-size:1.5rem!important;font-weight:700!important;letter-spacing:.15em!important;color:#fff!important;text-align:center!important;line-height:1!important}
[data-theme=light] #visionLoader{background:#fff!important}
[data-theme=light] .vision-text{color:#0f172a!important}
body{overflow:hidden!important}
body.loaded{overflow:auto!important}
</style>`);

// Inject HTML immediately - blocks rendering until complete
document.write(`<div id="visionLoader"><div class="vision-text">VISION EDU</div></div>`);

// Hide loader when page loads
(function() {
  function hideLoader() {
    const loader = document.getElementById('visionLoader');
    if (loader) {
      loader.classList.add('hide');
      if (document.body) document.body.classList.add('loaded');
      setTimeout(() => {
        if (loader.parentNode) loader.remove();
      }, 100);
    }
  }
  
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }
  
  // Fallback: hide after 1.5 seconds max
  setTimeout(hideLoader, 1500);
})();