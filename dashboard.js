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
});

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
        <a href="index.html?sub=${s.id.split("-").pop()}" class="search-result-item">
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
