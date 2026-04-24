// ============================================================
// VISION EDUCATION — THEME ENGINE v4
// Light default + persistent dark/light toggle
// ============================================================

(function () {
  const KEY = 'vision_theme';
  const saved = localStorage.getItem(KEY);
  // Default to light; only use dark if explicitly saved
  const theme = (saved === 'dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();

// Toggle function — called by any .theme-toggle-btn click
window.toggleTheme = function () {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('vision_theme', next);
  // Update aria labels on all toggle buttons
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
};

window.getTheme = function () {
  return document.documentElement.getAttribute('data-theme') || 'light';
};

// Wire up all buttons on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
    btn.setAttribute('aria-label',
      window.getTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.onclick = window.toggleTheme;
  });
});
