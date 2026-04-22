/* =====================================================
   WAEC 2026  Dashboard Logic
   Populates welcome section, stats, user chip
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  //  Auth guard
  const session = checkAuth(); // redirects to login.html if null
  if (!session) return;

  //  Populate user chip
  const navAvatar = document.getElementById("navAvatar");
  const navUsername = document.getElementById("navUsername");
  
  if (typeof updateVerificationUI === 'function') {
      updateVerificationUI(session.isVerified);
  }

  const initial = session.name ? session.name.charAt(0).toUpperCase() : "?";
  if (navAvatar) navAvatar.textContent = initial;
  if (navUsername) {
    navUsername.textContent = session.name || "Student";
    // If PRO role, add gold badge
    if (session.role === "pro") {
      const badge = document.createElement("span");
      badge.className = "pro-badge";
      badge.textContent = "PRO";
      navUsername.after(badge);
    }
  }

  // If Google user has picture, show it
  if (session.picture && navAvatar) {
    navAvatar.style.cssText = `
      background-image: url('${session.picture}');
      background-size: cover;
      background-position: center;
      font-size: 0;
    `;
  }

  //  Populate dropdown
  const dropdownName = document.getElementById("dropdownName");
  const dropdownEmail = document.getElementById("dropdownEmail");
  if (dropdownName) dropdownName.textContent = session.name || "Student";
  if (dropdownEmail) dropdownEmail.textContent = session.email || "";

  //  Welcome hero
  const welcomeName = document.getElementById("welcomeName");
  const welcomeGreeting = document.getElementById("welcomeGreeting");

  if (welcomeName) {
    const firstName = session.name ? session.name.split(" ")[0] : "Student";
    welcomeName.textContent = firstName;

    // Add PRO badge to hero if applicable
    if (session.role === "pro") {
      const heroBadge = document.createElement("span");
      heroBadge.className = "pro-badge";
      heroBadge.style.margin = "0 0 0 12px";
      heroBadge.style.fontSize = "0.8rem";
      heroBadge.style.height = "22px";
      heroBadge.textContent = "PRO";
      welcomeName.after(heroBadge);
    }
  }

  if (welcomeGreeting) {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour >= 5 && hour < 12) greeting = "Good morning";
    else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    welcomeGreeting.textContent = greeting;
  }

  //  Stats
  const stats = getStats();
  const answered = stats.answered || 0;
  const correct = stats.correct || 0;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) + "%" : "";

  const elAnswered = document.getElementById("statAnswered");
  const elCorrect = document.getElementById("statCorrect");
  const elPct = document.getElementById("statPct");

  if (elAnswered) animateCount(elAnswered, answered);
  if (elCorrect) animateCount(elCorrect, correct);
  if (elPct) elPct.textContent = pct;

  //  Stagger card animation
  const cards = document.querySelectorAll(".subject-card");
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.07 + 0.1}s`;
  });

  //  Close dropdown on outside click
  document.addEventListener("click", (e) => {
    const chip = document.getElementById("navUserChip");
    if (chip && !chip.contains(e.target)) {
      chip.classList.remove("open");
    }
  });

  //  Initialize Global Search
  initGlobalSearch();

  //  Premium Subject Handling
  initPremiumSubjects();

  //  System Broadcasts
  initBroadcasts();

  //  Background Sync for Materials
  if (typeof syncMaterials === 'function') {
      syncMaterials().then(() => {
          if (typeof renderDashMaterials === 'function') renderDashMaterials();
      });
  }
  
  // Initial render
  if (typeof renderDashMaterials === 'function') renderDashMaterials();

  // Background Sync for User Profile (Verification, Role, etc.)
  if (session.email && typeof fbGetUserWithFallback === 'function') {
      fbGetUserWithFallback(session.email).then(cloudUser => {
          if (cloudUser) {
              const updatedSession = typeof verifyUserSchema === 'function' ? verifyUserSchema({ ...session, ...cloudUser }) : { ...session, ...cloudUser };
              setSession(updatedSession);
              if (typeof updateVerificationUI === 'function') {
                  updateVerificationUI(updatedSession.isVerified);
              }
              // Also update pro badges if needed
              if (updatedSession.role === "pro" && !document.querySelector('.pro-badge')) {
                  // This is a naive way, but reloading is safer if role changed significantly
                  if (session.role !== 'pro') window.location.reload(); 
              }
          }
      }).catch(e => console.warn("Failed to sync user profile in background", e));
  }

});



//  Broadcast Engine
async function initBroadcasts() {
    const container = document.getElementById("broadcastContainer");
    const titleEl = document.getElementById("broadcastTitle");
    const bodyEl = document.getElementById("broadcastBody");
    const dateEl = document.getElementById("broadcastDate");
    
    if (!container || !titleEl || !bodyEl || !dateEl) return;

    // Use local fallback first
    const local = JSON.parse(localStorage.getItem("vision_announcements") || "[]");
    if (local && local.length > 0) {
        showBroadcast(local[0]);
    }

    // Then update from Firebase
    if (typeof window.fbGetBroadcasts === 'function') {
        try {
            const cloud = await window.fbGetBroadcasts();
            if (cloud && cloud.length > 0) {
                showBroadcast(cloud[0]);
                localStorage.setItem("vision_announcements", JSON.stringify(cloud.slice(0, 10)));
            }
        } catch(e) { console.error("Broadcast sync error", e); }
    }

    function showBroadcast(b) {
        container.style.display = "block";
        titleEl.textContent = b.title;
        bodyEl.textContent = b.body;
        // Simple time ago or locale date
        dateEl.textContent = new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function initPremiumSubjects() {
  const cards = document.querySelectorAll(".subject-card[data-premium='true']");
  cards.forEach((card) => {
    const itemId = card.id;
    if (isPurchased(itemId)) {
      // Update UI for purchased item
      const statusTag = card.querySelector(".subject-status");
      if (statusTag) {
        statusTag.textContent = "Unlocked";
        statusTag.classList.remove("premium-tag");
        statusTag.classList.add("available-tag");
        
        // Find the price shield and remove it or hide it
        const priceShield = statusTag.nextElementSibling;
        if (priceShield && priceShield.textContent.includes("GHS")) {
            priceShield.style.display = "none";
        }
      }
    }

    card.addEventListener("click", (e) => {
      if (isPurchased(itemId)) return; // Allow normal navigation

      e.preventDefault();
      const price = parseFloat(card.getAttribute("data-price") || "10");
      const name = card.getAttribute("data-name") || "Premium Subject";
      
      initiatePayment(itemId, price, name, (detail) => {
        alert("Success! " + name + " is now unlocked.");
        window.location.reload();
      });
    });
  });
}

/**
 * Render Materials on the main dashboard container
 */
window.renderDashMaterials = function() {
    console.info("[Dashboard] Synchronizing visual assets");
    const container = document.getElementById("materialsContainer");
    if (!container) return;

    const all = typeof getMaterials === 'function' ? getMaterials() : [];
    if (!all.length) {
        container.innerHTML = `
        <div style="text-align:center; padding:4rem 2rem; background:rgba(255,255,255,0.02); border-radius:24px; border:1px dashed rgba(255,255,255,0.05);">
            <div style="font-size:3rem; margin-bottom:1rem; opacity:0.3;">📂</div>
            <h3 style="font-weight:700; color:var(--text-primary); margin-bottom:0.5rem;">No Mission Assets Found</h3>
            <p style="color:var(--text-muted); font-size:0.875rem;">Your instructors haven't uploaded any study materials for your subjects yet.</p>
        </div>`;
        return;
    }

    const bySubject = {};
    if (typeof SUBJECTS_META !== 'undefined') {
        SUBJECTS_META.forEach((s) => { bySubject[s.id] = []; });
    }
    all.forEach((m) => {
        if (bySubject[m.subject]) bySubject[m.subject].push(m);
    });

    const activeSubjects = (typeof SUBJECTS_META !== 'undefined') 
        ? SUBJECTS_META.filter((s) => (bySubject[s.id] || []).length > 0)
        : [];

    container.innerHTML = activeSubjects.map((subj) => {
        const mats = bySubject[subj.id] || [];
        return `
        <div class="material-subject-group" style="margin-bottom:2.5rem; animation:fadeIn 0.5s ease-out forwards;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:36px; height:36px; background:var(--primary-dim); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--primary); color:var(--primary); font-size:1.2rem;">
                ${subj.icon}
              </div>
              <div>
                <h3 style="font-size:1rem; font-weight:900; color:var(--text-primary); letter-spacing:-0.01em;">${subj.name}</h3>
                <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Authorized Study Resources</span>
              </div>
            </div>
            <span style="font-size:0.7rem; font-weight:900; background:rgba(255,255,255,0.05); color:var(--text-secondary); padding:4px 12px; border-radius:100px; border:1px solid rgba(255,255,255,0.1); letter-spacing:0.05em;">${mats.length} MODULES</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:12px;">
            ${mats.map((m) => {
                const typeColor = { PDF: "#ef4444", VIDEO: "#f59e0b", DOC: "#3b82f6", SLIDE: "#8b5cf6", LINK: "#10b981" }[m.type?.toUpperCase()] || "#94a3b8";
                const isNew = m.uploadedAt && (Date.now() - new Date(m.uploadedAt).getTime() < 48 * 60 * 60 * 1000);
                const downloadUrl = m.url && m.url !== "#" ? m.url : "#";
                
                return `
                <div class="material-card" style="position:relative; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:1.25rem; display:flex; align-items:center; gap:16px; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)';" onclick="window.open('${downloadUrl}', '_blank')">
                  ${isNew ? `<div style="position:absolute; top: -6px; right: 12px; background:var(--primary); color:white; font-size:0.6rem; font-weight:900; padding:2px 8px; border-radius:4px; box-shadow:0 4px 10px rgba(99,102,241,0.4); text-transform:uppercase;">New</div>` : ""}
                  <div style="width:48px; height:48px; background:${typeColor}15; border-radius:12px; display:flex; align-items:center; justify-content:center; color:${typeColor}; border:1px solid ${typeColor}30; flex-shrink:0;">
                    <span style="font-weight:900; font-size:0.75rem;">${m.type || "PDF"}</span>
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:0.9rem; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:4px;">${m.title}</div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:0.72rem; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ${m.uploadedAt || "Session Asset"}
                      </span>
                      ${m.size ? `<span style="width:3px; height:3px; background:var(--text-muted); border-radius:50%;"></span><span style="font-size:0.72rem; color:var(--text-muted);">${m.size}</span>` : ""}
                    </div>
                  </div>
                  <div style="padding:10px; border-radius:10px; background:rgba(255,255,255,0.05); color:var(--text-muted); transition:all 0.2s;" onmouseover="this.style.color='var(--primary)'; this.style.background='var(--primary-dim)'">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </div>
                </div>`;
            }).join("")}
          </div>
        </div>`;
    }).join("");
};

//  Animated counter
function animateCount(el, target) {
  if (target === 0) {
    el.textContent = "0";
    return;
  }
  let start = 0;
  const duration = 1000;
  const step = (timestamp) => {
    if (!step.startTime) step.startTime = timestamp;
    const progress = Math.min((timestamp - step.startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

//  User Dropdown Toggle
function toggleUserDropdown() {
  const chip = document.getElementById("navUserChip");
  if (chip) chip.classList.toggle("open");
}
function closeUserDropdown() {
  const chip = document.getElementById("navUserChip");
  if (chip) chip.classList.remove("open");
}

//
// GLOBAL SEARCH ENGINE
//
function initGlobalSearch() {
  const searchInput = document.getElementById("globalSearch");
  const resultsBox = document.getElementById("searchResults");

  if (!searchInput || !resultsBox) return;

  // Shortcut key "/"
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      resultsBox.classList.remove("visible");
      resultsBox.innerHTML = "";
      return;
    }

    // 1. Filter Subjects
    const matchSubjects = SUBJECTS_META.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query),
    );

    // 2. Filter Materials
    const allMaterials =
      typeof getMaterials === "function" ? getMaterials() : [];
    const matchMaterials = allMaterials.filter((m) =>
      m.title.toLowerCase().includes(query),
    );

    renderSearchResults(matchSubjects, matchMaterials, query);
  });

  // Hide results on outside click
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
      resultsBox.classList.remove("visible");
    }
  });
}

function renderSearchResults(subjects, materials, query) {
  const resultsBox = document.getElementById("searchResults");
  if (!resultsBox) return;

  if (subjects.length === 0 && materials.length === 0) {
    resultsBox.innerHTML = `<div class="search-no-results">No matches for "<strong>${query}</strong>"</div>`;
    resultsBox.classList.add("visible");
    return;
  }

  let html = "";

  // Subjects Section
  if (subjects.length > 0) {
    html += `<div class="search-section-label">Subjects</div>`;
    subjects.forEach((s) => {
      html += `
        <a href="/?sub=${s.id.split("-").pop()}" class="search-result-item">
          <div class="search-result-icon">${s.icon}</div>
          <div class="search-result-info">
            <span class="search-result-title">${s.name}</span>
            <span class="search-result-meta">Subject Quiz · Authorized</span>
          </div>
        </a>
      `;
    });
  }

  // Materials Section
  if (materials.length > 0) {
    html += `<div class="search-section-label">Study Materials</div>`;
    materials.forEach((m) => {
      const subj = SUBJECTS_META.find((s) => s.id === m.subject) || {
        icon: "",
      };
      html += `
        <a href="${m.url !== "#" ? m.url : "#"}" target="${m.url !== "#" ? "_blank" : "_self"}" class="search-result-item">
          <div class="search-result-icon">${subj.icon}</div>
          <div class="search-result-info">
            <span class="search-result-title">${m.title}</span>
            <span class="search-result-meta">${m.type} · ${m.uploadedAt || "2026"}</span>
          </div>
        </a>
      `;
    });
  }

  resultsBox.innerHTML = html;
  resultsBox.classList.add("visible");
}
