// ============================================================
// VISION EDUCATION — THEME ENGINE (theme.js)
// Dark  Light mode toggle. Persists to localStorage.
// Include this on every page after auth.js.
// ============================================================

(function () {
  const THEME_KEY = "vision_theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      // Professional SVG icons
      const sunSVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
      const moonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
      
      btn.innerHTML = theme === "light" ? moonSVG : sunSVG;
      btn.title =
        theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode";
    });
    localStorage.setItem(THEME_KEY, theme);
  }

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }

  function toggleTheme() {
    const current = getTheme();
    applyTheme(current === "dark" ? "light" : "dark");
  }

  // Apply saved preference immediately on load
  applyTheme(getTheme());

  // Expose globally
  window.toggleTheme = toggleTheme;
  window.getTheme = getTheme;

  // After DOM ready, apply again to ensure all buttons get icons
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getTheme());
  });
})();
