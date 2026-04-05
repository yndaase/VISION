document.addEventListener("DOMContentLoaded", () => {
  //  1. Auth & Session
  const session = checkAuth();
  if (!session) return;

  // Populate User Chip
  const navAvatar = document.querySelector(".nav-avatar");
  const navUsername = document.querySelector(".nav-username");
  if (navAvatar) navAvatar.textContent = session.name.charAt(0).toUpperCase();
  if (navUsername) navUsername.textContent = session.name || "Student";

  //  2. Fetch User Stats
  const stats = getStats();
  const history = stats.mockHistory || [];
  
  const totalAnswered = stats.answered || 0;
  const totalCorrect = stats.correct || 0;
  const globalAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const totalMocks = history.length;

  //  3. Overview Cards
  updateEl("totalQuestions", totalAnswered);
  updateEl("avgAccuracy", globalAccuracy + "%");
  updateEl("totalMocks", totalMocks);

  // Calculate Aggregated Grade (Average of last 5 mocks)
  const recentMocks = history.slice(0, 5);
  const avgPct = recentMocks.length > 0 
    ? Math.round(recentMocks.reduce((sum, m) => sum + m.pct, 0) / recentMocks.length)
    : globalAccuracy;
    
  updateEl("theoryScore", getWAECGrade(avgPct));

  //  4. Subject-Specific Breakdown
  const subjectStats = {
    maths: { correct: 0, total: 0 },
    english: { correct: 0, total: 0 },
    science: { correct: 0, total: 0 },
    social: { correct: 0, total: 0 }
  };

  history.forEach(mock => {
    // Map mockId to subject if not explicitly stored
    let sub = "maths";
    if (mock.mockId.includes("english")) sub = "english";
    if (mock.mockId.includes("science")) sub = "science";
    if (mock.mockId.includes("social")) sub = "social";

    if (subjectStats[sub]) {
      subjectStats[sub].correct += mock.correct;
      subjectStats[sub].total += mock.total;
    }
  });

  // Update Matrix
  Object.keys(subjectStats).forEach(sub => {
    const s = subjectStats[sub];
    const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    const elId = sub + "Mastery";
    const el = document.getElementById(elId);
    if (el) {
      el.textContent = acc + "%";
      el.className = "matrix-score " + getScoreClass(acc);
    }
  });

  //  5. AI Diagnostic Flags
  renderAIFlags(subjectStats, globalAccuracy);
});

function updateEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getWAECGrade(pct) {
  if (pct >= 80) return "A1";
  if (pct >= 75) return "B2";
  if (pct >= 70) return "B3";
  if (pct >= 65) return "C4";
  if (pct >= 60) return "C5";
  if (pct >= 50) return "C6";
  if (pct >= 45) return "D7";
  if (pct >= 40) return "E8";
  return "F9";
}

function getScoreClass(score) {
  if (score >= 75) return "excellent";
  if (score >= 50) return "average";
  return "needs-work";
}

function renderAIFlags(subjectStats, globalAccuracy) {
  const container = document.querySelector(".weak-topics-list");
  if (!container) return;

  const totalAnswered = Object.values(subjectStats).reduce((sum, s) => sum + s.total, 0);

  if (totalAnswered < 10) {
    container.innerHTML = `
      <div class="weak-topic-item" style="border-left-color: var(--primary);">
        <p class="weak-topic-title">Data Collection Phase</p>
        <p class="weak-topic-desc">You've solved ${totalAnswered} questions. Our AI requires at least 10 answered questions across mocks to generate precise diagnostic flags.</p>
      </div>
    `;
    return;
  }

  let flags = "";

  // Check for specific subject weaknesses
  if (subjectStats.maths.total > 0 && (subjectStats.maths.correct / subjectStats.maths.total) < 0.5) {
    flags += `
      <div class="weak-topic-item">
        <p class="weak-topic-title">Mathematics Strategy</p>
        <p class="weak-topic-desc">Your Core Maths accuracy is below 50%. Focus on Section A speed and Section B justification logic.</p>
      </div>
    `;
  }

  if (subjectStats.science.total > 0 && (subjectStats.science.correct / subjectStats.science.total) < 0.6) {
    flags += `
      <div class="weak-topic-item" style="border-left-color: #ef4444;">
        <p class="weak-topic-title">Integrated Science Theory</p>
        <p class="weak-topic-desc">AI detected gaps in Theory application. Use the "Mark with AI" feature to improve your essay structures.</p>
      </div>
    `;
  }

  if (globalAccuracy >= 75) {
    flags += `
      <div class="weak-topic-item" style="border-left-color: #10b981; background: rgba(16, 185, 129, 0.05);">
        <p class="weak-topic-title" style="color: #4ade80;">Elite Mastery</p>
        <p class="weak-topic-desc">Your global accuracy of ${globalAccuracy}% puts you in the top 5% of Vision Education students. Maintain this for an A1.</p>
      </div>
    `;
  }

  container.innerHTML = flags || `<div class="weak-topic-item"><p class="weak-topic-title">All Systems Normal</p><p class="weak-topic-desc">No critical weaknesses detected in the current data set.</p></div>`;
}
