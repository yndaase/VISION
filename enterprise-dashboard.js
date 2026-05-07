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
async function loadDashboardData(forceRefresh = false) {
  const session = getSession();
  if (!session) return;

  console.log('[Enterprise Dashboard] Loading data for institution:', session.institutionId);
  console.log('[Enterprise Dashboard] Session schoolCode:', session.schoolCode);
  console.log('[Enterprise Dashboard] Force refresh:', forceRefresh);

  try {
    let allUsers = [];
    
    // Always try to load from Firestore first (don't use localStorage cache for user list)
    if (typeof window.fbGetAllUsers === 'function') {
      console.log('[Enterprise Dashboard] Fetching all users from Firestore...');
      allUsers = await window.fbGetAllUsers();
      console.log('[Enterprise Dashboard] Total users fetched:', allUsers.length);
      console.log('[Enterprise Dashboard] Sample users:', allUsers.slice(0, 3).map(u => ({ email: u.email, role: u.role, institutionId: u.institutionId })));
      
      // Update localStorage cache with fresh data
      if (allUsers.length > 0) {
        localStorage.setItem('waec_users', JSON.stringify(allUsers));
        console.log('[Enterprise Dashboard] ✅ Updated localStorage cache');
      }
    } else {
      console.warn('[Enterprise Dashboard] Firebase not available, using localStorage fallback');
      // Fallback to localStorage only if Firebase is not available
      allUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
      console.log('[Enterprise Dashboard] Total users from localStorage:', allUsers.length);
    }

    // Filter enterprise students for this institution
    students = allUsers.filter(u => {
      const isEnterpriseStudent = u.role === 'enterprise-student';
      
      // Check multiple possible institution identifiers for compatibility
      const matchesInstitution = 
        u.institutionId === session.institutionId || 
        u.schoolCode === session.institutionId ||
        u.institutionId === session.schoolCode ||
        u.schoolCode === session.schoolCode;
      
      if (isEnterpriseStudent) {
        console.log('[Enterprise Dashboard] Student check:', {
          email: u.email,
          role: u.role,
          institutionId: u.institutionId,
          schoolCode: u.schoolCode,
          sessionInstitutionId: session.institutionId,
          sessionSchoolCode: session.schoolCode,
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
      
      // Check multiple possible institution identifiers for compatibility
      const matchesInstitution = 
        u.institutionId === session.institutionId || 
        u.schoolCode === session.institutionId ||
        u.institutionId === session.schoolCode ||
        u.schoolCode === session.schoolCode;
      
      if (isTeacher || isEnterpriseAdmin) {
        console.log('[Enterprise Dashboard] Teacher/Admin check:', {
          email: u.email,
          role: u.role,
          institutionId: u.institutionId,
          schoolCode: u.schoolCode,
          sessionInstitutionId: session.institutionId,
          sessionSchoolCode: session.schoolCode,
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
      institutionName: session.schoolName || session.institutionName || 'Institution',
      schoolCode: session.schoolCode || session.institutionId,
      schoolName: session.schoolName || session.institutionName || 'Institution',
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

    // 4. Immediately add to local arrays for instant UI update
    students.push(newStudent);
    console.log('[Enterprise] Added student to local array, total:', students.length);

    // 5. Update UI immediately
    renderStudentsTable();
    updateDashboardStats();

    // 6. Wait for Firestore to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Update local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    localUsers.push(newStudent);
    localStorage.setItem('waec_users', JSON.stringify(localUsers));

    // 8. Reload from Firestore in background to ensure sync
    console.log('[Enterprise] Reloading from Firestore in background...');
    loadDashboardData(true).catch(err => console.error('[Enterprise] Background reload failed:', err));

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
      institutionName: session.schoolName || session.institutionName || 'Institution',
      schoolCode: session.schoolCode || session.institutionId,
      schoolName: session.schoolName || session.institutionName || 'Institution',
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

    // 4. Immediately add to local arrays for instant UI update
    teachers.push(newTeacher);
    console.log('[Enterprise] Added teacher to local array, total:', teachers.length);

    // 5. Update UI immediately
    renderTeachersTable();
    updateDashboardStats();

    // 6. Wait for Firestore to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Update local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    localUsers.push(newTeacher);
    localStorage.setItem('waec_users', JSON.stringify(localUsers));

    // 8. Reload from Firestore in background to ensure sync
    console.log('[Enterprise] Reloading from Firestore in background...');
    loadDashboardData(true).catch(err => console.error('[Enterprise] Background reload failed:', err));

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
  const student = students.find(s => s.email === email);
  if (!student) return;
  
  // Calculate student statistics
  const stats = JSON.parse(localStorage.getItem(`waec_stats_${email}`) || '{"answered":0,"correct":0}');
  const performance = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
  
  // Get grade book data if available
  const session = getSession();
  let gradeInfo = '';
  if (session && session.institutionId) {
    const gradeKey = `grades_${session.email}_*`;
    gradeInfo = `
      <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);">
        <h4 style="margin:0 0 1rem 0;font-size:1rem;font-weight:800;">Academic Performance</h4>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem;">Overall Grade</div>
            <div style="font-size:1.5rem;font-weight:800;color:#10b981;">--</div>
          </div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem;">Assignments</div>
            <div style="font-size:1.5rem;font-weight:800;color:var(--text-primary);">--</div>
          </div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.25rem;">Attendance</div>
            <div style="font-size:1.5rem;font-weight:800;color:var(--text-primary);">--</div>
          </div>
        </div>
      </div>
    `;
  }
  
  const modal = document.createElement('div');
  modal.className = 'gb-modal';
  modal.innerHTML = `
    <div class="gb-modal-content" style="max-width:700px;">
      <div class="gb-modal-header">
        <h2>Student Profile</h2>
        <button class="gb-modal-close" onclick="this.closest('.gb-modal').remove()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      
      <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:16px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:2rem;">
          ${(student.name || student.email).charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;">
          <h3 style="margin:0 0 0.5rem 0;font-size:1.5rem;font-weight:800;">${student.name || 'Student'}</h3>
          <div style="font-size:0.9rem;color:var(--text-muted);">${student.email}</div>
          <div style="margin-top:0.5rem;">
            <span style="padding:0.25rem 0.75rem;background:rgba(16,185,129,0.1);color:#10b981;border-radius:6px;font-size:0.8rem;font-weight:700;">Active</span>
          </div>
        </div>
      </div>
      
      <div style="display:grid;gap:1.5rem;">
        <div>
          <h4 style="margin:0 0 1rem 0;font-size:1rem;font-weight:800;">Basic Information</h4>
          <div style="display:grid;gap:0.75rem;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Class:</span>
              <span style="font-weight:700;">${student.class || 'Not assigned'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Institution:</span>
              <span style="font-weight:700;">${student.institutionName || 'N/A'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Joined:</span>
              <span style="font-weight:700;">${new Date(student.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="margin:0 0 1rem 0;font-size:1rem;font-weight:800;">Learning Statistics</h4>
          <div style="display:grid;gap:0.75rem;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Questions Answered:</span>
              <span style="font-weight:700;">${stats.answered}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Correct Answers:</span>
              <span style="font-weight:700;">${stats.correct}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Performance:</span>
              <span style="font-weight:700;color:#10b981;">${performance}%</span>
            </div>
          </div>
        </div>
        
        ${gradeInfo}
      </div>
      
      <div style="display:flex;gap:1rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);">
        <button class="gb-btn-secondary" onclick="editStudent('${email}')">Edit Profile</button>
        <button class="gb-btn-secondary" onclick="resetStudentPassword('${email}')">Reset Password</button>
        <button class="gb-btn-secondary" style="margin-left:auto;color:#ef4444;" onclick="deleteStudent('${email}')">Delete Student</button>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
};

/**
 * View teacher details
 */
window.viewTeacher = function(email) {
  const teacher = teachers.find(t => t.email === email);
  if (!teacher) return;
  
  const modal = document.createElement('div');
  modal.className = 'gb-modal';
  modal.innerHTML = `
    <div class="gb-modal-content" style="max-width:700px;">
      <div class="gb-modal-header">
        <h2>Teacher Profile</h2>
        <button class="gb-modal-close" onclick="this.closest('.gb-modal').remove()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      
      <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:2rem;">
          ${(teacher.name || teacher.email).charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;">
          <h3 style="margin:0 0 0.5rem 0;font-size:1.5rem;font-weight:800;">${teacher.name || 'Teacher'}</h3>
          <div style="font-size:0.9rem;color:var(--text-muted);">${teacher.email}</div>
          <div style="margin-top:0.5rem;">
            <span style="padding:0.25rem 0.75rem;background:rgba(16,185,129,0.1);color:#10b981;border-radius:6px;font-size:0.8rem;font-weight:700;">Active</span>
          </div>
        </div>
      </div>
      
      <div style="display:grid;gap:1.5rem;">
        <div>
          <h4 style="margin:0 0 1rem 0;font-size:1rem;font-weight:800;">Basic Information</h4>
          <div style="display:grid;gap:0.75rem;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Subject:</span>
              <span style="font-weight:700;">${teacher.subject || 'Not assigned'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Institution:</span>
              <span style="font-weight:700;">${teacher.institutionName || teacher.schoolName || 'N/A'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Joined:</span>
              <span style="font-weight:700;">${new Date(teacher.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="margin:0 0 1rem 0;font-size:1rem;font-weight:800;">Teaching Statistics</h4>
          <div style="display:grid;gap:0.75rem;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Classes:</span>
              <span style="font-weight:700;">${teacher.classes || 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Students:</span>
              <span style="font-weight:700;">--</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-muted);">Assignments Created:</span>
              <span style="font-weight:700;">--</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display:flex;gap:1rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);">
        <button class="gb-btn-secondary" onclick="editTeacher('${email}')">Edit Profile</button>
        <button class="gb-btn-secondary" onclick="resetTeacherPassword('${email}')">Reset Password</button>
        <button class="gb-btn-secondary" style="margin-left:auto;color:#ef4444;" onclick="deleteTeacher('${email}')">Delete Teacher</button>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
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


// =====================================================
// ADVANCED USER MANAGEMENT
// =====================================================

/**
 * Edit student profile
 */
window.editStudent = function(email) {
  const student = students.find(s => s.email === email);
  if (!student) return;
  
  // Close current modal
  document.querySelector('.gb-modal')?.remove();
  
  const modal = document.createElement('div');
  modal.className = 'gb-modal';
  modal.innerHTML = `
    <div class="gb-modal-content">
      <div class="gb-modal-header">
        <h2>Edit Student</h2>
        <button class="gb-modal-close" onclick="this.closest('.gb-modal').remove()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      
      <div class="gb-form-group">
        <label>Full Name *</label>
        <input type="text" id="editStudentName" value="${student.name || ''}" required>
      </div>
      
      <div class="gb-form-group">
        <label>Email *</label>
        <input type="email" id="editStudentEmail" value="${student.email}" readonly style="background:var(--bg-secondary);cursor:not-allowed;">
      </div>
      
      <div class="gb-form-group">
        <label>Class</label>
        <input type="text" id="editStudentClass" value="${student.class || ''}" placeholder="e.g., Form 3A">
      </div>
      
      <div class="gb-modal-actions">
        <button class="gb-btn-secondary" onclick="this.closest('.gb-modal').remove()">Cancel</button>
        <button class="gb-btn-primary" onclick="saveStudentEdit('${email}')">Save Changes</button>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
};

/**
 * Save student edits
 */
window.saveStudentEdit = async function(email) {
  const name = document.getElementById('editStudentName').value.trim();
  const studentClass = document.getElementById('editStudentClass').value.trim();
  
  if (!name) {
    showErrorNotification('Please enter student name');
    return;
  }
  
  const student = students.find(s => s.email === email);
  if (!student) return;
  
  student.name = name;
  student.class = studentClass;
  student.lastUpdated = new Date().toISOString();
  
  // Update in Firestore
  if (typeof window.fbUpdateUser === 'function') {
    await window.fbUpdateUser(email, { name, class: studentClass, lastUpdated: student.lastUpdated });
  }
  
  // Update local cache
  const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
  const index = localUsers.findIndex(u => u.email === email);
  if (index !== -1) {
    localUsers[index] = student;
    localStorage.setItem('waec_users', JSON.stringify(localUsers));
  }
  
  await loadDashboardData();
  document.querySelector('.gb-modal')?.remove();
  showSuccessNotification('Student updated successfully');
};

/**
 * Edit teacher profile
 */
window.editTeacher = function(email) {
  const teacher = teachers.find(t => t.email === email);
  if (!teacher) return;
  
  // Close current modal
  document.querySelector('.gb-modal')?.remove();
  
  const modal = document.createElement('div');
  modal.className = 'gb-modal';
  modal.innerHTML = `
    <div class="gb-modal-content">
      <div class="gb-modal-header">
        <h2>Edit Teacher</h2>
        <button class="gb-modal-close" onclick="this.closest('.gb-modal').remove()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      
      <div class="gb-form-group">
        <label>Full Name *</label>
        <input type="text" id="editTeacherName" value="${teacher.name || ''}" required>
      </div>
      
      <div class="gb-form-group">
        <label>Email *</label>
        <input type="email" id="editTeacherEmail" value="${teacher.email}" readonly style="background:var(--bg-secondary);cursor:not-allowed;">
      </div>
      
      <div class="gb-form-group">
        <label>Subject</label>
        <input type="text" id="editTeacherSubject" value="${teacher.subject || ''}" placeholder="e.g., Mathematics">
      </div>
      
      <div class="gb-modal-actions">
        <button class="gb-btn-secondary" onclick="this.closest('.gb-modal').remove()">Cancel</button>
        <button class="gb-btn-primary" onclick="saveTeacherEdit('${email}')">Save Changes</button>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
};

/**
 * Save teacher edits
 */
window.saveTeacherEdit = async function(email) {
  const name = document.getElementById('editTeacherName').value.trim();
  const subject = document.getElementById('editTeacherSubject').value.trim();
  
  if (!name) {
    showErrorNotification('Please enter teacher name');
    return;
  }
  
  const teacher = teachers.find(t => t.email === email);
  if (!teacher) return;
  
  teacher.name = name;
  teacher.subject = subject;
  teacher.lastUpdated = new Date().toISOString();
  
  // Update in Firestore
  if (typeof window.fbUpdateUser === 'function') {
    await window.fbUpdateUser(email, { name, subject, lastUpdated: teacher.lastUpdated });
  }
  
  // Update local cache
  const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
  const index = localUsers.findIndex(u => u.email === email);
  if (index !== -1) {
    localUsers[index] = teacher;
    localStorage.setItem('waec_users', JSON.stringify(localUsers));
  }
  
  await loadDashboardData();
  document.querySelector('.gb-modal')?.remove();
  showSuccessNotification('Teacher updated successfully');
};

/**
 * Reset student password
 */
window.resetStudentPassword = async function(email) {
  const newPassword = prompt('Enter new password for student (min 6 characters):');
  
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    showErrorNotification('Password must be at least 6 characters');
    return;
  }
  
  try {
    const hash = await sha256(newPassword);
    
    // Update in Firestore
    if (typeof window.fbUpdateUser === 'function') {
      await window.fbUpdateUser(email, { hash, lastUpdated: new Date().toISOString() });
    }
    
    // Update local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    const index = localUsers.findIndex(u => u.email === email);
    if (index !== -1) {
      localUsers[index].hash = hash;
      localUsers[index].lastUpdated = new Date().toISOString();
      localStorage.setItem('waec_users', JSON.stringify(localUsers));
    }
    
    document.querySelector('.gb-modal')?.remove();
    alert(`✅ Password reset successfully!\n\nNew password: ${newPassword}\n\n📧 Share this with the student.`);
    
  } catch (error) {
    console.error('Error resetting password:', error);
    showErrorNotification('Failed to reset password');
  }
};

/**
 * Reset teacher password
 */
window.resetTeacherPassword = async function(email) {
  const newPassword = prompt('Enter new password for teacher (min 6 characters):');
  
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    showErrorNotification('Password must be at least 6 characters');
    return;
  }
  
  try {
    const hash = await sha256(newPassword);
    
    // Update in Firestore
    if (typeof window.fbUpdateUser === 'function') {
      await window.fbUpdateUser(email, { hash, lastUpdated: new Date().toISOString() });
    }
    
    // Update local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    const index = localUsers.findIndex(u => u.email === email);
    if (index !== -1) {
      localUsers[index].hash = hash;
      localUsers[index].lastUpdated = new Date().toISOString();
      localStorage.setItem('waec_users', JSON.stringify(localUsers));
    }
    
    document.querySelector('.gb-modal')?.remove();
    alert(`✅ Password reset successfully!\n\nNew password: ${newPassword}\n\n📧 Share this with the teacher.`);
    
  } catch (error) {
    console.error('Error resetting password:', error);
    showErrorNotification('Failed to reset password');
  }
};

/**
 * Delete student
 */
window.deleteStudent = async function(email) {
  if (!confirm(`Are you sure you want to delete this student account?\n\nEmail: ${email}\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    // Delete from Firestore
    if (typeof window.fbDeleteUser === 'function') {
      await window.fbDeleteUser(email);
    }
    
    // Delete from local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    const filtered = localUsers.filter(u => u.email !== email);
    localStorage.setItem('waec_users', JSON.stringify(filtered));
    
    await loadDashboardData();
    document.querySelector('.gb-modal')?.remove();
    showSuccessNotification('Student deleted successfully');
    
  } catch (error) {
    console.error('Error deleting student:', error);
    showErrorNotification('Failed to delete student');
  }
};

/**
 * Delete teacher
 */
window.deleteTeacher = async function(email) {
  if (!confirm(`Are you sure you want to delete this teacher account?\n\nEmail: ${email}\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    // Delete from Firestore
    if (typeof window.fbDeleteUser === 'function') {
      await window.fbDeleteUser(email);
    }
    
    // Delete from local cache
    const localUsers = JSON.parse(localStorage.getItem('waec_users') || '[]');
    const filtered = localUsers.filter(u => u.email !== email);
    localStorage.setItem('waec_users', JSON.stringify(filtered));
    
    await loadDashboardData();
    document.querySelector('.gb-modal')?.remove();
    showSuccessNotification('Teacher deleted successfully');
    
  } catch (error) {
    console.error('Error deleting teacher:', error);
    showErrorNotification('Failed to delete teacher');
  }
};

/**
 * Show success notification
 */
function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(16, 185, 129, 0.95);
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
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}


// =====================================================
// ANALYTICS DASHBOARD
// =====================================================

/**
 * Render analytics dashboard
 */
function renderAnalytics() {
  const grid = document.getElementById('analyticsGrid');
  if (!grid) return;
  
  if (students.length === 0) {
    grid.innerHTML = `
      <div class="ent-dash-analytics-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>
        <p>No data available</p>
        <span>Add students to see analytics</span>
      </div>
    `;
    return;
  }
  
  // Calculate analytics
  const analytics = calculateInstitutionAnalytics();
  
  grid.innerHTML = `
    <!-- Performance Overview -->
    <div class="ent-dash-report-card">
      <h3>Performance Overview</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1.5rem;margin-top:1rem;">
        <div class="ent-dash-stat">
          <div class="ent-dash-stat-label">Average Performance</div>
          <div class="ent-dash-stat-value" style="color:#10b981;">${analytics.avgPerformance}%</div>
        </div>
        <div class="ent-dash-stat">
          <div class="ent-dash-stat-label">Total Questions</div>
          <div class="ent-dash-stat-value">${analytics.totalQuestions}</div>
        </div>
        <div class="ent-dash-stat">
          <div class="ent-dash-stat-label">Correct Answers</div>
          <div class="ent-dash-stat-value">${analytics.totalCorrect}</div>
        </div>
        <div class="ent-dash-stat">
          <div class="ent-dash-stat-label">Active Students</div>
          <div class="ent-dash-stat-value">${analytics.activeStudents}</div>
        </div>
      </div>
    </div>
    
    <!-- Performance Distribution -->
    <div class="ent-dash-report-card">
      <h3>Performance Distribution</h3>
      <div style="margin-top:1rem;">
        ${renderPerformanceDistribution(analytics.distribution)}
      </div>
    </div>
    
    <!-- Top Performers -->
    <div class="ent-dash-report-card">
      <h3>Top Performers</h3>
      <div style="margin-top:1rem;">
        ${renderTopPerformers(analytics.topPerformers)}
      </div>
    </div>
    
    <!-- Students Needing Support -->
    <div class="ent-dash-report-card">
      <h3>Students Needing Support</h3>
      <div style="margin-top:1rem;">
        ${renderAtRiskStudents(analytics.atRiskStudents)}
      </div>
    </div>
    
    <!-- Activity Timeline -->
    <div class="ent-dash-report-card" style="grid-column:1/-1;">
      <h3>Recent Activity</h3>
      <div style="margin-top:1rem;">
        ${renderRecentActivity()}
      </div>
    </div>
  `;
}

/**
 * Calculate institution analytics
 */
function calculateInstitutionAnalytics() {
  let totalQuestions = 0;
  let totalCorrect = 0;
  let activeStudents = 0;
  const performances = [];
  const topPerformers = [];
  const atRiskStudents = [];
  
  students.forEach(student => {
    const stats = JSON.parse(localStorage.getItem(`waec_stats_${student.email}`) || '{"answered":0,"correct":0}');
    
    if (stats.answered > 0) {
      activeStudents++;
      totalQuestions += stats.answered;
      totalCorrect += stats.correct;
      
      const performance = Math.round((stats.correct / stats.answered) * 100);
      performances.push(performance);
      
      const studentData = {
        name: student.name || student.email,
        email: student.email,
        performance,
        answered: stats.answered,
        correct: stats.correct
      };
      
      if (performance >= 80) {
        topPerformers.push(studentData);
      } else if (performance < 60) {
        atRiskStudents.push(studentData);
      }
    }
  });
  
  // Sort top performers
  topPerformers.sort((a, b) => b.performance - a.performance);
  
  // Sort at-risk students
  atRiskStudents.sort((a, b) => a.performance - b.performance);
  
  // Calculate distribution
  const distribution = {
    excellent: performances.filter(p => p >= 90).length,
    good: performances.filter(p => p >= 70 && p < 90).length,
    average: performances.filter(p => p >= 50 && p < 70).length,
    poor: performances.filter(p => p < 50).length
  };
  
  const avgPerformance = performances.length > 0 
    ? Math.round(performances.reduce((sum, p) => sum + p, 0) / performances.length)
    : 0;
  
  return {
    avgPerformance,
    totalQuestions,
    totalCorrect,
    activeStudents,
    distribution,
    topPerformers: topPerformers.slice(0, 5),
    atRiskStudents: atRiskStudents.slice(0, 5)
  };
}

/**
 * Render performance distribution chart
 */
function renderPerformanceDistribution(distribution) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return '<p style="color:var(--text-muted);text-align:center;">No data available</p>';
  }
  
  const categories = [
    { label: 'Excellent (90-100%)', key: 'excellent', color: '#10b981' },
    { label: 'Good (70-89%)', key: 'good', color: '#3b82f6' },
    { label: 'Average (50-69%)', key: 'average', color: '#f59e0b' },
    { label: 'Needs Improvement (<50%)', key: 'poor', color: '#ef4444' }
  ];
  
  return categories.map(cat => {
    const count = distribution[cat.key];
    const percentage = Math.round((count / total) * 100);
    
    return `
      <div style="margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
          <span style="font-weight:600;color:var(--text-primary);">${cat.label}</span>
          <span style="font-weight:700;color:var(--text-secondary);">${count} (${percentage}%)</span>
        </div>
        <div style="height:12px;background:rgba(0,0,0,0.1);border-radius:6px;overflow:hidden;">
          <div style="width:${percentage}%;height:100%;background:${cat.color};transition:width 0.3s;"></div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render top performers list
 */
function renderTopPerformers(topPerformers) {
  if (topPerformers.length === 0) {
    return '<p style="color:var(--text-muted);text-align:center;">No top performers yet</p>';
  }
  
  return `
    <div style="display:grid;gap:0.75rem;">
      ${topPerformers.map((student, index) => `
        <div style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:var(--bg-secondary);border-radius:8px;">
          <div style="width:32px;height:32px;background:linear-gradient(135deg,#10b981,#059669);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.9rem;">
            ${index + 1}
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;color:var(--text-primary);">${student.name}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">${student.answered} questions answered</div>
          </div>
          <div style="font-size:1.25rem;font-weight:800;color:#10b981;">${student.performance}%</div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render at-risk students list
 */
function renderAtRiskStudents(atRiskStudents) {
  if (atRiskStudents.length === 0) {
    return '<p style="color:var(--text-muted);text-align:center;">All students performing well! 🎉</p>';
  }
  
  return `
    <div style="display:grid;gap:0.75rem;">
      ${atRiskStudents.map(student => `
        <div style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:8px;">
          <div style="width:32px;height:32px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:0.9rem;">
            ⚠
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;color:var(--text-primary);">${student.name}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">${student.answered} questions answered</div>
          </div>
          <div style="font-size:1.25rem;font-weight:800;color:#ef4444;">${student.performance}%</div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render recent activity
 */
function renderRecentActivity() {
  // This would ideally come from a real activity log
  // For now, we'll show a placeholder
  return `
    <div style="text-align:center;padding:2rem;color:var(--text-muted);">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="margin-bottom:1rem;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <p>Activity tracking coming soon</p>
      <span style="font-size:0.85rem;">Real-time student activity will be displayed here</span>
    </div>
  `;
}

// Update navigation to render analytics when clicked
document.addEventListener('DOMContentLoaded', () => {
  const analyticsNav = document.querySelector('[data-section="analytics"]');
  if (analyticsNav) {
    analyticsNav.addEventListener('click', () => {
      setTimeout(renderAnalytics, 100);
    });
  }
});
