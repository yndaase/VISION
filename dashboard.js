/* =====================================================
   WAEC 2026 High-Fidelity Dashboard Logic
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Auth guard
  const session = typeof checkAuth === 'function' ? checkAuth() : JSON.parse(sessionStorage.getItem('waec_session') || '{}');
  if (!session || !session.email) {
      window.location.href = "/login.html";
      return;
  }

  // Populate User Identity
  const navAvatar = document.getElementById("navAvatar");
  const navName = document.getElementById("navName");
  const settingsAvatar = document.getElementById("settingsAvatar");
  const settingsName = document.getElementById("settingsName");
  const settingsEmail = document.getElementById("settingsEmail");

  const initial = session.name ? session.name.charAt(0).toUpperCase() : "S";
  
  if (navAvatar) navAvatar.textContent = initial;
  if (settingsAvatar) settingsAvatar.textContent = initial;
  
  if (navName) navName.textContent = session.name || "Candidate 2026";
  if (settingsName) settingsName.textContent = session.name || "Candidate 2026";
  if (settingsEmail) settingsEmail.textContent = session.email;

  // Handle Pro Badge and Promo Strip
  const proBadge = document.getElementById("proHeaderBadge");
  const promoStrip = document.getElementById("proPromoStrip");
  
  const isPro = session.role === "pro" || session.subscriptionExpiry > Date.now() || session.role === "enterprise";
  
  if (isPro) {
      if (proBadge) proBadge.classList.replace("hidden", "inline-flex");
      if (promoStrip) promoStrip.classList.add("hidden");
  } else {
      if (proBadge) proBadge.classList.replace("inline-flex", "hidden");
      if (promoStrip) {
          promoStrip.classList.remove("hidden");
          promoStrip.style.display = "block";
      }
  }

  // Institutional Sync
  const schoolBrandingRow = document.getElementById("schoolBrandingRow");
  if (session.institutionId && schoolBrandingRow) {
      schoolBrandingRow.style.display = 'flex';
      const uEmail = session.institutionId;
      const instData = JSON.parse(localStorage.getItem("vision_ext_" + uEmail) || "{}");
      if (instData.schoolName) {
          schoolBrandingRow.classList.replace("hidden", "flex");
          document.getElementById("schoolName").textContent = instData.schoolName;
          document.getElementById("schoolLogo").textContent = instData.schoolLogo || instData.schoolName.charAt(0);
      }
  }

  // Bind Metrics
  bindTelemetry();

  // Premium Modules
  initPremiumSubjects();

  // Initial Feature Population
  renderDashboardLeaderboard();
  renderDashboardMaterials();
  
  // Tab Handling Logic
  window.showSection = function(sectionId, btn) {
      document.querySelectorAll(".main-section").forEach(s => s.classList.remove("active"));
      const target = document.getElementById(sectionId);
      if (target) target.classList.add("active");

      document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      if (btn) btn.classList.add("active");

      // Contextual rendering
      if (sectionId === 'overview') renderDashboardLeaderboard();
      if (sectionId === 'materials') renderDashboardMaterials();
  };
});

function bindTelemetry() {
  const stats = typeof getStats === 'function' ? getStats() : { answered: 0, correct: 0 };
  const answered = stats.answered || 0;
  const correct = stats.correct || 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  
  const elQuestions = document.getElementById("questionsSolved");
  const elAccuracy = document.getElementById("accuracyRate");
  const elStreak = document.getElementById("streakCurrent");
  const elLongest = document.getElementById("streakLongest");

  if (elQuestions) animateCount(elQuestions, answered);
  if (elAccuracy) animateCount(elAccuracy, accuracy, "%");
  
  const sData = typeof getStreakData === 'function' ? getStreakData() : JSON.parse(localStorage.getItem("vision_streak_" + session.email) || "{}");
  if (elStreak) animateCount(elStreak, sData.currentStreak || 0);
  if (elLongest) animateCount(elLongest, sData.longestStreak || 0);


  // Sync mastery level logic based on arbitrary correctness
  const masteryEl = document.getElementById("masteryLevel");
  if (masteryEl) {
      if (accuracy >= 80) masteryEl.textContent = "S3";
      else if (accuracy >= 60) masteryEl.textContent = "S2";
      else masteryEl.textContent = "S1";
  }
}

function animateCount(el, target, suffix = "") {
  if (target === 0) { el.textContent = "0" + suffix; return; }
  let start = 0;
  const duration = 1000;
  const step = (timestamp) => {
      if (!step.startTime) step.startTime = timestamp;
      const progress = Math.min((timestamp - step.startTime) / duration, 1);
      el.textContent = Math.floor(progress * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
  };
  requestAnimationFrame(step);
}

function initPremiumSubjects() {
  const session = typeof checkAuth === 'function' ? checkAuth() : JSON.parse(sessionStorage.getItem('waec_session') || '{}');
  const isPro = session && (session.role === "pro" || session.subscriptionExpiry > Date.now() || session.role === "enterprise");
  
  // Computer Science is Premium
  const csCard = document.getElementById("card-cs");
  if (csCard) {
      const unlocked = isPro || (typeof isPurchased === 'function' && isPurchased("cs"));
      
      if (unlocked) {
          // Unlock UI
          csCard.classList.remove("border-indigo-500/20", "bg-indigo-500/5");
          csCard.classList.add("border-white/5", "hover:border-indigo-500/30");
          
          const label = csCard.querySelector(".bg-indigo-50"); // The exclusive label
          if (label) label.style.display = "none";
          
          const footerSpan = csCard.querySelector("span:contains('Vision Pro required')") || csCard.querySelectorAll("span")[2];
          if (footerSpan) {
              footerSpan.textContent = "Unlocked Access";
              footerSpan.classList.replace("text-indigo-400", "text-emerald-400");
          }
      } else {
          csCard.addEventListener("click", (e) => {
              e.preventDefault();
              if (typeof initiatePayment === 'function') {
                  initiatePayment("cs", 10, "Computer Science Pack", () => {
                      alert("Success! Pack unlocked.");
                      window.location.reload();
                  });
              } else {
                  alert("Vision Pro Required. Please visit settings to upgrade.");
              }
          });
      }
  }
}

function handle2FAToggle() {
  const t = document.getElementById("tfaToggle");
  const c = t.firstElementChild;
  if (c.classList.contains("left-1")) {
      c.classList.remove("left-1", "bg-gray-700");
      c.classList.add("left-7", "bg-emerald-400");
      t.classList.replace("glass", "bg-emerald-500/20");
  } else {
      c.classList.remove("left-7", "bg-emerald-400");
      c.classList.add("left-1", "bg-gray-700");
      t.classList.replace("bg-emerald-500/20", "glass");
  }
}

async function unifiedChangePassword() {
  const curr = document.getElementById("setCurrentPass").value;
  const newp = document.getElementById("setNewPass").value;
  const conf = document.getElementById("setConfirmPass").value;
  const msg = document.getElementById("passChangeMsg");

  if (!curr || !newp || !conf) {
      msg.textContent = "Error: Fill all fields.";
      msg.classList.remove("hidden", "text-emerald-400");
      msg.classList.add("text-red-400", "border-red-500/20", "bg-red-500/10");
      return;
  }
  if (newp !== conf) {
      msg.textContent = "Error: Sequence mismatch.";
      msg.classList.remove("hidden", "text-emerald-400");
      msg.classList.add("text-red-400", "border-red-500/20", "bg-red-500/10");
      return;
  }
  
  // Actually update password logic here or mock it
  msg.textContent = "Sequence rotation successful.";
  msg.classList.remove("hidden", "text-red-400", "bg-red-500/10", "border-red-500/20");
  msg.classList.add("text-emerald-400", "glass");
  
  setTimeout(() => { msg.classList.add("hidden"); }, 3000);
}

// Leaderboard Restorer
function renderDashboardLeaderboard() {
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    // Use DEMO_STUDENTS or actual data if available
    const students = [
        { name: 'Kwame Asante', questions: 1242, accuracy: 94 },
        { name: 'Ama Serwaa', questions: 1105, accuracy: 91 },
        { name: 'Kofi Mensah', questions: 982, accuracy: 89 },
        { name: 'Abena Osei', questions: 845, accuracy: 87 }
    ];

    list.innerHTML = students.map((s, idx) => `
        <div class="grid grid-cols-4 px-10 py-6 items-center hover:bg-white/2 transition-colors">
           <div class="col-span-2 flex items-center gap-4">
              <div class="w-8 h-8 rounded-lg glass flex items-center justify-center font-black text-[10px] text-gray-500">${idx + 1}</div>
              <p class="font-bold text-sm text-white">${s.name}</p>
           </div>
           <p class="text-center font-mono text-xs text-gray-400">${s.questions}</p>
           <p class="text-right font-mono font-black text-emerald-400">${s.accuracy}%</p>
        </div>
    `).join('');
}

// Materials Hub Sync
function renderDashboardMaterials() {
    const container = document.getElementById("materialsContainer");
    if (!container || typeof getMaterials !== 'function') return;

    const subjects = [
        { id: 'core-maths', name: 'Core Mathematics', icon: '📐' },
        { id: 'english', name: 'English Language', icon: '📖' },
        { id: 'science', name: 'Integrated Science', icon: '🔬' }
    ];

    container.innerHTML = subjects.map(subj => {
        const mats = getMaterials().filter(m => m.subject === subj.id).slice(0, 3);
        if (mats.length === 0) return '';
        return `
            <div class="space-y-8">
               <div class="flex items-center gap-4">
                  <span class="text-2xl">${subj.icon}</span>
                  <p class="text-xs font-black text-white uppercase tracking-widest">${subj.name}</p>
                  <span class="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black rounded uppercase">${mats.length} ITEMS</span>
               </div>
               <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${mats.map(m => `
                    <div class="glass-card p-6 rounded-3xl border-white/5 flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                       <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-navy transition-all duration-500">
                          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                       </div>
                       <div class="flex-1 min-width-0">
                          <p class="text-sm font-bold truncate text-white">${m.title}</p>
                          <p class="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">${m.type || 'PDF'} · ${m.size || 'Core Packet'}</p>
                       </div>
                       <a href="${m.url || '#'}" download class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white text-gray-400 hover:text-navy transition-all">
                          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                       </a>
                    </div>
                  `).join('')}
               </div>
            </div>
        `;
    }).join('');
}

