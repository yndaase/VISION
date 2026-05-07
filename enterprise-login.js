/* =====================================================
   ENTERPRISE LOGIN PORTAL JAVASCRIPT
   Handles institutional authentication and role-based access
   ===================================================== */

// Role state
let selectedRole = 'admin';

/**
 * Switch between Admin, Teacher, and Enterprise Student roles
 */
window.selectRole = function(role) {
  selectedRole = role;
  
  // Update UI
  document.querySelectorAll('.ent-role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });
  
  // Show institution code field for all enterprise roles (admin, teacher, enterprise-student)
  const institutionCodeField = document.getElementById('institutionCodeField');
  if (institutionCodeField) {
    institutionCodeField.style.display = 'flex';
  }
  
  // Clear errors
  clearEnterpriseErrors();
};

/**
 * Toggle password visibility
 */
window.togglePasswordVisibility = function(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  button.classList.toggle('visible', isPassword);
};

/**
 * Clear all error messages
 */
function clearEnterpriseErrors() {
  document.querySelectorAll('.ent-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

/**
 * Show error message
 */
function showEnterpriseError(fieldId, message) {
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
 * Handle enterprise login form submission
 */
window.handleEnterpriseLogin = async function(event) {
  event.preventDefault();
  clearEnterpriseErrors();
  
  const institutionCode = document.getElementById('institutionCode')?.value.trim().toUpperCase();
  const email = document.getElementById('entEmail').value.trim().toLowerCase();
  const password = document.getElementById('entPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  let valid = true;
  
  // Validate institution code (required for all enterprise roles)
  if (!institutionCode) {
    showEnterpriseError('errInstitutionCode', 'Institution code is required');
    valid = false;
  } else if (institutionCode.length < 6) {
    showEnterpriseError('errInstitutionCode', 'Invalid institution code format');
    valid = false;
  }
  
  // Validate email
  if (!email) {
    showEnterpriseError('errEntEmail', 'Email address is required');
    valid = false;
  } else if (!isValidEmail(email)) {
    showEnterpriseError('errEntEmail', 'Please enter a valid email address');
    valid = false;
  }
  
  // Validate password
  if (!password) {
    showEnterpriseError('errEntPassword', 'Password is required');
    valid = false;
  } else if (password.length < 6) {
    showEnterpriseError('errEntPassword', 'Password must be at least 6 characters');
    valid = false;
  }
  
  if (!valid) return;
  
  // Update button state
  const submitBtn = document.getElementById('entSubmitBtn');
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
    
    // Verify role (Sub-task 3.1: Add enterprise-student role handling)
    if (selectedRole === 'admin' && user.role !== 'enterprise' && user.role !== 'admin') {
      throw new Error('This account does not have admin privileges');
    }
    
    if (selectedRole === 'teacher' && user.role !== 'teacher' && user.role !== 'enterprise' && user.role !== 'admin') {
      throw new Error('This account does not have teacher privileges');
    }
    
    // Accept enterprise-student role explicitly
    if (selectedRole === 'enterprise-student' && user.role !== 'enterprise-student') {
      throw new Error('This account does not have enterprise student privileges');
    }
    
    // Verify institution code (required for all enterprise roles, including enterprise-student)
    // Sub-task 3.1: Ensure enterprise-student accounts have institutionId/schoolCode
    if (!user.institutionId && !user.schoolCode) {
      throw new Error('This account is not linked to an institution');
    }
    
    const userInstitutionCode = (user.institutionId || user.schoolCode || '').toUpperCase();
    if (userInstitutionCode !== institutionCode) {
      throw new Error('Invalid institution code');
    }
    
    // Verify user schema and set session
    // Sub-task 3.3: Ensure enterprise-student role is preserved
    const verifiedUser = verifyUserSchema(user);
    
    // Set session with remember me option
    if (rememberMe) {
      localStorage.setItem('waec_session', JSON.stringify(verifiedUser));
      localStorage.setItem('waec_remember', 'true');
    } else {
      sessionStorage.setItem('waec_session', JSON.stringify(verifiedUser));
      localStorage.removeItem('waec_remember');
    }
    
    // Success - redirect to appropriate dashboard
    // Sub-task 3.2: Update dashboard redirection logic for enterprise-student
    submitBtn.innerHTML = '<span>Success! Redirecting...</span>';
    
    setTimeout(() => {
      if (verifiedUser.role === 'enterprise' || verifiedUser.role === 'admin') {
        window.location.href = '/enterprise-dashboard.html';
      } else if (verifiedUser.role === 'teacher') {
        window.location.href = '/teacher-dashboard.html';
      } else if (verifiedUser.role === 'enterprise-student') {
        // Redirect enterprise students to student dashboard with enterprise context
        window.location.href = '/dashboard.html?enterprise=true';
      } else {
        window.location.href = '/dashboard.html';
      }
    }, 800);
    
  } catch (error) {
    console.error('[Enterprise Login] Error:', error);
    
    let errorMessage = 'Authentication failed. Please check your credentials.';
    
    if (error.message.includes('credentials')) {
      errorMessage = 'Invalid email or password';
    } else if (error.message.includes('privileges')) {
      errorMessage = 'This account does not have the required permissions';
    } else if (error.message.includes('institution')) {
      errorMessage = error.message;
    } else if (error.message.includes('not found')) {
      errorMessage = 'Account not found. Please contact your institution administrator.';
    }
    
    showEnterpriseError('errEntGeneral', errorMessage);
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
    
    // Shake animation
    const form = document.getElementById('enterpriseLoginForm');
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
window.showForgotPassword = function() {
  alert('Password reset for enterprise accounts must be done through your institution administrator. Please contact support@visionedu.site for assistance.');
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
 * Sub-task 3.3: Updated to preserve enterprise-student role
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
  const isEnterpriseStudent = user.role === 'enterprise-student';
  const isTeacher = user.role === 'teacher';
  const isPaidPro = (user.subscriptionExpiry || 0) > now;
  const isPermanentPro = !!user.permanentPro;
  
  // Preserve enterprise-student role (never downgrade to 'student')
  // Enterprise students maintain their role even if subscription expires
  if (isEnterpriseStudent) {
    // Verify institutionId/schoolCode is present for enterprise-student users
    if (!user.institutionId && !user.schoolCode) {
      console.warn('[Enterprise Login] enterprise-student missing institution link');
    }
    user.role = 'enterprise-student';
  } else if (isAdmin || isEnterprise) {
    // Keep admin/enterprise roles
    user.role = user.role;
  } else if (isTeacher) {
    // Keep teacher role
    user.role = 'teacher';
  } else if (isPaidPro || isPermanentPro) {
    user.role = 'pro';
  } else {
    user.role = 'student';
  }
  
  return user;
}

/**
 * Check for remembered session on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const session = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
  
  if (session) {
    try {
      const user = JSON.parse(session);
      
      // Redirect to appropriate dashboard (including enterprise-student)
      if (user.role === 'enterprise' || user.role === 'admin') {
        window.location.href = '/enterprise-dashboard.html';
      } else if (user.role === 'teacher') {
        window.location.href = '/teacher-dashboard.html';
      } else if (user.role === 'enterprise-student') {
        window.location.href = '/dashboard.html?enterprise=true';
      } else {
        window.location.href = '/dashboard.html';
      }
    } catch (e) {
      console.error('[Enterprise Login] Session parse error:', e);
    }
  }
  
  // Initialize role selector
  selectRole('admin');
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
