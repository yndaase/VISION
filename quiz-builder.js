/* =====================================================
   QUIZ BUILDER SYSTEM
   Create and manage quizzes with AI assistance
   ===================================================== */

let currentUser = null;
let quizzes = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserSession();
  loadQuizzes();
});

/**
 * Load user session
 */
function loadUserSession() {
  const session = getSession();
  if (!session) {
    window.location.href = '/enterprise-login.html';
    return;
  }
  
  currentUser = session;
  
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userName) userName.textContent = session.name || 'Teacher';
  if (userAvatar) {
    const initial = (session.name || 'T').charAt(0).toUpperCase();
    userAvatar.textContent = initial;
  }
}

/**
 * Get session
 */
function getSession() {
  try {
    const sessionData = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Load quizzes from Firestore
 */
async function loadQuizzes() {
  console.log('[Quiz Builder] Loading quizzes for:', currentUser.email);
  
  try {
    // Try loading from Firestore first
    if (typeof window.fbGetQuizzes === 'function') {
      const firestoreQuizzes = await window.fbGetQuizzes(currentUser.email, currentUser.institutionId);
      if (firestoreQuizzes && firestoreQuizzes.length > 0) {
        quizzes = firestoreQuizzes;
        console.log('[Quiz Builder] ✅ Loaded', quizzes.length, 'quizzes from Firestore');
        renderQuizzes();
        return;
      }
    }
    
    // Fallback to localStorage
    const storageKey = `quizzes_${currentUser.email}`;
    quizzes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    console.log('[Quiz Builder] Loaded', quizzes.length, 'quizzes from localStorage');
    renderQuizzes();
    
  } catch (error) {
    console.error('[Quiz Builder] Error loading quizzes:', error);
    showNotification('Failed to load quizzes', 'error');
  }
}

/**
 * Render quizzes list
 */
function renderQuizzes() {
  const container = document.getElementById('quizzesList');
  if (!container) return;
  
  const filterStatus = document.getElementById('filterStatus')?.value || '';
  const filtered = filterStatus ? quizzes.filter(q => q.status === filterStatus) : quizzes;
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="gb-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>No quizzes found</p>
        <span>Create your first quiz to assess student knowledge</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(quiz => {
    const statusColors = {
      draft: '#f59e0b',
      published: '#10b981',
      archived: '#6b7280'
    };
    
    return `
      <div class="gb-assignment-card">
        <div class="gb-assignment-header">
          <div class="gb-assignment-info">
            <h3>${quiz.title}</h3>
            <div class="gb-assignment-meta">
              <span>${quiz.questions.length} questions</span>
              <span>${quiz.duration} minutes</span>
              <span style="color:${statusColors[quiz.status]};font-weight:700;">${quiz.status}</span>
            </div>
          </div>
          <div class="gb-assignment-actions">
            <button class="gb-icon-btn" onclick="editQuiz('${quiz.id}')" title="Edit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="gb-icon-btn" onclick="duplicateQuiz('${quiz.id}')" title="Duplicate">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="gb-icon-btn" onclick="deleteQuiz('${quiz.id}')" title="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        
        <div class="gb-assignment-stats">
          <div class="gb-stat">
            <span class="gb-stat-label">Attempts</span>
            <span class="gb-stat-value">${quiz.attempts || 0}</span>
          </div>
          <div class="gb-stat">
            <span class="gb-stat-label">Avg Score</span>
            <span class="gb-stat-value">${quiz.avgScore || 0}%</span>
          </div>
          <div class="gb-stat">
            <span class="gb-stat-label">Created</span>
            <span class="gb-stat-value">${new Date(quiz.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div style="display:flex;gap:0.75rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);">
          ${quiz.status === 'published' ? 
            '<button class="gb-btn-secondary" onclick="viewResults(\'' + quiz.id + '\')">View Results</button>' :
            '<button class="gb-btn-primary" onclick="publishQuiz(\'' + quiz.id + '\')">Publish</button>'}
          <button class="gb-btn-secondary" onclick="previewQuiz('${quiz.id}')">Preview</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Show create quiz modal
 */
window.showCreateQuizModal = function() {
  const modal = createModal('Create Quiz', `
    <div class="gb-form-group">
      <label>Quiz Title *</label>
      <input type="text" id="quizTitle" placeholder="e.g., Chapter 5 Assessment" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="quizDesc" placeholder="Optional description"></textarea>
    </div>
    
    <div class="gb-form-group">
      <label>Duration (minutes) *</label>
      <input type="number" id="quizDuration" min="5" value="30" required>
    </div>
    
    <div class="gb-form-group">
      <label>Subject</label>
      <select id="quizSubject">
        <option value="mathematics">Mathematics</option>
        <option value="english">English</option>
        <option value="science">Science</option>
        <option value="social_studies">Social Studies</option>
        <option value="other">Other</option>
      </select>
    </div>
  `, () => {
    createQuiz();
  });
  
  document.body.appendChild(modal);
};

/**
 * Create quiz
 */
async function createQuiz() {
  const title = document.getElementById('quizTitle').value.trim();
  const description = document.getElementById('quizDesc').value.trim();
  const duration = parseInt(document.getElementById('quizDuration').value);
  const subject = document.getElementById('quizSubject').value;
  
  if (!title) {
    showNotification('Please enter quiz title', 'error');
    return;
  }
  
  const quiz = {
    id: generateId(),
    title,
    description,
    duration,
    subject,
    questions: [],
    status: 'draft',
    createdAt: Date.now(),
    createdBy: currentUser.email,
    institutionId: currentUser.institutionId || null,
    attempts: 0,
    avgScore: 0
  };
  
  quizzes.push(quiz);
  await saveQuizzes();
  renderQuizzes();
  
  closeModal();
  showNotification('Quiz created successfully', 'success');
  
  // Open quiz editor
  setTimeout(() => editQuiz(quiz.id), 500);
}

/**
 * Edit quiz
 */
window.editQuiz = function(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  const modal = createModal(`Edit Quiz: ${quiz.title}`, `
    <div class="gb-form-group">
      <label>Quiz Title *</label>
      <input type="text" id="quizTitle" value="${quiz.title}" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="quizDesc">${quiz.description || ''}</textarea>
    </div>
    
    <div class="gb-form-group">
      <label>Duration (minutes) *</label>
      <input type="number" id="quizDuration" min="5" value="${quiz.duration}" required>
    </div>
    
    <div style="margin:1.5rem 0;padding:1.5rem;background:var(--bg-secondary);border-radius:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h4 style="margin:0;font-size:1rem;font-weight:800;">Questions (${quiz.questions.length})</h4>
        <button class="gb-btn-primary" onclick="addQuestion('${quizId}')">Add Question</button>
      </div>
      
      <div id="questionsList">
        ${quiz.questions.length === 0 ? 
          '<p style="text-align:center;color:var(--text-muted);">No questions yet</p>' :
          quiz.questions.map((q, index) => `
            <div style="padding:1rem;background:var(--bg-card);border-radius:8px;margin-bottom:0.75rem;">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                  <div style="font-weight:700;margin-bottom:0.5rem;">${index + 1}. ${q.question}</div>
                  <div style="font-size:0.85rem;color:var(--text-muted);">${q.options.length} options • ${q.points} points</div>
                </div>
                <button class="gb-icon-btn" onclick="removeQuestion('${quizId}', ${index})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `, () => {
    updateQuiz(quizId);
  });
  
  document.body.appendChild(modal);
};

/**
 * Add question to quiz
 */
window.addQuestion = function(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  const questionModal = createModal('Add Question', `
    <div class="gb-form-group">
      <label>Question *</label>
      <textarea id="questionText" placeholder="Enter your question" required></textarea>
    </div>
    
    <div class="gb-form-group">
      <label>Question Type *</label>
      <select id="questionType" onchange="updateQuestionOptions()">
        <option value="multiple_choice">Multiple Choice</option>
        <option value="true_false">True/False</option>
        <option value="short_answer">Short Answer</option>
      </select>
    </div>
    
    <div id="optionsContainer">
      <div class="gb-form-group">
        <label>Options</label>
        <div id="optionsList">
          <input type="text" class="option-input" placeholder="Option A" style="margin-bottom:0.5rem;width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;">
          <input type="text" class="option-input" placeholder="Option B" style="margin-bottom:0.5rem;width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;">
          <input type="text" class="option-input" placeholder="Option C" style="margin-bottom:0.5rem;width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;">
          <input type="text" class="option-input" placeholder="Option D" style="width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;">
        </div>
      </div>
      
      <div class="gb-form-group">
        <label>Correct Answer (index, 0-based) *</label>
        <input type="number" id="correctAnswer" min="0" max="3" value="0" required>
      </div>
    </div>
    
    <div class="gb-form-group">
      <label>Points *</label>
      <input type="number" id="questionPoints" min="1" value="1" required>
    </div>
  `, () => {
    saveQuestion(quizId);
  });
  
  document.body.appendChild(questionModal);
};

/**
 * Save question
 */
function saveQuestion(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  const questionText = document.getElementById('questionText').value.trim();
  const questionType = document.getElementById('questionType').value;
  const points = parseInt(document.getElementById('questionPoints').value);
  
  if (!questionText) {
    showNotification('Please enter question text', 'error');
    return;
  }
  
  let options = [];
  let correctAnswer = 0;
  
  if (questionType === 'multiple_choice') {
    const optionInputs = document.querySelectorAll('.option-input');
    options = Array.from(optionInputs).map(input => input.value.trim()).filter(v => v);
    correctAnswer = parseInt(document.getElementById('correctAnswer').value);
    
    if (options.length < 2) {
      showNotification('Please provide at least 2 options', 'error');
      return;
    }
  } else if (questionType === 'true_false') {
    options = ['True', 'False'];
    correctAnswer = parseInt(document.getElementById('correctAnswer').value);
  }
  
  const question = {
    question: questionText,
    type: questionType,
    options,
    correctAnswer,
    points
  };
  
  quiz.questions.push(question);
  saveQuizzes();
  
  closeModal();
  showNotification('Question added successfully', 'success');
  
  // Reopen quiz editor
  setTimeout(() => editQuiz(quizId), 500);
}

/**
 * Remove question
 */
window.removeQuestion = function(quizId, questionIndex) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  if (!confirm('Remove this question?')) return;
  
  quiz.questions.splice(questionIndex, 1);
  saveQuizzes();
  
  closeModal();
  setTimeout(() => editQuiz(quizId), 100);
};

/**
 * Update quiz
 */
function updateQuiz(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  quiz.title = document.getElementById('quizTitle').value.trim();
  quiz.description = document.getElementById('quizDesc').value.trim();
  quiz.duration = parseInt(document.getElementById('quizDuration').value);
  
  saveQuizzes();
  renderQuizzes();
  
  closeModal();
  showNotification('Quiz updated successfully', 'success');
}

/**
 * Publish quiz
 */
window.publishQuiz = function(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  if (quiz.questions.length === 0) {
    showNotification('Cannot publish quiz without questions', 'error');
    return;
  }
  
  if (!confirm(`Publish "${quiz.title}"? Students will be able to take this quiz.`)) {
    return;
  }
  
  quiz.status = 'published';
  saveQuizzes();
  renderQuizzes();
  
  showNotification('Quiz published successfully', 'success');
};

/**
 * Duplicate quiz
 */
window.duplicateQuiz = function(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  const duplicate = {
    ...quiz,
    id: generateId(),
    title: quiz.title + ' (Copy)',
    status: 'draft',
    createdAt: Date.now(),
    attempts: 0,
    avgScore: 0
  };
  
  quizzes.push(duplicate);
  saveQuizzes();
  renderQuizzes();
  
  showNotification('Quiz duplicated successfully', 'success');
};

/**
 * Delete quiz
 */
window.deleteQuiz = function(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return;
  
  if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
    return;
  }
  
  quizzes = quizzes.filter(q => q.id !== quizId);
  saveQuizzes();
  renderQuizzes();
  
  showNotification('Quiz deleted successfully', 'success');
};

/**
 * Preview quiz â€” full in-modal walkthrough (admin/teacher view, correct answers highlighted)
 */
window.previewQuiz = function(quizId) {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) { showNotification('Quiz not found', 'error'); return; }
  if (!quiz.questions || quiz.questions.length === 0) {
    showNotification('This quiz has no questions to preview', 'warning');
    return;
  }

  let currentQ = 0;
  const answers = new Array(quiz.questions.length).fill(null);

  function optionLetter(i) { return ['A','B','C','D','E'][i] || i; }

  function subjectColor(s) {
    const map = { mathematics:'#6366f1', english:'#10b981', science:'#3b82f6',
                  social_studies:'#f59e0b', other:'#8b5cf6' };
    return map[s] || '#6366f1';
  }

  function renderNav() {
    return quiz.questions.map((_, i) => `
      <button
        onclick="previewGoTo(${i})"
        style="
          width:36px;height:36px;border-radius:8px;border:2px solid;
          font-weight:800;font-size:0.85rem;cursor:pointer;transition:all 0.2s;
          ${i === currentQ
            ? 'background:#6366f1;border-color:#6366f1;color:#fff;'
            : answers[i] !== null
              ? 'background:rgba(16,185,129,0.15);border-color:#10b981;color:#10b981;'
              : 'background:var(--bg-secondary);border-color:var(--border);color:var(--text-muted);'}
        "
      >${i + 1}</button>
    `).join('');
  }

  function renderQuestion() {
    const q = quiz.questions[currentQ];
    const isLast = currentQ === quiz.questions.length - 1;

    let optionsHTML = '';
    if (q.type === 'short_answer') {
      optionsHTML = `
        <div style="margin-top:1.5rem;">
          <textarea placeholder="Short answer (preview only)"
            style="width:100%;padding:1rem;background:var(--bg-secondary);border:1px solid var(--border);
                   border-radius:10px;color:var(--text-primary);font-family:inherit;font-size:0.95rem;
                   resize:vertical;min-height:100px;box-sizing:border-box;" disabled></textarea>
          <div style="margin-top:0.75rem;padding:0.75rem 1rem;background:rgba(16,185,129,0.1);
                      border:1px solid rgba(16,185,129,0.3);border-radius:8px;font-size:0.85rem;color:#10b981;font-weight:600;">
            âœ“ Expected answer: ${q.correctAnswer ?? '(not set)'}
          </div>
        </div>`;
    } else {
      optionsHTML = '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1.5rem;">'
        + (q.options || []).map((opt, oi) => {
          const isCorrect = oi === q.correctAnswer;
          const isSelected = answers[currentQ] === oi;
          return `<button onclick="previewSelectOption(${oi})" style="
            display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;border-radius:12px;
            border:2px solid;text-align:left;cursor:pointer;font-family:inherit;font-size:0.95rem;
            font-weight:600;transition:all 0.15s;width:100%;
            ${isSelected
              ? 'background:rgba(99,102,241,0.15);border-color:#6366f1;color:var(--text-primary);'
              : isCorrect
                ? 'background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.4);color:var(--text-primary);'
                : 'background:var(--bg-secondary);border-color:var(--border);color:var(--text-primary);'}
          ">
            <span style="
              width:32px;height:32px;border-radius:8px;display:flex;align-items:center;
              justify-content:center;font-weight:900;font-size:0.85rem;flex-shrink:0;
              ${isSelected ? 'background:#6366f1;color:#fff;' : isCorrect ? 'background:#10b981;color:#fff;' : 'background:var(--bg-card);color:var(--text-muted);'}
            ">${optionLetter(oi)}</span>
            <span style="flex:1;">${opt}</span>
            ${isCorrect ? '<span style="margin-left:auto;font-size:0.75rem;padding:0.25rem 0.6rem;background:rgba(16,185,129,0.15);color:#10b981;border-radius:6px;font-weight:700;white-space:nowrap;">âœ“ Correct</span>' : ''}
          </button>`;
        }).join('')
        + '</div>';
    }

    return `
      <div style="height:4px;background:var(--bg-secondary);border-radius:4px;margin-bottom:1.5rem;">
        <div style="height:100%;width:${((currentQ+1)/quiz.questions.length)*100}%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:4px;transition:width 0.3s;"></div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.5rem;">
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <span style="font-size:0.8rem;padding:0.3rem 0.75rem;background:rgba(99,102,241,0.12);color:#6366f1;border-radius:6px;font-weight:700;">Q ${currentQ + 1} / ${quiz.questions.length}</span>
          <span style="font-size:0.8rem;padding:0.3rem 0.75rem;background:var(--bg-secondary);color:var(--text-muted);border-radius:6px;font-weight:600;">${q.points || 1} pt${(q.points||1)!==1?'s':''}</span>
        </div>
        <span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">${q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'true_false' ? 'True / False' : 'Short Answer'}</span>
      </div>

      <div style="font-size:1.05rem;font-weight:700;line-height:1.65;color:var(--text-primary);">${q.question}</div>

      ${optionsHTML}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);flex-wrap:wrap;gap:0.75rem;">
        <button onclick="previewGoTo(${currentQ - 1})" ${currentQ === 0 ? 'disabled' : ''} style="
          display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1.25rem;border-radius:10px;
          border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-secondary);
          font-weight:700;cursor:pointer;font-family:inherit;opacity:${currentQ===0?'0.4':'1'};">â† Prev</button>

        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;justify-content:center;max-width:300px;">
          ${renderNav()}
        </div>

        ${isLast
          ? '<button onclick="closePreview()" style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1.25rem;border-radius:10px;border:none;background:#10b981;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;">Done âœ“</button>'
          : `<button onclick="previewGoTo(${currentQ + 1})" style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1.25rem;border-radius:10px;border:none;background:#6366f1;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;">Next â†’</button>`}
      </div>
    `;
  }

  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'quizPreviewOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:2rem 1rem;overflow-y:auto;';

  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:20px;width:100%;max-width:760px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);margin:auto;">
      <div style="padding:1.5rem 2rem;border-bottom:1px solid var(--border);background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05));display:flex;align-items:center;justify-content:space-between;gap:1rem;">
        <div style="display:flex;align-items:center;gap:1rem;min-width:0;">
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div style="min-width:0;">
            <div style="font-size:0.72rem;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.15rem;">Admin Preview</div>
            <div style="font-size:1.05rem;font-weight:800;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${quiz.title}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.1rem;">${quiz.questions.length} questions Â· ${quiz.duration || 30} min Â· ${(quiz.subject||'').replace('_',' ')}</div>
          </div>
        </div>
        <button onclick="closePreview()" style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div id="previewQuestionArea" style="padding:2rem;"></div>

      <div style="padding:0.9rem 2rem;border-top:1px solid var(--border);background:rgba(245,158,11,0.06);display:flex;align-items:center;gap:0.75rem;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span style="font-size:0.78rem;color:#f59e0b;font-weight:600;">Preview mode â€” correct answers are highlighted. Students will not see them during the actual quiz.</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('previewQuestionArea').innerHTML = renderQuestion();

  window.previewGoTo = function(index) {
    if (index < 0 || index >= quiz.questions.length) return;
    currentQ = index;
    document.getElementById('previewQuestionArea').innerHTML = renderQuestion();
  };

  window.previewSelectOption = function(optionIndex) {
    answers[currentQ] = optionIndex;
    document.getElementById('previewQuestionArea').innerHTML = renderQuestion();
  };

  window.closePreview = function() {
    const el = document.getElementById('quizPreviewOverlay');
    if (el) el.remove();
  };

  overlay.addEventListener('click', function(e) { if (e.target === overlay) window.closePreview(); });

  const escHandler = function(e) {
    if (e.key === 'Escape') { window.closePreview(); document.removeEventListener('keydown', escHandler); }
  };
  document.addEventListener('keydown', escHandler);
};

/**
 * View results
 */
window.viewResults = function(quizId) {
  showNotification('Results view coming soon!', 'info');
};

/**
 * Generate AI quiz
 */
window.generateAIQuiz = async function() {
  const modal = createModal('Generate Quiz with AI', `
    <div class="gb-form-group">
      <label>Topic *</label>
      <input type="text" id="aiTopic" placeholder="e.g., Photosynthesis, Quadratic Equations" required>
    </div>
    
    <div class="gb-form-group">
      <label>Number of Questions *</label>
      <input type="number" id="aiQuestionCount" min="5" max="20" value="10" required>
    </div>
    
    <div class="gb-form-group">
      <label>Difficulty Level</label>
      <select id="aiDifficulty">
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
    
    <div class="gb-form-group">
      <label>Subject</label>
      <select id="aiSubject">
        <option value="mathematics">Mathematics</option>
        <option value="english">English</option>
        <option value="science">Science</option>
        <option value="social_studies">Social Studies</option>
        <option value="other">Other</option>
      </select>
    </div>
    
    <div style="padding:1rem;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:8px;margin-top:1rem;">
      <div style="display:flex;align-items:start;gap:0.75rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <div style="font-size:0.85rem;color:var(--text-secondary);">
          AI will generate multiple-choice questions based on your topic. Review and edit questions before publishing.
        </div>
      </div>
    </div>
  `, async () => {
    await generateQuizWithAI();
  });
  
  document.body.appendChild(modal);
};

/**
 * Generate quiz with AI
 */
async function generateQuizWithAI() {
  const topic = document.getElementById('aiTopic').value.trim();
  const questionCount = parseInt(document.getElementById('aiQuestionCount').value);
  const difficulty = document.getElementById('aiDifficulty').value;
  const subject = document.getElementById('aiSubject').value;
  
  if (!topic) {
    showNotification('Please enter a topic', 'error');
    return;
  }
  
  // Show loading
  const saveBtn = document.getElementById('modalSaveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>Generating...</span>';
  }
  
  try {
    console.log('[Quiz Builder] Generating AI quiz:', { topic, questionCount, difficulty, subject });
    
    // Call AI generation API
    const response = await fetch('/api/ai-quiz-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        questionCount,
        difficulty,
        subject
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }
    
    const data = await response.json();
    
    if (!data.success || !data.questions) {
      throw new Error(data.error || 'Failed to generate questions');
    }
    
    // Create quiz with AI-generated questions
    const quiz = {
      id: generateId(),
      title: `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      description: `AI-generated quiz on ${topic}`,
      duration: questionCount * 2, // 2 minutes per question
      subject,
      questions: data.questions,
      status: 'draft',
      createdAt: Date.now(),
      createdBy: currentUser.email,
      institutionId: currentUser.institutionId || null,
      attempts: 0,
      avgScore: 0,
      aiGenerated: true
    };
    
    quizzes.push(quiz);
    await saveQuizzes();
    renderQuizzes();
    
    closeModal();
    showNotification(`✅ Generated ${data.questions.length} questions successfully!`, 'success');
    
    // Open quiz editor
    setTimeout(() => editQuiz(quiz.id), 500);
    
  } catch (error) {
    console.error('[Quiz Builder] AI generation error:', error);
    showNotification('Failed to generate quiz: ' + error.message, 'error');
    
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Generate</span>';
    }
  }
}

/**
 * Import quiz from CSV
 */
window.importQuiz = function() {
  const modal = createModal('Import Quiz from CSV', `
    <div class="gb-form-group">
      <label>Quiz Title *</label>
      <input type="text" id="importTitle" placeholder="e.g., Imported Quiz" required>
    </div>
    
    <div class="gb-form-group">
      <label>CSV File *</label>
      <input type="file" id="csvFile" accept=".csv" required style="padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;width:100%;">
    </div>
    
    <div style="padding:1rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:8px;margin-top:1rem;">
      <div style="font-weight:700;margin-bottom:0.5rem;color:#f59e0b;">CSV Format:</div>
      <div style="font-size:0.85rem;color:var(--text-secondary);font-family:monospace;">
        question,optionA,optionB,optionC,optionD,correctAnswer,points<br>
        "What is 2+2?","2","3","4","5",2,1<br>
        "Capital of Ghana?","Accra","Lagos","Nairobi","Cairo",0,1
      </div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem;">
        • correctAnswer is 0-based index (0=A, 1=B, 2=C, 3=D)<br>
        • Use quotes for text with commas
      </div>
    </div>
  `, () => {
    importQuizFromCSV();
  });
  
  document.body.appendChild(modal);
};

/**
 * Import quiz from CSV file
 */
async function importQuizFromCSV() {
  const title = document.getElementById('importTitle').value.trim();
  const fileInput = document.getElementById('csvFile');
  
  if (!title) {
    showNotification('Please enter quiz title', 'error');
    return;
  }
  
  if (!fileInput.files || fileInput.files.length === 0) {
    showNotification('Please select a CSV file', 'error');
    return;
  }
  
  const file = fileInput.files[0];
  
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one question');
    }
    
    // Skip header row
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      
      if (values.length < 7) {
        console.warn(`Skipping line ${i + 1}: insufficient columns`);
        continue;
      }
      
      const [question, optionA, optionB, optionC, optionD, correctAnswer, points] = values;
      
      questions.push({
        question: question.trim(),
        type: 'multiple_choice',
        options: [
          optionA.trim(),
          optionB.trim(),
          optionC.trim(),
          optionD.trim()
        ].filter(opt => opt),
        correctAnswer: parseInt(correctAnswer),
        points: parseInt(points) || 1
      });
    }
    
    if (questions.length === 0) {
      throw new Error('No valid questions found in CSV');
    }
    
    // Create quiz
    const quiz = {
      id: generateId(),
      title,
      description: `Imported from CSV (${questions.length} questions)`,
      duration: questions.length * 2,
      subject: 'other',
      questions,
      status: 'draft',
      createdAt: Date.now(),
      createdBy: currentUser.email,
      institutionId: currentUser.institutionId || null,
      attempts: 0,
      avgScore: 0
    };
    
    quizzes.push(quiz);
    await saveQuizzes();
    renderQuizzes();
    
    closeModal();
    showNotification(`✅ Imported ${questions.length} questions successfully!`, 'success');
    
    // Open quiz editor
    setTimeout(() => editQuiz(quiz.id), 500);
    
  } catch (error) {
    console.error('[Quiz Builder] Import error:', error);
    showNotification('Failed to import CSV: ' + error.message, 'error');
  }
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

/**
 * Filter quizzes
 */
window.filterQuizzes = function() {
  renderQuizzes();
};

/**
 * Save quizzes to Firestore and localStorage
 */
async function saveQuizzes() {
  try {
    // Save to Firestore
    if (typeof window.fbSaveQuizzes === 'function') {
      await window.fbSaveQuizzes(currentUser.email, quizzes);
      console.log('[Quiz Builder] ✅ Saved to Firestore');
    }
    
    // Also save to localStorage as backup
    const storageKey = `quizzes_${currentUser.email}`;
    localStorage.setItem(storageKey, JSON.stringify(quizzes));
    console.log('[Quiz Builder] ✅ Saved to localStorage');
    
  } catch (error) {
    console.error('[Quiz Builder] Error saving quizzes:', error);
    
    // Fallback to localStorage only
    const storageKey = `quizzes_${currentUser.email}`;
    localStorage.setItem(storageKey, JSON.stringify(quizzes));
  }
}

/**
 * Utility functions
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createModal(title, content, onSave) {
  const modal = document.createElement('div');
  modal.className = 'gb-modal';
  modal.innerHTML = `
    <div class="gb-modal-content" style="max-width:700px;max-height:90vh;overflow-y:auto;">
      <div class="gb-modal-header">
        <h2>${title}</h2>
        <button class="gb-modal-close" onclick="closeModal()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      ${content}
      <div class="gb-modal-actions">
        <button class="gb-btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="gb-btn-primary" id="modalSaveBtn">Save</button>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn && onSave) {
      saveBtn.onclick = onSave;
    }
  }, 0);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  return modal;
}

window.closeModal = function() {
  const modal = document.querySelector('.gb-modal');
  if (modal) modal.remove();
};

function showNotification(message, type = 'info') {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${colors[type]};
    color: white;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
