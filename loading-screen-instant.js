// INSTANT Loading Screen - Shows BEFORE any content renders
// This is the fastest possible loading screen implementation

// Inject CSS immediately - blocks rendering until complete
document.write(`<style>
#visionLoader{position:fixed!important;inset:0!important;background:#0f172a!important;z-index:999999!important;display:flex!important;align-items:center!important;justify-content:center!important;opacity:1!important;transition:opacity .15s ease!important;font-family:system-ui,sans-serif!important}
#visionLoader.hide{opacity:0!important;pointer-events:none!important}
.vision-text{font-size:clamp(2rem,8vw,4rem)!important;font-weight:900!important;letter-spacing:.2em!important;color:#fff!important;animation:visionPulse .8s ease-in-out infinite!important;text-align:center!important;line-height:1!important}
@keyframes visionPulse{0%,100%{opacity:.8}50%{opacity:1}}
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
      }, 150);
    }
  }
  
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 200);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 50));
  }
  
  // Fallback
  setTimeout(hideLoader, 2500);
})();