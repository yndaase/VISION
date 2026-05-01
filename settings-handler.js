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
