// ============================================================
// VISION EDUCATION — SITE NAV MOBILE DRAWER
// Include after body content on all global-site pages
// ============================================================

(function () {
  // Build drawer HTML
  const drawerHTML = `
  <div class="site-overlay" id="siteOverlay"></div>
  <div class="site-drawer" id="siteDrawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
    <div class="site-drawer-header">
      <a href="/" class="site-drawer-brand">
        <img src="/assets/logo.png" alt="Logo" width="28" height="28">
        <span>Vision <em>Education</em></span>
      </a>
      <button class="site-drawer-close" id="siteDrawerClose" aria-label="Close menu">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="site-drawer-links">
      <a href="/" class="site-drawer-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Home
      </a>
      <a href="/mocks.html" class="site-drawer-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Mock Exams
      </a>
      <a href="/features.html" class="site-drawer-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Features
      </a>
      <a href="https://visionedu.site" target="_blank" class="site-drawer-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Blog
      </a>
      <a href="/pricing.html" class="site-drawer-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Pricing
      </a>
      <a href="/about.html" class="site-drawer-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        About
      </a>
    </div>
    <div class="site-drawer-footer">
      <a href="/login.html" class="site-drawer-login">Log In</a>
      <a href="/dashboard.html" class="site-drawer-start">Start Free →</a>
    </div>
  </div>`;

  // Inject drawer
  document.body.insertAdjacentHTML('beforeend', drawerHTML);

  // Mark active link
  const path = location.pathname;
  document.querySelectorAll('.site-drawer-link').forEach(link => {
    if (link.getAttribute('href') === path || link.getAttribute('href') === path.replace('.html','')) {
      link.classList.add('active');
    }
  });

  // Wire hamburger
  const hamburger = document.getElementById('siteHamburger');
  const overlay = document.getElementById('siteOverlay');
  const drawer = document.getElementById('siteDrawer');
  const closeBtn = document.getElementById('siteDrawerClose');

  function openSiteDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeSiteDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openSiteDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeSiteDrawer);
  overlay.addEventListener('click', closeSiteDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSiteDrawer(); });
})();
