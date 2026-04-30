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
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) {
      alert('Question not found');
      return;
    }

    // Show loading state
    const btn = event.target.closest('.btn-download');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Downloading...';
    btn.disabled = true;

    // Fetch download URL from API
    const response = await fetch(`/api/waec-questions?questionId=${questionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.token || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    const data = await response.json();
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = data.downloadUrl;
    link.download = `${question.subject}_${question.year}_${question.paperType}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Restore button
    btn.innerHTML = originalText;
    btn.disabled = false;

    // Track download analytics
    trackDownload(questionId);
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download. Please try again.');
    
    // Restore button
    const btn = event.target.closest('.btn-download');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Preview question
function previewQuestion(questionId) {
  const question = allQuestions.find(q => q.id === questionId);
  if (!question) {
    alert('Question not found');
    return;
  }

  // Open preview in new window/tab
  window.open(`/preview-question?id=${questionId}`, '_blank');
}

// Track download for analytics
async function trackDownload(questionId) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token || ''}`
      },
      body: JSON.stringify({
        event: 'question_download',
        questionId: questionId,
        userId: session.uid,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
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
