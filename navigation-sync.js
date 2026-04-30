/**
 * Universal Navigation Sync System
 * Synchronizes navigation state across all pages and provides professional styling
 */

(function() {
  'use strict';
  
  // Navigation configuration
  const NAV_CONFIG = {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'home',
        description: 'Overview and analytics'
      },
      {
        id: 'mocks',
        label: 'Mock Exams',
        href: '/mocks',
        icon: 'exam',
        description: 'Practice examinations'
      },
      {
        id: 'past-questions',
        label: 'Past Questions',
        href: '/waec-past-questions',
        icon: 'questions',
        description: 'WAEC past papers'
      },
      {
        id: 'ai-learning',
        label: 'AI Learning Hub',
        href: '/ai-learning',
        icon: 'ai',
        description: 'AI-powered learning',
        premium: true
      },
      {
        id: 'blog',
        label: 'Vision Blog',
        href: 'https://visionedu.site',
        icon: 'blog',
        description: 'Educational content',
        external: true
      },
      {
        id: 'planner',
        label: 'Study Planner',
        href: '/planner',
        icon: 'calendar',
        description: 'Plan your studies'
      }
    ],
    footer: [
      {
        id: 'settings',
        label: 'Settings',
        href: '#',
        icon: 'settings',
        action: 'openSettings'
      },
      {
        id: 'youtube',
        label: 'YouTube',
        href: 'https://www.youtube.com/channel/UCo4k-_8Q92hXOcUdbAtwabg',
        icon: 'youtube',
        external: true
      }
    ]
  };

  // SVG Icons
  const ICONS = {
    home: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    exam: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
    questions: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
    ai: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 13l-1.26-2.74L15 9l2.74-1.26L19 5l1.26 2.74L23 9l-2.74 1.26L19 13zM9 13l-2.26-4.74L2 6l4.74-2.26L9 1.5l2.26 4.74L16 8.26l-4.74 2.26L9 13zm10 9.5l-1.26-2.74L15 18.5l2.74-1.26L19 14.5l1.26 2.74L23 18.5l-2.74 1.26L19 22.5z"/></svg>',
    blog: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"/></svg>',
    youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
  };

  // Get current page identifier
  function getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard' || path.includes('dashboard')) return 'dashboard';
    if (path.includes('mocks')) return 'mocks';
    if (path.includes('waec-past-questions')) return 'past-questions';
    if (path.includes('ai-learning')) return 'ai-learning';
    if (path.includes('planner')) return 'planner';
    return 'dashboard'; // default
  }

  // Create navigation item HTML
  function createNavItem(item, isActive = false) {
    const activeClass = isActive ? ' active' : '';
    const premiumBadge = item.premium ? '<span class="nav-premium-badge">PRO</span>' : '';
    const externalIcon = item.external ? '<span class="nav-external-icon">↗</span>' : '';
    
    return `
      <a href="${item.href}" 
         class="nav-item${activeClass}" 
         data-nav-id="${item.id}"
         ${item.external ? 'target="_blank" rel="noopener"' : ''}
         ${item.action ? `onclick="${item.action}(); return false;"` : ''}
         title="${item.description}">
        <span class="nav-item-icon">
          ${ICONS[item.icon] || ICONS.home}
        </span>
        <span class="nav-item-content">
          <span class="nav-item-label">${item.label}</span>
          <span class="nav-item-desc">${item.description}</span>
        </span>
        ${premiumBadge}
        ${externalIcon}
      </a>
    `;
  }

  // Enhanced CSS for professional navigation
  function injectNavigationCSS() {
    const css = `
      /* Enhanced Professional Navigation Styles */
      .side-nav {
        background: linear-gradient(180deg, 
          rgba(15, 23, 42, 0.95) 0%, 
          rgba(15, 23, 42, 0.98) 100%);
        backdrop-filter: blur(20px);
        border-right: 1px solid rgba(148, 163, 184, 0.1);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
      }

      .nav-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        margin: 2px 0;
        border-radius: 12px;
        text-decoration: none;
        color: rgba(148, 163, 184, 0.8);
        font-weight: 500;
        font-size: 0.875rem;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        border: 1px solid transparent;
      }

      .nav-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary);
        transform: scaleY(0);
        transition: transform 0.2s ease;
      }

      .nav-item:hover {
        background: rgba(99, 102, 241, 0.08);
        color: rgba(255, 255, 255, 0.9);
        border-color: rgba(99, 102, 241, 0.2);
        transform: translateX(2px);
      }

      .nav-item:hover::before {
        transform: scaleY(1);
      }

      .nav-item.active {
        background: linear-gradient(135deg, 
          rgba(99, 102, 241, 0.15) 0%, 
          rgba(139, 92, 246, 0.1) 100%);
        color: rgba(255, 255, 255, 0.95);
        border-color: rgba(99, 102, 241, 0.3);
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      }

      .nav-item.active::before {
        transform: scaleY(1);
      }

      .nav-item-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .nav-item:hover .nav-item-icon {
        background: rgba(99, 102, 241, 0.2);
        border-color: rgba(99, 102, 241, 0.3);
        transform: scale(1.05);
      }

      .nav-item.active .nav-item-icon {
        background: rgba(99, 102, 241, 0.25);
        border-color: rgba(99, 102, 241, 0.4);
        color: rgba(255, 255, 255, 0.95);
      }

      .nav-item-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .nav-item-label {
        font-weight: inherit;
        line-height: 1.2;
      }

      .nav-item-desc {
        font-size: 0.75rem;
        color: rgba(148, 163, 184, 0.6);
        line-height: 1.2;
        transition: color 0.2s ease;
      }

      .nav-item:hover .nav-item-desc {
        color: rgba(148, 163, 184, 0.8);
      }

      .nav-item.active .nav-item-desc {
        color: rgba(148, 163, 184, 0.9);
      }

      .nav-premium-badge {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #000;
        font-size: 0.625rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        flex-shrink: 0;
      }

      .nav-external-icon {
        font-size: 0.75rem;
        color: rgba(148, 163, 184, 0.5);
        flex-shrink: 0;
      }

      .side-nav-footer {
        border-top: 1px solid rgba(148, 163, 184, 0.1);
        padding-top: 16px;
        margin-top: 16px;
      }

      .side-nav-footer .nav-item {
        padding: 10px 14px;
      }

      .side-nav-footer .nav-item-content {
        display: none;
      }

      @media (max-width: 900px) {
        .side-nav {
          display: none;
        }
      }

      /* Loading state */
      .nav-item.loading {
        pointer-events: none;
        opacity: 0.6;
      }

      .nav-item.loading .nav-item-icon {
        animation: navItemPulse 1.5s ease-in-out infinite;
      }

      @keyframes navItemPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      /* Notification dots */
      .nav-item-notification {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: #ef4444;
        border-radius: 50%;
        border: 2px solid var(--bg-sidebar);
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Update navigation HTML
  function updateNavigation() {
    const currentPage = getCurrentPage();
    const sideNav = document.querySelector('.side-nav-menu');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (sideNav) {
      // Update sidebar navigation
      const mainItems = NAV_CONFIG.items.map(item => 
        createNavItem(item, item.id === currentPage)
      ).join('');
      
      sideNav.innerHTML = mainItems;
    }

    if (bottomNav) {
      // Update bottom navigation for mobile
      const mobileItems = NAV_CONFIG.items.slice(0, 5).map(item => {
        const isActive = item.id === currentPage;
        return `
          <a href="${item.href}" class="bottom-nav-item${isActive ? ' active' : ''}" 
             ${item.external ? 'target="_blank" rel="noopener"' : ''}>
            <span class="bottom-icon">
              ${ICONS[item.icon] || ICONS.home}
            </span>
            <span>${item.label.split(' ')[0]}</span>
          </a>
        `;
      }).join('');
      
      bottomNav.innerHTML = mobileItems;
    }

    // Update footer navigation
    const footerNav = document.querySelector('.side-nav-footer');
    if (footerNav) {
      const footerItems = NAV_CONFIG.footer.map(item => 
        createNavItem(item, false)
      ).join('');
      
      footerNav.innerHTML = footerItems;
    }
  }

  // Add loading states for navigation
  function addLoadingState(navId) {
    const navItem = document.querySelector(`[data-nav-id="${navId}"]`);
    if (navItem) {
      navItem.classList.add('loading');
    }
  }

  function removeLoadingState(navId) {
    const navItem = document.querySelector(`[data-nav-id="${navId}"]`);
    if (navItem) {
      navItem.classList.remove('loading');
    }
  }

  // Initialize navigation sync
  function initNavigationSync() {
    injectNavigationCSS();
    updateNavigation();

    // Add click handlers for loading states
    document.addEventListener('click', function(e) {
      const navItem = e.target.closest('.nav-item[data-nav-id]');
      if (navItem && !navItem.hasAttribute('onclick')) {
        const navId = navItem.getAttribute('data-nav-id');
        addLoadingState(navId);
        
        // Remove loading state after navigation
        setTimeout(() => removeLoadingState(navId), 2000);
      }
    });

    // Sync active state on page load
    window.addEventListener('load', updateNavigation);
  }

  // Public API
  window.NavigationSync = {
    update: updateNavigation,
    setActive: function(pageId) {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelectorAll(`[data-nav-id="${pageId}"]`).forEach(item => {
        item.classList.add('active');
      });
    },
    addNotification: function(navId) {
      const navItem = document.querySelector(`[data-nav-id="${navId}"]`);
      if (navItem && !navItem.querySelector('.nav-item-notification')) {
        const dot = document.createElement('span');
        dot.className = 'nav-item-notification';
        navItem.appendChild(dot);
      }
    },
    removeNotification: function(navId) {
      const notification = document.querySelector(`[data-nav-id="${navId}"] .nav-item-notification`);
      if (notification) {
        notification.remove();
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationSync);
  } else {
    initNavigationSync();
  }

})();