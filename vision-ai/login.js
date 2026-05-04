const SESSION_KEY = "waec_session";
const GOOGLE_CLIENT_ID = "324420775871-o8anc82qu2aut8mmcdujbo6g0hgs22ll.apps.googleusercontent.com";
let googleInitialized = false;

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
  if (googleInitialized) {
    console.log('[Login] Google Sign-In already initialized');
    return;
  }
  
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true // Opt-in to FedCM to avoid deprecation warnings
    });
    
    // Create custom styled button instead of Google's default
    const buttonDiv = document.getElementById('googleSignInBtn');
    if (buttonDiv) {
      buttonDiv.innerHTML = `
        <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      `;
      
      // Add click handler to trigger Google Sign-In popup directly
      buttonDiv.onclick = () => {
        console.log('[Login] Custom Google button clicked');
        // Create a hidden div to render Google's button and trigger it
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '-9999px';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Render Google's button in the hidden div
        google.accounts.id.renderButton(tempDiv, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular'
        });
        
        // Click the rendered button to trigger sign-in
        setTimeout(() => {
          const gsiButton = tempDiv.querySelector('[role="button"]');
          if (gsiButton) {
            gsiButton.click();
            // Clean up after a delay
            setTimeout(() => {
              document.body.removeChild(tempDiv);
            }, 1000);
          }
        }, 100);
      };
      
      console.log('[Login] Custom Google button created');
    }
    
    googleInitialized = true;
    console.log('[Login] Google Sign-In initialized');
  } else {
    console.error('[Login] Google Sign-In library not loaded, retrying...');
    setTimeout(initializeGoogleSignIn, 500); // Retry after 500ms
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
    let firebaseAuthSuccess = false;
    if (typeof window.fbSignInWithGoogle === 'function') {
      console.log('[Login] Signing into Firebase Auth...');
      console.log('[Login] Google credential length:', response.credential.length);
      try {
        const fbResult = await window.fbSignInWithGoogle(response.credential);
        console.log('[Login] Firebase Auth result:', fbResult);
        if (fbResult.success) {
          console.log('[Login] Firebase Auth successful:', fbResult.user.email);
          firebaseAuthSuccess = true;
          
          // Verify auth state is set
          if (window.fbAuth && window.fbAuth.currentUser) {
            console.log('[Login] ✓ Firebase Auth currentUser confirmed:', window.fbAuth.currentUser.email);
          } else {
            console.warn('[Login] ⚠ Firebase Auth succeeded but currentUser is null');
          }
          
          // Wait a bit for Firebase Auth state to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check again after wait
          if (window.fbAuth && window.fbAuth.currentUser) {
            console.log('[Login] ✓ Firebase Auth still valid after wait');
          } else {
            console.warn('[Login] ⚠ Firebase Auth lost after wait');
          }
        } else {
          console.error('[Login] Firebase Auth failed:', fbResult.error);
        }
      } catch (fbError) {
        console.error('[Login] Firebase Auth exception:', fbError);
      }
    } else {
      console.error('[Login] fbSignInWithGoogle not available - firebase.js may not be loaded');
    }

    const successMessage = firebaseAuthSuccess 
      ? 'Welcome, ' + user.name + '! Firebase Auth complete. Redirecting...'
      : 'Welcome, ' + user.name + '! Redirecting to Vision AI...';
    
    showSuccess(successMessage);
    
    setTimeout(() => {
      window.location.href = '/chat';
    }, 1000);
  } catch (e) {
    console.error('[Login] Google Sign-In error:', e);
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
        
        // Sign into Firebase Auth to enable chat history and syncing
        if (typeof window.fbSignIn === 'function') {
          console.log('[Login] Signing into Firebase Auth with email...');
          await window.fbSignIn(email, password);
        }
        
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
    console.log('[Login] Vision AI Login - Ready');
    
    // Check if firebase.js loaded
    setTimeout(() => {
      if (typeof window.fbSignInWithGoogle === 'function') {
        console.log('[Login] Firebase Auth functions available ✓');
      } else {
        console.warn('[Login] Firebase Auth functions NOT available - firebase.js may not have loaded');
      }
    }, 1500);
    
    // Initialize Google Sign-In after page loads
    setTimeout(initializeGoogleSignIn, 1000);
  }
});

// Make functions globally available
window.handleGoogleCredential = handleGoogleCredential;
window.handleEmailLogin = handleEmailLogin;
