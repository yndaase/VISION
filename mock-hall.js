// ============================================================
// VISION EDUCATION — MOCK EXAMINATION HALL ENGINE
// mock-hall.js | Proctored WASSCE Simulation Logic
// ============================================================

// ── State ──────────────────────────────────────────────────
let examState = {
  mockId: null,
  mockConfig: null,
  questions: [],
  currentIndex: 0,
  answers: {},      // { qId: 'A' | 'B' | 'C' | 'D' }
  flags: new Set(), // Set of flagged qIds
  timeRemaining: 0, // seconds
  startTime: null,
  timerInterval: null,
  submitted: false
};

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const mockId = params.get('id') || 'math_mock_a';

  const mockConfig = MOCK_EXAMS[mockId];
  if (!mockConfig) {
    alert('Mock exam not found.');
    window.location.href = 'mocks.html';
    return;
  }

  examState.mockId = mockId;
  examState.mockConfig = mockConfig;
  examState.timeRemaining = mockConfig.timeLimit * 60; // to seconds

  // Pull questions from DATABASE
  const allQuestions = DATABASE[mockConfig.subject] || [];
  const qIds = new Set(mockConfig.questions);
  examState.questions = allQuestions.filter(q => qIds.has(q.id));

  // Update meta UI
  document.getElementById('infoMockTitle').textContent = mockConfig.title;
  document.getElementById('topbarMockTitle').textContent = mockConfig.title;
  document.getElementById('infoMockDesc').textContent = mockConfig.description;
  document.getElementById('statTotal').textContent = examState.questions.length;
  document.getElementById('totalQNum').textContent = examState.questions.length;

  examState.startTime = Date.now();

  // Render
  renderPalette();
  renderQuestion();
  startTimer();
});

// ─── Timer ─────────────────────────────────────────────────
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
  const str = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const el = document.getElementById('timerClock');
  if (!el) return;
  el.textContent = str;
  el.className = '';
  if (t <= 300) el.classList.add('critical');
  else if (t <= 900) el.classList.add('warning');
}

// ─── Question Rendering ─────────────────────────────────────
function renderQuestion() {
  const q = examState.questions[examState.currentIndex];
  if (!q) return;

  const card = document.getElementById('qDisplayCard');
  const diffLabel = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' }[q.difficulty] || q.difficulty;
  const diffClass = `diff-${q.difficulty}`;
  const chosen = examState.answers[q.id];

  card.innerHTML = `
    <div class="q-header-row">
      <div class="q-num-badge">Q${examState.currentIndex + 1} of ${examState.questions.length}</div>
      <div class="q-tags">
        <span class="q-tag ${diffClass}">${diffLabel}</span>
        <span class="q-tag">${q.topic}</span>
        <span class="q-tag">${q.contextIcon || '📝'}</span>
      </div>
    </div>
    <p class="q-text">${q.question}</p>
    <div class="options-stack">
      ${['A','B','C','D'].map(letter => `
        <div class="option-row ${chosen === letter ? 'selected' : ''}"
             id="opt-row-${q.id}-${letter}"
             onclick="selectAnswer(${q.id}, '${letter}')">
          <div class="option-letter-box">${letter}</div>
          <div class="option-text">${q.options[letter]}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Update num display
  document.getElementById('currentQNum').textContent = examState.currentIndex + 1;

  // Flag button state
  const flagBtn = document.getElementById('flagBtn');
  if (flagBtn) {
    if (examState.flags.has(q.id)) {
      flagBtn.classList.add('active');
      flagBtn.textContent = '🏷 Flagged';
    } else {
      flagBtn.classList.remove('active');
      flagBtn.textContent = '🏷 Flag for Review';
    }
  }

  updatePalette();
  updateSideStats();
}

// ─── Answer Selection ───────────────────────────────────────
function selectAnswer(qId, letter) {
  if (examState.submitted) return;
  examState.answers[qId] = letter;

  // Update visuals for all option rows of this question
  const q = examState.questions[examState.currentIndex];
  ['A','B','C','D'].forEach(l => {
    const row = document.getElementById(`opt-row-${qId}-${l}`);
    if (!row) return;
    row.classList.toggle('selected', l === letter);
  });

  updatePalette();
  updateSideStats();
}

// ─── Navigation ─────────────────────────────────────────────
function navigateQ(delta) {
  const next = examState.currentIndex + delta;
  if (next < 0 || next >= examState.questions.length) return;
  examState.currentIndex = next;
  renderQuestion();
}

function goToQuestion(index) {
  if (index < 0 || index >= examState.questions.length) return;
  examState.currentIndex = index;
  renderQuestion();
}

// ─── Flag ───────────────────────────────────────────────────
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

// ─── Palette ────────────────────────────────────────────────
function renderPalette() {
  const grid = document.getElementById('paletteGrid');
  if (!grid) return;
  grid.innerHTML = '';
  examState.questions.forEach((q, i) => {
    const num = document.createElement('div');
    num.className = 'palette-num';
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
    el.className = 'palette-num';
    if (i === examState.currentIndex) el.classList.add('pn-active');
    else if (examState.answers[q.id]) el.classList.add('pn-answered');
    if (examState.flags.has(q.id)) el.classList.add('pn-flagged');
  });
  // Update progress text
  const answered = Object.keys(examState.answers).length;
  const progress = document.getElementById('topbarProgress');
  if (progress) progress.textContent = `${answered} of ${examState.questions.length} answered`;
}

function updateSideStats() {
  const answered = Object.keys(examState.answers).length;
  const flagged = examState.flags.size;
  const total = examState.questions.length;
  const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  s('statAnswered', answered);
  s('statFlagged', flagged);
  s('statUnanswered', total - answered);
}

// ─── Submit ─────────────────────────────────────────────────
function confirmSubmit() {
  const answered = Object.keys(examState.answers).length;
  const total = examState.questions.length;
  const unanswered = total - answered;

  if (unanswered > 0) {
    const ok = confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to submit?`);
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

  examState.questions.forEach(q => {
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
  let grade = 'F9', desc = 'Fail';
  if (pct >= 80)      { grade = 'A1'; desc = 'Excellent'; }
  else if (pct >= 75) { grade = 'B2'; desc = 'Very Good'; }
  else if (pct >= 70) { grade = 'B3'; desc = 'Good'; }
  else if (pct >= 65) { grade = 'C4'; desc = 'Credit'; }
  else if (pct >= 60) { grade = 'C5'; desc = 'Credit'; }
  else if (pct >= 50) { grade = 'C6'; desc = 'Credit'; }
  else if (pct >= 45) { grade = 'D7'; desc = 'Pass'; }
  else if (pct >= 40) { grade = 'E8'; desc = 'Pass'; }

  // Time used
  const totalTimeSec = (examState.mockConfig.timeLimit * 60) - examState.timeRemaining;
  const th = Math.floor(totalTimeSec / 3600);
  const tm = Math.floor((totalTimeSec % 3600) / 60);
  const ts = totalTimeSec % 60;
  const timeStr = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}:${String(ts).padStart(2,'0')}`;

  // Save to user stats
  saveExamResult({ grade, pct, correct, wrong, skipped, total, timeStr });

  // Show results modal
  const modal = document.getElementById('resultsModal');
  document.getElementById('gradeBadge').textContent = grade;
  document.getElementById('gradeDesc').textContent = desc;
  document.getElementById('gradePct').textContent = `${pct}%`;
  document.getElementById('gradeBreakdown').textContent = `${correct} / ${total} Correct`;
  document.getElementById('rCorrect').textContent = correct;
  document.getElementById('rWrong').textContent = wrong;
  document.getElementById('rSkipped').textContent = skipped;
  document.getElementById('rTime').textContent = timeStr;

  modal.style.display = 'block';
  modal.scrollTop = 0;
}

// ─── Persist to user account ────────────────────────────────
function saveExamResult({ grade, pct, correct, wrong, skipped, total, timeStr }) {
  try {
    const stats = getStats(); // from auth.js
    stats.mocks = (stats.mocks || 0) + 1;
    stats.lastGrade = grade;
    stats.lastPct = pct;
    stats.answered = (stats.answered || 0) + (correct + wrong);
    stats.correct = (stats.correct || 0) + correct;

    // History array (last 10 mocks)
    if (!stats.mockHistory) stats.mockHistory = [];
    stats.mockHistory.unshift({
      mockId: examState.mockId,
      title: examState.mockConfig.title,
      grade, pct, correct, total, wrong, skipped, timeStr,
      date: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    });
    if (stats.mockHistory.length > 10) stats.mockHistory.pop();

    saveStats(stats); // from auth.js
  } catch (e) {
    console.warn('Could not save exam result to stats:', e);
  }
}
