/**
 * Universal Settings & Account Handler
 * Provides consistent settings modal and account dropdown functionality across all pages
 */

(function() {
  'use strict';

  // ============================================
  // SETTINGS MODAL HANDLER
  // ============================================
  
  window.openSettings = function() {
    console.log("[Settings] Opening immersive workspace");
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session) {
      console.warn("[Settings] No session found");
      return;
    }

    const modal = document.getElementById("settingsModal");
    if (!modal) {
      console.log("[Settings] Settings modal not found on this page - redirecting to dashboard");
      // Store intent to open settings
      sessionStorage.setItem('openSettingsOnLoad', 'true');
      window.location.href = '/dashboard';
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // TASK 10.2: Update settings modal for enterprise students
    // ═══════════════════════════════════════════════════════════════
    const isEnterpriseStudent = session.role === 'enterprise-student';
    const institutionName = session.institutionName || 'Your Institution';
    
    if (isEnterpriseStudent) {
      console.log("[Settings] Enterprise student detected - applying enterprise settings");
      
      // Disable subscription management for enterprise students
      const subscriptionPane = document.getElementById('pane-subscription');
      if (subscriptionPane) {
        // Add enterprise notice to subscription pane
        let enterpriseNotice = subscriptionPane.querySelector('.enterprise-notice');
        if (!enterpriseNotice) {
          enterpriseNotice = document.createElement('div');
          enterpriseNotice.className = 'enterprise-notice';
          enterpriseNotice.style.cssText = `
            padding: 1.5rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 12px;
            margin-bottom: 1.5rem;
          `;
          enterpriseNotice.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <div>
                <h3 style="margin: 0 0 8px 0; font-size: 1rem; color: #10b981; font-weight: 700;">
                  Managed by ${institutionName}
                </h3>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
                  Your account is managed by your institution. Subscription features are automatically enabled.
                  For billing or account questions, please contact your institution administrator.
                </p>
              </div>
            </div>
          `;
          subscriptionPane.insertBefore(enterpriseNotice, subscriptionPane.firstChild);
        }
        
        // Disable upgrade buttons
        const upgradeButtons = subscriptionPane.querySelectorAll('.hero-btn-primary, button[onclick*="upgrade"]');
        upgradeButtons.forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
          btn.title = 'Managed by your institution';
        });
      }
      
      // Add institution info to profile pane
      const profilePane = document.getElementById('pane-profile');
      if (profilePane) {
        let institutionInfo = profilePane.querySelector('.institution-info');
        if (!institutionInfo) {
          institutionInfo = document.createElement('div');
          institutionInfo.className = 'institution-info';
          institutionInfo.style.cssText = `
            padding: 1rem;
            background: rgba(16, 185, 129, 0.05);
            border: 1px solid rgba(16, 185, 129, 0.15);
            border-radius: 12px;
            margin-top: 1rem;
          `;
          institutionInfo.innerHTML = `
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">
              Institution
            </div>
            <div style="font-weight: 600; color: #10b981; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              ${institutionName}
            </div>
          `;
          
          // Insert after the grid of user role/sync status
          const gridContainer = profilePane.querySelector('div[style*="grid-template-columns"]');
          if (gridContainer && gridContainer.parentNode) {
            gridContainer.parentNode.insertBefore(institutionInfo, gridContainer.nextSibling);
          }
        }
      }
    }

    // Populate user info
    const nameEl = document.getElementById("settingsName");
    const emailEl = document.getElementById("settingsEmail");
    const avatarEl = document.getElementById("settingsAvatar");
    
    if (nameEl) nameEl.textContent = session.name;
    if (emailEl) emailEl.textContent = session.email;
    if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();

    // Immediate local state (fast path — no waiting for Firebase)
    const phoneEl = document.getElementById("settingsPhone");
    if (phoneEl) phoneEl.value = session.phone || "";

    const waEl = document.getElementById("waToggle");
    if (waEl) waEl.classList.toggle("active", !!session.waOptIn);

    const waStatusText = document.getElementById("waStatusText");
    if (waStatusText) {
      waStatusText.innerText = session.phone ? "WhatsApp Linked" : "Not Linked";
      waStatusText.style.color = session.phone ? "#10b981" : "var(--text-muted)";
    }

    // Sync Profile state from Firestore (Ground Truth — overwrites local when ready)
    if (typeof window.fbGetUser === 'function') {
      window.fbGetUser(session.email).then(userData => {
        if (userData) {
          const phoneEl = document.getElementById("settingsPhone");
          if (phoneEl) phoneEl.value = userData.phone || "";
          
          const waEl = document.getElementById("waToggle");
          if (waEl) waEl.classList.toggle("active", !!userData.waOptIn);
          
          const waStatusText = document.getElementById("waStatusText");
          if (waStatusText) {
            waStatusText.innerText = userData.phone ? "WhatsApp Linked" : "Not Linked";
            waStatusText.style.color = userData.phone ? "#10b981" : "var(--text-muted)";
          }
        }
      });
    }

    // Sync 2FA state
    if (typeof is2FAEnabled === 'function') {
      const enabled = is2FAEnabled(session.email);
      updateSecurityStatusUI(enabled);
    }

    // Sync Verification State
    if (typeof updateVerificationUI === 'function') {
      updateVerificationUI(session.isVerified);
    }

    // Show immersive view
    modal.classList.add("visible");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; 

    if (typeof updateSettingsSubUI === "function") {
      updateSettingsSubUI();
    }
  };

  window.closeSettings = function() {
    const modal = document.getElementById("settingsModal");
    if (!modal) return;
    
    modal.classList.remove("visible");
    setTimeout(() => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }, 300);
  };

  // ============================================
  // ACCOUNT DROPDOWN HANDLER
  // ============================================

  window.toggleUserDropdown = function() {
    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) {
      console.warn("[Account] User dropdown not found on this page");
      return;
    }
    
    const isVisible = dropdown.classList.contains("visible");
    
    if (isVisible) {
      closeUserDropdown();
    } else {
      openUserDropdown();
    }
  };

  window.openUserDropdown = function() {
    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) return;
    
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session) return;

    // Update dropdown content
    const nameEl = dropdown.querySelector('.dropdown-user-name');
    const emailEl = dropdown.querySelector('.dropdown-user-email');
    const avatarEl = dropdown.querySelector('.user-avatar');
    
    if (nameEl) nameEl.textContent = session.name;
    if (emailEl) emailEl.textContent = session.email;
    if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();

    // Show dropdown
    dropdown.classList.add("visible");
    dropdown.style.display = "block";

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 10);
  };

  window.closeUserDropdown = function() {
    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) return;
    
    dropdown.classList.remove("visible");
    setTimeout(() => {
      dropdown.style.display = "none";
    }, 200);
    
    document.removeEventListener('click', handleOutsideClick);
  };

  function handleOutsideClick(e) {
    const dropdown = document.getElementById("userDropdown");
    const userBtn = document.getElementById("userBtn");
    
    if (dropdown && userBtn && 
        !dropdown.contains(e.target) && 
        !userBtn.contains(e.target)) {
      closeUserDropdown();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function initializeHandlers() {
    // Close settings modal on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeSettings();
        closeUserDropdown();
      }
    });

    // Close settings modal on backdrop click
    const modal = document.getElementById("settingsModal");
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeSettings();
        }
      });

      // Check if we should auto-open settings (from redirect)
      const shouldOpenSettings = sessionStorage.getItem('openSettingsOnLoad');
      if (shouldOpenSettings === 'true') {
        console.log("[Settings] Auto-opening settings from redirect");
        sessionStorage.removeItem('openSettingsOnLoad');
        // Wait for page to fully load and auth to initialize
        const attemptOpen = () => {
          if (typeof getSession === 'function' && getSession()) {
            console.log("[Settings] Session ready, opening settings");
            openSettings();
          } else {
            console.log("[Settings] Session not ready, retrying...");
            setTimeout(attemptOpen, 200);
          }
        };
        setTimeout(attemptOpen, 300);
      }
    }

    console.log("[Settings Handler] Initialized");
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHandlers);
  } else {
    initializeHandlers();
  }

  // Also check on window load (after all resources including auth.js)
  window.addEventListener('load', function() {
    const shouldOpenSettings = sessionStorage.getItem('openSettingsOnLoad');
    if (shouldOpenSettings === 'true') {
      console.log("[Settings] Window loaded, checking for auto-open");
      const modal = document.getElementById("settingsModal");
      if (modal) {
        sessionStorage.removeItem('openSettingsOnLoad');
        setTimeout(() => {
          if (typeof openSettings === 'function') {
            console.log("[Settings] Triggering auto-open from window.load");
            openSettings();
          }
        }, 100);
      }
    }
  });

})();
