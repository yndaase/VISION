const SESSION_KEY = "waec_session";
const GOOGLE_CLIENT_ID = "378999569796-v8bj9miq61sggvpea5sbslc24dr9t71s.apps.googleusercontent.com";

// Check if already logged in
function checkExistingSession() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (session) {
    try {
      const user = JSON.parse(session);
      if (user && user.email) {
        window.location.href = '/chat';
        return true;
      }
    } catch (e) {
      console.error('Session parse error:', e);
    }
  }
  return false;
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.classList.add('show');
  setTimeout(() => errorEl.classList.remove('show'), 5000);
}

// Show success message
function showSuccess(message) {
  const successEl = document.getElementById('successMessage');
  successEl.textContent = message;
  successEl.classList.add('show');
}

// Initialize Google Sign-In
function initializeGoogleSignIn() {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    console.log('Google Sign-In initialized');
  } else {
    console.error('Google Sign-In library not loaded');
    setTimeout(initializeGoogleSignIn, 500); // Retry after 500ms
  }
}

// Handle Google Sign-In button click
function triggerGoogleSignIn() {
  try {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: Show One Tap dialog
          console.log('One Tap not displayed, showing popup');
        }
      });
    } else {
      showError('Google Sign-In is not ready. Please refresh the page.');
    }
  } catch (error) {
    console.error('Google Sign-In trigger error:', error);
    showError('Failed to open Google Sign-In. Please try again.');
  }
}

// Google credential callback
async function handleGoogleCredential(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    const user = {
      name: payload.name || 'Google User',
      email: payload.email || '',
      picture: payload.picture || '',
      provider: 'google',
      sub: payload.sub,
      role: 'student'
    };

    // Store session locally
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    // Sign into Firebase Auth with Google credential
    if (typeof window.fbSignInWithGoogle === 'function') {
      console.log('[Login] Signing into Firebase Auth...');
      const fbResult = await window.fbSignInWithGoogle(response.credential);
      if (fbResult.success) {
        console.log('[Login] Firebase Auth successful');
      } else {
        console.warn('[Login] Firebase Auth failed:', fbResult.error);
      }
    } else {
      console.warn('[Login] Firebase Auth not available');
    }

    showSuccess('Welcome, ' + user.name + '! Redirecting to Vision AI...');
    
    setTimeout(() => {
      window.location.href = '/chat';
    }, 1000);
  } catch (e) {
    console.error('Google Sign-In error:', e);
    showError('Google sign-in failed. Please try again.');
  }
}

// Handle Email Login
async function handleEmailLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const submitBtn = document.getElementById('submitBtn');

  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    // Simple authentication - in production, verify against backend
    const response = await fetch('https://visionedu.online/api/auth-core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'login',
        email,
        password 
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1000);
      } else {
        showError('Invalid email or password.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Vision AI';
      }
    } else {
      showError('Invalid email or password.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Vision AI';
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Login failed. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In to Vision AI';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (!checkExistingSession()) {
    console.log('Vision AI Login - Ready');
    // Initialize Google Sign-In after page loads
    setTimeout(initializeGoogleSignIn, 1000);
  }
});

// Make functions globally available
window.handleGoogleCredential = handleGoogleCredential;
window.triggerGoogleSignIn = triggerGoogleSignIn;
window.handleEmailLogin = handleEmailLogin;
