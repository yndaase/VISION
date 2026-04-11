// ============================================================
// VISION EDUCATION  MOCK EXAMINATION HALL ENGINE
// mock-hall.js | Proctored WASSCE Simulation Logic
// ============================================================

//  State
let examState = {
  mockId: null,
  mockConfig: null,
  questions: [],
  currentIndex: 0,
  answers: {}, // { qId: 'A' | 'B' | 'C' | 'D' }
  flags: new Set(), // Set of flagged qIds
  timeRemaining: 0, // seconds
  startTime: null,
  timerInterval: null,
  submitted: false,
  isGeneratingPartB: false,
};

//  Init
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const mockId = params.get("id") || "math_mock_a";

  if (mockId === "daily_ai_mock") {
    // Generate AI Mock for today
    await initAIMock();
    return;
  }

  const mockConfig = MOCK_EXAMS[mockId];
  if (!mockConfig) {
    alert("Mock exam not found.");
    window.location.href = "/mocks";
    return;
  }

  examState.mockId = mockId;
  examState.mockConfig = mockConfig;
  examState.timeRemaining = mockConfig.timeLimit * 60; // to seconds

  // Pull questions from DATABASE
  const mcqQuestions = (window.DATABASE[mockConfig.subject] || []).filter(q => new Set(mockConfig.questions).has(q.id)).map(q => ({ ...q, type: 'mcq' }));
  const essayQuestions = (window.DATABASE.theory && window.DATABASE.theory[mockConfig.subject] || []).filter(q => new Set(mockConfig.essayQuestions || []).has(q.id)).map(q => ({ ...q, type: 'essay' }));
  
  examState.questions = [...mcqQuestions, ...essayQuestions];

  // Update meta UI
  document.getElementById("infoMockTitle").textContent = mockConfig.title;
  document.getElementById("topbarMockTitle").textContent = mockConfig.title;
  document.getElementById("infoMockDesc").textContent = mockConfig.description;
  document.getElementById("statTotal").textContent = examState.questions.length;
  document.getElementById("totalQNum").textContent = examState.questions.length;

  examState.startTime = Date.now();

  // Render
  renderPalette();
  renderQuestion();
  startTimer();
});

async function initAIMock() {
  const session = typeof getSession === 'function' ? getSession() : JSON.parse(sessionStorage.getItem("waec_session") || "{}");
  const isAdmin = (session.email || "").toLowerCase() === 'gisgreat308@gmail.com';
  const isPro = session.role === 'pro' || isAdmin;
  
  const qCard = document.getElementById("qDisplayCard");
  if (qCard) {
    const engineName = isPro ? "Azure GPT-4o" : "Gemini AI";
    qCard.innerHTML = `<div style='text-align:center; padding: 3rem;'><h2 style='color:var(--primary); animation: pulse 2s infinite;'>${engineName} is setting your daily questions...</h2><p style='color:var(--text-muted);'>Analysing the 2026 syllabus to build your ${isPro ? 'High-Precision' : ''} mission of the day.</p></div>`;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const session = typeof getSession === 'function' ? getSession() : null;
    const userRole = session?.role || 'student';

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'generate-questions', 
        subject: 'Core Mathematics', 
        dateSeed: today, 
        role: userRole,
        email: session?.email || "" 
      })
    });
    const data = await res.json();
    
    examState.mockId = "daily_ai_mock";
    examState.mockConfig = {
      title: "AI Daily Challenge - " + today,
      description: "A fresh set of syllabus-aligned WASSCE questions generated specifically for today's mission.",
      timeLimit: 45
    };
    examState.timeRemaining = 45 * 60;
    examState.questions = [
      ...data.mcqs.map(q => ({ ...q, type: 'mcq' })),
      ...data.theory.map(q => ({ ...q, type: 'essay' }))
    ];

    document.getElementById("infoMockTitle").textContent = examState.mockConfig.title;
    document.getElementById("topbarMockTitle").textContent = examState.mockConfig.title;
    document.getElementById("infoMockDesc").textContent = examState.mockConfig.description;
    document.getElementById("statTotal").textContent = examState.questions.length;
    document.getElementById("totalQNum").textContent = examState.questions.length;
    examState.startTime = Date.now();

    renderPalette();
    renderQuestion();
    startTimer();
  } catch (err) {
    console.error("AI Generation Error:", err);
    alert("AI failed to set today's questions. Launching fallback mock.");
    window.location.href = "/mock-hall?id=math_mock_a";
  }
}

//  Timer
function startTimer() {
  clearInterval(examState.timerInterval);
  updateTimerDisplay();
  examState.timerInterval = setInterval(() => {
    examState.timeRemaining--;
    updateTimerDisplay();
    if (examState.timeRemaining <= 0) {
      clearInterval(examState.timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const t = examState.timeRemaining;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const str = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const el = document.getElementById("timerClock");
  if (!el) return;
  el.textContent = str;
  el.className = "";
  if (t <= 300) el.classList.add("critical");
  else if (t <= 900) el.classList.add("warning");
}

//  Question Rendering
function renderQuestion() {
  const q = examState.questions[examState.currentIndex];
  if (!q) return;

  const card = document.getElementById("qDisplayCard");
  const diffLabel =
    { easy: " Easy", medium: " Medium", hard: " Hard" }[q.difficulty] ||
    q.difficulty;
  const diffClass = `diff-${q.difficulty}`;
  const chosen = examState.answers[q.id];

  let bodyHtml = "";
  if (q.type === "essay") {
    bodyHtml = `
      <div class="essay-container">
        <textarea id="essay-ans-${q.id}" 
                  class="essay-input" 
                  placeholder="Type your detailed answer here..."
                  oninput="saveEssayAnswer(${q.id}, this.value)">${chosen || ""}</textarea>
        <div class="essay-actions">
          <button class="ai-mark-btn" onclick="markEssayWithAI(${q.id})">
            <span class="sparkle-icon">✨</span> Mark with AI
          </button>
          <div id="ai-feedback-${q.id}" class="ai-feedback-box" style="display:none">
            <div class="ai-loader">Analyzing your answer...</div>
          </div>
        </div>
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="options-stack">
        ${["A", "B", "C", "D"]
          .map(
            (letter) => `
          <div class="option-row ${chosen === letter ? "selected" : ""}"
               id="opt-row-${q.id}-${letter}"
               onclick="selectAnswer(${q.id}, '${letter}')">
            <div class="option-letter-box">${letter}</div>
            <div class="option-text">${q.options[letter]}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  card.innerHTML = `
    <div class="q-header-row">
      <div class="q-num-badge">Q${examState.currentIndex + 1} of ${examState.questions.length}</div>
      <div class="q-tags">
        <span class="q-tag ${diffClass}">${diffLabel}</span>
        <span class="q-tag">${q.topic}</span>
        <span class="q-tag">${q.contextIcon || ""}</span>
        ${q.type === 'essay' ? '<span class="q-tag theory-tag">Theory</span>' : ''}
      </div>
    </div>
    <p class="q-text">${q.question}</p>
    ${bodyHtml}
  `;

  // Update num display
  document.getElementById("currentQNum").textContent =
    examState.currentIndex + 1;

  // Flag button state
  const flagBtn = document.getElementById("flagBtn");
  if (flagBtn) {
    if (examState.flags.has(q.id)) {
      flagBtn.classList.add("active");
      flagBtn.textContent = " Flagged";
    } else {
      flagBtn.classList.remove("active");
      flagBtn.textContent = " Flag for Review";
    }
  }

  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(card, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }

  updatePalette();
  updateSideStats();
}

// Essay Answer Saving
function saveEssayAnswer(qId, text) {
  if (examState.submitted) return;
  examState.answers[qId] = text;
  updatePalette();
  updateSideStats();
}

// AI Marking Logic
async function markEssayWithAI(qId) {
  const answer = examState.answers[qId];
  const q = examState.questions.find(item => item.id === qId);
  const feedbackEl = document.getElementById(`ai-feedback-${qId}`);
  
  if (!answer || answer.trim().length < 10) {
    alert("Please provide a more detailed answer before marking.");
    return;
  }

  feedbackEl.style.display = "block";
  feedbackEl.innerHTML = '<div class="ai-loader">Analyzing your answer...</div>';

  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const userRole = session?.role || 'student';

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mark-exam',
        studentResponses: [{
          questionId: q.id,
          question: q.question,
          studentAnswer: answer,
          markScheme: q.markScheme,
          modelAnswer: q.modelAnswer
        }],
        role: userRole
      })
    });

    const result = await response.json();
    
    if (result.success) {
      feedbackEl.innerHTML = `
        <div class="ai-score-row">
          <div class="ai-score-badge">${result.score} / ${result.maxPoints}</div>
          <div class="ai-verdict">${result.verdict}</div>
        </div>
        <div class="ai-feedback-text">${result.feedback}</div>
        ${q.modelAnswer ? `
        <div class="ai-model-ans">
          <strong>Model Answer:</strong><br>
          ${q.modelAnswer}
        </div>` : ''}
      `;
    } else {
      feedbackEl.innerHTML = `
        <div class="ai-error-card" style="border: 1px solid var(--error); padding: 1rem; border-radius: 8px; text-align:center;">
          <p style="color: var(--error); font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem;">AI Brain is resting</p>
          <p style="color: var(--text-muted); font-size: 0.8rem;">${result.error || 'Failed to analyze.'}</p>
          <button onclick="markEssayWithAI(${qId})" class="nav-btn" style="margin-top: 0.5rem; width: 100%; font-size: 0.75rem;">Try Again</button>
        </div>
      `;
    }

    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(feedbackEl, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }
  } catch (err) {
    console.error(err);
    feedbackEl.innerHTML = '<div class="ai-error">Connection error. Please try again.</div>';
  }
}

//  Answer Selection
function selectAnswer(qId, letter) {
  if (examState.submitted) return;
  examState.answers[qId] = letter;

  // Update visuals for all option rows of this question
  const q = examState.questions[examState.currentIndex];
  ["A", "B", "C", "D"].forEach((l) => {
    const row = document.getElementById(`opt-row-${qId}-${l}`);
    if (!row) return;
    row.classList.toggle("selected", l === letter);
  });

  updatePalette();
  updateSideStats();
}

//  Navigation
function navigateQ(delta) {
  const nextIdx = examState.currentIndex + delta;
  
  // Transition check: If on last MCQ and going next
  if (delta > 0 && nextIdx >= examState.questions.length && !examState.isGeneratingPartB) {
    const allMCQsAnswered = (examState.questions || [])
      .filter(q => q.type === 'mcq')
      .every(q => examState.answers[q.id]);

    if (allMCQsAnswered) {
      checkForPartBTransition();
      return;
    }
  }

  if (nextIdx < 0 || nextIdx >= examState.questions.length) return;
  examState.currentIndex = nextIdx;
  renderQuestion();
}

function goToQuestion(index) {
  if (index < 0 || index >= examState.questions.length) return;
  examState.currentIndex = index;
  renderQuestion();
}

//  Flag
function toggleFlag() {
  const q = examState.questions[examState.currentIndex];
  if (!q) return;
  if (examState.flags.has(q.id)) {
    examState.flags.delete(q.id);
  } else {
    examState.flags.add(q.id);
  }
  renderQuestion(); // re-render to update button
}

//  Palette
function renderPalette() {
  const grid = document.getElementById("paletteGrid");
  if (!grid) return;
  grid.innerHTML = "";
  examState.questions.forEach((q, i) => {
    const num = document.createElement("div");
    num.className = "palette-num";
    num.id = `pn-${q.id}`;
    num.textContent = i + 1;
    num.title = `Q${i + 1}: ${q.topic}`;
    num.onclick = () => goToQuestion(i);
    grid.appendChild(num);
  });
  updatePalette();
}

function updatePalette() {
  examState.questions.forEach((q, i) => {
    const el = document.getElementById(`pn-${q.id}`);
    if (!el) return;
    el.className = "palette-num";
    if (i === examState.currentIndex) el.classList.add("pn-active");
    else if (examState.answers[q.id]) el.classList.add("pn-answered");
    if (examState.flags.has(q.id)) el.classList.add("pn-flagged");
  });
  // Update progress text
  const answered = Object.keys(examState.answers).length;
  const progress = document.getElementById("topbarProgress");
  if (progress)
    progress.textContent = `${answered} of ${examState.questions.length} answered`;
}

function updateSideStats() {
  const answered = Object.keys(examState.answers).length;
  const flagged = examState.flags.size;
  const total = examState.questions.length;
  const s = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  s("statAnswered", answered);
  s("statFlagged", flagged);
  s("statUnanswered", total - answered);
}

//  Submit
function confirmSubmit() {
  const answered = Object.keys(examState.answers).length;
  const total = examState.questions.length;
  const unanswered = total - answered;

  if (unanswered > 0) {
    const ok = confirm(
      `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`,
    );
    if (!ok) return;
  }
  submitExam();
}

function autoSubmit() {
  examState.submitted = true;
  submitExam();
}

function submitExam() {
  clearInterval(examState.timerInterval);
  examState.submitted = true;

  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  examState.questions.forEach((q) => {
    const chosen = examState.answers[q.id];
    if (!chosen) {
      skipped++;
    } else if (chosen === q.correct || chosen === q.correctFixed) {
      correct++;
    } else {
      wrong++;
    }
  });

  const total = examState.questions.length;
  const pct = Math.round((correct / total) * 100);

  // WAEC Grading Scale
  let grade = "F9",
    desc = "Fail";
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

  // Time used
  const totalTimeSec =
    examState.mockConfig.timeLimit * 60 - examState.timeRemaining;
  const th = Math.floor(totalTimeSec / 3600);
  const tm = Math.floor((totalTimeSec % 3600) / 60);
  const ts = totalTimeSec % 60;
  const timeStr = `${String(th).padStart(2, "0")}:${String(tm).padStart(2, "0")}:${String(ts).padStart(2, "0")}`;

  // Save to user stats
  saveExamResult({ grade, pct, correct, wrong, skipped, total, timeStr });

  // Show results modal
  const modal = document.getElementById("resultsModal");
  document.getElementById("gradeBadge").textContent = grade;
  document.getElementById("gradeDesc").textContent = desc;
  document.getElementById("gradePct").textContent = `${pct}%`;
  document.getElementById("gradeBreakdown").textContent =
    `${correct} / ${total} Correct`;
  document.getElementById("rCorrect").textContent = correct;
  document.getElementById("rWrong").textContent = wrong;
  document.getElementById("rSkipped").textContent = skipped;
  document.getElementById("rTime").textContent = timeStr;

  modal.style.display = "block";
  modal.scrollTop = 0;
}

//  Persist to user account
function saveExamResult({
  grade,
  pct,
  correct,
  wrong,
  skipped,
  total,
  timeStr,
}) {
  try {
    const stats = getStats(); // from auth.js
    stats.mocks = (stats.mocks || 0) + 1;
    stats.lastGrade = grade;
    stats.lastPct = pct;
    stats.answered = (stats.answered || 0) + (correct + wrong);
    stats.correct = (stats.correct || 0) + correct;

    // AI Grading Handshake for Daily Mocks
    if (examState.mockId === "daily_ai_mock") {
      performAIGrading(stats);
      return; 
    }

    // History array (last 10 mocks)
    if (!stats.mockHistory) stats.mockHistory = [];
    stats.mockHistory.unshift({
      mockId: examState.mockId,
      title: examState.mockConfig.title,
      grade,
      pct,
      correct,
      total,
      wrong,
      skipped,
      timeStr,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });
    if (stats.mockHistory.length > 10) stats.mockHistory.pop();

    saveStats(stats); // from auth.js
  } catch (e) {
    console.warn("Could not save exam result to stats:", e);
  }
}

async function performAIGrading(stats) {
  const resultArea = document.getElementById('resultArea');
  if (resultArea) resultArea.innerHTML = "<div style='text-align:center; padding: 2rem;'><h3 style='color:var(--primary); animation: pulse 2s infinite;'>AI Examiner is marking your Theory responses...</h3><p style='color:var(--text-muted);'>This process takes 3-5 seconds for precision grading.</p></div>";

  try {
    const studentResponses = examState.questions
      .filter(q => q.type === 'essay')
      .map(q => ({
        questionId: q.id,
        question: q.question,
        studentAnswer: examState.answers[q.id] || "No Answer Provided",
        markScheme: q.markScheme
      }));

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mark-exam', studentResponses })
    });
    const results = await res.json();
    
    // Aggregate AI results back into final view
    let aiHtml = `
      <div class="ai-feedback-box" style="background: rgba(99, 102, 241, 0.08); border: 1.5px solid var(--primary); margin-top: 2rem;">
        <h3 style="font-size: 1.25rem; color: var(--primary); margin-bottom: 1.5rem; display: flex; align-items:center; gap:10px; font-weight: 800;">
          <span>✨</span> Chief Examiner's Critique
        </h3>
    `;
    
    // Ensure results is an array
    const resultsList = Array.isArray(results) ? results : (results.results || []);

    resultsList.forEach((r, idx) => {
      aiHtml += `
        <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <strong style="color:var(--text-secondary); font-size: 0.9rem;">Question ${r.questionId || (idx + 1)}</strong>
            <span class="ai-score-badge">
              ${r.score} / ${r.maxScore || 10} Marks
            </span>
          </div>
          <p style="font-size: 0.95rem; line-height:1.6; color:var(--text-muted); font-style:italic; margin:0;">
            "${r.critique || r.feedback || 'No specific critique provided.'}"
          </p>
        </div>
      `;
    });
    
    aiHtml += `
        <button onclick="window.location.reload()" class="submit-hall-btn" style="width: 100%; margin-top: 1rem; padding: 12px;">Back to Mock Hall</button>
      </div>
    `;

    if (resultArea) {
      resultArea.innerHTML = aiHtml;
      if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultArea, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      }
    }
  } catch (err) {
    console.error("AI Marking Failed:", err);
    saveStats(stats);
  }
}

/**  ASK AI TUTOR INTEGRATION  **/
const aiBtn = document.getElementById('askAIButton');
const aiDrawer = document.getElementById('aiTutorDrawer');
const closeDrawer = document.getElementById('closeDrawer');
const aiHistory = document.getElementById('aiChatHistory');
const aiInput = document.getElementById('aiInput');
const sendAI = document.getElementById('sendToAI');

if (aiBtn) {
  aiBtn.onclick = () => aiDrawer.classList.toggle('open');
}

if (closeDrawer) {
  closeDrawer.onclick = () => aiDrawer.classList.remove('open');
}

if (sendAI) {
  sendAI.onclick = () => handleAISearch();
}

if (aiInput) {
  aiInput.onkeypress = (e) => {
    if (e.key === 'Enter') handleAISearch();
  };
}

document.querySelectorAll('.quick-btn').forEach((btn) => {
  btn.onclick = () => {
    const action = btn.dataset.action;
    const qData = examState.questions[examState.currentIndex];

    let prompt = "";
    if (action === 'explain') prompt = `Can you explain the concept behind this question: "${qData.question}"?`;
    if (action === 'hint') prompt = `Give me a small hint for this question: "${qData.question}". Don't tell me the answer yet!`;

    aiInput.value = prompt;
    handleAISearch(prompt);
  };
});

async function handleAISearch(manualPrompt) {
  const text = manualPrompt || aiInput.value;
  if (!text.trim()) return;

  const qData = examState.questions[examState.currentIndex];

  // Add User Message
  appendMsg(text, 'user');
  aiInput.value = "";

  // Add AI Loading
  const loader = appendMsg("Thinking...", 'ai');

  try {
    const session = typeof getSession === 'function' ? getSession() : null;
    const userRole = session?.role || 'student';

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'help',
        question: qData.question,
        options: qData.options,
        subject: qData.subject || 'WASSCE Prep',
        topic: qData.topic || 'General',
        userMessage: text,
        role: userRole
      })
    });

    const data = await res.json();
    if (res.ok) {
        const helpText = data.helpText || "I couldn't generate a response right now.";
        loader.innerHTML = typeof marked !== 'undefined' ? marked.parse(helpText) : helpText;
    } else {
        loader.style.background = "rgba(248, 113, 113, 0.05)";
        loader.style.border = "1px solid var(--error)";
        loader.innerHTML = `
          <div style="color: var(--error); font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">⚠️ AI Brain Exhaustion</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${data.error || "AI brain offline."}</div>
        `;
    }

    if (typeof renderMathInElement !== 'undefined') {
      renderMathInElement(loader, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }
  } catch (err) {
    loader.style.color = "var(--error)";
    loader.textContent = "Linking to AI brain failed. This usually indicates a network issue or missing API credentials.";
  }
}

function appendMsg(text, type) {
  const div = document.createElement('div');
  div.className = `${type}-msg`;
  
  if (typeof marked !== 'undefined' && type === 'ai') {
    div.innerHTML = marked.parse(text);
  } else {
    div.textContent = text;
  }
  
  aiHistory.appendChild(div);

  if (type === 'ai' && typeof renderMathInElement !== 'undefined') {
    renderMathInElement(div, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }

  aiHistory.scrollTop = aiHistory.scrollHeight;
  return div;
}


/**  DYNAMIC AI QUESTION GENERATION  **/

async function checkForPartBTransition() {
  const confirmMsg = "General Objectives (Part A) complete! Would you like the AI to generate your Theory Paper (Part B) now? This will take a few seconds.";
  if (!confirm(confirmMsg)) return;

  examState.isGeneratingPartB = true;
  showGenerationLoading();

  // Calculate MCQ Performance for Adaptive Prompting
  const perf = {}; // { topic: { correct: 0, total: 0 } }
  examState.questions.filter(q => q.type === 'mcq').forEach(q => {
    if (!perf[q.topic]) perf[q.topic] = { correct: 0, total: 0 };
    perf[q.topic].total++;
    if (examState.answers[q.id] === q.correct || examState.answers[q.id] === q.correctFixed) {
      perf[q.topic].correct++;
    }
  });

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generate-questions',
        subject: examState.mockConfig.subject,
        count: 3,
        studentPerformance: perf
      })
    });

    const data = await res.json();
    if (data.questions && data.questions.length > 0) {
      // Append new questions
      examState.questions = [...examState.questions, ...data.questions];
      examState.currentIndex++; 
      
      // Update UI
      renderPalette();
      updateSideStats();
      document.getElementById("statTotal").textContent = examState.questions.length;
      document.getElementById("totalQNum").textContent = examState.questions.length;
      
      hideGenerationLoading();
      renderQuestion();
    } else {
      throw new Error("No questions generated");
    }
  } catch (err) {
    console.error(err);
    alert("AI set-up failed. We will use standard theory questions instead.");
    hideGenerationLoading();
    // Fallback to static theory if available
  } finally {
    examState.isGeneratingPartB = false;
  }
}

function showGenerationLoading() {
  const card = document.getElementById("qDisplayCard");
  card.innerHTML = `
    <div class="ai-gen-loading">
      <div class="ai-sparkles">✨</div>
      <h2>AI is setting your Theory Paper...</h2>
      <p>Analyzing your MCQ performance to create the perfect challenge.</p>
      <div class="pixel-loader"></div>
    </div>
  `;
}

function hideGenerationLoading() {
  // Logic to restore normally will be handled by renderQuestion()
}
