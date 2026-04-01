// ============================================================
// VISION EDUCATION — THEME ENGINE (theme.js)
// Dark ↔ Light mode toggle. Persists to localStorage.
// Include this on every page after auth.js.
// ============================================================

(function() {
  const THEME_KEY = 'vision_theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // Update all toggle button icons
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
      btn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    });
    localStorage.setItem(THEME_KEY, theme);
  }

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  function toggleTheme() {
    const current = getTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply saved preference immediately on load
  applyTheme(getTheme());

  // Expose globally
  window.toggleTheme = toggleTheme;
  window.getTheme = getTheme;

  // After DOM ready, apply again to ensure all buttons get icons
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());
  });
})();
