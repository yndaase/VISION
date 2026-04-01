// ============================================================
// VISION EDUCATION — THEME ENGINE
// Dark mode only. Enforced on every page load.
// ============================================================

(function () {
  // Remove any saved light-mode preference and force dark
  localStorage.removeItem("vision_theme");
  document.documentElement.removeAttribute("data-theme");

  // Expose dummy toggle (does nothing) so any existing onclick calls don't error
  window.toggleTheme = function () {};
  window.getTheme = function () {
    return "dark";
  };

  // Remove theme toggle buttons from the DOM on load
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".theme-toggle-btn").forEach(function (btn) {
      btn.remove();
    });
  });
})();
