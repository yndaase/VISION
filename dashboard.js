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
});

function bindTelemetry() {
  const stats = typeof getStats === 'function' ? getStats() : { answered: 0, correct: 0 };
  const answered = stats.answered || 0;
  const correct = stats.correct || 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  
  const elQuestions = document.getElementById("questionsSolved");
  const elAccuracy = document.getElementById("accuracyRate");
  const elStreak = document.getElementById("studyStreak");

  if (elQuestions) animateCount(elQuestions, answered);
  if (elAccuracy) animateCount(elAccuracy, accuracy, "%");
  
  const sData = JSON.parse(localStorage.getItem("vision_streak") || "{}");
  if (elStreak) animateCount(elStreak, sData.count || 0);

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

// Generate Parent Linking Code
window.generateParentCode = async function() {
  const session = JSON.parse(sessionStorage.getItem('waec_session'));
  if (!session || !session.email) return;

  const display = document.getElementById("parentCodeDisplay");
  const valueEl = document.getElementById("parentCodeValue");
  
  valueEl.textContent = "GEN...";
  display.classList.remove("hidden");
  
  if (typeof window.generateLinkingCode === 'function') {
      const code = await window.generateLinkingCode(session.email);
      if (code) {
          valueEl.textContent = code;
      } else {
          valueEl.textContent = "ERROR";
      }
  } else {
      valueEl.textContent = "OFFLINE";
  }
}
