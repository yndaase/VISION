/* =====================================================
   QUIZ TAKER SYSTEM
   Enterprise student quiz-taking logic
   ===================================================== */

let quiz = null;
let currentQuestion = 0;
let answers = [];
let timerInterval = null;
let timeRemaining = 0;
let session = null;
let submitted = false;

/* ─── Session Helper ─── */
function getSession() {
  try {
    const data = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('[Quiz Taker] Error getting session:', e);
    return null;
  }
}

/* ─── URL Params Helper ─── */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    quizId: params.get('quizId'),
    teacherEmail: params.get('teacherEmail')
  };
}

/* ─── Load Quiz ─── */
async function loadQuiz(quizId, teacherEmail) {
  // 1. Try localStorage first
  try {
    const storageKey = `quizzes_${teacherEmail}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const found = stored.find(q => q.id === quizId);
    if (found) {
      console.log('[Quiz Taker] Loaded quiz from localStorage:', found.title);
      return found;
    }
  } catch (e) {
    console.warn('[Quiz Taker] localStorage error:', e);
  }

  // 2. Try Firestore via fbGetQuizzes
  if (typeof window.fbGetQuizzes === 'function') {
    try {
      const quizzes = await window.fbGetQuizzes(teacherEmail);
      const found = (quizzes || []).find(q => q.id === quizId);
      if (found) {
        console.log('[Quiz Taker] Loaded quiz from Firestore:', found.title);
        return found;
      }
    } catch (e) {
      console.warn('[Quiz Taker] Firestore fbGetQuizzes error:', e);
    }
  }

  // 3. Try fbGetPublishedQuizzes with institutionId
  if (typeof window.fbGetPublishedQuizzes === 'function' && session) {
    try {
      const institutionId = session.institutionId || session.schoolCode;
      const quizzes = await window.fbGetPublishedQuizzes(institutionId);
      const found = (quizzes || []).find(q => q.id === quizId);
      if (found) {
        console.log('[Quiz Taker] Loaded quiz from published quizzes:', found.title);
        return found;
      }
    } catch (e) {
      console.warn('[Quiz Taker] Firestore fbGetPublishedQuizzes error:', e);
    }
  }

  return null;
}

/* ─── Check if student already attempted this quiz ─── */
function hasAttempted(quizId) {
  try {
    const key = `quiz_attempts_${session.email}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    return attempts.some(a => a.quizId === quizId);
  } catch (e) {
    return false;
  }
}

/* ─── Render Quiz UI ─── */
function renderQuizUI() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = `
    <!-- Quiz Header -->
    <div class="qt-header">
      <div class="qt-header-left">
        <div class="qt-title-wrap">
          <h1 class="qt-title">${escapeHtml(quiz.title)}</h1>
          ${quiz.subject ? `<span class="qt-subject-badge">${escapeHtml(quiz.subject)}</span>` : ''}
        </div>
        <p class="qt-desc">${escapeHtml(quiz.description || '')}</p>
      </div>
      <div class="qt-timer-wrap">
        <div class="qt-timer" id="quizTimer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span id="timerDisplay">--:--</span>
        </div>
        <div class="qt-progress-text" id="progressText">Question 1 of ${quiz.questions.length}</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="qt-progress-bar-wrap">
      <div class="qt-progress-bar" id="progressBar" style="width: ${(1 / quiz.questions.length) * 100}%"></div>
    </div>

    <!-- Main Content -->
    <div class="qt-body">
      <!-- Question Navigator -->
      <div class="qt-navigator">
        <div class="qt-nav-label">Questions</div>
        <div class="qt-nav-grid" id="questionNav">
          ${quiz.questions.map((_, i) => `
            <button class="qt-nav-btn${i === 0 ? ' active' : ''}" id="navBtn${i}" onclick="goToQuestion(${i})">${i + 1}</button>
          `).join('')}
        </div>
        <div class="qt-nav-legend">
          <span class="qt-legend-item"><span class="qt-legend-dot answered"></span>Answered</span>
          <span class="qt-legend-item"><span class="qt-legend-dot current"></span>Current</span>
          <span class="qt-legend-item"><span class="qt-legend-dot"></span>Unanswered</span>
        </div>
        <button class="qt-submit-btn" onclick="confirmSubmit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Submit Quiz
        </button>
      </div>

      <!-- Question Display -->
      <div class="qt-question-wrap">
        <div class="qt-question-card" id="questionCard">
          <!-- Rendered dynamically -->
        </div>
        <div class="qt-nav-controls">
          <button class="qt-btn-secondary" id="prevBtn" onclick="previousQuestion()" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
          <button class="qt-btn-primary" id="nextBtn" onclick="nextQuestion()">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  renderQuestion(0);
  startTimer();
}

/* ─── Render Current Question ─── */
function renderQuestion(index) {
  const q = quiz.questions[index];
  const card = document.getElementById('questionCard');
  if (!card || !q) return;

  const selectedAnswer = answers[index];
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  let optionsHTML = '';
  if (q.type === 'short_answer') {
    optionsHTML = `
      <div class="qt-short-answer-wrap" style="margin-top:1.25rem;">
        <textarea
          class="qt-short-answer-input"
          id="shortAnswerInput"
          placeholder="Type your answer here..."
          rows="3"
          oninput="selectShortAnswer(this.value)"
          style="width:100%;padding:1rem;background:var(--bg-secondary);border:2px solid var(--border);border-radius:12px;color:var(--text-primary);font-family:inherit;font-size:1rem;resize:vertical;box-sizing:border-box;"
        >${escapeHtml(answers[index] || '')}</textarea>
      </div>
    `;
  } else {
    const opts = (q.options && q.options.length > 0) ? q.options : ['True', 'False'];
    optionsHTML = `
      <div class="qt-options" id="optionsList">
        ${opts.map((opt, i) => {
          const isSelected = selectedAnswer === i || selectedAnswer === opt;
          return `
            <button
              type="button"
              class="qt-option${isSelected ? ' selected' : ''}"
              id="opt_${i}"
              data-index="${i}"
              onclick="selectOption(${i})"
            >
              <span class="qt-option-label">${optionLabels[i] || i + 1}</span>
              <span class="qt-option-text">${escapeHtml(opt)}</span>
              <span class="qt-option-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  card.innerHTML = `
    <div class="qt-question-num">Question ${index + 1} <span class="qt-points">${q.points || 1} pt${(q.points || 1) !== 1 ? 's' : ''}</span></div>
    <div class="qt-question-text">${escapeHtml(q.question)}</div>
    ${optionsHTML}
  `;

  // Attach direct event listener to each option for guaranteed click responsiveness
  card.querySelectorAll('.qt-option').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const idx = parseInt(this.getAttribute('data-index'), 10);
      if (!isNaN(idx)) {
        selectOption(idx);
      }
    });
  });

  // Update nav controls
  document.getElementById('prevBtn').disabled = (index === 0);
  const nextBtn = document.getElementById('nextBtn');
  if (index === quiz.questions.length - 1) {
    nextBtn.innerHTML = `Submit Quiz <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    nextBtn.onclick = confirmSubmit;
  } else {
    nextBtn.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
    nextBtn.onclick = nextQuestion;
  }

  // Update progress
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  if (progressBar) progressBar.style.width = `${((index + 1) / quiz.questions.length) * 100}%`;
  if (progressText) progressText.textContent = `Question ${index + 1} of ${quiz.questions.length}`;

  // Update nav buttons
  updateNavButtons();
}

/* ─── Select Option ─── */
function selectOption(index) {
  answers[currentQuestion] = index;
  updateNavButtons();

  // Visual update: highlight selected
  const buttons = document.querySelectorAll('.qt-option');
  buttons.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}
window.selectOption = selectOption;
window.selectAnswer = selectOption;

function selectShortAnswer(val) {
  answers[currentQuestion] = val;
  updateNavButtons();
}
window.selectShortAnswer = selectShortAnswer;

/* ─── Navigation ─── */
function goToQuestion(index) {
  currentQuestion = index;
  renderQuestion(index);
}
window.goToQuestion = goToQuestion;

function nextQuestion() {
  if (currentQuestion < quiz.questions.length - 1) {
    currentQuestion++;
    renderQuestion(currentQuestion);
  }
}
window.nextQuestion = nextQuestion;

function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion(currentQuestion);
  }
}
window.previousQuestion = previousQuestion;

/* ─── Update Navigator Buttons ─── */
function updateNavButtons() {
  quiz.questions.forEach((_, i) => {
    const btn = document.getElementById(`navBtn${i}`);
    if (!btn) return;
    btn.className = 'qt-nav-btn';
    if (i === currentQuestion) btn.classList.add('active');
    if (answers[i] !== undefined && answers[i] !== null) btn.classList.add('answered');
  });
}

/* ─── Timer ─── */
function startTimer() {
  const duration = (quiz.duration && quiz.duration > 0) ? quiz.duration : 30;
  timeRemaining = duration * 60;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }

    // Warning color at 5 minutes remaining
    const timerEl = document.getElementById('quizTimer');
    if (timerEl) {
      if (timeRemaining <= 60) {
        timerEl.classList.add('danger');
        timerEl.classList.remove('warning');
      } else if (timeRemaining <= 300) {
        timerEl.classList.add('warning');
        timerEl.classList.remove('danger');
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const display = document.getElementById('timerDisplay');
  if (!display) return;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ─── Submit Flow ─── */
window.confirmSubmit = function() {
  const unanswered = quiz.questions.length - answers.filter(a => a !== undefined && a !== null).length;

  if (unanswered > 0) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
      document.getElementById('confirmMsg').textContent =
        `You have ${unanswered} unanswered question${unanswered !== 1 ? 's' : ''}. Are you sure you want to submit?`;
      modal.classList.add('open');
      return;
    }
  }
  submitQuiz();
};

window.closeConfirmModal = function() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.remove('open');
};

window.proceedSubmit = function() {
  closeConfirmModal();
  submitQuiz();
};

function autoSubmit() {
  if (!submitted) {
    showToast('Time is up! Submitting your quiz...', 'warning');
    setTimeout(submitQuiz, 1500);
  }
}

async function submitQuiz() {
  if (submitted) return;
  submitted = true;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Calculate score
  let score = 0;
  let totalPoints = 0;
  const details = quiz.questions.map((q, i) => {
    const pts = q.points || 1;
    totalPoints += pts;

    const userAns = answers[i];
    let isCorrect = false;

    if (userAns !== undefined && userAns !== null && userAns !== '') {
      if (q.type === 'short_answer') {
        const userText = String(userAns).trim().toLowerCase();
        const correctText = String(q.correctAnswer || '').trim().toLowerCase();
        isCorrect = userText === correctText;
      } else {
        const opts = q.options || ['True', 'False'];
        const selectedText = opts[userAns] ? String(opts[userAns]).trim().toLowerCase() : '';
        const correctRaw = q.correctAnswer;
        const correctText = (opts[correctRaw] !== undefined)
          ? String(opts[correctRaw]).trim().toLowerCase()
          : String(correctRaw || '').trim().toLowerCase();

        // Match index (0 === 0 or 0 === "0")
        if (userAns === correctRaw || String(userAns) === String(correctRaw)) {
          isCorrect = true;
        }
        // Match option text ("Accra" === "Accra")
        else if (selectedText && (selectedText === correctText || selectedText === String(correctRaw).trim().toLowerCase())) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) score += pts;

    const selectedDisplay = (q.type === 'short_answer')
      ? (userAns || null)
      : (q.options && q.options[userAns] !== undefined ? q.options[userAns] : (userAns ?? null));

    const correctDisplay = (q.options && q.options[q.correctAnswer] !== undefined)
      ? q.options[q.correctAnswer]
      : q.correctAnswer;

    return {
      question: q.question,
      selected: selectedDisplay,
      selectedIndex: userAns,
      correct: correctDisplay,
      isCorrect,
      points: pts
    };
  });

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const timeTaken = ((quiz.duration || 30) * 60) - timeRemaining;

  const attempt = {
    quizId: quiz.id,
    quizTitle: quiz.title,
    subject: quiz.subject || '',
    score,
    totalPoints,
    percentage,
    correct: details.filter(d => d.isCorrect).length,
    total: quiz.questions.length,
    timeTaken,
    submittedAt: new Date().toISOString(),
    answers: answers,
    details
  };

  // Save to localStorage
  try {
    const key = `quiz_attempts_${session.email}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(attempt);
    localStorage.setItem(key, JSON.stringify(existing));
    console.log('[Quiz Taker] Saved attempt to localStorage');
  } catch (e) {
    console.warn('[Quiz Taker] Failed to save to localStorage:', e);
  }

  // Save to Firestore if available
  if (typeof window.fbSaveQuizAttempt === 'function') {
    try {
      await window.fbSaveQuizAttempt(session.email, quiz.id, attempt);
      console.log('[Quiz Taker] Saved attempt to Firestore');
    } catch (e) {
      console.warn('[Quiz Taker] Failed to save to Firestore:', e);
    }
  }

  showResults(attempt);
}

/* ─── Show Results ─── */
function showResults(attempt) {
  const overlay = document.getElementById('resultsOverlay');
  if (!overlay) return;

  const pct = attempt.percentage;
  let grade, gradeClass, message;
  if (pct >= 80) { grade = 'Excellent'; gradeClass = 'grade-excellent'; message = 'Outstanding performance! Keep up the great work.'; }
  else if (pct >= 65) { grade = 'Good'; gradeClass = 'grade-good'; message = 'Well done! You have a solid understanding.'; }
  else if (pct >= 50) { grade = 'Average'; gradeClass = 'grade-average'; message = 'Not bad! Review the topics you missed.'; }
  else { grade = 'Needs Improvement'; gradeClass = 'grade-fail'; message = 'Keep practicing! Review the material and try again.'; }

  const mins = Math.floor(attempt.timeTaken / 60);
  const secs = attempt.timeTaken % 60;
  const timeStr = `${mins}m ${secs}s`;

  overlay.innerHTML = `
    <div class="qt-results-card">
      <div class="qt-results-header ${gradeClass}">
        <div class="qt-results-icon">
          ${pct >= 50
            ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
          }
        </div>
        <h2 class="qt-results-title">Quiz Complete!</h2>
        <p class="qt-results-quiz-name">${escapeHtml(quiz.title)}</p>
      </div>

      <div class="qt-results-score-wrap">
        <div class="qt-score-circle ${gradeClass}">
          <span class="qt-score-pct">${pct}%</span>
          <span class="qt-score-label">Score</span>
        </div>
      </div>

      <div class="qt-results-stats">
        <div class="qt-result-stat">
          <span class="qt-result-stat-num">${attempt.correct}</span>
          <span class="qt-result-stat-lbl">Correct</span>
        </div>
        <div class="qt-result-stat">
          <span class="qt-result-stat-num">${attempt.total - attempt.correct}</span>
          <span class="qt-result-stat-lbl">Wrong</span>
        </div>
        <div class="qt-result-stat">
          <span class="qt-result-stat-num">${attempt.score}/${attempt.totalPoints}</span>
          <span class="qt-result-stat-lbl">Points</span>
        </div>
        <div class="qt-result-stat">
          <span class="qt-result-stat-num">${timeStr}</span>
          <span class="qt-result-stat-lbl">Time</span>
        </div>
      </div>

      <div class="qt-results-grade-wrap">
        <span class="qt-grade-badge ${gradeClass}">${grade}</span>
        <p class="qt-results-message">${message}</p>
      </div>

      <div class="qt-results-actions">
        <a href="/enterprise-student-dashboard.html" class="qt-btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Back to Dashboard
        </a>
      </div>
    </div>
  `;

  overlay.classList.add('open');
}

/* ─── Toast Helper ─── */
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `qt-toast qt-toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ─── Escape HTML ─── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', async () => {
  session = getSession();

  if (!session || session.role !== 'enterprise-student') {
    window.location.href = '/enterprise-login.html';
    return;
  }

  const { quizId, teacherEmail } = getUrlParams();

  if (!quizId || !teacherEmail) {
    document.getElementById('quizContainer').innerHTML = `
      <div class="qt-error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h2>Invalid Quiz Link</h2>
        <p>This quiz link is missing required information. Please go back to your dashboard and try again.</p>
        <a href="/enterprise-student-dashboard.html" class="qt-btn-primary">Back to Dashboard</a>
      </div>
    `;
    return;
  }

  // Show loading
  document.getElementById('quizContainer').innerHTML = `
    <div class="qt-loading">
      <div class="qt-spinner"></div>
      <p>Loading quiz...</p>
    </div>
  `;

  // Load quiz (wait a moment for firebase.js module to initialize)
  setTimeout(async () => {
    quiz = await loadQuiz(quizId, teacherEmail);

    if (!quiz) {
      document.getElementById('quizContainer').innerHTML = `
        <div class="qt-error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h2>Quiz Not Found</h2>
          <p>This quiz could not be found. It may have been removed or you may not have access.</p>
          <a href="/enterprise-student-dashboard.html" class="qt-btn-primary">Back to Dashboard</a>
        </div>
      `;
      return;
    }

    if (quiz.status !== 'published') {
      document.getElementById('quizContainer').innerHTML = `
        <div class="qt-error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h2>Quiz Unavailable</h2>
          <p>This quiz is not currently published. Please contact your teacher or check back later.</p>
          <a href="/enterprise-student-dashboard.html" class="qt-btn-primary">Back to Dashboard</a>
        </div>
      `;
      return;
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      document.getElementById('quizContainer').innerHTML = `
        <div class="qt-error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h2>No Questions</h2>
          <p>This quiz doesn't have any questions yet. Please check back later.</p>
          <a href="/enterprise-student-dashboard.html" class="qt-btn-primary">Back to Dashboard</a>
        </div>
      `;
      return;
    }

    // Initialize answers array
    answers = new Array(quiz.questions.length).fill(undefined);

    // Update page title
    document.title = `${quiz.title} | Vision Education`;

    // Render the quiz UI
    renderQuizUI();
  }, 800);
});
