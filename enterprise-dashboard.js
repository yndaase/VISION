/* =====================================================
   ENTERPRISE DASHBOARD JAVASCRIPT
   School administration functionality
   ===================================================== */

let currentSection = 'overview';
let students = [];
let teachers = [];
let classes = [];

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  loadUserSession();
  loadDashboardData();
  setupNavigation();
  setupEventListeners();
});

/**
 * Load user session and display info
 */
function loadUserSession() {
  const session = getSession();
  if (!session) {
    window.location.href = '/enterprise-login.html';
    return;
  }

  // Update user info in header
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userName) {
    userName.textContent = session.name || 'Administrator';
  }
  
  if (userAvatar) {
    const initial = (session.name || 'A').charAt(0).toUpperCase();
    userAvatar.textContent = initial;
  }

  // Update school name
  const schoolName = document.getElementById('schoolName');
  if (schoolName && session.schoolName) {
    schoolName.textContent = session.schoolName;
  }

  // Update settings fields
  const settingsSchoolName = document.getElementById('settingsSchoolName');
  const settingsInstitutionCode = document.getElementById('settingsInstitutionCode');
  
  if (settingsSchoolName && session.schoolName) {
    settingsSchoolName.value = session.schoolName;
  }
  
  if (settingsInstitutionCode && session.institutionId) {
    settingsInstitutionCode.value = session.institutionId;
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
 * Load dashboard data from Firebase/localStorage
 */
async function loadDashboardData() {
  const session = getSession();
  if (!session) return;

  console.log('[Enterprise Dashboard] Loading data for institution:', session.institutionId);

  try {
    // Load students from Firestore
    if (typeof window.fbGetAllUsers === 'function') {
      console.log('[Enterprise Dashboard] Fetching all users from Firestore...');
      const allUsers = await window.fbGetAllUsers();
      console.log('[Enterprise Dashboard] Total users fetched:', allUsers.length);
      
      // Filter enterprise students for this institution
      students = allUsers.filter(u => {
        const isEnterpriseStudent = u.role === 'enterprise-student';
        const matchesInstitution = u.institutionId === session.institutionId || u.schoolCode === session.institutionId;
        return isEnterpriseStudent && matchesInstitution;
      });
      
      console.log('[Enterprise Dashboard] Enterprise students found:', students.length);
    } else {
      console.log('[Enterprise Dashboard] Firebase not available, using localStorage fallback');
      // Fallback to localStorage
      const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
      students = localUsers.filter(u => 
        u.role === 'enterprise-student' && 
        (u.institutionId === session.institutionId || u.schoolCode === session.institutionId)
      );
    }

    // Load teachers from Firestore
    if (typeof window.fbGetAllUsers === 'function') {
      const allUsers = await window.fbGetAllUsers();
      
      // Filter teachers for this institution
      teachers = allUsers.filter(u => {
        const isTeacher = u.role === 'teacher' || u.role === 'enterprise';
        const matchesInstitution = u.institutionId === session.institutionId || u.schoolCode === session.institutionId;
        return isTeacher && matchesInstitution;
      });
      
      console.log('[Enterprise Dashboard] Teachers found:', teachers.length);
    } else {
      const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
      teachers = localUsers.filter(u => 
        (u.role === 'teacher' || u.role === 'enterprise') && 
        (u.institutionId === session.institutionId || u.schoolCode === session.institutionId)
      );
    }

    // Load classes from localStorage (will be migrated to Firestore later)
    const institutionClasses = JSON.parse(localStorage.getItem(`classes_${session.institutionId}`) || '[]');
    classes = institutionClasses;
    console.log('[Enterprise Dashboard] Classes found:', classes.length);

    // Update UI
    updateDashboardStats();
    renderStudentsTable();
    renderTeachersTable();
    renderClassesGrid();

  } catch (error) {
    console.error('[Enterprise Dashboard] Error loading dashboard data:', error);
    
    // Show error message to user
    showErrorNotification('Failed to load dashboard data. Please refresh the page.');
  }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  // Update counts
  document.getElementById('totalStudents').textContent = students.length;
  document.getElementById('totalTeachers').textContent = teachers.length;
  document.getElementById('totalClasses').textContent = classes.length;
  document.getElementById('studentCount').textContent = students.length;
  document.getElementById('teacherCount').textContent = teachers.length;

  // Calculate average performance
  let totalPerformance = 0;
  let performanceCount = 0;

  students.forEach(student => {
    const stats = JSON.parse(localStorage.getItem(`waec_stats_${student.email}`) || '{"answered":0,"correct":0}');
    if (stats.answered > 0) {
      const performance = (stats.correct / stats.answered) * 100;
      totalPerformance += performance;
      performanceCount++;
    }
  });

  const avgPerformance = performanceCount > 0 ? Math.round(totalPerformance / performanceCount) : 0;
  document.getElementById('avgPerformance').textContent = avgPerformance + '%';
}

/**
 * Setup navigation between sections
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.ent-dash-nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const section = item.dataset.section;
      if (!section) return;

      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show corresponding section
      document.querySelectorAll('.ent-dash-section').forEach(sec => {
        sec.classList.remove('active');
      });
      
      const targetSection = document.getElementById(`section-${section}`);
      if (targetSection) {
        targetSection.classList.add('active');
      }

      // Update page title and breadcrumb
      const title = item.querySelector('span').textContent;
      document.getElementById('pageTitle').textContent = title;
      document.getElementById('breadcrumb').textContent = `Dashboard / ${title}`;

      currentSection = section;
    });
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add event listeners for future functionality
}

/**
 * Render students table
 */
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="ent-dash-table-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>No students found</p>
          <button class="ent-dash-primary-btn" onclick="showAddStudentModal()">Add Your First Student</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(student => {
    const stats = JSON.parse(localStorage.getItem(`waec_stats_${student.email}`) || '{"answered":0,"correct":0}');
    const performance = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
    
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.9rem;">
              ${(student.name || student.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);">${student.name || 'Student'}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">${student.email}</div>
            </div>
          </div>
        </td>
        <td>${student.class || 'Not assigned'}</td>
        <td>${student.email}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="flex:1;height:8px;background:rgba(99,102,241,0.1);border-radius:4px;overflow:hidden;">
              <div style="width:${performance}%;height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);"></div>
            </div>
            <span style="font-weight:700;color:var(--text-primary);">${performance}%</span>
          </div>
        </td>
        <td>
          <span style="padding:0.25rem 0.75rem;background:rgba(16,185,129,0.1);color:#10b981;border-radius:6px;font-size:0.8rem;font-weight:700;">Active</span>
        </td>
        <td>
          <button onclick="viewStudent('${student.email}')" style="padding:0.5rem 1rem;background:rgba(99,102,241,0.1);border:none;border-radius:8px;color:#6366f1;font-weight:700;cursor:pointer;">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Render teachers table
 */
function renderTeachersTable() {
  const tbody = document.getElementById('teachersTableBody');
  if (!tbody) return;

  if (teachers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="ent-dash-table-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <p>No teachers found</p>
          <button class="ent-dash-primary-btn" onclick="showAddTeacherModal()">Add Your First Teacher</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = teachers.map(teacher => {
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.9rem;">
              ${(teacher.name || teacher.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);">${teacher.name || 'Teacher'}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">${teacher.email}</div>
            </div>
          </div>
        </td>
        <td>${teacher.subject || 'Not assigned'}</td>
        <td>${teacher.email}</td>
        <td>${teacher.classes || 0} classes</td>
        <td>
          <span style="padding:0.25rem 0.75rem;background:rgba(16,185,129,0.1);color:#10b981;border-radius:6px;font-size:0.8rem;font-weight:700;">Active</span>
        </td>
        <td>
          <button onclick="viewTeacher('${teacher.email}')" style="padding:0.5rem 1rem;background:rgba(16,185,129,0.1);border:none;border-radius:8px;color:#10b981;font-weight:700;cursor:pointer;">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Render classes grid
 */
function renderClassesGrid() {
  const grid = document.getElementById('classesGrid');
  if (!grid) return;

  if (classes.length === 0) {
    grid.innerHTML = `
      <div class="ent-dash-class-card-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p>No classes created yet</p>
        <button class="ent-dash-primary-btn" onclick="showCreateClassModal()">Create Your First Class</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = classes.map(cls => {
    return `
      <div style="padding:2rem;background:var(--bg-card);border:1px solid var(--border);border-radius:16px;">
        <h3 style="font-size:1.25rem;font-weight:800;color:var(--text-primary);margin-bottom:0.5rem;">${cls.name}</h3>
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1.5rem;">${cls.description || 'No description'}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.85rem;color:var(--text-muted);">${cls.students || 0} students</span>
          <button onclick="viewClass('${cls.id}')" style="padding:0.5rem 1rem;background:rgba(99,102,241,0.1);border:none;border-radius:8px;color:#6366f1;font-weight:700;cursor:pointer;">View</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Filter students based on search and class
 */
window.filterStudents = function() {
  const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
  const classFilter = document.getElementById('classFilter').value;

  const filtered = students.filter(student => {
    const matchesSearch = !searchTerm || 
      (student.name && student.name.toLowerCase().includes(searchTerm)) ||
      student.email.toLowerCase().includes(searchTerm);
    
    const matchesClass = !classFilter || student.class === classFilter;

    return matchesSearch && matchesClass;
  });

  // Re-render with filtered data
  const originalStudents = students;
  students = filtered;
  renderStudentsTable();
  students = originalStudents;
};

/**
 * Export students to Excel
 */
window.exportStudents = function() {
  alert('Excel export feature coming soon! This will download a spreadsheet with all student data.');
};

/**
 * Export all data
 */
window.exportData = function() {
  alert('Data export feature coming soon! This will download all institutional data.');
};

/**
 * Show add student modal
 */
window.showAddStudentModal = function() {
  alert('Add student modal coming soon! You will be able to add students individually or bulk import from Excel.');
};

/**
 * Show add teacher modal
 */
window.showAddTeacherModal = function() {
  alert('Add teacher modal coming soon! You will be able to invite teachers via email.');
};

/**
 * Show create class modal
 */
window.showCreateClassModal = function() {
  alert('Create class modal coming soon! You will be able to create classes and assign teachers.');
};

/**
 * View student details
 */
window.viewStudent = function(email) {
  alert(`View student details for: ${email}\n\nFull student profile coming soon!`);
};

/**
 * View teacher details
 */
window.viewTeacher = function(email) {
  alert(`View teacher details for: ${email}\n\nFull teacher profile coming soon!`);
};

/**
 * View class details
 */
window.viewClass = function(id) {
  alert(`View class details for ID: ${id}\n\nFull class management coming soon!`);
};

/**
 * Save school settings
 */
window.saveSchoolSettings = function() {
  const schoolName = document.getElementById('settingsSchoolName').value;
  
  if (!schoolName) {
    alert('Please enter a school name');
    return;
  }

  const session = getSession();
  if (!session) return;

  // Update session
  session.schoolName = schoolName;
  sessionStorage.setItem('waec_session', JSON.stringify(session));
  localStorage.setItem('waec_session', JSON.stringify(session));

  // Update Firebase
  if (typeof window.fbUpdateUser === 'function') {
    window.fbUpdateUser(session.email, { schoolName: schoolName });
  }

  // Update UI
  document.getElementById('schoolName').textContent = schoolName;

  alert('School settings saved successfully!');
};

/**
 * Save branding settings
 */
window.saveBrandingSettings = function() {
  alert('Branding settings will be saved! Logo upload and color customization coming soon.');
};

/**
 * Handle logout
 */
window.handleLogout = function() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('waec_session');
    localStorage.removeItem('waec_session');
    window.location.href = '/enterprise-login.html';
  }
};

/**
 * Show error notification
 */
function showErrorNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
