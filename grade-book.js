/* =====================================================
   GRADE BOOK SYSTEM - MAIN JAVASCRIPT
   Complete grade management for teachers
   ===================================================== */

// Global state
let currentUser = null;
let currentClass = null;
let assignments = [];
let categories = [];
let grades = {};
let undoStack = [];
let redoStack = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUserSession();
  loadClasses();
  setupEventListeners();
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
  
  // Update UI
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userName) userName.textContent = session.name || 'Teacher';
  if (userAvatar) {
    const initial = (session.name || 'T').charAt(0).toUpperCase();
    userAvatar.textContent = initial;
  }
}

/**
 * Get session from storage
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
 * Load classes for teacher
 */
async function loadClasses() {
  const classSelect = document.getElementById('classSelect');
  if (!classSelect) return;
  
  try {
    // Load classes from localStorage (will be migrated to Firestore later)
    const institutionId = currentUser.institutionId || currentUser.email;
    const storedClasses = JSON.parse(localStorage.getItem(`classes_${institutionId}`) || '[]');
    
    // Add default classes if none exist
    if (storedClasses.length === 0) {
      storedClasses.push(
        { id: 'form1a', name: 'Form 1A', description: 'First year class A' },
        { id: 'form2b', name: 'Form 2B', description: 'Second year class B' },
        { id: 'form3a', name: 'Form 3A', description: 'Third year class A' }
      );
      localStorage.setItem(`classes_${institutionId}`, JSON.stringify(storedClasses));
    }
    
    // Populate dropdown
    classSelect.innerHTML = '<option value="">Choose a class...</option>';
    storedClasses.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls.id;
      option.textContent = cls.name;
      classSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading classes:', error);
    showNotification('Error loading classes', 'error');
  }
}

/**
 * Load class data (assignments, grades, categories)
 */
async function loadClassData() {
  const classSelect = document.getElementById('classSelect');
  const classId = classSelect.value;
  
  if (!classId) {
    currentClass = null;
    clearAllData();
    return;
  }
  
  currentClass = classId;
  
  try {
    // Load assignments
    const storageKey = `assignments_${currentUser.email}_${classId}`;
    assignments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Load categories
    const catKey = `categories_${currentUser.email}_${classId}`;
    categories = JSON.parse(localStorage.getItem(catKey) || '[]');
    
    // Load grades
    const gradeKey = `grades_${currentUser.email}_${classId}`;
    grades = JSON.parse(localStorage.getItem(gradeKey) || '{}');
    
    // Update UI
    renderAssignments();
    renderCategories();
    updateAssignmentSelect();
    
    showNotification('Class data loaded successfully', 'success');
    
  } catch (error) {
    console.error('Error loading class data:', error);
    showNotification('Error loading class data', 'error');
  }
}

/**
 * Clear all data displays
 */
function clearAllData() {
  assignments = [];
  categories = [];
  grades = {};
  renderAssignments();
  renderCategories();
  updateAssignmentSelect();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undoLastChange();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      redoLastChange();
    }
  });
}

/**
 * Switch between tabs
 */
window.switchTab = function(tabName) {
  // Update tab buttons
  document.querySelectorAll('.gb-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.gb-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tabName}`).classList.add('active');
};

// =====================================================
// ASSIGNMENTS
// =====================================================

/**
 * Show create assignment modal
 */
window.showCreateAssignmentModal = function() {
  if (!currentClass) {
    showNotification('Please select a class first', 'warning');
    return;
  }
  
  const modal = createModal('Create Assignment', `
    <div class="gb-form-group">
      <label>Assignment Name *</label>
      <input type="text" id="assignmentName" placeholder="e.g., Chapter 5 Quiz" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="assignmentDesc" placeholder="Optional description"></textarea>
    </div>
    
    <div class="gb-form-group">
      <label>Maximum Points *</label>
      <input type="number" id="assignmentPoints" min="1" value="100" required>
    </div>
    
    <div class="gb-form-group">
      <label>Due Date</label>
      <input type="date" id="assignmentDueDate">
    </div>
    
    <div class="gb-form-group">
      <label>Assignment Type *</label>
      <select id="assignmentType">
        <option value="homework">Homework</option>
        <option value="quiz">Quiz</option>
        <option value="test">Test</option>
        <option value="project">Project</option>
        <option value="participation">Participation</option>
      </select>
    </div>
    
    <div class="gb-form-group">
      <label>Category</label>
      <select id="assignmentCategory">
        <option value="">No category</option>
        ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
      </select>
    </div>
    
    <div class="gb-form-group">
      <label>Weight (%)</label>
      <input type="number" id="assignmentWeight" min="0" max="100" value="10">
    </div>
  `, () => {
    createAssignment();
  });
  
  document.body.appendChild(modal);
};

/**
 * Create new assignment
 */
function createAssignment() {
  const name = document.getElementById('assignmentName').value.trim();
  const description = document.getElementById('assignmentDesc').value.trim();
  const maxPoints = parseFloat(document.getElementById('assignmentPoints').value);
  const dueDate = document.getElementById('assignmentDueDate').value;
  const type = document.getElementById('assignmentType').value;
  const categoryId = document.getElementById('assignmentCategory').value;
  const weight = parseFloat(document.getElementById('assignmentWeight').value);
  
  if (!name) {
    showNotification('Please enter assignment name', 'error');
    return;
  }
  
  if (!maxPoints || maxPoints <= 0) {
    showNotification('Please enter valid maximum points', 'error');
    return;
  }
  
  const assignment = {
    id: generateId(),
    name,
    description,
    maxPoints,
    dueDate,
    type,
    categoryId,
    weight,
    createdAt: Date.now(),
    createdBy: currentUser.email
  };
  
  assignments.push(assignment);
  saveAssignments();
  renderAssignments();
  updateAssignmentSelect();
  
  closeModal();
  showNotification('Assignment created successfully', 'success');
}

/**
 * Render assignments list
 */
function renderAssignments() {
  const container = document.getElementById('assignmentsList');
  if (!container) return;
  
  if (assignments.length === 0) {
    container.innerHTML = `
      <div class="gb-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>No assignments yet</p>
        <span>Create your first assignment to start grading</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = assignments.map(assignment => {
    const stats = calculateAssignmentStats(assignment.id);
    const category = categories.find(c => c.id === assignment.categoryId);
    
    return `
      <div class="gb-assignment-card">
        <div class="gb-assignment-header">
          <div class="gb-assignment-info">
            <h3>${assignment.name}</h3>
            <div class="gb-assignment-meta">
              <span>${assignment.type}</span>
              ${assignment.dueDate ? `<span>Due: ${formatDate(assignment.dueDate)}</span>` : ''}
              ${category ? `<span>${category.name}</span>` : ''}
              <span>${assignment.maxPoints} points</span>
            </div>
          </div>
          <div class="gb-assignment-actions">
            <button class="gb-icon-btn" onclick="editAssignment('${assignment.id}')" title="Edit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="gb-icon-btn" onclick="deleteAssignment('${assignment.id}')" title="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        
        <div class="gb-assignment-stats">
          <div class="gb-stat">
            <span class="gb-stat-label">Submitted</span>
            <span class="gb-stat-value">${stats.submitted}/${stats.total}</span>
          </div>
          <div class="gb-stat">
            <span class="gb-stat-label">Average</span>
            <span class="gb-stat-value">${stats.average}%</span>
          </div>
          <div class="gb-stat">
            <span class="gb-stat-label">Completion</span>
            <span class="gb-stat-value">${stats.completion}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Calculate assignment statistics
 */
function calculateAssignmentStats(assignmentId) {
  const students = getClassStudents();
  const total = students.length;
  let submitted = 0;
  let totalScore = 0;
  
  students.forEach(student => {
    const gradeKey = `${student.email}_${assignmentId}`;
    if (grades[gradeKey] && grades[gradeKey].score !== null) {
      submitted++;
      totalScore += (grades[gradeKey].score / grades[gradeKey].maxPoints) * 100;
    }
  });
  
  return {
    total,
    submitted,
    average: submitted > 0 ? Math.round(totalScore / submitted) : 0,
    completion: total > 0 ? Math.round((submitted / total) * 100) : 0
  };
}

/**
 * Save assignments to storage
 */
function saveAssignments() {
  const storageKey = `assignments_${currentUser.email}_${currentClass}`;
  localStorage.setItem(storageKey, JSON.stringify(assignments));
}

/**
 * Update assignment select dropdown
 */
function updateAssignmentSelect() {
  const select = document.getElementById('assignmentSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Choose an assignment...</option>';
  assignments.forEach(assignment => {
    const option = document.createElement('option');
    option.value = assignment.id;
    option.textContent = `${assignment.name} (${assignment.maxPoints} pts)`;
    select.appendChild(option);
  });
}

/**
 * Edit assignment
 */
window.editAssignment = function(assignmentId) {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return;
  
  const modal = createModal('Edit Assignment', `
    <div class="gb-form-group">
      <label>Assignment Name *</label>
      <input type="text" id="assignmentName" value="${assignment.name}" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="assignmentDesc">${assignment.description || ''}</textarea>
    </div>
    
    <div class="gb-form-group">
      <label>Maximum Points *</label>
      <input type="number" id="assignmentPoints" min="1" value="${assignment.maxPoints}" required>
    </div>
    
    <div class="gb-form-group">
      <label>Due Date</label>
      <input type="date" id="assignmentDueDate" value="${assignment.dueDate || ''}">
    </div>
    
    <div class="gb-form-group">
      <label>Assignment Type *</label>
      <select id="assignmentType">
        <option value="homework" ${assignment.type === 'homework' ? 'selected' : ''}>Homework</option>
        <option value="quiz" ${assignment.type === 'quiz' ? 'selected' : ''}>Quiz</option>
        <option value="test" ${assignment.type === 'test' ? 'selected' : ''}>Test</option>
        <option value="project" ${assignment.type === 'project' ? 'selected' : ''}>Project</option>
        <option value="participation" ${assignment.type === 'participation' ? 'selected' : ''}>Participation</option>
      </select>
    </div>
    
    <div class="gb-form-group">
      <label>Weight (%)</label>
      <input type="number" id="assignmentWeight" min="0" max="100" value="${assignment.weight}">
    </div>
  `, () => {
    updateAssignment(assignmentId);
  });
  
  document.body.appendChild(modal);
};

/**
 * Update assignment
 */
function updateAssignment(assignmentId) {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return;
  
  assignment.name = document.getElementById('assignmentName').value.trim();
  assignment.description = document.getElementById('assignmentDesc').value.trim();
  assignment.maxPoints = parseFloat(document.getElementById('assignmentPoints').value);
  assignment.dueDate = document.getElementById('assignmentDueDate').value;
  assignment.type = document.getElementById('assignmentType').value;
  assignment.weight = parseFloat(document.getElementById('assignmentWeight').value);
  
  saveAssignments();
  renderAssignments();
  updateAssignmentSelect();
  
  closeModal();
  showNotification('Assignment updated successfully', 'success');
}

/**
 * Delete assignment
 */
window.deleteAssignment = function(assignmentId) {
  if (!confirm('Are you sure you want to delete this assignment? All grades will be lost.')) {
    return;
  }
  
  assignments = assignments.filter(a => a.id !== assignmentId);
  
  // Remove associated grades
  Object.keys(grades).forEach(key => {
    if (key.endsWith(`_${assignmentId}`)) {
      delete grades[key];
    }
  });
  
  saveAssignments();
  saveGrades();
  renderAssignments();
  updateAssignmentSelect();
  
  showNotification('Assignment deleted successfully', 'success');
};

// Continue in next part...


// =====================================================
// GRADE ENTRY
// =====================================================

/**
 * Load grade entry interface
 */
window.loadGradeEntry = function() {
  const assignmentSelect = document.getElementById('assignmentSelect');
  const assignmentId = assignmentSelect.value;
  const container = document.getElementById('gradeTableContainer');
  
  if (!assignmentId) {
    container.innerHTML = `
      <div class="gb-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <p>Select an assignment to enter grades</p>
      </div>
    `;
    return;
  }
  
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return;
  
  const students = getClassStudents();
  
  container.innerHTML = `
    <table class="gb-grade-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Score</th>
          <th>Percentage</th>
          <th>Status</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(student => {
          const gradeKey = `${student.email}_${assignmentId}`;
          const grade = grades[gradeKey] || { score: null, status: 'not_submitted', comments: '' };
          const percentage = grade.score !== null ? Math.round((grade.score / assignment.maxPoints) * 100) : 0;
          
          return `
            <tr>
              <td>
                <div style="font-weight:700;">${student.name || student.email}</div>
                <div style="font-size:0.85rem;color:var(--text-muted);">${student.email}</div>
              </td>
              <td>
                <input 
                  type="number" 
                  class="gb-grade-input" 
                  min="0" 
                  max="${assignment.maxPoints}" 
                  step="0.5"
                  value="${grade.score !== null ? grade.score : ''}"
                  placeholder="0"
                  onchange="saveGrade('${student.email}', '${assignmentId}', this.value, ${assignment.maxPoints})"
                  onkeydown="handleGradeKeyNav(event)"
                />
                <span style="margin-left:0.5rem;color:var(--text-muted);">/ ${assignment.maxPoints}</span>
              </td>
              <td>
                <span class="gb-grade-badge ${getGradeBadgeClass(percentage)}">
                  ${percentage}%
                </span>
              </td>
              <td>
                <select 
                  onchange="updateGradeStatus('${student.email}', '${assignmentId}', this.value)"
                  style="padding:0.5rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);"
                >
                  <option value="submitted" ${grade.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                  <option value="late" ${grade.status === 'late' ? 'selected' : ''}>Late</option>
                  <option value="missing" ${grade.status === 'missing' ? 'selected' : ''}>Missing</option>
                  <option value="excused" ${grade.status === 'excused' ? 'selected' : ''}>Excused</option>
                </select>
              </td>
              <td>
                <input 
                  type="text" 
                  placeholder="Add comment..."
                  value="${grade.comments || ''}"
                  onchange="updateGradeComment('${student.email}', '${assignmentId}', this.value)"
                  style="width:200px;padding:0.5rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);"
                />
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
};

/**
 * Save individual grade
 */
window.saveGrade = function(studentEmail, assignmentId, score, maxPoints) {
  const gradeKey = `${studentEmail}_${assignmentId}`;
  const numScore = score === '' ? null : parseFloat(score);
  
  // Validation
  if (numScore !== null && (numScore < 0 || numScore > maxPoints)) {
    showNotification(`Score must be between 0 and ${maxPoints}`, 'error');
    return;
  }
  
  // Save to undo stack
  const previousGrade = grades[gradeKey] ? {...grades[gradeKey]} : null;
  undoStack.push({
    type: 'grade',
    key: gradeKey,
    previous: previousGrade,
    current: { score: numScore, maxPoints, status: 'submitted', timestamp: Date.now() }
  });
  
  // Update grade
  grades[gradeKey] = {
    score: numScore,
    maxPoints,
    status: grades[gradeKey]?.status || 'submitted',
    comments: grades[gradeKey]?.comments || '',
    timestamp: Date.now(),
    gradedBy: currentUser.email
  };
  
  saveGrades();
  loadGradeEntry(); // Refresh display
  
  showNotification('Grade saved', 'success');
};

/**
 * Update grade status
 */
window.updateGradeStatus = function(studentEmail, assignmentId, status) {
  const gradeKey = `${studentEmail}_${assignmentId}`;
  
  if (!grades[gradeKey]) {
    grades[gradeKey] = { score: null, maxPoints: 0, status, comments: '', timestamp: Date.now() };
  } else {
    grades[gradeKey].status = status;
    grades[gradeKey].timestamp = Date.now();
  }
  
  saveGrades();
  showNotification('Status updated', 'success');
};

/**
 * Update grade comment
 */
window.updateGradeComment = function(studentEmail, assignmentId, comment) {
  const gradeKey = `${studentEmail}_${assignmentId}`;
  
  if (!grades[gradeKey]) {
    grades[gradeKey] = { score: null, maxPoints: 0, status: 'not_submitted', comments: comment, timestamp: Date.now() };
  } else {
    grades[gradeKey].comments = comment;
    grades[gradeKey].timestamp = Date.now();
  }
  
  saveGrades();
};

/**
 * Handle keyboard navigation in grade entry
 */
window.handleGradeKeyNav = function(event) {
  if (event.key === 'Enter' || event.key === 'Tab') {
    const inputs = Array.from(document.querySelectorAll('.gb-grade-input'));
    const currentIndex = inputs.indexOf(event.target);
    
    if (currentIndex < inputs.length - 1) {
      event.preventDefault();
      inputs[currentIndex + 1].focus();
      inputs[currentIndex + 1].select();
    }
  }
};

/**
 * Get grade badge class based on percentage
 */
function getGradeBadgeClass(percentage) {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage > 0) return 'poor';
  return 'missing';
}

/**
 * Save grades to storage
 */
function saveGrades() {
  const gradeKey = `grades_${currentUser.email}_${currentClass}`;
  localStorage.setItem(gradeKey, JSON.stringify(grades));
}

/**
 * Toggle bulk entry mode
 */
window.toggleBulkEntry = function() {
  showNotification('Bulk entry mode coming soon!', 'info');
};

/**
 * Undo last change
 */
window.undoLastChange = function() {
  if (undoStack.length === 0) {
    showNotification('Nothing to undo', 'info');
    return;
  }
  
  const change = undoStack.pop();
  redoStack.push(change);
  
  if (change.type === 'grade') {
    if (change.previous) {
      grades[change.key] = change.previous;
    } else {
      delete grades[change.key];
    }
    saveGrades();
    loadGradeEntry();
  }
  
  showNotification('Undo successful', 'success');
};

/**
 * Redo last undone change
 */
window.redoLastChange = function() {
  if (redoStack.length === 0) {
    showNotification('Nothing to redo', 'info');
    return;
  }
  
  const change = redoStack.pop();
  undoStack.push(change);
  
  if (change.type === 'grade') {
    grades[change.key] = change.current;
    saveGrades();
    loadGradeEntry();
  }
  
  showNotification('Redo successful', 'success');
};

// =====================================================
// CATEGORIES
// =====================================================

/**
 * Show create category modal
 */
window.showCreateCategoryModal = function() {
  if (!currentClass) {
    showNotification('Please select a class first', 'warning');
    return;
  }
  
  const modal = createModal('Create Category', `
    <div class="gb-form-group">
      <label>Category Name *</label>
      <input type="text" id="categoryName" placeholder="e.g., Tests" required>
    </div>
    
    <div class="gb-form-group">
      <label>Weight (%) *</label>
      <input type="number" id="categoryWeight" min="0" max="100" value="25" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="categoryDesc" placeholder="Optional description"></textarea>
    </div>
  `, () => {
    createCategory();
  });
  
  document.body.appendChild(modal);
};

/**
 * Create new category
 */
function createCategory() {
  const name = document.getElementById('categoryName').value.trim();
  const weight = parseFloat(document.getElementById('categoryWeight').value);
  const description = document.getElementById('categoryDesc').value.trim();
  
  if (!name) {
    showNotification('Please enter category name', 'error');
    return;
  }
  
  if (!weight || weight < 0 || weight > 100) {
    showNotification('Weight must be between 0 and 100', 'error');
    return;
  }
  
  // Check total weight
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0) + weight;
  if (totalWeight > 100) {
    showNotification(`Total weight would exceed 100% (currently ${totalWeight}%)`, 'error');
    return;
  }
  
  const category = {
    id: generateId(),
    name,
    weight,
    description,
    createdAt: Date.now()
  };
  
  categories.push(category);
  saveCategories();
  renderCategories();
  
  closeModal();
  showNotification('Category created successfully', 'success');
}

/**
 * Render categories list
 */
function renderCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;
  
  if (categories.length === 0) {
    container.innerHTML = `
      <div class="gb-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <p>No categories defined</p>
        <span>Create categories to organize assignments by type</span>
      </div>
    `;
    return;
  }
  
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  
  container.innerHTML = `
    <div style="padding:1rem;background:var(--bg-secondary);border-radius:12px;margin-bottom:1rem;">
      <strong>Total Weight:</strong> ${totalWeight}% ${totalWeight !== 100 ? '⚠️ Should equal 100%' : '✅'}
    </div>
    
    ${categories.map(category => {
      const assignmentCount = assignments.filter(a => a.categoryId === category.id).length;
      
      return `
        <div class="gb-category-card">
          <div class="gb-category-header">
            <div class="gb-category-info">
              <h3>${category.name}</h3>
              <p style="font-size:0.9rem;color:var(--text-muted);margin:0.25rem 0 0 0;">
                ${category.description || 'No description'}
              </p>
              <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.5rem 0 0 0;">
                ${assignmentCount} assignment${assignmentCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div class="gb-category-weight">${category.weight}%</div>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:1rem;">
            <button class="gb-btn-secondary" onclick="editCategory('${category.id}')">Edit</button>
            <button class="gb-btn-secondary" onclick="deleteCategory('${category.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

/**
 * Edit category
 */
window.editCategory = function(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return;
  
  const modal = createModal('Edit Category', `
    <div class="gb-form-group">
      <label>Category Name *</label>
      <input type="text" id="categoryName" value="${category.name}" required>
    </div>
    
    <div class="gb-form-group">
      <label>Weight (%) *</label>
      <input type="number" id="categoryWeight" min="0" max="100" value="${category.weight}" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="categoryDesc">${category.description || ''}</textarea>
    </div>
  `, () => {
    updateCategory(categoryId);
  });
  
  document.body.appendChild(modal);
};

/**
 * Update category
 */
function updateCategory(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  if (!category) return;
  
  const oldWeight = category.weight;
  const newWeight = parseFloat(document.getElementById('categoryWeight').value);
  
  // Check total weight
  const totalWeight = categories.reduce((sum, cat) => sum + (cat.id === categoryId ? 0 : cat.weight), 0) + newWeight;
  if (totalWeight > 100) {
    showNotification(`Total weight would exceed 100% (currently ${totalWeight}%)`, 'error');
    return;
  }
  
  category.name = document.getElementById('categoryName').value.trim();
  category.weight = newWeight;
  category.description = document.getElementById('categoryDesc').value.trim();
  
  saveCategories();
  renderCategories();
  
  closeModal();
  showNotification('Category updated successfully', 'success');
}

/**
 * Delete category
 */
window.deleteCategory = function(categoryId) {
  const assignmentCount = assignments.filter(a => a.categoryId === categoryId).length;
  
  if (assignmentCount > 0) {
    if (!confirm(`This category has ${assignmentCount} assignment(s). Delete anyway?`)) {
      return;
    }
  }
  
  categories = categories.filter(c => c.id !== categoryId);
  
  // Remove category from assignments
  assignments.forEach(a => {
    if (a.categoryId === categoryId) {
      a.categoryId = '';
    }
  });
  
  saveCategories();
  saveAssignments();
  renderCategories();
  renderAssignments();
  
  showNotification('Category deleted successfully', 'success');
};

/**
 * Save categories to storage
 */
function saveCategories() {
  const catKey = `categories_${currentUser.email}_${currentClass}`;
  localStorage.setItem(catKey, JSON.stringify(categories));
}

// Continue in next part...


// =====================================================
// REPORTS & ANALYTICS
// =====================================================

/**
 * Generate and display reports
 */
function generateReports() {
  const container = document.getElementById('reportsGrid');
  if (!container) return;
  
  if (assignments.length === 0) {
    container.innerHTML = `
      <div class="gb-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>
        <p>No data to display</p>
        <span>Add assignments and grades to see reports</span>
      </div>
    `;
    return;
  }
  
  const students = getClassStudents();
  const classStats = calculateClassStatistics(students);
  
  container.innerHTML = `
    <!-- Class Overview -->
    <div class="gb-report-card">
      <h3>Class Overview</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1.5rem;">
        <div class="gb-stat">
          <span class="gb-stat-label">Total Students</span>
          <span class="gb-stat-value">${students.length}</span>
        </div>
        <div class="gb-stat">
          <span class="gb-stat-label">Class Average</span>
          <span class="gb-stat-value">${classStats.average}%</span>
        </div>
        <div class="gb-stat">
          <span class="gb-stat-label">Median</span>
          <span class="gb-stat-value">${classStats.median}%</span>
        </div>
        <div class="gb-stat">
          <span class="gb-stat-label">Highest</span>
          <span class="gb-stat-value">${classStats.highest}%</span>
        </div>
        <div class="gb-stat">
          <span class="gb-stat-label">Lowest</span>
          <span class="gb-stat-value">${classStats.lowest}%</span>
        </div>
      </div>
    </div>
    
    <!-- Grade Distribution -->
    <div class="gb-report-card">
      <h3>Grade Distribution</h3>
      <div style="display:grid;gap:0.75rem;">
        ${generateGradeDistribution(classStats.distribution)}
      </div>
    </div>
    
    <!-- Student Performance -->
    <div class="gb-report-card">
      <h3>Student Performance</h3>
      <table class="gb-grade-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Overall Grade</th>
            <th>Assignments Completed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => {
            const studentGrade = calculateStudentOverallGrade(student.email);
            return `
              <tr>
                <td>
                  <div style="font-weight:700;">${student.name || student.email}</div>
                </td>
                <td>
                  <span class="gb-grade-badge ${getGradeBadgeClass(studentGrade.percentage)}">
                    ${studentGrade.percentage}% (${studentGrade.letterGrade})
                  </span>
                </td>
                <td>${studentGrade.completed}/${assignments.length}</td>
                <td>
                  ${studentGrade.percentage >= 60 ? 
                    '<span style="color:#10b981;">✓ Passing</span>' : 
                    '<span style="color:#ef4444;">⚠ At Risk</span>'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Assignment Statistics -->
    <div class="gb-report-card">
      <h3>Assignment Statistics</h3>
      <table class="gb-grade-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Average</th>
            <th>Completion</th>
            <th>Late</th>
          </tr>
        </thead>
        <tbody>
          ${assignments.map(assignment => {
            const stats = calculateAssignmentStats(assignment.id);
            const lateCount = countLateSubmissions(assignment.id);
            return `
              <tr>
                <td>${assignment.name}</td>
                <td>
                  <span class="gb-grade-badge ${getGradeBadgeClass(stats.average)}">
                    ${stats.average}%
                  </span>
                </td>
                <td>${stats.completion}%</td>
                <td>${lateCount}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Calculate class statistics
 */
function calculateClassStatistics(students) {
  const grades = students.map(student => {
    return calculateStudentOverallGrade(student.email).percentage;
  }).filter(g => g > 0);
  
  if (grades.length === 0) {
    return {
      average: 0,
      median: 0,
      highest: 0,
      lowest: 0,
      distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
    };
  }
  
  grades.sort((a, b) => a - b);
  
  const distribution = {
    A: grades.filter(g => g >= 90).length,
    B: grades.filter(g => g >= 80 && g < 90).length,
    C: grades.filter(g => g >= 70 && g < 80).length,
    D: grades.filter(g => g >= 60 && g < 70).length,
    F: grades.filter(g => g < 60).length
  };
  
  return {
    average: Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length),
    median: Math.round(grades[Math.floor(grades.length / 2)]),
    highest: Math.round(Math.max(...grades)),
    lowest: Math.round(Math.min(...grades)),
    distribution
  };
}

/**
 * Generate grade distribution HTML
 */
function generateGradeDistribution(distribution) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  return Object.entries(distribution).map(([grade, count]) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const colors = {
      A: '#10b981',
      B: '#3b82f6',
      C: '#f59e0b',
      D: '#f97316',
      F: '#ef4444'
    };
    
    return `
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:40px;font-weight:800;color:var(--text-primary);">${grade}</div>
        <div style="flex:1;height:32px;background:rgba(0,0,0,0.1);border-radius:8px;overflow:hidden;">
          <div style="width:${percentage}%;height:100%;background:${colors[grade]};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.85rem;">
            ${count > 0 ? count : ''}
          </div>
        </div>
        <div style="width:60px;text-align:right;font-weight:700;color:var(--text-secondary);">${percentage}%</div>
      </div>
    `;
  }).join('');
}

/**
 * Calculate student overall grade
 */
function calculateStudentOverallGrade(studentEmail) {
  let totalPoints = 0;
  let earnedPoints = 0;
  let completed = 0;
  
  assignments.forEach(assignment => {
    const gradeKey = `${studentEmail}_${assignment.id}`;
    const grade = grades[gradeKey];
    
    if (grade && grade.score !== null && grade.status !== 'excused') {
      totalPoints += assignment.maxPoints;
      earnedPoints += grade.score;
      completed++;
    }
  });
  
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const letterGrade = getLetterGrade(percentage);
  
  return {
    percentage,
    letterGrade,
    completed,
    totalPoints,
    earnedPoints
  };
}

/**
 * Get letter grade from percentage
 */
function getLetterGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Count late submissions for assignment
 */
function countLateSubmissions(assignmentId) {
  let count = 0;
  Object.keys(grades).forEach(key => {
    if (key.endsWith(`_${assignmentId}`) && grades[key].status === 'late') {
      count++;
    }
  });
  return count;
}

/**
 * Export to Excel
 */
window.exportToExcel = function() {
  if (!currentClass) {
    showNotification('Please select a class first', 'warning');
    return;
  }
  
  const students = getClassStudents();
  
  // Create CSV content
  let csv = 'Student Name,Email';
  assignments.forEach(a => csv += `,${a.name} (${a.maxPoints})`);
  csv += ',Overall Grade,Letter Grade\n';
  
  students.forEach(student => {
    csv += `"${student.name || student.email}","${student.email}"`;
    
    assignments.forEach(assignment => {
      const gradeKey = `${student.email}_${assignment.id}`;
      const grade = grades[gradeKey];
      csv += `,${grade && grade.score !== null ? grade.score : ''}`;
    });
    
    const overall = calculateStudentOverallGrade(student.email);
    csv += `,${overall.percentage}%,${overall.letterGrade}\n`;
  });
  
  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gradebook_${currentClass}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Exported to CSV successfully', 'success');
};

/**
 * Print reports
 */
window.printReports = function() {
  window.print();
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get students in current class
 */
function getClassStudents() {
  const institutionId = currentUser.institutionId || currentUser.email;
  const allUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
  
  // Filter students for this institution
  return allUsers.filter(u => {
    const isStudent = u.role === 'enterprise-student' || u.role === 'student';
    const matchesInstitution = u.institutionId === institutionId || u.schoolCode === institutionId;
    return isStudent && matchesInstitution;
  });
}

/**
 * Create modal dialog
 */
function createModal(title, content, onSave) {
  const modal = document.createElement('div');
  modal.className = 'gb-modal';
  modal.innerHTML = `
    <div class="gb-modal-content">
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
  
  // Add save handler
  setTimeout(() => {
    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn && onSave) {
      saveBtn.onclick = onSave;
    }
  }, 0);
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  return modal;
}

/**
 * Close modal
 */
window.closeModal = function() {
  const modal = document.querySelector('.gb-modal');
  if (modal) {
    modal.remove();
  }
};

/**
 * Show create class modal
 */
window.showCreateClassModal = function() {
  const modal = createModal('Create Class', `
    <div class="gb-form-group">
      <label>Class Name *</label>
      <input type="text" id="className" placeholder="e.g., Form 1A" required>
    </div>
    
    <div class="gb-form-group">
      <label>Description</label>
      <textarea id="classDesc" placeholder="Optional description"></textarea>
    </div>
  `, () => {
    createClass();
  });
  
  document.body.appendChild(modal);
};

/**
 * Create new class
 */
function createClass() {
  const name = document.getElementById('className').value.trim();
  const description = document.getElementById('classDesc').value.trim();
  
  if (!name) {
    showNotification('Please enter class name', 'error');
    return;
  }
  
  const institutionId = currentUser.institutionId || currentUser.email;
  const storedClasses = JSON.parse(localStorage.getItem(`classes_${institutionId}`) || '[]');
  
  const newClass = {
    id: generateId(),
    name,
    description,
    createdAt: Date.now(),
    createdBy: currentUser.email
  };
  
  storedClasses.push(newClass);
  localStorage.setItem(`classes_${institutionId}`, JSON.stringify(storedClasses));
  
  loadClasses();
  closeModal();
  showNotification('Class created successfully', 'success');
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Show notification
 */
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

// Auto-generate reports when switching to reports tab
const reportsTab = document.querySelector('[data-tab="reports"]');
if (reportsTab) {
  reportsTab.addEventListener('click', () => {
    setTimeout(generateReports, 100);
  });
}
