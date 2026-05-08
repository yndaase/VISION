/* =====================================================
   ENTERPRISE STUDENT DASHBOARD
   Specialized dashboard for institutional students
   ===================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Load session and verify enterprise student role
  const session = getSession();
  if (!session || session.role !== 'enterprise-student') {
    window.location.href = '/enterprise-login.html';
    return;
  }

  console.log('[Enterprise Student Dashboard] Session loaded:', {
    email: session.email,
    name: session.name,
    role: session.role,
    institutionId: session.institutionId,
    institutionName: session.institutionName
  });

  // Initialize dashboard
  await initializeDashboard(session);
  
  // Load data
  loadStats(session);
  loadSubjects();
  loadInstitutionMaterials(session);
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Initialize dashboard with institution branding and user info
 */
async function initializeDashboard(session) {
  // Apply institution branding
  applyInstitutionBranding(session);
  
  // Update user info
  updateUserInfo(session);
  
  // Update welcome section
  updateWelcomeSection(session);
}

/**
 * Apply institution-specific branding
 */
function applyInstitutionBranding(session) {
  const institutionName = session.institutionName || session.schoolName || 'Your Institution';
  const institutionId = session.institutionId || session.schoolCode || '';
  
  console.log('[Enterprise Student] Applying branding:', institutionName);
  
  // Update page title
  document.title = `Dashboard | ${institutionName} - Vision Education`;
  
  // Update institution name in branding section
  const institutionNameEl = document.getElementById('institutionName');
  if (institutionNameEl) {
    institutionNameEl.textContent = institutionName;
  }
  
  // Update institution indicator in nav
  const institutionIndicator = document.getElementById('institutionIndicator');
  if (institutionIndicator) {
    institutionIndicator.textContent = institutionName;
    institutionIndicator.style.display = 'block';
  }
  
  // Update institution logo (use first letter)
  const institutionLogo = document.getElementById('institutionLogo');
  if (institutionLogo && institutionName) {
    const initial = institutionName.charAt(0).toUpperCase();
    institutionLogo.innerHTML = `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:900;color:var(--primary);">
        ${initial}
      </div>
    `;
  }
}

/**
 * Update user information in navigation
 */
function updateUserInfo(session) {
  // Update avatar
  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar) {
    const initial = session.name ? session.name.charAt(0).toUpperCase() : 'S';
    navAvatar.textContent = initial;
    
    // If Google user has picture, show it
    if (session.picture) {
      const img = new Image();
      img.onload = () => {
        navAvatar.style.backgroundImage = `url('${session.picture}')`;
        navAvatar.style.backgroundSize = 'cover';
        navAvatar.style.backgroundPosition = 'center';
        navAvatar.style.fontSize = '0';
      };
      img.src = session.picture;
    }
  }
  
  // Update username
  const navUsername = document.getElementById('navUsername');
  if (navUsername) {
    navUsername.textContent = session.name || 'Student';
  }
  
  // Update dropdown
  const dropdownName = document.getElementById('dropdownName');
  const dropdownEmail = document.getElementById('dropdownEmail');
  if (dropdownName) dropdownName.textContent = session.name || 'Student';
  if (dropdownEmail) dropdownEmail.textContent = session.email || '';
}

/**
 * Update welcome section
 */
function updateWelcomeSection(session) {
  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName) {
    const firstName = session.name ? session.name.split(' ')[0] : 'Student';
    welcomeName.textContent = firstName;
  }
  
  // Update welcome badge
  const welcomeBadge = document.getElementById('welcomeBadge');
  if (welcomeBadge && session.institutionName) {
    welcomeBadge.innerHTML = `
      <span class="badge-dot"></span>
      Enterprise Student · ${session.institutionName}
    `;
  }
}

/**
 * Load and display user statistics
 */
function loadStats(session) {
  const stats = getStats();
  const answered = stats.answered || 0;
  const correct = stats.correct || 0;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  
  // Update stat elements
  const elAnswered = document.getElementById('statAnswered');
  const elCorrect = document.getElementById('statCorrect');
  const elPct = document.getElementById('statPct');
  
  if (elAnswered) animateCount(elAnswered, answered);
  if (elCorrect) animateCount(elCorrect, correct);
  if (elPct) elPct.textContent = pct + '%';
  
  // Load streak data
  loadStreakData();
}

/**
 * Load streak data
 */
function loadStreakData() {
  const streakData = JSON.parse(localStorage.getItem('waec_streak') || '{"current":0,"longest":0,"lastDate":null}');
  
  const streakCurrent = document.getElementById('streakCurrent');
  const streakLongest = document.getElementById('streakLongest');
  const streakFire = document.getElementById('streakFire');
  const streakStatus = document.getElementById('streakStatus');
  
  if (streakCurrent) streakCurrent.textContent = streakData.current || 0;
  if (streakLongest) streakLongest.textContent = streakData.longest || 0;
  
  // Update fire icon based on streak
  if (streakFire) {
    if (streakData.current > 0) {
      streakFire.classList.remove('streak-fire-cold');
    } else {
      streakFire.classList.add('streak-fire-cold');
    }
  }
  
  // Update status message
  if (streakStatus) {
    if (streakData.current === 0) {
      streakStatus.textContent = 'Start your streak today!';
    } else if (streakData.current === 1) {
      streakStatus.textContent = 'Keep it going!';
    } else if (streakData.current >= 7) {
      streakStatus.textContent = '🔥 On fire!';
    } else {
      streakStatus.textContent = 'Great progress!';
    }
  }
}

/**
 * Load subjects grid
 */
function loadSubjects() {
  const subjectsGrid = document.getElementById('subjectsGrid');
  if (!subjectsGrid) return;
  
  const subjects = [
    {
      id: 'maths',
      name: 'Core Mathematics',
      icon: '📐',
      color: '#6366f1',
      description: 'Algebra, Number Theory, Statistics, Geometry & real-world word problems.',
      available: true
    },
    {
      id: 'english',
      name: 'English Language',
      icon: '📖',
      color: '#60a5fa',
      description: 'Comprehension, essay writing, oral English & language structure.',
      available: true
    },
    {
      id: 'science',
      name: 'Integrated Science',
      icon: '🔬',
      color: '#34d399',
      description: 'Biology, Chemistry & Physics concepts in one integrated WAEC paper.',
      available: true
    },
    {
      id: 'social',
      name: 'Social Studies',
      icon: '🌍',
      color: '#a78bfa',
      description: 'Ghana\'s history, government, culture, citizenship & global issues.',
      available: true
    },
    {
      id: 'physics',
      name: 'Physics',
      icon: '⚛️',
      color: '#f87171',
      description: 'Mechanics, waves, electricity, magnetism & modern physics.',
      available: true
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: '🧪',
      color: '#fb923c',
      description: 'Atomic structure, bonding, organic chemistry & stoichiometry.',
      available: true
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: '🧬',
      color: '#4ade80',
      description: 'Cell biology, genetics, ecology, reproduction & human physiology.',
      available: true
    },
    {
      id: 'economics',
      name: 'Economics',
      icon: '💰',
      color: '#38bdf8',
      description: 'Demand & supply, national income, trade, banking & development economics.',
      available: true
    }
  ];
  
  subjectsGrid.innerHTML = subjects.map(subject => `
    <a class="subject-card available" href="/?sub=${subject.id}" style="--subj-color: ${subject.color}">
      <div class="subject-card-inner">
        <div class="subject-top">
          <div class="subject-icon-wrap">
            <span class="subject-icon">${subject.icon}</span>
          </div>
          <span class="subject-status available-tag">Available</span>
        </div>
        <h3 class="subject-name">${subject.name}</h3>
        <p class="subject-desc">${subject.description}</p>
        <div class="subject-cta">
          Start Practice <span class="cta-arrow">→</span>
        </div>
      </div>
      <div class="subject-card-glow" style="--glow: ${subject.color}"></div>
    </a>
  `).join('');
}

/**
 * Load institution-specific materials
 */
async function loadInstitutionMaterials(session) {
  const materialsContainer = document.getElementById('materialsContainer');
  if (!materialsContainer) return;
  
  console.log('[Enterprise Student] Loading materials for institution:', session.institutionId);
  
  // Get all materials
  let allMaterials = [];
  if (typeof getMaterials === 'function') {
    allMaterials = getMaterials();
  }
  
  // Filter materials by institution
  const institutionId = session.institutionId || session.schoolCode;
  const institutionMaterials = allMaterials.filter(m => {
    // Show materials that belong to this institution
    if (m.institutionId === institutionId) return true;
    // Also show materials without institution (public materials)
    if (!m.institutionId) return true;
    return false;
  });
  
  console.log('[Enterprise Student] Materials found:', {
    total: allMaterials.length,
    filtered: institutionMaterials.length,
    institutionId
  });
  
  if (institutionMaterials.length === 0) {
    materialsContainer.innerHTML = `
      <div class="materials-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <h3>No Materials Available</h3>
        <p>Your institution hasn't uploaded any study materials yet. Check back soon!</p>
      </div>
    `;
    return;
  }
  
  // Group materials by subject
  const materialsBySubject = {};
  institutionMaterials.forEach(material => {
    const subject = material.subject || 'general';
    if (!materialsBySubject[subject]) {
      materialsBySubject[subject] = [];
    }
    materialsBySubject[subject].push(material);
  });
  
  // Render materials
  materialsContainer.innerHTML = Object.entries(materialsBySubject).map(([subject, materials]) => {
    const subjectName = getSubjectName(subject);
    const subjectIcon = getSubjectIcon(subject);
    
    return `
      <div class="material-subject-group">
        <div class="material-subject-header">
          <div class="material-subject-icon">${subjectIcon}</div>
          <div class="material-subject-info">
            <h3 class="material-subject-name">${subjectName}</h3>
            <span class="material-count">${materials.length} resource${materials.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div class="material-items">
          ${materials.map(material => renderMaterialCard(material)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render a single material card
 */
function renderMaterialCard(material) {
  const typeColor = {
    PDF: '#ef4444',
    VIDEO: '#f59e0b',
    DOC: '#3b82f6',
    SLIDE: '#8b5cf6',
    LINK: '#10b981'
  }[material.type?.toUpperCase()] || '#94a3b8';
  
  const isNew = material.uploadedAt && (Date.now() - new Date(material.uploadedAt).getTime() < 48 * 60 * 60 * 1000);
  
  // Check for both blobUrl (R2 key) and url (direct URL)
  const materialUrl = material.blobUrl || material.url;
  const isR2 = materialUrl && !materialUrl.startsWith('http');
  const downloadUrl = isR2 ? `/api/upload?action=download&materialId=${material.id}` : (materialUrl || "#");
  
  return `
    <div class="material-card" onclick="window.open('${downloadUrl}', '_blank')">
      ${isNew ? '<div class="material-new-badge">New</div>' : ''}
      <div class="material-type-icon" style="background: ${typeColor}15; color: ${typeColor}; border-color: ${typeColor}30;">
        ${material.type || 'PDF'}
      </div>
      <div class="material-info">
        <div class="material-title">${material.title}</div>
        <div class="material-meta">
          <span>${material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : 'Recent'}</span>
          ${material.size ? `<span>·</span><span>${material.size}</span>` : ''}
        </div>
      </div>
      <div class="material-download-icon">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Get subject display name
 */
function getSubjectName(subjectId) {
  const subjectNames = {
    'core-maths': 'Core Mathematics',
    'maths': 'Mathematics',
    'english': 'English Language',
    'social': 'Social Studies',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'economics': 'Economics',
    'cs': 'Computer Science',
    'science': 'Integrated Science',
    'general': 'General Resources'
  };
  return subjectNames[subjectId] || subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
}

/**
 * Get subject icon
 */
function getSubjectIcon(subjectId) {
  const subjectIcons = {
    'core-maths': '📐',
    'maths': '📐',
    'english': '📖',
    'social': '🌍',
    'physics': '⚛️',
    'chemistry': '🧪',
    'biology': '🧬',
    'economics': '💰',
    'cs': '💻',
    'science': '🔬',
    'general': '📚'
  };
  return subjectIcons[subjectId] || '📚';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const chip = document.getElementById('navUserChip');
    if (chip && !chip.contains(e.target)) {
      chip.classList.remove('open');
    }
  });
}

/**
 * Toggle user dropdown
 */
window.toggleUserDropdown = function() {
  const chip = document.getElementById('navUserChip');
  if (chip) chip.classList.toggle('open');
};

/**
 * Close user dropdown
 */
window.closeUserDropdown = function() {
  const chip = document.getElementById('navUserChip');
  if (chip) chip.classList.remove('open');
};

/**
 * Animate counter
 */
function animateCount(el, target) {
  if (target === 0) {
    el.textContent = "0";
    return;
  }
  let start = 0;
  const duration = 1000;
  const step = (timestamp) => {
    if (!step.startTime) step.startTime = timestamp;
    const progress = Math.min((timestamp - step.startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
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
 * Get stats from localStorage
 */
function getStats() {
  const session = getSession();
  if (!session) return { answered: 0, correct: 0 };
  
  try {
    const stats = localStorage.getItem(`waec_stats_${session.email}`);
    return stats ? JSON.parse(stats) : { answered: 0, correct: 0 };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { answered: 0, correct: 0 };
  }
}

/**
 * Handle logout
 */
window.handleLogout = function() {
  if (confirm('Are you sure you want to log out?')) {
    sessionStorage.removeItem('waec_session');
    localStorage.removeItem('waec_session');
    window.location.href = '/enterprise-login.html';
  }
};

/**
 * Open settings modal
 */
window.openSettings = function() {
  // Redirect to settings page or open modal
  alert('Settings functionality coming soon for enterprise students!');
};
