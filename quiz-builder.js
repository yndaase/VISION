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
 * Load quizzes
 */
function loadQuizzes() {
  const storageKey = `quizzes_${currentUser.email}`;
  quizzes = JSON.parse(localStorage.getItem(storageKey) || '[]');
  renderQuizzes();
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
function createQuiz() {
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
    attempts: 0,
    avgScore: 0
  };
  
  quizzes.push(quiz);
  saveQuizzes();
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
 * Preview quiz
 */
window.previewQuiz = function(quizId) {
  showNotification('Quiz preview coming soon!', 'info');
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
window.generateAIQuiz = function() {
  showNotification('AI quiz generation coming soon!', 'info');
};

/**
 * Import quiz
 */
window.importQuiz = function() {
  showNotification('Quiz import coming soon!', 'info');
};

/**
 * Filter quizzes
 */
window.filterQuizzes = function() {
  renderQuizzes();
};

/**
 * Save quizzes
 */
function saveQuizzes() {
  const storageKey = `quizzes_${currentUser.email}`;
  localStorage.setItem(storageKey, JSON.stringify(quizzes));
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
