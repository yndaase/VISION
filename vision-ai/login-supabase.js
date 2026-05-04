const SESSION_KEY = "waec_session";

// Load Supabase configuration
async function loadSupabaseConfig() {
  try {
    const response = await fetch('/api/supabase-config');
    const config = await response.json();
    
    if (config.error) {
      console.error('[Login] Supabase config error:', config.error);
      return false;
    }
    
    window.SUPABASE_URL = config.url;
    window.SUPABASE_ANON_KEY = config.anonKey;
    console.log('[Login] Supabase config loaded');
    return true;
  } catch (error) {
    console.error('[Login] Failed to load Supabase config:', error);
    return false;
  }
}

// Check if already logged in
async function checkExistingSession() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (session) {
    try {
      const user = JSON.parse(session);
      if (user && user.email) {
        // Verify with Supabase
        const sbUser = await window.sbGetUser();
        if (sbUser) {
          console.log('[Login] Existing session valid, redirecting...');
          window.location.href = '/chat';
          return true;
        }
      }
    } catch (e) {
      console.error('[Login] Session parse error:', e);
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

// Handle Google Sign-In
async function handleGoogleSignIn() {
  console.log('[Login] Google Sign-In clicked');
  
  try {
    const result = await window.sbSignInWithGoogle();
    
    if (!result.success) {
      showError('Google sign-in failed: ' + result.error);
      return;
    }
    
    // Supabase will redirect automatically
    showSuccess('Redirecting to Google...');
  } catch (error) {
    console.error('[Login] Google Sign-In error:', error);
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
    // Use existing auth-core API for email/password
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
    console.error('[Login] Email login error:', error);
    showError('Login failed. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In to Vision AI';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Login] Vision AI Login - Initializing...');
  
  // Load Supabase config first
  const configLoaded = await loadSupabaseConfig();
  if (!configLoaded) {
    showError('Failed to load configuration. Please refresh the page.');
    return;
  }
  
  // Wait for Supabase client to load
  let attempts = 0;
  const waitForSupabase = setInterval(async () => {
    attempts++;
    if (window.supabase && window.sbSignInWithGoogle) {
      clearInterval(waitForSupabase);
      console.log('[Login] Supabase client ready');
      
      // Check for existing session
      const hasSession = await checkExistingSession();
      if (!hasSession) {
        // Set up Google Sign-In button
        const googleBtn = document.getElementById('googleSignInBtn');
        if (googleBtn) {
          googleBtn.innerHTML = `
            <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          `;
          googleBtn.onclick = handleGoogleSignIn;
        }
        
        console.log('[Login] Ready');
      }
    } else if (attempts >= 20) {
      clearInterval(waitForSupabase);
      console.error('[Login] Supabase client failed to load');
      showError('Failed to initialize. Please refresh the page.');
    }
  }, 500);
});

// Make functions globally available
window.handleEmailLogin = handleEmailLogin;
window.handleGoogleSignIn = handleGoogleSignIn;
