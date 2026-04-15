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
    console.info("[Dashboard] Rendering materials list");
    const container = document.getElementById("materialsContainer");
    if (!container) return;

    const all = typeof getMaterials === 'function' ? getMaterials() : [];
    if (!all.length) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">No materials uploaded yet. Check back soon!</p>';
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
        <div style="margin-bottom:1.75rem;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem;">
            <span style="font-size:1.2rem">${subj.icon}</span>
            <h3 style="font-size:0.95rem;font-weight:800;color:var(--text-primary);">${subj.name}</h3>
            <span style="font-size:0.68rem;font-weight:700;background:var(--primary-dim);color:var(--primary);padding:2px 8px;border-radius:100px;border:1px solid var(--border-accent);">${mats.length} file${mats.length !== 1 ? "s" : ""}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
            ${mats.map((m) => {
                const typeColor = { PDF: "#f87171", VIDEO: "#fb923c", DOC: "#60a5fa", SLIDE: "#a78bfa", LINK: "#4ade80" }[m.type?.toUpperCase()] || "#94a3b8";
                const downloadUrl = m.url && m.url !== "#" ? m.url : "#";
                return `
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:1rem 1.25rem;display:flex;align-items:center;gap:12px;transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--border-bright)'" onmouseout="this.style.borderColor='var(--border)'">
                  <span style="font-size:1.4rem;flex-shrink:0;"></span>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:0.85rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.title}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                      <span style="padding:1px 7px;border-radius:4px;font-size:0.65rem;font-weight:800;background:${typeColor}22;color:${typeColor};">${m.type || "PDF"}</span>
                      ${m.size ? `<span style="font-size:0.72rem;color:var(--text-muted);">${m.size}</span>` : ""}
                    </div>
                  </div>
                  <a href="${downloadUrl}" target="_blank" class="btn-icon" style="background:var(--primary-dim);color:var(--primary);padding:8px;border-radius:8px;">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                  </a>
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
