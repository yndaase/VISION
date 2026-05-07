/* =====================================================
   TEACHER DASHBOARD JAVASCRIPT
   Classroom management functionality
   ===================================================== */

let currentSection = 'overview';
let myClasses = [];
let myStudents = [];
let teacherInfo = {};

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  loadUserSession();
  loadDashboardData();
  setupNavigation();
  updateWelcomeDate();
});

/**
 * Load user session and display info
 */
function loadUserSession() {
  const session = getSession();
  if (!session) {
    window.location.href = '/teacher-login.html';
    return;
  }

  // Update user info in header
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  const welcomeName = document.getElementById('welcomeName');
  const userSubject = document.getElementById('userSubject');
  
  if (userName) {
    userName.textContent = session.name || 'Teacher';
  }
  
  if (welcomeName) {
    welcomeName.textContent = session.name || 'Teacher';
  }
  
  if (userAvatar) {
    const initial = (session.name || 'T').charAt(0).toUpperCase();
    userAvatar.textContent = initial;
  }

  if (userSubject) {
    userSubject.textContent = session.subject || 'Subject Teacher';
  }

  // Load teacher info from localStorage
  teacherInfo = {
    name: session.name || '',
    email: session.email || '',
    subject: session.subject || '',
    school: session.schoolName || session.school || '',
    institutionId: session.institutionId || session.schoolCode || ''
  };

  // Update settings fields
  const settingsName = document.getElementById('settingsName');
  const settingsSubject = document.getElementById('settingsSubject');
  const settingsSchool = document.getElementById('settingsSchool');
  
  if (settingsName) settingsName.value = teacherInfo.name;
  if (settingsSubject) settingsSubject.value = teacherInfo.subject;
  if (settingsSchool) settingsSchool.value = teacherInfo.school;
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
 * Update welcome date
 */
function updateWelcomeDate() {
  const dateEl = document.getElementById('currentDate');
  if (!dateEl) return;

  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Load dashboard data from Firebase/localStorage
 */
async function loadDashboardData() {
  const session = getSession();
  if (!session) return;

  try {
    // Load classes for this teacher
    const classesKey = `teacher_classes_${session.email}`;
    myClasses = JSON.parse(localStorage.getItem(classesKey) || '[]');

    // Load students - filter by teacher's classes or institution
    if (typeof window.fbGetAllUsers === 'function') {
      const allUsers = await window.fbGetAllUsers();
      myStudents = allUsers.filter(u => {
        if (u.role !== 'student') return false;
        
        // If teacher has institution, filter by institution
        if (teacherInfo.institutionId) {
          return u.institutionId === teacherInfo.institutionId || 
                 u.schoolCode === teacherInfo.institutionId;
        }
        
        // Otherwise, filter by classes
        if (myClasses.length > 0) {
          return myClasses.some(cls => cls.students && cls.students.includes(u.email));
        }
        
        return false;
      });
    } else {
      // Fallback to localStorage
      const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
      myStudents = localUsers.filter(u => {
        if (u.role !== 'student') return false;
        
        if (teacherInfo.institutionId) {
          return u.institutionId === teacherInfo.institutionId || 
                 u.schoolCode === teacherInfo.institutionId;
        }
        
        if (myClasses.length > 0) {
          return myClasses.some(cls => cls.students && cls.students.includes(u.email));
        }
        
        return false;
      });
    }

    // Update UI
    updateDashboardStats();
    renderClassesGrid();
    renderStudentsTable();
    populateClassFilters();

  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  // Update counts
  document.getElementById('totalClasses').textContent = myClasses.length;
  document.getElementById('totalStudents').textContent = myStudents.length;
  document.getElementById('classCount').textContent = myClasses.length;
  document.getElementById('studentCount').textContent = myStudents.length;

  // Calculate total quizzes (placeholder)
  document.getElementById('totalQuizzes').textContent = '0';

  // Calculate average performance
  let totalPerformance = 0;
  let performanceCount = 0;

  myStudents.forEach(student => {
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
  const navItems = document.querySelectorAll('.teacher-dash-nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const section = item.dataset.section;
      if (!section) return;

      navigateToSection(section);
    });
  });
}

/**
 * Navigate to a specific section
 */
window.navigateToSection = function(section) {
  // Update active nav item
  document.querySelectorAll('.teacher-dash-nav-item').forEach(nav => nav.classList.remove('active'));
  const activeNav = document.querySelector(`.teacher-dash-nav-item[data-section="${section}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Show corresponding section
  document.querySelectorAll('.teacher-dash-section').forEach(sec => {
    sec.classList.remove('active');
  });
  
  const targetSection = document.getElementById(`section-${section}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update page title and breadcrumb
  const navItem = document.querySelector(`.teacher-dash-nav-item[data-section="${section}"]`);
  if (navItem) {
    const title = navItem.querySelector('span').textContent;
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('breadcrumb').textContent = `Dashboard / ${title}`;
  }

  currentSection = section;
}

/**
 * Render classes grid
 */
function renderClassesGrid() {
  const grid = document.getElementById('classesGrid');
  if (!grid) return;

  if (myClasses.length === 0) {
    grid.innerHTML = `
      <div class="teacher-dash-class-card-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p>No classes yet</p>
        <button class="teacher-dash-primary-btn" onclick="showCreateClassModal()">Create Your First Class</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = myClasses.map(cls => {
    const studentCount = cls.students ? cls.students.length : 0;
    return `
      <div style="padding:2rem;background:var(--bg-card);border:1px solid var(--border);border-radius:16px;transition:all 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='';this.style.boxShadow='';">
        <div style="width:48px;height:48px;background:rgba(16,185,129,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h3 style="font-size:1.25rem;font-weight:800;color:var(--text-primary);margin-bottom:0.5rem;">${cls.name}</h3>
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1.5rem;">${cls.description || 'No description'}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.85rem;color:var(--text-muted);">${studentCount} students</span>
          <button onclick="viewClass('${cls.id}')" style="padding:0.5rem 1rem;background:rgba(16,185,129,0.1);border:none;border-radius:8px;color:#10b981;font-weight:700;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(16,185,129,0.2)';" onmouseout="this.style.background='rgba(16,185,129,0.1)';">View</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render students table
 */
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (myStudents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="teacher-dash-table-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>No students found</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = myStudents.map(student => {
    const stats = JSON.parse(localStorage.getItem(`waec_stats_${student.email}`) || '{"answered":0,"correct":0}');
    const performance = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
    const className = student.class || 'Not assigned';
    
    // Get last active (placeholder)
    const lastActive = 'Today';
    
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.9rem;">
              ${(student.name || student.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);">${student.name || 'Student'}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">${student.email}</div>
            </div>
          </div>
        </td>
        <td>${className}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="flex:1;height:8px;background:rgba(16,185,129,0.1);border-radius:4px;overflow:hidden;">
              <div style="width:${performance}%;height:100%;background:linear-gradient(90deg,#10b981,#059669);"></div>
            </div>
            <span style="font-weight:700;color:var(--text-primary);">${performance}%</span>
          </div>
        </td>
        <td>${lastActive}</td>
        <td>
          <button onclick="viewStudent('${student.email}')" style="padding:0.5rem 1rem;background:rgba(16,185,129,0.1);border:none;border-radius:8px;color:#10b981;font-weight:700;cursor:pointer;">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Populate class filter dropdowns
 */
function populateClassFilters() {
  const classFilter = document.getElementById('classFilterStudents');
  if (!classFilter) return;

  // Get unique classes
  const uniqueClasses = [...new Set(myClasses.map(c => c.name))];
  
  classFilter.innerHTML = '<option value="">All Classes</option>' + 
    uniqueClasses.map(name => `<option value="${name}">${name}</option>`).join('');
}

/**
 * Filter students based on search and class
 */
window.filterStudents = function() {
  const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
  const classFilter = document.getElementById('classFilterStudents').value;

  const filtered = myStudents.filter(student => {
    const matchesSearch = !searchTerm || 
      (student.name && student.name.toLowerCase().includes(searchTerm)) ||
      student.email.toLowerCase().includes(searchTerm);
    
    const matchesClass = !classFilter || student.class === classFilter;

    return matchesSearch && matchesClass;
  });

  // Re-render with filtered data
  const originalStudents = myStudents;
  myStudents = filtered;
  renderStudentsTable();
  myStudents = originalStudents;
};

/**
 * Show create quiz modal
 */
window.showCreateQuizModal = function() {
  alert('AI-Powered Quiz Builder coming soon!\n\nYou will be able to:\n• Generate quizzes using Groq + Llama AI\n• Align to WAEC syllabus\n• Customize difficulty and topics\n• Assign to specific classes\n• Track student performance');
};

/**
 * Show create class modal
 */
window.showCreateClassModal = function() {
  const className = prompt('Enter class name (e.g., "Form 3A - Mathematics"):');
  if (!className) return;

  const description = prompt('Enter class description (optional):') || '';

  const session = getSession();
  if (!session) return;

  const newClass = {
    id: Date.now().toString(),
    name: className,
    description: description,
    teacherEmail: session.email,
    teacherName: session.name || 'Teacher',
    students: [],
    createdAt: Date.now()
  };

  // Save to localStorage
  const classesKey = `teacher_classes_${session.email}`;
  myClasses.push(newClass);
  localStorage.setItem(classesKey, JSON.stringify(myClasses));

  // Update UI
  updateDashboardStats();
  renderClassesGrid();
  populateClassFilters();

  alert(`Class "${className}" created successfully!`);
};

/**
 * View class details
 */
window.viewClass = function(id) {
  const cls = myClasses.find(c => c.id === id);
  if (!cls) return;

  alert(`Class: ${cls.name}\n\nDescription: ${cls.description || 'No description'}\nStudents: ${cls.students ? cls.students.length : 0}\n\nFull class management coming soon!`);
};

/**
 * View student details
 */
window.viewStudent = function(email) {
  const student = myStudents.find(s => s.email === email);
  if (!student) return;

  const stats = JSON.parse(localStorage.getItem(`waec_stats_${email}`) || '{"answered":0,"correct":0}');
  const performance = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  alert(`Student: ${student.name || 'Student'}\nEmail: ${email}\nClass: ${student.class || 'Not assigned'}\n\nPerformance: ${performance}%\nQuestions Answered: ${stats.answered}\nCorrect Answers: ${stats.correct}\n\nFull student profile coming soon!`);
};

/**
 * Export grades to Excel
 */
window.exportGrades = function() {
  alert('Excel Export coming soon!\n\nYou will be able to export:\n• Student grades\n• Performance reports\n• Attendance records\n• Quiz results\n\nFormat: .xlsx (Excel)');
};

/**
 * Save teacher settings
 */
window.saveTeacherSettings = function() {
  const name = document.getElementById('settingsName').value.trim();
  const subject = document.getElementById('settingsSubject').value.trim();
  const school = document.getElementById('settingsSchool').value.trim();

  if (!name) {
    alert('Please enter your name');
    return;
  }

  const session = getSession();
  if (!session) return;

  // Update session
  session.name = name;
  session.subject = subject;
  session.schoolName = school;
  
  sessionStorage.setItem('waec_session', JSON.stringify(session));
  localStorage.setItem('waec_session', JSON.stringify(session));

  // Update Firebase
  if (typeof window.fbUpdateUser === 'function') {
    window.fbUpdateUser(session.email, { 
      name: name, 
      subject: subject, 
      schoolName: school 
    });
  }

  // Update local users array
  try {
    const users = JSON.parse(localStorage.getItem('waec_users') || '[]');
    const idx = users.findIndex(u => u.email === session.email);
    if (idx !== -1) {
      users[idx].name = name;
      users[idx].subject = subject;
      users[idx].schoolName = school;
      localStorage.setItem('waec_users', JSON.stringify(users));
    }
  } catch(e) {}

  // Update UI
  document.getElementById('userName').textContent = name;
  document.getElementById('welcomeName').textContent = name;
  document.getElementById('userSubject').textContent = subject || 'Subject Teacher';

  alert('Settings saved successfully!');
};

/**
 * Handle logout
 */
window.handleLogout = function() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('waec_session');
    localStorage.removeItem('waec_session');
    window.location.href = '/teacher-login.html';
  }
};
