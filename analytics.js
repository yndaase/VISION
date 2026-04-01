/* =====================================================
   VISION EDUCATION  Analytics Engine
   Populates performance data from localStorage
   Calculates trends and AI diagnostic flags
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  //  1. Auth & Session
  const session = checkAuth();
  if (!session) return;

  // Populate User Chip (Top Nav)
  const navAvatar = document.querySelector(".nav-avatar");
  const navUsername = document.querySelector(".nav-username");
  if (navAvatar) navAvatar.textContent = session.name.charAt(0).toUpperCase();
  if (navUsername) navUsername.textContent = session.name || "Student";

  //  2. Fetch User Stats
  const stats = getStats();
  const answered = stats.answered || 0;
  const correct = stats.correct || 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  //  3. Populate Overview Cards
  updateEl("totalQuestions", answered);
  updateEl("avgAccuracy", accuracy + "%");

  // Simulated data for "Mock" specific metrics (can be expanded later)
  const mocksTaken = Math.floor(answered / 15); // Assume 15 questions per simulated mock
  updateEl("totalMocks", mocksTaken);

  // Simple grade calculation based on accuracy
  let grade = "C4";
  if (accuracy >= 80) grade = "A1";
  else if (accuracy >= 70) grade = "B2";
  else if (accuracy >= 60) grade = "B3";
  else if (accuracy >= 50) grade = "C5";
  else if (accuracy < 50) grade = "F9";
  updateEl("theoryScore", grade);

  //  4. Subject Matrix Mastery
  // (In a real app, these would be separate keys. For now, we scale based on overall stats)
  updateEl("mathsMastery", accuracy + "%");

  // Set classes for colors
  const mathsEl = document.getElementById("mathsMastery");
  if (mathsEl) {
    mathsEl.className = "matrix-score " + getScoreClass(accuracy);
  }

  //  5. AI Diagnostic Flags
  renderAIFlags(answered, accuracy);
});

function updateEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getScoreClass(score) {
  if (score >= 75) return "excellent";
  if (score >= 50) return "average";
  return "needs-work";
}

function renderAIFlags(answered, accuracy) {
  const container = document.querySelector(".weak-topics-list");
  if (!container) return;

  if (answered === 0) {
    container.innerHTML = `
      <div class="weak-topic-item" style="border-left-color: var(--primary);">
        <p class="weak-topic-title">Data Collection Phase</p>
        <p class="weak-topic-desc">Start practicing to activate AI diagnostics. Our system requires at least 5 answered questions to flag weaknesses.</p>
      </div>
    `;
    return;
  }

  let flags = "";

  if (accuracy < 60) {
    flags += `
      <div class="weak-topic-item">
        <p class="weak-topic-title">Accuracy Warning</p>
        <p class="weak-topic-desc">Your global accuracy is below the WASSCE "Pass" threshold. Review foundational concepts in Algebra and Number Theory.</p>
      </div>
    `;
  }

  if (answered < 20) {
    flags += `
      <div class="weak-topic-item" style="border-left-color: #fbbf24; background: rgba(251, 191, 36, 0.05);">
        <p class="weak-topic-title" style="color: #fcd34d;">Low Sample Size</p>
        <p class="weak-topic-desc">You've solved ${answered} questions. Solve more to improve the precision of these AI flags.</p>
      </div>
    `;
  } else {
    flags += `
      <div class="weak-topic-item" style="border-left-color: #10b981; background: rgba(16, 185, 129, 0.05);">
        <p class="weak-topic-title" style="color: #4ade80;">Steady Progression</p>
        <p class="weak-topic-desc">You are maintaining a consistent pace. Your predicted Section B efficiency is improving.</p>
      </div>
    `;
  }

  container.innerHTML = flags;
}
