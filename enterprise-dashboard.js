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
 * Refresh dashboard data (can be called manually)
 */
window.refreshDashboard = async function() {
  console.log('[Enterprise Dashboard] Manual refresh triggered');
  await loadDashboardData();
  console.log('[Enterprise Dashboard] Refresh complete');
};

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
  console.log('[Enterprise Dashboard] Session schoolCode:', session.schoolCode);

  try {
    let allUsers = [];
    
    // Load all users from Firestore (fetch once)
    if (typeof window.fbGetAllUsers === 'function') {
      console.log('[Enterprise Dashboard] Fetching all users from Firestore...');
      allUsers = await window.fbGetAllUsers();
      console.log('[Enterprise Dashboard] Total users fetched:', allUsers.length);
      console.log('[Enterprise Dashboard] Sample users:', allUsers.slice(0, 3).map(u => ({ email: u.email, role: u.role, institutionId: u.institutionId })));
    } else {
      console.log('[Enterprise Dashboard] Firebase not available, using localStorage fallback');
      // Fallback to localStorage
      allUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
      console.log('[Enterprise Dashboard] Total users from localStorage:', allUsers.length);
    }

    // Filter enterprise students for this institution
    students = allUsers.filter(u => {
      const isEnterpriseStudent = u.role === 'enterprise-student';
      const matchesInstitution = u.institutionId === session.institutionId || u.schoolCode === session.institutionId;
      
      if (isEnterpriseStudent) {
        console.log('[Enterprise Dashboard] Student check:', {
          email: u.email,
          role: u.role,
          institutionId: u.institutionId,
          schoolCode: u.schoolCode,
          matches: matchesInstitution
        });
      }
      
      return isEnterpriseStudent && matchesInstitution;
    });
    
    console.log('[Enterprise Dashboard] ✅ Enterprise students found:', students.length);

    // Filter teachers for this institution
    teachers = allUsers.filter(u => {
      const isTeacher = u.role === 'teacher';
      const isEnterpriseAdmin = u.role === 'enterprise';
      const matchesInstitution = u.institutionId === session.institutionId || u.schoolCode === session.institutionId;
      
      if (isTeacher || isEnterpriseAdmin) {
        console.log('[Enterprise Dashboard] Teacher/Admin check:', {
          email: u.email,
          role: u.role,
          institutionId: u.institutionId,
          schoolCode: u.schoolCode,
          matches: matchesInstitution
        });
      }
      
      return (isTeacher || isEnterpriseAdmin) && matchesInstitution;
    });
    
    console.log('[Enterprise Dashboard] ✅ Teachers found:', teachers.length);

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
window.showAddStudentModal = async function() {
  const session = getSession();
  if (!session || !session.institutionId) {
    alert('Error: Institution information not found. Please log out and log back in.');
    return;
  }

  const name = prompt('Enter student full name:');
  if (!name || name.trim().length < 2) {
    if (name !== null) alert('Please enter a valid name (at least 2 characters)');
    return;
  }

  const email = prompt('Enter student email address:');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (email !== null) alert('Please enter a valid email address');
    return;
  }

  const password = prompt('Enter temporary password for student (min 6 characters):');
  if (!password || password.length < 6) {
    if (password !== null) alert('Password must be at least 6 characters');
    return;
  }

  const studentClass = prompt('Enter student class (e.g., Form 3A):') || 'Not assigned';

  // Show loading
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    padding: 2rem 3rem;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    text-align: center;
    font-weight: 700;
    color: var(--text-primary);
  `;
  loadingMsg.innerHTML = `
    <div style="margin-bottom:1rem;">Creating student account...</div>
    <div style="width:40px;height:40px;border:4px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;margin:0 auto;animation:spin 1s linear infinite;"></div>
  `;
  document.body.appendChild(loadingMsg);

  try {
    // Check if user already exists
    if (typeof window.fbGetUser === 'function') {
      const existing = await window.fbGetUser(email.toLowerCase());
      if (existing) {
        loadingMsg.remove();
        alert('Error: A user with this email already exists.');
        return;
      }
    }

    // Hash password
    const hash = await sha256(password);

    // Create student object
    const newStudent = {
      name: name.trim(),
      email: email.toLowerCase(),
      emailLower: email.toLowerCase(),
      hash: hash,
      role: 'enterprise-student',
      institutionId: session.institutionId,
      institutionName: session.schoolName || 'Institution',
      schoolCode: session.schoolCode || session.institutionId,
      class: studentClass,
      provider: 'email',
      createdAt: Date.now(),
      status: 'active',
      isVerified: false,
      twoFAEnabled: false,
      lastUpdated: new Date().toISOString()
    };

    console.log('[Enterprise] Creating student:', newStudent);

    // 1. Create Firebase Auth account
    if (typeof window.fbSignUp === 'function') {
      const authResult = await window.fbSignUp(email.toLowerCase(), password);
      if (!authResult || !authResult.success) {
        console.warn('[Enterprise] Firebase Auth creation failed:', authResult?.error);
      }
    }

    // 2. Wait for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Save to Firestore
    if (typeof window.fbSaveUser === 'function') {
      await window.fbSaveUser(newStudent);
      console.log('[Enterprise] ✅ Student saved to Firestore');
    }

    // 4. Update local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    localUsers.push(newStudent);
    localStorage.setItem('waec_users', JSON.stringify(localUsers));

    // 5. Reload dashboard data to refresh from Firestore
    console.log('[Enterprise] Reloading dashboard data...');
    await loadDashboardData();

    loadingMsg.remove();
    
    alert(`✅ Student account created successfully!\n\n` +
          `Name: ${newStudent.name}\n` +
          `Email: ${newStudent.email}\n` +
          `Class: ${newStudent.class}\n` +
          `Password: ${password}\n\n` +
          `📧 Share these credentials with the student.`);

  } catch (error) {
    loadingMsg.remove();
    console.error('[Enterprise] Error creating student:', error);
    alert('Error creating student account: ' + error.message);
  }
};

/**
 * Show add teacher modal
 */
window.showAddTeacherModal = async function() {
  const session = getSession();
  if (!session || !session.institutionId) {
    alert('Error: Institution information not found. Please log out and log back in.');
    return;
  }

  const name = prompt('Enter teacher full name:');
  if (!name || name.trim().length < 2) {
    if (name !== null) alert('Please enter a valid name (at least 2 characters)');
    return;
  }

  const email = prompt('Enter teacher email address:');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (email !== null) alert('Please enter a valid email address');
    return;
  }

  const password = prompt('Enter temporary password for teacher (min 6 characters):');
  if (!password || password.length < 6) {
    if (password !== null) alert('Password must be at least 6 characters');
    return;
  }

  const subject = prompt('Enter teacher subject (e.g., Mathematics):') || 'Not assigned';

  // Show loading
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    padding: 2rem 3rem;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    text-align: center;
    font-weight: 700;
    color: var(--text-primary);
  `;
  loadingMsg.innerHTML = `
    <div style="margin-bottom:1rem;">Creating teacher account...</div>
    <div style="width:40px;height:40px;border:4px solid rgba(16,185,129,0.2);border-top-color:#10b981;border-radius:50%;margin:0 auto;animation:spin 1s linear infinite;"></div>
  `;
  document.body.appendChild(loadingMsg);

  try {
    // Check if user already exists
    if (typeof window.fbGetUser === 'function') {
      const existing = await window.fbGetUser(email.toLowerCase());
      if (existing) {
        loadingMsg.remove();
        alert('Error: A user with this email already exists.');
        return;
      }
    }

    // Hash password
    const hash = await sha256(password);

    // Create teacher object
    const newTeacher = {
      name: name.trim(),
      email: email.toLowerCase(),
      emailLower: email.toLowerCase(),
      hash: hash,
      role: 'teacher',
      institutionId: session.institutionId,
      institutionName: session.schoolName || 'Institution',
      schoolName: session.schoolName || 'Institution',
      schoolCode: session.schoolCode || session.institutionId,
      subject: subject,
      provider: 'email',
      createdAt: Date.now(),
      status: 'active',
      isVerified: false,
      twoFAEnabled: false,
      lastUpdated: new Date().toISOString()
    };

    console.log('[Enterprise] Creating teacher:', newTeacher);

    // 1. Create Firebase Auth account
    if (typeof window.fbSignUp === 'function') {
      const authResult = await window.fbSignUp(email.toLowerCase(), password);
      if (!authResult || !authResult.success) {
        console.warn('[Enterprise] Firebase Auth creation failed:', authResult?.error);
      }
    }

    // 2. Wait for auth state to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Save to Firestore
    if (typeof window.fbSaveUser === 'function') {
      await window.fbSaveUser(newTeacher);
      console.log('[Enterprise] ✅ Teacher saved to Firestore');
    }

    // 4. Update local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    localUsers.push(newTeacher);
    localStorage.setItem('waec_users', JSON.stringify(localUsers));

    // 5. Reload dashboard data to refresh from Firestore
    console.log('[Enterprise] Reloading dashboard data...');
    await loadDashboardData();

    loadingMsg.remove();
    
    alert(`✅ Teacher account created successfully!\n\n` +
          `Name: ${newTeacher.name}\n` +
          `Email: ${newTeacher.email}\n` +
          `Subject: ${newTeacher.subject}\n` +
          `Password: ${password}\n\n` +
          `📧 Share these credentials with the teacher.`);

  } catch (error) {
    loadingMsg.remove();
    console.error('[Enterprise] Error creating teacher:', error);
    alert('Error creating teacher account: ' + error.message);
  }
};

// Helper function for SHA-256 hashing
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashArray = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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
