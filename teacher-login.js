/* =====================================================
   TEACHER LOGIN PORTAL JAVASCRIPT
   Handles teacher authentication and dashboard access
   ===================================================== */

/**
 * Toggle password visibility
 */
window.toggleTeacherPasswordVisibility = function(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  button.classList.toggle('visible', isPassword);
};

/**
 * Clear all error messages
 */
function clearTeacherErrors() {
  document.querySelectorAll('.teacher-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

/**
 * Show error message
 */
function showTeacherError(fieldId, message) {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Handle teacher login form submission
 */
window.handleTeacherLogin = async function(event) {
  event.preventDefault();
  clearTeacherErrors();
  
  const school = document.getElementById('teacherSchool')?.value.trim();
  const email = document.getElementById('teacherEmail').value.trim().toLowerCase();
  const password = document.getElementById('teacherPassword').value;
  const rememberMe = document.getElementById('teacherRememberMe').checked;
  
  let valid = true;
  
  // Validate email
  if (!email) {
    showTeacherError('errTeacherEmail', 'Email address is required');
    valid = false;
  } else if (!isValidEmail(email)) {
    showTeacherError('errTeacherEmail', 'Please enter a valid email address');
    valid = false;
  }
  
  // Validate password
  if (!password) {
    showTeacherError('errTeacherPassword', 'Password is required');
    valid = false;
  } else if (password.length < 6) {
    showTeacherError('errTeacherPassword', 'Password must be at least 6 characters');
    valid = false;
  }
  
  if (!valid) return;
  
  // Update button state
  const submitBtn = document.getElementById('teacherSubmitBtn');
  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Authenticating...</span>';
  
  try {
    // Attempt Firebase authentication first
    let authResult = null;
    if (typeof window.fbSignIn === 'function') {
      authResult = await window.fbSignIn(email, password);
      
      if (!authResult || !authResult.success) {
        throw new Error('Invalid credentials');
      }
    }
    
    // Fetch user from Firestore
    let user = null;
    if (typeof window.fbGetUser === 'function') {
      user = await window.fbGetUser(email);
    }
    
    // Fallback to localStorage if Firestore fails
    if (!user) {
      const users = JSON.parse(localStorage.getItem('waec_users') || '[]');
      user = users.find(u => u.email === email);
    }
    
    if (!user) {
      throw new Error('Account not found');
    }
    
    // Verify password (if Firebase auth didn't already)
    if (!authResult) {
      const inputHash = await sha256(password);
      const legacyHash = simpleHash(password);
      
      if (user.hash !== inputHash && user.hash !== legacyHash) {
        throw new Error('Invalid credentials');
      }
    }
    
    // Verify role - teachers can have 'teacher', 'enterprise', or 'admin' roles
    const validRoles = ['teacher', 'enterprise', 'admin'];
    if (!validRoles.includes(user.role)) {
      throw new Error('This account does not have teacher privileges');
    }
    
    // Update school if provided
    if (school && school !== user.school) {
      user.school = school;
      
      // Update in Firestore
      if (typeof window.fbUpdateUser === 'function') {
        await window.fbUpdateUser(email, { school: school });
      }
      
      // Update in localStorage
      const users = JSON.parse(localStorage.getItem('waec_users') || '[]');
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) {
        users[idx].school = school;
        localStorage.setItem('waec_users', JSON.stringify(users));
      }
    }
    
    // Verify user schema and set session
    const verifiedUser = verifyUserSchema(user);
    
    // Set session with remember me option
    if (rememberMe) {
      localStorage.setItem('waec_session', JSON.stringify(verifiedUser));
      localStorage.setItem('waec_remember', 'true');
    } else {
      sessionStorage.setItem('waec_session', JSON.stringify(verifiedUser));
      localStorage.removeItem('waec_remember');
    }
    
    // Success - redirect to teacher dashboard
    submitBtn.innerHTML = '<span>Success! Redirecting...</span>';
    
    setTimeout(() => {
      window.location.href = '/teacher-dashboard.html';
    }, 800);
    
  } catch (error) {
    console.error('[Teacher Login] Error:', error);
    
    let errorMessage = 'Authentication failed. Please check your credentials.';
    
    if (error.message.includes('credentials')) {
      errorMessage = 'Invalid email or password';
    } else if (error.message.includes('privileges')) {
      errorMessage = 'This account does not have teacher access. Please use the student or admin portal.';
    } else if (error.message.includes('not found')) {
      errorMessage = 'Account not found. Please create a teacher account or contact your school administrator.';
    }
    
    showTeacherError('errTeacherGeneral', errorMessage);
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
    
    // Shake animation
    const form = document.getElementById('teacherLoginForm');
    if (form) {
      form.style.animation = 'shake 0.5s';
      setTimeout(() => {
        form.style.animation = '';
      }, 500);
    }
  }
};

/**
 * Show forgot password modal
 */
window.showTeacherForgotPassword = function() {
  // Redirect to main login with forgot password tab
  window.location.href = '/login.html?tab=forgot';
};

/**
 * Simple hash function (for legacy compatibility)
 */
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString(16);
}

/**
 * SHA-256 hash function
 */
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashArray = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify user schema (from auth.js)
 */
function verifyUserSchema(user) {
  if (!user) return null;
  
  const emailLower = (user.email || '').toString().trim().toLowerCase();
  
  // Ensure default booleans/timestamps
  user.twoFAEnabled = !!user.twoFAEnabled;
  user.isVerified = !!user.isVerified;
  user.subscriptionExpiry = user.subscriptionExpiry || 0;
  
  // Calculate effective role
  const now = Date.now();
  const isAdmin = user.role === 'admin';
  const isEnterprise = user.role === 'enterprise';
  const isTeacher = user.role === 'teacher';
  const isPaidPro = (user.subscriptionExpiry || 0) > now;
  const isPermanentPro = !!user.permanentPro;
  
  // Keep special roles
  if (isAdmin || isEnterprise || isTeacher) {
    user.role = user.role;
  } else if (isPaidPro || isPermanentPro) {
    user.role = 'pro';
  } else {
    user.role = 'student';
  }
  
  return user;
}

/**
 * Load teacher preview stats (if returning user)
 */
async function loadTeacherPreview() {
  try {
    // Check if there's a remembered session
    const rememberedSession = localStorage.getItem('waec_remember');
    if (!rememberedSession) return;
    
    const session = localStorage.getItem('waec_session');
    if (!session) return;
    
    const user = JSON.parse(session);
    if (!user || !['teacher', 'enterprise', 'admin'].includes(user.role)) return;
    
    // Show preview section
    const previewEl = document.getElementById('teacherPreview');
    if (previewEl) {
      previewEl.style.display = 'grid';
      
      // Load stats from localStorage or Firestore
      const teacherStats = JSON.parse(localStorage.getItem(`teacher_stats_${user.email}`) || '{}');
      
      document.getElementById('previewStudents').textContent = teacherStats.students || '0';
      document.getElementById('previewClasses').textContent = teacherStats.classes || '0';
      document.getElementById('previewQuizzes').textContent = teacherStats.quizzes || '0';
      
      // Pre-fill email
      const emailInput = document.getElementById('teacherEmail');
      if (emailInput) {
        emailInput.value = user.email;
      }
      
      // Pre-fill school
      const schoolInput = document.getElementById('teacherSchool');
      if (schoolInput && user.school) {
        schoolInput.value = user.school;
      }
    }
  } catch (e) {
    console.error('[Teacher Login] Preview load error:', e);
  }
}

/**
 * Check for existing session on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const session = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
  
  if (session) {
    try {
      const user = JSON.parse(session);
      
      // Redirect to appropriate dashboard
      if (user.role === 'teacher' || user.role === 'enterprise' || user.role === 'admin') {
        window.location.href = '/teacher-dashboard.html';
      } else {
        // Not a teacher, stay on login page
        loadTeacherPreview();
      }
    } catch (e) {
      console.error('[Teacher Login] Session parse error:', e);
      loadTeacherPreview();
    }
  } else {
    loadTeacherPreview();
  }
});

// Add shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }
`;
document.head.appendChild(style);
