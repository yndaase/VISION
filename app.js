let currentFilter = "all";
let currentMode = "objective"; // 'objective' or 'subjective'
let answered = {}; // Store MCQ answers: { qId: { chosen, isCorrect } }
let theoryGrades = {}; // Store Theory grades: { qId: { score, feedback, userText } }

const urlParams = new URLSearchParams(window.location.search);
const currentSubjectStr = urlParams.get("sub") || "maths";

let QUESTIONS = [];
let currentIndex = 0; // For "Infinite Feed" mode

// V4 Mock State
let isMockActive = false;
let mockTimeRemaining = 7200; // 2 hours
let mockInterval = null;
let mockAnswered = {}; // { qId: chosenIndex }

function getDailyQuestions(subject, mode = "objective") {
  if (mode === "subjective") {
    return DATABASE.theory[subject] || [];
  }

  const allQuestions = DATABASE[subject] || [];
  if (allQuestions.length === 0) return [];

  // Seeded shuffle to give everyone the same "Daily" set, but we'll use it as a pool
  const dateStr = new Date().toDateString();
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed += dateStr.charCodeAt(i);
  }

  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const shuffled = [...allQuestions].sort(() => seededRandom() - 0.5);
  return shuffled; // Return the whole shuffled pool
}

// Display constants
const DISPLAY_COUNT = 15;
let activeQuestions = [];

//  Mode Management (V4)
function setMode(mode) {
  const practiceBtn = document.getElementById("practiceModeBtn");
  const mockBtn = document.getElementById("mockModeBtn");
  const examHeader = document.getElementById("mockExamHeader");
  const navigator = document.getElementById("examNavigator");

  if (mode === "mock") {
    isMockActive = true;
    practiceBtn.classList.remove("active");
    mockBtn.classList.add("active");
    examHeader.style.display = "block";
    navigator.style.display = "block";

    // Prepare Composite Exam: 40 MCQs + 4 Theory
    const allObj = DATABASE[currentSubjectStr] || [];
    const allSubj = DATABASE.theory[currentSubjectStr] || [];

    const poolObj = [...allObj].sort(() => Math.random() - 0.5).slice(0, 40);
    const poolSubj = [...allSubj].sort(() => Math.random() - 0.5).slice(0, 4);

    QUESTIONS = [...poolObj, ...poolSubj];
    mockAnswered = {};
    startMockTimer();
    renderNavigator();
    renderAll();
    window.scrollTo({ top: 300, behavior: "smooth" });
  } else {
    isMockActive = false;
    clearInterval(mockInterval);
    practiceBtn.classList.add("active");
    mockBtn.classList.remove("active");
    examHeader.style.display = "none";
    navigator.style.display = "none";

    // Resume practice
    QUESTIONS = getDailyQuestions(currentSubjectStr, "objective");
    activeQuestions = QUESTIONS.slice(0, DISPLAY_COUNT);
    renderAll();
  }
}

function startMockTimer() {
  mockTimeRemaining = 7200;
  clearInterval(mockInterval);
  mockInterval = setInterval(() => {
    mockTimeRemaining--;
    updateTimerUI();
    if (mockTimeRemaining <= 0) {
      clearInterval(mockInterval);
      submitExam();
    }
  }, 1000);
}

function updateTimerUI() {
  const h = Math.floor(mockTimeRemaining / 3600);
  const m = Math.floor((mockTimeRemaining % 3600) / 60);
  const s = mockTimeRemaining % 60;
  const clock = document.getElementById("examTimer");
  if (clock)
    clock.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (mockTimeRemaining < 300 && clock) clock.style.color = "var(--error)";
}

//  Render Logic
function renderAll() {
  const grid = document.getElementById("questionsGrid");
  grid.innerHTML = "";

  const filtered =
    currentMode === "objective" && currentFilter !== "all" && !isMockActive
      ? activeQuestions.filter((q) => q.difficulty === currentFilter)
      : isMockActive
        ? QUESTIONS
        : currentMode === "objective"
          ? activeQuestions
          : QUESTIONS;

  filtered.forEach((q, idx) => {
    const card =
      currentMode === "objective" ? buildCard(q, idx) : buildTheoryCard(q, idx);
    grid.appendChild(card);
  });

  updateProgress();
}

function buildCard(q, idx) {
  const div = document.createElement("div");
  div.className = `q-card ${q.difficulty}`;
  div.id = `q-card-${q.id}`;
  div.style.animationDelay = `${idx * 0.06}s`;

  const diffLabel = { easy: " Easy", medium: " Medium", hard: " Hard" }[
    q.difficulty
  ];

  div.innerHTML = `
    <div class="q-card-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="q-number-badge">Q${idx + 1}</span>
        <span class="daily-badge">Verified AI Choice</span>
      </div>
      <div class="q-tags">
        <span class="tag-difficulty ${q.difficulty}">${diffLabel}</span>
        <span class="tag-topic">${q.topic}</span>
      </div>
    </div>

    <p class="q-text">${q.question}</p>

    <div class="options-grid" id="options-${q.id}">
      ${["A", "B", "C", "D"]
        .map(
          (letter) => `
        <button class="option-btn" id="opt-${q.id}-${letter}" onclick="chooseOption(${q.id}, '${letter}')">
          <span class="option-letter">${letter}</span>
          <span class="option-text">${q.options[letter]}</span>
        </button>
      `,
        )
        .join("")}
    </div>

    <div class="result-msg" id="result-${q.id}"></div>

    <div class="workings-panel" id="workings-${q.id}">
      <div class="workings-label">Step-by-Step Workings</div>
      <div class="workings-text">${q.workings}</div>
      <div class="distractor-text"><strong> Distractor Logic:</strong> ${q.distractorLogic}</div>
    </div>

    <div class="protip-panel" id="protip-${q.id}">
      <span class="protip-text"><strong>Examiner's Secret:</strong> ${q.protip.replace("Examiner's Secret: ", "")}</span>
    </div>
  `;

  const state = answered[q.id];
  if (state) restoreCardState(q, state);

  return div;
}

function buildTheoryCard(q, idx) {
  const div = document.createElement("div");
  div.className = `q-card theory-card ${q.difficulty}`;
  div.id = `theory-card-${q.id}`;

  const diffLabel = { easy: " Easy", medium: " Medium", hard: " Hard" }[
    q.difficulty
  ];

  div.innerHTML = `
    <div class="q-card-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="q-number-badge">Task ${q.id}</span>
        <span class="daily-badge">Official Standard</span>
      </div>
      <div class="q-tags">
        <span class="tag-topic">${q.topic}</span>
      </div>
    </div>

    <p class="q-text" style="font-size:1.1rem; font-weight:600; margin-bottom:1.5rem;">${q.question}</p>

    <div class="theory-workarea">
      <textarea class="theory-input-area" id="theory-input-${q.id}" placeholder="Type your full solution steps here... (Shift + Enter for new line)"></textarea>
      <button class="submit-theory-btn" id="theory-submit-${q.id}" onclick="handleTheorySubmit(${q.id})">
        <span>Submit for AI Grading</span>
        <span class="btn-arrow">→</span>
      </button>
    </div>

    <div class="ai-feedback-panel" id="ai-feedback-${q.id}">
      <div class="ai-feedback-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span>AI Analysis Result</span>
        </div>
        <div class="ai-score-pill" id="score-pill-${q.id}">0 / 10</div>
      </div>
      <div class="ai-feedback-body" id="feedback-body-${q.id}">
        <!-- Dynamic Feedback -->
      </div>
      <div class="workings-panel visible" style="margin:0; border-top:1px solid var(--border); border-radius:0;">
        <div class="workings-label">Official WAEC Mark Scheme</div>
        <div class="workings-text">${q.modelAnswer}</div>
      </div>
    </div>
  `;

  const state = theoryGrades[q.id];
  if (state) restoreTheoryState(q, state);

  return div;
}

//  AI Marking Engine (Simulated)
function handleTheorySubmit(qId) {
  const input = document.getElementById(`theory-input-${qId}`).value.trim();
  if (!input) {
    alert("Please provide an answer first.");
    return;
  }

  if (isMockActive) {
    mockAnswered[qId] = input;
    renderNavigator();

    // Proctored Saving Animation
    const btn = document.getElementById(`theory-submit-${qId}`);
    if (btn) {
      btn.classList.add("saving");
      btn.innerHTML = "<span> Encryption & Saving...</span>";
      setTimeout(() => {
        btn.innerHTML = "<span> Script Saved</span>";
        btn.style.background = "var(--success)";
        btn.disabled = true;
      }, 800);
    }
    return;
  }

  const q = QUESTIONS.find((x) => x.id === qId);
  const result = markSubjective(input, q);

  theoryGrades[qId] = {
    score: result.score,
    feedback: result.feedback,
    userText: input,
  };
  applyTheoryFeedback(qId, result);
  updateProgress();
}

function markSubjective(input, q) {
  const text = input.toLowerCase();
  let score = 0;
  let maxPoints = 0;
  let breakdown = [];

  q.markScheme.forEach((item) => {
    maxPoints += item.points;
    const exists = text.includes(item.key.toLowerCase());
    if (exists) {
      score += item.points;
      breakdown.push(` <strong>+${item.points}</strong>: ${item.desc}`);
    } else {
      breakdown.push(` <strong>+0</strong>: Missing ${item.desc}`);
    }
  });

  // Structural bonus (length and complexity)
  if (input.length > 100) score += 1;
  const finalScore = Math.min(10, Math.round((score / maxPoints) * 10));

  let commentary = "";
  if (finalScore >= 8)
    commentary =
      "Excellent logical flow. You captured all key requirements of the question.";
  else if (finalScore >= 5)
    commentary =
      "Good attempt. You identified the main concepts but missed some specific technical details in your explanation.";
  else
    commentary =
      "Try to be more specific. Ensure you mention all the core technical components outlined in the mark scheme.";

  return {
    score: `${finalScore} / 10`,
    feedback: `
      <p style="margin-bottom:1rem;">${commentary}</p>
      <div style="background: var(--bg-input); border: 1px solid var(--border); padding:1rem; border-radius:10px; font-size:0.85rem;">
        <p style="text-transform:uppercase; font-size:0.7rem; font-weight:800; color:var(--text-muted); margin-bottom:0.5rem;">Logical Breakdown</p>
        ${breakdown.join("<br/>")}
      </div>
    `,
  };
}

function applyTheoryFeedback(qId, result) {
  const panel = document.getElementById(`ai-feedback-${qId}`);
  const pill = document.getElementById(`score-pill-${qId}`);
  const body = document.getElementById(`feedback-body-${qId}`);
  const input = document.getElementById(`theory-input-${qId}`);
  const btn = document.getElementById(`theory-submit-${qId}`);

  input.disabled = true;
  if (btn) btn.style.display = "none";

  pill.textContent = result.score;
  body.innerHTML = result.feedback;
  panel.style.display = "block";
}

function restoreTheoryState(q, state) {
  setTimeout(() => {
    const input = document.getElementById(`theory-input-${q.id}`);
    if (input) input.value = state.userText;
    applyTheoryFeedback(q.id, { score: state.score, feedback: state.feedback });
  }, 0);
}

//  MCQ Answer Handling
function chooseOption(qId, chosen) {
  if (isMockActive) {
    mockAnswered[qId] = chosen;
    renderNavigator();
    // Silent highlight (no feedback)
    ["A", "B", "C", "D"].forEach((letter) => {
      const b = document.getElementById(`opt-${qId}-${letter}`);
      if (b) b.classList.toggle("reveal-correct", letter === chosen);
    });
    return;
  }

  if (answered[qId]) return;
  const q = activeQuestions.find((it) => it.id === qId);
  const isCorrect = chosen === q.correct;
  answered[qId] = { chosen, isCorrect };

  applyCardFeedback(q, chosen, isCorrect);
  updateProgress();
  updateGlobalStats(isCorrect);

  // AUTOMATIC NEXT (Triggered by V3 Plan)
  if (currentMode === "objective") {
    setTimeout(() => {
      autoReplenish(qId);
    }, 4000); // 4-second dwell for professional absorption
  }
}

function renderNavigator() {
  const grid = document.getElementById("navigatorGrid");
  if (!grid) return;
  grid.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = `nav-item ${mockAnswered[q.id] ? "answered" : ""}`;
    item.textContent = i + 1;
    item.onclick = () => {
      document
        .getElementById(`q-card-${q.id}`)
        .scrollIntoView({ behavior: "smooth", block: "center" });
    };
    grid.appendChild(item);
  });
}

function submitExam() {
  clearInterval(mockInterval);
  isMockActive = false;

  let scoreObj = 0;
  let countObj = 0;
  let scoreSubj = 0;
  let countSubj = 0;

  QUESTIONS.forEach((q) => {
    if (q.options) {
      // MCQ
      countObj++;
      const chosen = mockAnswered[q.id];
      const isCorrect = chosen === q.correct;
      if (isCorrect) scoreObj++;
      // Save for the reveal view
      if (chosen) answered[q.id] = { chosen, isCorrect };
    } else {
      // Theory
      countSubj++;
      const userText = mockAnswered[q.id] || "";
      const result = markSubjective(userText, q);
      // Normalized to 1-10
      scoreSubj += (result.score / 10) * 10;
      // Also save to theoryGrades for the results page
      theoryGrades[q.id] = {
        score: result.score,
        feedback: result.feedback,
        userText,
      };
    }
  });

  const pctObj = countObj > 0 ? (scoreObj / countObj) * 50 : 0; // Weighted 50%
  const pctSubj = countSubj > 0 ? (scoreSubj / (countSubj * 10)) * 50 : 0; // Weighted 50%
  const pct = Math.round(pctObj + pctSubj);

  // WAEC Scale: A1(80-100), B2(75-79), B3(70-74), C4(65-69), C5(60-64), C6(50-59), D7(45-49), E8(40-44), F9(0-39)
  let grade = "F9";
  let desc = "Fail";
  if (pct >= 80) {
    grade = "A1";
    desc = "Excellent";
  } else if (pct >= 75) {
    grade = "B2";
    desc = "Very Good";
  } else if (pct >= 70) {
    grade = "B3";
    desc = "Good";
  } else if (pct >= 65) {
    grade = "C4";
    desc = "Credit";
  } else if (pct >= 60) {
    grade = "C5";
    desc = "Credit";
  } else if (pct >= 50) {
    grade = "C6";
    desc = "Credit";
  } else if (pct >= 45) {
    grade = "D7";
    desc = "Pass";
  } else if (pct >= 40) {
    grade = "E8";
    desc = "Pass";
  }

  const resultsSect = document.getElementById("resultsSection");
  resultsSect.style.display = "block";
  document.getElementById("resultsTitle").innerHTML = `
    <div style="font-size:3rem; color:var(--primary); font-weight:800;">${grade}</div>
    <div style="font-size:1.2rem; margin-top:0.5rem;">${desc} · Total Composite: ${pct}%</div>
    <div style="font-size:0.9rem; color:var(--text-muted); margin-top:0.5rem;">
      (Section A: ${Math.round(pctObj * 2)}% · Section B: ${Math.round(pctSubj * 2)}%)
    </div>
  `;

  // Render full results with feedback
  renderAll();
  resultsSect.scrollIntoView({ behavior: "smooth" });

  // Reset UI
  document.getElementById("mockExamHeader").style.display = "none";
  document.getElementById("examNavigator").style.display = "none";
}

function autoReplenish(oldId) {
  // Find next unused question in the large pool
  const usedIds = Object.keys(answered).map(Number);
  const nextQ = QUESTIONS.find(
    (q) =>
      !usedIds.includes(q.id) && !activeQuestions.find((aq) => aq.id === q.id),
  );

  if (nextQ) {
    // Replace in active questions
    const idx = activeQuestions.findIndex((q) => q.id === oldId);
    if (idx !== -1) {
      activeQuestions[idx] = nextQ;

      // Cross-fade animation
      const card = document.getElementById(`q-card-${oldId}`);
      if (card) {
        card.style.opacity = "0";
        card.style.transition = "opacity 0.6s ease";
        setTimeout(() => {
          renderAll();
          const newCard = document.getElementById(`q-card-${nextQ.id}`);
          if (newCard) {
            newCard.style.opacity = "0";
            setTimeout(() => {
              newCard.style.opacity = "1";
              newCard.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
          }
        }, 600);
      }
    }
  } else {
    checkAllAnswered();
  }
}

function applyCardFeedback(q, chosen, isCorrect) {
  ["A", "B", "C", "D"].forEach((letter) => {
    const btn = document.getElementById(`opt-${q.id}-${letter}`);
    if (!btn) return;
    btn.disabled = true;
    if (letter === chosen) btn.classList.add(isCorrect ? "correct" : "wrong");
    if (!isCorrect && letter === q.correct) btn.classList.add("reveal-correct");
  });

  const msg = document.getElementById(`result-${q.id}`);
  if (msg) {
    msg.className = `result-msg ${isCorrect ? "correct" : "wrong"}`;
    msg.innerHTML = isCorrect
      ? " Correct! Well done."
      : ` Incorrect. The correct answer is <strong>${q.correct}</strong>`;
  }

  const wp = document.getElementById(`workings-${q.id}`);
  const pp = document.getElementById(`protip-${q.id}`);
  if (wp) wp.classList.add("visible");
  if (pp) pp.classList.add("visible");
}

function restoreCardState(q, state) {
  setTimeout(() => applyCardFeedback(q, state.chosen, state.isCorrect), 0);
}

//  Stats & Progress
function updateGlobalStats(isCorrect) {
  const stats = getStats();
  stats.answered = (stats.answered || 0) + 1;
  if (isCorrect) stats.correct = (stats.correct || 0) + 1;
  saveStats(stats);
}

function updateProgress() {
  const total = QUESTIONS.length;
  if (total === 0) return;

  const done =
    currentMode === "objective"
      ? Object.keys(answered).length
      : Object.keys(theoryGrades).length;

  const pct = (done / total) * 100;

  const progressFill = document.getElementById("progressFill");
  const currentQSpan = document.getElementById("currentQ");

  if (progressFill) progressFill.style.width = pct + "%";
  if (currentQSpan) currentQSpan.textContent = Math.min(done + 1, total);
}

function checkAllAnswered() {
  if (
    Object.keys(answered).length === QUESTIONS.length &&
    currentMode === "objective"
  ) {
    setTimeout(showResults, 600);
  }
}

function showResults() {
  const total = QUESTIONS.length;
  const correct = Object.values(answered).filter((v) => v.isCorrect).length;
  const pct = Math.round((correct / total) * 100);

  document.getElementById("resultsSection").style.display = "block";
  document.getElementById("resultsTitle").textContent =
    `${correct}/${total}  ${pct}%`;
  document
    .getElementById("resultsSection")
    .scrollIntoView({ behavior: "smooth" });
}

function filterQuestions(filter, btn) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderAll();
}

function initNavUserChip() {
  const session = getSession();
  if (!session) return;

  const navAvatar = document.getElementById("navAvatar");
  const navUsername = document.getElementById("navUsername");
  if (navAvatar) navAvatar.textContent = session.name.charAt(0).toUpperCase();
  if (navUsername) navUsername.textContent = session.name.split(" ")[0];

  const heroHeading = document.querySelector(".hero h1");
  const subjectTitles = {
    maths: "Core Maths",
    cs: "Computer Science",
    science: "Integrated Science",
    english: "English Language",
  };
  const titleText = subjectTitles[currentSubjectStr] || "WAEC Prep";

  if (heroHeading) {
    heroHeading.innerHTML = `Master <span class="gradient-text">${titleText}</span>`;
    // If it's not the default landing, shrink the hero to save space
    if (currentSubjectStr !== "maths") {
      document.querySelector(".hero").style.padding = "60px 20px";
      document.querySelector(".hero").style.minHeight = "auto";
    }
  }

  const navLabel = document.querySelector(".nav-subject-label");
  const subjectIcons = { maths: "", cs: "", science: "", english: "" };
  if (navLabel) {
    navLabel.innerHTML = `${subjectIcons[currentSubjectStr] || ""} ${titleText}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const session = checkAuth();
  if (!session) return;

  // Safe Initialization
  QUESTIONS = getDailyQuestions(currentSubjectStr, currentMode);
  activeQuestions = QUESTIONS.slice(0, DISPLAY_COUNT);

  initNavUserChip();
  renderAll();
});
