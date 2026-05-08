// ============================================================
// YAW NDAASE — THEME ENGINE
// Light default + persistent dark/light toggle
// ============================================================

(function () {
  const KEY = 'yaw_theme';
  const saved = localStorage.getItem(KEY);
  const theme = (saved === 'dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();

window.toggleTheme = function () {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('yaw_theme', next);
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
};

window.getTheme = function () {
  return document.documentElement.getAttribute('data-theme') || 'light';
};

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
    btn.setAttribute('aria-label',
      window.getTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.onclick = window.toggleTheme;
  });
});
