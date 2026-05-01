// WAEC Past Questions - Vercel Blob Integration
// This module handles fetching, filtering, and downloading past questions from Vercel Blob Storage

// Auth guard
const session = checkAuth();
if (!session) {
  throw new Error("Authentication required");
}

// State management
let allQuestions = [];
let filteredQuestions = [];
let currentSubject = 'all';
let currentYear = 'all';
let currentPaper = 'all';
let currentSort = 'newest';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeFilters();
  loadPastQuestions();
});

// Initialize filter event listeners
function initializeFilters() {
  // Subject pills
  const subjectPills = document.querySelectorAll('.subject-pill');
  subjectPills.forEach(pill => {
    pill.addEventListener('click', () => {
      subjectPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentSubject = pill.dataset.subject;
      filterAndRenderQuestions();
    });
  });

  // Year filter
  document.getElementById('yearFilter').addEventListener('change', (e) => {
    currentYear = e.target.value;
    filterAndRenderQuestions();
  });

  // Paper type filter
  document.getElementById('paperFilter').addEventListener('change', (e) => {
    currentPaper = e.target.value;
    filterAndRenderQuestions();
  });

  // Sort filter
  document.getElementById('sortFilter').addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRenderQuestions();
  });
}

// Load past questions from Vercel Blob
async function loadPastQuestions() {
  try {
    showLoading();
    
    // Fetch from API endpoint that connects to Vercel Blob
    const response = await fetch('/api/waec-questions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load past questions');
    }

    const data = await response.json();
    allQuestions = data.questions || [];
    
    // Update stats
    updateStats();
    
    // Initial render
    filterAndRenderQuestions();
  } catch (error) {
    console.error('Error loading past questions:', error);
    showError('Failed to load past questions. Please try again later.');
  }
}

// Filter and render questions based on current filters
function filterAndRenderQuestions() {
  // Apply filters
  filteredQuestions = allQuestions.filter(q => {
    const subjectMatch = currentSubject === 'all' || q.subject.toLowerCase() === currentSubject.toLowerCase();
    const yearMatch = currentYear === 'all' || q.year === parseInt(currentYear);
    const paperMatch = currentPaper === 'all' || q.paperType === currentPaper;
    
    return subjectMatch && yearMatch && paperMatch;
  });

  // Apply sorting
  filteredQuestions.sort((a, b) => {
    switch (currentSort) {
      case 'newest':
        return b.year - a.year;
      case 'oldest':
        return a.year - b.year;
      case 'subject':
        return a.subject.localeCompare(b.subject);
      default:
        return 0;
    }
  });

  // Render
  renderQuestions();
}

// Render questions to the grid
function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  
  if (filteredQuestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3 class="empty-title">No Questions Found</h3>
        <p class="empty-text">Try adjusting your filters to see more results.</p>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'questions-grid';
  
  filteredQuestions.forEach(question => {
    const card = createQuestionCard(question);
    grid.appendChild(card);
  });
  
  container.innerHTML = '';
  container.appendChild(grid);
}

// Create a question card element
function createQuestionCard(question) {
  const card = document.createElement('div');
  card.className = 'question-card';
  
  const paperTypeLabel = {
    'objective': 'Paper 1 - Objective',
    'theory': 'Paper 2 - Theory',
    'practical': 'Paper 3 - Practical'
  }[question.paperType] || question.paperType;
  
  card.innerHTML = `
    <div class="question-header">
      <span class="question-subject">${question.subject}</span>
      <span class="question-year">${question.year}</span>
    </div>
    <h3 class="question-title">${question.title}</h3>
    <div class="question-meta">
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        ${paperTypeLabel}
      </div>
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        ${question.duration || '3 hours'}
      </div>
      ${question.questions ? `
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        ${question.questions} questions
      </div>
      ` : ''}
    </div>
    <div class="question-actions">
      <button class="btn-download" onclick="downloadQuestion('${question.id}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Download PDF
      </button>
      <button class="btn-preview" onclick="previewQuestion('${question.id}')">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      </button>
    </div>
  `;
  
  return card;
}

// Download question PDF
async function downloadQuestion(questionId) {
  try {
    const btn = event.target.closest('.btn-download');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></span>';
    btn.disabled = true;

    // Check if the question exists and has a blobUrl
    const question = allQuestions.find(q => q.id === questionId);
    if (!question || !question.blobUrl) {
      showNotification('PDF not available for this question yet.', 'warning');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    // Redirect to proxy download route
    const token = session.token || '';
    window.location.href = `/api/waec-questions?action=download&questionId=${questionId}&download=1&token=${token}`;
    
    // Track download locally
    trackDownload(questionId);
    showNotification('Download started', 'success');

    // Restore button immediately since it's just a location change
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 1000);
  } catch (error) {
    console.error('Download error:', error);
    showNotification('Failed to download. Please try again.', 'error');
    
    // Restore button
    const btn = event.target.closest('.btn-download');
    if (btn) {
      btn.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Download PDF';
      btn.disabled = false;
    }
  }
}

// Show notification helper
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#6366f1'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    font-weight: 600;
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}


// Preview question - open PDF directly or show message
function previewQuestion(questionId) {
  const question = allQuestions.find(q => q.id === questionId);
  if (!question) {
    showNotification('Question not found', 'error');
    return;
  }

  if (question.blobUrl) {
    // Open PDF securely via proxy
    const token = session.token || '';
    window.open(`/api/waec-questions?action=download&questionId=${questionId}&token=${token}`, '_blank');
  } else {
    showNotification('PDF preview not yet available. Click Download to access when uploaded.', 'warning');
  }
}

// Track download for analytics (local only)
function trackDownload(questionId) {
  try {
    const key = 'vision_waec_downloads';
    const downloads = JSON.parse(localStorage.getItem(key) || '[]');
    downloads.push({ questionId, timestamp: new Date().toISOString() });
    if (downloads.length > 200) downloads.shift();
    localStorage.setItem(key, JSON.stringify(downloads));
  } catch (e) {}
}

// Update statistics
function updateStats() {
  const totalQuestions = allQuestions.length;
  const subjects = new Set(allQuestions.map(q => q.subject)).size;
  const years = allQuestions.map(q => q.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  document.getElementById('totalQuestions').textContent = totalQuestions;
  document.getElementById('totalSubjects').textContent = subjects;
  document.getElementById('yearRange').textContent = `${minYear}-${maxYear}`;
}

// Show loading state
function showLoading() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <div class="loading-text">Loading past questions...</div>
    </div>
  `;
}

// Show error state
function showError(message) {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3 class="empty-title">Error Loading Questions</h3>
      <p class="empty-text">${message}</p>
      <button onclick="loadPastQuestions()" style="margin-top: 1rem; padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700;">
        Try Again
      </button>
    </div>
  `;
}

// Export functions for global access
window.downloadQuestion = downloadQuestion;
window.previewQuestion = previewQuestion;
